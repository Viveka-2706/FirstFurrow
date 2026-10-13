import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './helpers.js';

const withApp = (opts, fn) => async () => {
  const app = await startApp(opts);
  try { await fn(app); } finally { await app.close(); }
};
const profile = (app, token, body) => app.request('PATCH', '/api/auth/profile', { token, body });
const changePw = (app, token, body) => app.request('POST', '/api/auth/change-password', { token, body });
const login = (app, email, password) => app.request('POST', '/api/auth/login', { body: { email, password } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('settings need a login', withApp({}, async (app) => {
  assert.equal((await profile(app, null, { name: 'X' })).status, 401);
  assert.equal((await changePw(app, null, { currentPassword: 'a', newPassword: 'bbbbbbbb1' })).status, 401);
}));

test('the name can be changed without the password', withApp({}, async (app) => {
  const f = await app.signup('Old Name');
  const r = await profile(app, f.token, { name: '  New Name ' });
  assert.equal(r.status, 200); assert.equal(r.body.user.name, 'New Name'); assert.equal(r.body.user.email, f.email);
  assert.equal((await app.request('GET', '/api/auth/me', { token: f.token })).body.user.name, 'New Name');
  assert.equal((await profile(app, f.token, { name: '   ' })).status, 400);
  assert.equal((await profile(app, f.token, {})).status, 400);
}));

test('changing the login email needs the current password, then the new address works and the old one does not', withApp({}, async (app) => {
  const f = await app.signup('Ravi');
  const bad = await profile(app, f.token, { email: 'new.ravi@example.com' });
  assert.equal(bad.status, 403); assert.equal(bad.body.code, 'wrong_password');
  const wrong = await profile(app, f.token, { email: 'new.ravi@example.com', currentPassword: 'not-it-at-all' });
  assert.equal(wrong.status, 403); assert.equal(wrong.body.code, 'wrong_password');

  const ok = await profile(app, f.token, { email: '  New.Ravi@Example.com ', currentPassword: f.password, lang: 'ta' });
  assert.equal(ok.status, 200); assert.equal(ok.body.user.email, 'new.ravi@example.com');
  assert.equal((await login(app, 'new.ravi@example.com', f.password)).status, 200);
  assert.equal((await login(app, f.email, f.password)).status, 401);
  // still logged in on this device — changing the email is not a sign-out
  assert.equal((await app.request('GET', '/api/auth/me', { token: f.token })).status, 200);

  await app.idle();
  assert.equal(app.outbox.length, 1, 'the OLD address is warned');
  assert.equal(app.outbox[0].to, f.email);
  assert.ok(app.outbox[0].text.includes('new.ravi@example.com'));
  assert.match(app.outbox[0].text, /[஀-௿]/, 'in Tamil when the app is in Tamil');
}));

test('an email that already has an account is refused, and nothing changes', withApp({}, async (app) => {
  const a = await app.signup('A'); const b = await app.signup('B');
  const r = await profile(app, a.token, { email: b.email.toUpperCase(), currentPassword: a.password });
  assert.equal(r.status, 409); assert.equal(r.body.code, 'email_taken');
  assert.equal((await login(app, a.email, a.password)).status, 200);
}));

test('typing the same email again changes nothing and sends nothing', withApp({}, async (app) => {
  const f = await app.signup();
  const r = await profile(app, f.token, { email: f.email.toUpperCase() });
  assert.equal(r.status, 200); assert.equal(r.body.user.email, f.email);
  await app.idle(); assert.equal(app.outbox.length, 0);
}));

test('a bad email is refused', withApp({}, async (app) => {
  const f = await app.signup();
  assert.equal((await profile(app, f.token, { email: 'not-an-email', currentPassword: f.password })).status, 400);
  assert.equal((await profile(app, f.token, { email: { $gt: '' }, currentPassword: f.password })).status, 400);
}));

test('changing the password: needs the current one, rules apply, other devices are signed out, this one stays in', withApp({}, async (app) => {
  const f = await app.signup('Ravi');
  const otherDevice = (await login(app, f.email, f.password)).body.token;
  await sleep(1100); // tokens are dated to the second

  const wrong = await changePw(app, f.token, { currentPassword: 'wrong-wrong', newPassword: 'brand-new-pass1' });
  assert.equal(wrong.status, 403); assert.equal(wrong.body.code, 'wrong_password');
  assert.equal((await changePw(app, f.token, { currentPassword: f.password, newPassword: 'short' })).body.code, 'weak_password');
  assert.equal((await changePw(app, f.token, { currentPassword: f.password, newPassword: f.password })).body.code, 'same_password');
  assert.equal((await changePw(app, f.token, { currentPassword: f.password })).status, 400);
  assert.equal((await changePw(app, f.token, { currentPassword: ['x'], newPassword: 'brand-new-pass1' })).status, 403);

  const ok = await changePw(app, f.token, { currentPassword: f.password, newPassword: 'brand-new-pass1', lang: 'en' });
  assert.equal(ok.status, 200); assert.ok(ok.body.token); assert.equal(ok.body.user.email, f.email);
  assert.equal((await login(app, f.email, f.password)).status, 401, 'old password is dead');
  assert.equal((await login(app, f.email, 'brand-new-pass1')).status, 200);
  assert.equal((await app.request('GET', '/api/auth/me', { token: ok.body.token })).status, 200, 'this device keeps working');
  assert.equal((await app.request('GET', '/api/auth/me', { token: otherDevice })).status, 401, 'other devices are signed out');
  assert.equal((await app.request('GET', '/api/auth/me', { token: f.token })).status, 401, 'the old token is dead too');

  await app.idle();
  assert.equal(app.outbox.length, 1); assert.equal(app.outbox[0].to, f.email); assert.match(app.outbox[0].subject, /password was changed/i);
}));

test('wrong current password attempts are rate limited like logging in', withApp({ rateLimits: { auth: { windowMs: 60000, limit: 3 }, api: { windowMs: 60000, limit: 10000 }, forgot: { windowMs: 60000, limit: 10000 } } }, async (app) => {
  const f = await app.signup(); // signup uses one of the 3
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await changePw(app, f.token, { currentPassword: 'guess-guess', newPassword: 'whatever-123' })).status);
  assert.deepEqual(codes.slice(0, 2), [403, 403]); assert.ok(codes.includes(429));
}));
