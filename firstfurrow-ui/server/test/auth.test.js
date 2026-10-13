import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { startApp } from './helpers.js';

let app;
before(async () => { app = await startApp(); });
after(() => app.close());

const signupBody = (over = {}) => ({ name: 'Ravi Kumar', email: `ravi${Math.random().toString(36).slice(2, 8)}@example.com`, password: 'correct-horse1', ...over });

test('signup creates an account and returns a token + public user (never the password)', async () => {
  const b = signupBody();
  const r = await app.request('POST', '/api/auth/signup', { body: b });
  assert.equal(r.status, 201);
  assert.ok(r.body.token.split('.').length === 3, 'a JWT');
  assert.deepEqual(Object.keys(r.body.user).sort(), ['email', 'emailVerified', 'id', 'name']);
  assert.ok(!r.text.includes(b.password) && !r.text.includes('passwordHash'));
});

test('the password is stored as a bcrypt hash, never in plain text', async () => {
  const b = signupBody();
  await app.request('POST', '/api/auth/signup', { body: b });
  const stored = await app.repo.users.findByEmail(b.email);
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
  assert.ok(!stored.passwordHash.includes(b.password));
});

test('emails are case-insensitive: a duplicate in different case is rejected with 409 email_taken', async () => {
  const b = signupBody({ email: 'Mixed.Case@Example.com' });
  assert.equal((await app.request('POST', '/api/auth/signup', { body: b })).status, 201);
  const dup = await app.request('POST', '/api/auth/signup', { body: { ...b, email: 'mixed.case@example.COM' } });
  assert.equal(dup.status, 409); assert.equal(dup.body.code, 'email_taken');
});

test('signup validation: bad email, short/long password, missing name, wrong types, missing letter/number', async () => {
  const cases = [
    [{ email: 'not-an-email' }, 'invalid_email'],
    [{ email: 12345 }, 'invalid_email'],
    [{ password: 'short' }, 'weak_password'],
    [{ password: 'x'.repeat(73) }, 'weak_password'],
    [{ password: 12345678 }, 'weak_password'],
    [{ password: 'onlyletterspass' }, 'weak_password'],
    [{ password: '1234567890' }, 'weak_password'],
    [{ name: '   ' }, 'validation'],
    [{ name: { $ne: 1 } }, 'validation'],
    [{ name: 'n'.repeat(81) }, 'validation'],
  ];
  for (const [over, code] of cases) {
    const r = await app.request('POST', '/api/auth/signup', { body: signupBody(over) });
    assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(r.body.code, code, JSON.stringify(over));
  }
  assert.equal((await app.request('POST', '/api/auth/signup', { body: undefined })).status, 400);
});

test('login works, and a wrong password looks exactly like an unknown email', async () => {
  const b = signupBody();
  await app.request('POST', '/api/auth/signup', { body: b });
  const ok = await app.request('POST', '/api/auth/login', { body: { email: b.email.toUpperCase(), password: b.password } });
  assert.equal(ok.status, 200); assert.ok(ok.body.token);

  const wrongPw = await app.request('POST', '/api/auth/login', { body: { email: b.email, password: 'nope-nope-nope' } });
  const noUser = await app.request('POST', '/api/auth/login', { body: { email: 'ghost@example.com', password: 'nope-nope-nope' } });
  assert.equal(wrongPw.status, 401); assert.equal(noUser.status, 401);
  assert.deepEqual(wrongPw.body, noUser.body, 'identical response — no way to discover which emails exist');
  assert.equal(wrongPw.body.code, 'bad_credentials');
});

test('NoSQL-injection style payloads are rejected, not executed', async () => {
  const b = signupBody();
  await app.request('POST', '/api/auth/signup', { body: b });
  for (const body of [{ email: { $gt: '' }, password: { $gt: '' } }, { email: b.email, password: { $ne: null } }, { email: { $ne: null }, password: 'correct-horse1' }]) {
    const r = await app.request('POST', '/api/auth/login', { body });
    assert.ok([400, 401].includes(r.status) && !r.body.token, `got ${r.status} for ${JSON.stringify(body)}`);
  }
});

test('GET /api/auth/me returns the logged-in user', async () => {
  const { token, user } = await app.signup('Meena');
  const r = await app.request('GET', '/api/auth/me', { token });
  assert.equal(r.status, 200); assert.equal(r.body.user.id, user.id); assert.equal(r.body.user.name, 'Meena');
});

test('bad tokens are all rejected with 401: none, garbage, wrong secret, expired, alg=none, deleted user', async () => {
  const { user } = await app.signup();
  const secret = app.config.jwtSecret;
  const bad = {
    none: undefined,
    garbage: 'not.a.token',
    wrongSecret: jwt.sign({}, 'some-other-secret-some-other-secret!!', { subject: user.id }),
    expired: jwt.sign({}, secret, { subject: user.id, expiresIn: -10 }),
    algNone: `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id })).toString('base64url')}.`,
    deletedUser: jwt.sign({}, secret, { subject: 'a'.repeat(24), expiresIn: '1h' }),
  };
  for (const [name, token] of Object.entries(bad)) {
    const r = await app.request('GET', '/api/auth/me', { token });
    assert.equal(r.status, 401, name); assert.equal(r.body.code, 'unauthorized', name);
  }
  // and a correctly signed one works, as a control
  const good = jwt.sign({}, secret, { subject: user.id, expiresIn: '1h' });
  assert.equal((await app.request('GET', '/api/auth/me', { token: good })).status, 200);
});
