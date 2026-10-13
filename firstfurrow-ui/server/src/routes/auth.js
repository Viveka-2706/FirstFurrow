import { Router } from 'express';
import { HttpError, badRequest, conflict, unauthorized, DuplicateEmailError } from '../errors.js';
import { validateSignup, validateLogin, validateEmail, validatePassword, validateProfile, hashPassword, checkPassword, signToken, publicUser } from '../services/auth.js';
import { newToken, hashToken, TOKEN_RE, resetEmail, changedEmail, emailChangedEmail } from '../services/passwordReset.js';
import { newVerificationCode, hashVerificationCode, verificationEmail } from '../services/emailVerification.js';
import { isStr } from '../validate.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/wrap.js';

export function authRoutes(repo, config, mailer) {
  const router = Router();

  // Emails are sent AFTER the response goes out. That keeps "forgot password" equally fast whether or not the
  // address has an account (so timing can't reveal who is registered), and a slow mail server never blocks the page.
  const pending = new Set();
  const inBackground = (promise) => {
    const task = promise.catch((err) => console.error(`[email service] ${err.message}`)).finally(() => pending.delete(task));
    pending.add(task);
  };
  router.idle = () => Promise.allSettled([...pending]); // lets tests wait for background work
  // compared against when the email is unknown, so "no such user" takes as long as "wrong password"
  const dummyHash = hashPassword('not-a-real-password', config.bcryptRounds);

  router.post('/signup', wrap(async (req, res) => {
    const { name, email, password } = validateSignup(req.body);
    const lang = req.body?.lang === 'ta' ? 'ta' : 'en';

    // If skipEmailVerification is enabled (e.g. fast unit tests), auto-verify
    if (config.skipEmailVerification) {
      let user;
      try {
        user = await repo.users.create({
          name,
          email,
          passwordHash: await hashPassword(password, config.bcryptRounds),
          emailVerified: true,
        });
      } catch (err) {
        if (err instanceof DuplicateEmailError) throw conflict('An account with this email already exists.', 'email_taken');
        throw err;
      }
      return res.status(201).json({ token: signToken(user.id, config), user: publicUser(user) });
    }

    const code = newVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + config.verificationCodeMinutes * 60 * 1000);

    let user;
    try {
      user = await repo.users.create({
        name,
        email,
        passwordHash: await hashPassword(password, config.bcryptRounds),
        emailVerified: false,
        verificationCodeHash: codeHash,
        verificationExpiresAt: expiresAt,
      });
    } catch (err) {
      if (err instanceof DuplicateEmailError) throw conflict('An account with this email already exists.', 'email_taken');
      throw err;
    }

    // Send verification email
    if (mailer && mailer.kind !== 'none') {
      inBackground(mailer.send({
        to: user.email,
        ...verificationEmail({ lang, name: user.name, code, minutes: config.verificationCodeMinutes }),
      }));
    } else {
      console.log(`[FirstFurrow DEV] Email verification code for ${user.email} is: ${code}`);
    }

    res.status(201).json({
      requiresVerification: true,
      email: user.email,
      message: 'Verification code sent to your email.',
      user: publicUser(user),
    });
  }));

  // ── Email verification ────────────────────────────────────────────────────────
  router.post('/verify-email', wrap(async (req, res) => {
    const email = validateEmail(req.body?.email);
    const codeStr = String(req.body?.code ?? '').trim();
    if (!/^\d{6}$/.test(codeStr)) throw badRequest('Please enter a valid 6-digit verification code.', 'invalid_code');

    const user = await repo.users.findByEmail(email);
    if (!user) throw badRequest('Invalid verification request.', 'invalid_code');

    if (!user.verificationCodeHash || !user.verificationExpiresAt || new Date(user.verificationExpiresAt).getTime() <= Date.now()) {
      throw badRequest('Verification code has expired. Please request a new one.', 'code_expired');
    }

    if (hashVerificationCode(codeStr) !== user.verificationCodeHash) {
      throw badRequest('Incorrect verification code. Please check and try again.', 'invalid_code');
    }

    const updated = await repo.users.markEmailVerified(user.id);
    res.json({ token: signToken(user.id, config), user: publicUser(updated) });
  }));

  router.post('/resend-verification', wrap(async (req, res) => {
    const email = validateEmail(req.body?.email);
    const lang = req.body?.lang === 'ta' ? 'ta' : 'en';

    const user = await repo.users.findByEmail(email);
    if (!user) return res.json({ ok: true }); // do not disclose registration status

    if (user.verificationCooldown && Date.now() - new Date(user.verificationCooldown).getTime() < config.verificationCooldownSeconds * 1000) {
      throw new HttpError(429, 'Please wait a moment before requesting another verification code.', 'rate_limited');
    }

    const code = newVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + config.verificationCodeMinutes * 60 * 1000);
    await repo.users.setVerificationCode(user.id, { codeHash, expiresAt, cooldown: new Date() });

    if (mailer && mailer.kind !== 'none') {
      inBackground(mailer.send({
        to: user.email,
        ...verificationEmail({ lang, name: user.name, code, minutes: config.verificationCodeMinutes }),
      }));
    } else {
      console.log(`[FirstFurrow DEV] Email verification code for ${user.email} is: ${code}`);
    }

    res.json({ ok: true });
  }));

  router.post('/login', wrap(async (req, res) => {
    const { email, password } = validateLogin(req.body);
    const lang = req.body?.lang === 'ta' ? 'ta' : 'en';
    const user = await repo.users.findByEmail(email);

    // Account-level lockout check:
    if (user?.lockUntil && new Date(user.lockUntil).getTime() > Date.now()) {
      const remainingMins = Math.max(1, Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000));
      throw new HttpError(429, `This account is temporarily locked due to repeated incorrect password attempts. Please try again in ${remainingMins} minute(s).`, 'account_locked');
    }

    const ok = await checkPassword(password, user ? user.passwordHash : await dummyHash);
    if (!user || !ok) {
      if (user) {
        const attempts = (user.failedLoginAttempts || 0) + 1;
        if (attempts >= config.maxFailedLogins) {
          const lockUntil = new Date(Date.now() + config.lockoutMinutes * 60 * 1000);
          await repo.users.recordFailedAttempt(user.id, { attempts, lockUntil });
          throw new HttpError(429, `Too many incorrect password attempts. This account is locked for ${config.lockoutMinutes} minutes.`, 'account_locked');
        } else {
          await repo.users.recordFailedAttempt(user.id, { attempts, lockUntil: null });
        }
      }
      throw unauthorized('Incorrect email or password.', 'bad_credentials');
    }

    // Successful credentials: reset failed login attempts if any were recorded
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await repo.users.resetFailedAttempts(user.id);
    }

    // If skipEmailVerification is enabled (e.g. fast unit tests), directly return token
    if (config.skipEmailVerification) {
      return res.json({ token: signToken(user.id, config), user: publicUser(user) });
    }

    // Require 6-digit verification code sent to email for login
    const code = newVerificationCode();
    const codeHash = hashVerificationCode(code);
    const expiresAt = new Date(Date.now() + config.verificationCodeMinutes * 60 * 1000);
    await repo.users.setVerificationCode(user.id, { codeHash, expiresAt, cooldown: new Date() });

    if (mailer && mailer.kind !== 'none') {
      inBackground(mailer.send({
        to: user.email,
        ...verificationEmail({ lang, name: user.name, code, minutes: config.verificationCodeMinutes }),
      }));
    } else {
      console.log(`[FirstFurrow DEV] Login verification code for ${user.email} is: ${code}`);
    }

    res.json({
      requiresVerification: true,
      email: user.email,
      message: 'Verification code sent to your email.',
    });
  }));

  // ── Forgot password ─────────────────────────────────────────────────────────
  // Always answers the same way, so it can't be used to find out which emails have accounts.
  router.post('/forgot-password', wrap(async (req, res) => {
    const email = validateEmail(req.body?.email);
    const lang = req.body?.lang === 'ta' ? 'ta' : 'en';
    // Whether the SERVER can send email says nothing about any account, so being honest here leaks nothing —
    // and it beats telling someone to "check your email" when no email can ever arrive.
    if (mailer.kind === 'none') throw new HttpError(503, 'Password-reset email is not set up on this server yet.', 'email_unavailable');
    inBackground(sendResetEmail(email, lang));
    res.json({ ok: true });
  }));

  async function sendResetEmail(email, lang) {
    const user = await repo.users.findByEmail(email);
    if (!user) return; // no account: say nothing
    if (!config.appUrl) throw new Error('APP_URL is not set, so a reset link cannot be built.');

    // at most one email a minute per account — stops anyone flooding somebody's inbox
    const last = await repo.resets.latestForUser(user.id);
    if (last && Date.now() - new Date(last.createdAt).getTime() < config.resetCooldownSeconds * 1000) return;

    const token = newToken();
    await repo.resets.create({ userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + config.resetTokenMinutes * 60 * 1000) });
    const link = `${config.appUrl}/reset-password?token=${token}`;
    await mailer.send({ to: user.email, ...resetEmail({ lang, name: user.name, link, minutes: config.resetTokenMinutes }) });
  }

  router.post('/reset-password', wrap(async (req, res) => {
    const { token, password } = req.body ?? {};
    const invalid = () => badRequest('This reset link is invalid or has expired.', 'invalid_reset_token');
    if (!isStr(token) || !TOKEN_RE.test(token)) throw invalid();
    validatePassword(password); // checked BEFORE the link is used up, so a too-short password can simply be retyped

    const record = await repo.resets.consume(hashToken(token)); // atomic: a link works exactly once
    if (!record || new Date(record.expiresAt).getTime() <= Date.now()) throw invalid();
    const user = await repo.users.findById(record.userId);
    if (!user) throw invalid();

    await repo.users.updatePassword(user.id, await hashPassword(password, config.bcryptRounds));
    await repo.resets.deleteForUser(user.id);
    if (config.appUrl) {
      inBackground(mailer.send({ to: user.email, ...changedEmail({ lang: req.body?.lang === 'ta' ? 'ta' : 'en', name: user.name, forgotUrl: `${config.appUrl}/` }) }));
    }
    res.json({ ok: true });
  }));

  router.get('/me', requireAuth(config, repo), wrap(async (req, res) => {
    res.json({ user: publicUser(await repo.users.findById(req.userId)) });
  }));

  // ── Settings & Account Deletion ──────────────────────────────────────────────
  const wrongPassword = () => new HttpError(403, 'Your current password is not correct.', 'wrong_password');
  const lang = (req) => (req.body?.lang === 'ta' ? 'ta' : 'en');

  router.patch('/profile', requireAuth(config, repo), wrap(async (req, res) => {
    const changes = validateProfile(req.body);
    const user = await repo.users.findById(req.userId);
    if (!user) throw unauthorized();
    const emailChanges = changes.email !== undefined && changes.email !== user.email;
    if (changes.email === user.email) delete changes.email; // same address typed again: nothing to do
    if (emailChanges) {
      if (!isStr(req.body.currentPassword) || !(await checkPassword(req.body.currentPassword, user.passwordHash))) throw wrongPassword();
    }
    if (changes.name === user.name) delete changes.name;
    if (!('name' in changes) && !('email' in changes)) return res.json({ user: publicUser(user) });

    let updated;
    try {
      updated = await repo.users.updateProfile(user.id, changes);
    } catch (err) {
      if (err instanceof DuplicateEmailError) throw conflict('An account with this email already exists.', 'email_taken');
      throw err;
    }
    if (emailChanges) {
      await repo.resets.deleteForUser(user.id); // a reset link sent to the old address must not work any more
      if (config.appUrl) inBackground(mailer.send({ to: user.email, ...emailChangedEmail({ lang: lang(req), name: updated.name, newEmail: updated.email, forgotUrl: `${config.appUrl}/` }) }));
    }
    res.json({ user: publicUser(updated) });
  }));

  router.post('/change-password', requireAuth(config, repo), wrap(async (req, res) => {
    const { currentPassword, newPassword } = req.body ?? {};
    const user = await repo.users.findById(req.userId);
    if (!user) throw unauthorized();
    if (!isStr(currentPassword) || !(await checkPassword(currentPassword, user.passwordHash))) throw wrongPassword();
    validatePassword(newPassword);
    if (newPassword === currentPassword) throw badRequest('Choose a password different from your current one.', 'same_password');

    await repo.users.updatePassword(user.id, await hashPassword(newPassword, config.bcryptRounds));
    await repo.resets.deleteForUser(user.id);
    if (config.appUrl) inBackground(mailer.send({ to: user.email, ...changedEmail({ lang: lang(req), name: user.name, forgotUrl: `${config.appUrl}/` }) }));
    // Every login issued before now stops working (that is what signs out other devices). This device gets a fresh one.
    res.json({ token: signToken(user.id, config), user: publicUser(user) });
  }));

  // ── Delete my account ───────────────────────────────────────────────────────
  // Permanently wipes the user's account and all associated farm plans and reset tokens.
  // Requires verifying current password so an unattended session cannot be abused.
  router.delete('/me', requireAuth(config, repo), wrap(async (req, res) => {
    const { password } = req.body ?? {};
    const user = await repo.users.findById(req.userId);
    if (!user) throw unauthorized();
    if (!isStr(password) || !(await checkPassword(password, user.passwordHash))) throw wrongPassword();

    await repo.plans.deleteAllForUser(user.id);
    await repo.resets.deleteForUser(user.id);
    await repo.users.delete(user.id);

    res.json({ ok: true, deleted: true });
  }));

  return router;
}
