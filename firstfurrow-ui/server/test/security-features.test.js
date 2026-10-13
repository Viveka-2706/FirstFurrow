import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, planBody } from './helpers.js';

const withApp = (opts, fn) => async () => {
  const app = await startApp(opts);
  try { await fn(app); } finally { await app.close(); }
};

// ── 1. Delete My Account ──────────────────────────────────────────────────────
test('Delete account: requires current password, removes user, plans, and resets', withApp({}, async (app) => {
  const f = await app.signup('Kavitha');
  // Create a plan for Kavitha
  const p = await app.request('POST', '/api/plans', { token: f.token, body: planBody() });
  assert.equal(p.status, 201);
  assert.equal((await app.repo.plans.listByUser(f.user.id)).length, 1);

  // Wrong password fails
  const wrong = await app.request('DELETE', '/api/auth/me', { token: f.token, body: { password: 'wrong-password1' } });
  assert.equal(wrong.status, 403);
  assert.equal(wrong.body.code, 'wrong_password');

  // Correct password deletes everything
  const del = await app.request('DELETE', '/api/auth/me', { token: f.token, body: { password: f.password } });
  assert.equal(del.status, 200);
  assert.equal(del.body.ok, true);

  // User no longer exists
  assert.equal(await app.repo.users.findById(f.user.id), null);
  // All plans for user are gone
  assert.equal((await app.repo.plans.listByUser(f.user.id)).length, 0);

  // Cannot log in anymore
  const loginAgain = await app.request('POST', '/api/auth/login', { body: { email: f.email, password: f.password } });
  assert.equal(loginAgain.status, 401);
}));

// ── 2. Strong Password Rules ──────────────────────────────────────────────────
test('Strong password rule requires both letters and numbers', withApp({}, async (app) => {
  const email = 'strong.pass@example.com';
  // Numbers only
  const noLetters = await app.request('POST', '/api/auth/signup', { body: { name: 'Test', email, password: '123456789' } });
  assert.equal(noLetters.status, 400);
  assert.equal(noLetters.body.code, 'weak_password');

  // Letters only
  const noNumbers = await app.request('POST', '/api/auth/signup', { body: { name: 'Test', email, password: 'onlylettersallowed' } });
  assert.equal(noNumbers.status, 400);
  assert.equal(noNumbers.body.code, 'weak_password');

  // Both letters and numbers
  const good = await app.request('POST', '/api/auth/signup', { body: { name: 'Test', email, password: 'goodpassword1' } });
  assert.equal(good.status, 201);
}));

// ── 3. Account-Level Lockout ──────────────────────────────────────────────────
test('Account locks after repeated wrong passwords for that specific account', withApp({ maxFailedLogins: 3, lockoutMinutes: 5 }, async (app) => {
  const f = await app.signup('Suresh');

  // 3 wrong attempts
  for (let i = 0; i < 3; i++) {
    const res = await app.request('POST', '/api/auth/login', { body: { email: f.email, password: 'wrongPassword1' } });
    if (i < 2) {
      assert.equal(res.status, 401);
      assert.equal(res.body.code, 'bad_credentials');
    } else {
      // 3rd attempt hits the limit and locks account
      assert.equal(res.status, 429);
      assert.equal(res.body.code, 'account_locked');
    }
  }

  // Next attempt (even with right password) is locked
  const lockedRes = await app.request('POST', '/api/auth/login', { body: { email: f.email, password: f.password } });
  assert.equal(lockedRes.status, 429);
  assert.equal(lockedRes.body.code, 'account_locked');
  assert.match(lockedRes.body.error, /locked/i);

  // A different unknown email still returns 401, not locked
  const unknown = await app.request('POST', '/api/auth/login', { body: { email: 'unknown@example.com', password: 'wrongPassword1' } });
  assert.equal(unknown.status, 401);
}));

// ── 4. Email Verification at Sign-up ──────────────────────────────────────────
test('Email verification: signup sends code, unverified login blocked, verification activates account', withApp({ skipEmailVerification: false }, async (app) => {
  const email = 'verify.me@example.com';
  const name = 'Ananya';
  const password = 'securePassword1';

  // Sign up with verification enabled
  const signupRes = await app.request('POST', '/api/auth/signup', { body: { name, email, password } });
  assert.equal(signupRes.status, 201);
  assert.equal(signupRes.body.requiresVerification, true);
  assert.equal(signupRes.body.email, email);

  await app.idle();
  assert.equal(app.outbox.length, 1);
  assert.equal(app.outbox[0].to, email);
  assert.match(app.outbox[0].subject, /verify your firstfurrow/i);
  // Extract 6 digit code from email text
  const match = app.outbox[0].text.match(/\b\d{6}\b/);
  assert.ok(match, 'contains 6 digit code');
  const code = match[0];

  // Try to log in before verifying -> blocked!
  const prematureLogin = await app.request('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(prematureLogin.status, 403);
  assert.equal(prematureLogin.body.code, 'email_not_verified');

  // Verify with invalid code -> rejected
  const badCode = await app.request('POST', '/api/auth/verify-email', { body: { email, code: '000000' } });
  assert.equal(badCode.status, 400);
  assert.equal(badCode.body.code, 'invalid_code');

  // Verify with correct code -> succeeds and logs in
  const verifyRes = await app.request('POST', '/api/auth/verify-email', { body: { email, code } });
  assert.equal(verifyRes.status, 200);
  assert.ok(verifyRes.body.token);
  assert.equal(verifyRes.body.user.emailVerified, true);

  // Now login succeeds normally
  const loginOk = await app.request('POST', '/api/auth/login', { body: { email, password } });
  assert.equal(loginOk.status, 200);
  assert.ok(loginOk.body.token);
}));
