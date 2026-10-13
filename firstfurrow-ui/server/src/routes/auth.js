import { Router } from 'express';
import { HttpError, badRequest, conflict, unauthorized, DuplicateEmailError } from '../errors.js';
import { validateSignup, validateLogin, validateEmail, validatePassword, validateProfile, hashPassword, checkPassword, signToken, publicUser } from '../services/auth.js';
import { newToken, hashToken, TOKEN_RE, resetEmail, changedEmail, emailChangedEmail } from '../services/passwordReset.js';
import { isStr } from '../validate.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/wrap.js';

export function authRoutes(repo, config, mailer) {
  const router = Router();

  // Emails are sent AFTER the response goes out. That keeps "forgot password" equally fast whether or not the
  // address has an account (so timing can't reveal who is registered), and a slow mail server never blocks the page.
  const pending = new Set();
  const inBackground = (promise) => {
    const task = promise.catch((err) => console.error(`[password reset] ${err.message}`)).finally(() => pending.delete(task));
    pending.add(task);
  };
  router.idle = () => Promise.allSettled([...pending]); // lets tests wait for background work
  // compared against when the email is unknown, so "no such user" takes as long as "wrong password"
  const dummyHash = hashPassword('not-a-real-password', config.bcryptRounds);

  router.post('/signup', wrap(async (req, res) => {
    const { name, email, password } = validateSignup(req.body);
    let user;
    try {
      user = await repo.users.create({ name, email, passwordHash: await hashPassword(password, config.bcryptRounds) });
    } catch (err) {
      if (err instanceof DuplicateEmailError) throw conflict('An account with this email already exists.', 'email_taken');
      throw err;
    }
    res.status(201).json({ token: signToken(user.id, config), user: publicUser(user) });
  }));

  router.post('/login', wrap(async (req, res) => {
    const { email, password } = validateLogin(req.body);
    const user = await repo.users.findByEmail(email);
    const ok = await checkPassword(password, user ? user.passwordHash : await dummyHash);
    if (!user || !ok) throw unauthorized('Incorrect email or password.', 'bad_credentials');
    res.json({ token: signToken(user.id, config), user: publicUser(user) });
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

  // ── Settings (the farmer is logged in) ──────────────────────────────────────
  // A stolen or left-open session must not be enough to take over an account, so changing the login email or the
  // password asks for the CURRENT password again. (403, not 401: the login itself is fine, so the app must not log out.)
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

  return router;
}
