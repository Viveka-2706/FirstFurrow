import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './helpers.js';
import { hashToken } from '../src/services/passwordReset.js';

const withApp = (opts, fn) => async () => {
  const app = await startApp(opts);
  try { await fn(app); } finally { await app.close(); }
};
const forgot = (app, body) => app.request('POST', '/api/auth/forgot-password', { body });
const reset = (app, body) => app.request('POST', '/api/auth/reset-password', { body });
const login = (app, email, password) => app.request('POST', '/api/auth/login', { body: { email, password } });
const tokenFrom = (mail) => mail.text.match(/reset-password\?token=([A-Za-z0-9_-]{43})/)?.[1];

// registers a farmer and asks for a reset; returns everything a test needs
async function requestReset(app, name = 'Ravi Kumar') {
  const f = await app.signup(name);
  const r = await forgot(app, { email: f.email });
  await app.idle();
  const mail = app.outbox.at(-1);
  return { ...f, response: r, mail, token: mail ? tokenFrom(mail) : null };
}

test('asking for a reset emails a one-time link to that address', withApp({}, async (app) => {
  const f = await requestReset(app);
  assert.equal(f.response.status, 200); assert.deepEqual(f.response.body, { ok: true });
  assert.equal(app.outbox.length, 1);
  assert.equal(f.mail.to, f.email);
  assert.match(f.mail.subject, /reset/i);
  assert.match(f.mail.text, /^Hi Ravi Kumar,/);
  assert.match(f.mail.text, /https:\/\/farm\.example\.com\/reset-password\?token=[A-Za-z0-9_-]{43}\b/);
  assert.ok(f.mail.html.includes(f.token), 'the button in the HTML email carries the same link');
  assert.match(f.mail.text, /30 minutes/);
}));

test('an unknown address gets the SAME answer and no email — so nobody can discover who has an account', withApp({}, async (app) => {
  const known = await app.signup();
  const a = await forgot(app, { email: known.email });
  const b = await forgot(app, { email: 'nobody-here@example.com' });
  await app.idle();
  assert.equal(a.status, b.status); assert.deepEqual(a.body, b.body);
  assert.equal(app.outbox.length, 1, 'only the real account was emailed');
}));

test('email matching ignores case and spaces', withApp({}, async (app) => {
  const f = await app.signup();
  await forgot(app, { email: `  ${f.email.toUpperCase()} ` });
  await app.idle();
  assert.equal(app.outbox.length, 1); assert.equal(app.outbox[0].to, f.email);
}));

test('bad input to "forgot password" is rejected', withApp({}, async (app) => {
  for (const body of [{}, { email: 'not-an-email' }, { email: 42 }, { email: { $ne: null } }, { email: ['a@b.co'] }]) {
    const r = await forgot(app, body);
    assert.equal(r.status, 400, JSON.stringify(body)); assert.equal(r.body.code, 'invalid_email');
  }
  await app.idle(); assert.equal(app.outbox.length, 0);
}));

test('only a HASH of the token is stored — a copy of the database cannot reset anyone', withApp({}, async (app) => {
  const f = await requestReset(app);
  const user = await app.repo.users.findByEmail(f.email);
  const stored = await app.repo.resets.latestForUser(user.id);
  assert.equal(stored.tokenHash, hashToken(f.token));
  assert.notEqual(stored.tokenHash, f.token);
  assert.ok(!JSON.stringify(stored).includes(f.token));
  const mins = (new Date(stored.expiresAt) - Date.now()) / 60000;
  assert.ok(mins > 28 && mins <= 30, `expires in ~30 minutes, got ${mins}`);
}));

test('full journey: reset → old password dead → new password works → confirmation email', withApp({}, async (app) => {
  const f = await requestReset(app);
  const r = await reset(app, { token: f.token, password: 'brand-new-pass' });
  assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true });

  assert.equal((await login(app, f.email, f.password)).status, 401, 'old password no longer works');
  const ok = await login(app, f.email, 'brand-new-pass');
  assert.equal(ok.status, 200); assert.ok(ok.body.token);

  await app.idle();
  const confirm = app.outbox.at(-1);
  assert.equal(app.outbox.length, 2); assert.equal(confirm.to, f.email); assert.match(confirm.subject, /changed/i);
  assert.ok(!confirm.text.includes('brand-new-pass'), 'the new password is never emailed');
}));

test('a link works exactly once', withApp({}, async (app) => {
  const f = await requestReset(app);
  assert.equal((await reset(app, { token: f.token, password: 'first-new-pass' })).status, 200);
  const again = await reset(app, { token: f.token, password: 'second-new-pass' });
  assert.equal(again.status, 400); assert.equal(again.body.code, 'invalid_reset_token');
  assert.equal((await login(app, f.email, 'first-new-pass')).status, 200, 'the first password stands');
}));

test('two people clicking the same link at once: only one wins', withApp({}, async (app) => {
  const f = await requestReset(app);
  const [a, b] = await Promise.all([reset(app, { token: f.token, password: 'racer-pass-one' }), reset(app, { token: f.token, password: 'racer-pass-two' })]);
  assert.deepEqual([a.status, b.status].sort(), [200, 400]);
}));

test('an expired link is refused', withApp({}, async (app) => {
  const f = await requestReset(app);
  const user = await app.repo.users.findByEmail(f.email);
  await app.repo.resets.deleteForUser(user.id);
  const raw = 'e'.repeat(43);
  await app.repo.resets.create({ userId: user.id, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() - 1000) });
  const r = await reset(app, { token: raw, password: 'fresh-password' });
  assert.equal(r.status, 400); assert.equal(r.body.code, 'invalid_reset_token');
  assert.equal((await login(app, f.email, f.password)).status, 200, 'password unchanged');
}));

test('made-up, malformed and wrongly-typed tokens are all refused', withApp({}, async (app) => {
  const bad = ['x'.repeat(43), 'short', '', 'a'.repeat(44), `${'a'.repeat(42)}!`, 12345, null, { $ne: null }, ['a'.repeat(43)], undefined];
  for (const token of bad) {
    const r = await reset(app, { token, password: 'a-fine-password' });
    assert.equal(r.status, 400, JSON.stringify(token)); assert.equal(r.body.code, 'invalid_reset_token');
  }
}));

test('a too-short new password is refused WITHOUT using up the link', withApp({}, async (app) => {
  const f = await requestReset(app);
  for (const password of ['short', '', 12345678, undefined, 'x'.repeat(73)]) {
    const r = await reset(app, { token: f.token, password });
    assert.equal(r.status, 400); assert.equal(r.body.code, 'weak_password');
  }
  assert.equal((await reset(app, { token: f.token, password: 'now-a-good-one' })).status, 200, 'same link still works for a valid password');
}));

test('resetting logs out every older session (someone who stole a login is kicked out)', withApp({}, async (app) => {
  const f = await requestReset(app);
  // make "before" and "after" land in different seconds (tokens carry a 1-second timestamp)
  const oldToken = (await login(app, f.email, f.password)).body.token;
  assert.equal((await app.request('GET', '/api/auth/me', { token: oldToken })).status, 200);
  await new Promise((r) => setTimeout(r, 1100));
  await reset(app, { token: f.token, password: 'after-the-reset' });
  const stale = await app.request('GET', '/api/auth/me', { token: oldToken });
  assert.equal(stale.status, 401); assert.equal(stale.body.code, 'unauthorized');
  const fresh = (await login(app, f.email, 'after-the-reset')).body.token;
  assert.equal((await app.request('GET', '/api/auth/me', { token: fresh })).status, 200);
}));

test('a farmer can still use their plans after resetting (data is untouched)', withApp({}, async (app) => {
  const f = await requestReset(app);
  await app.request('POST', '/api/plans', { token: f.token ? (await login(app, f.email, f.password)).body.token : '', body: { cropId: 'okra', land: 1, soilId: 'red', region: 'Salem', season: 'Kharif (Jun–Oct)' } });
  await reset(app, { token: f.token, password: 'after-the-reset' });
  const t2 = (await login(app, f.email, 'after-the-reset')).body.token;
  assert.equal((await app.request('GET', '/api/plans', { token: t2 })).body.plans.length, 1);
}));

test('asking again quickly does not send a second email; asking later replaces the old link', async () => {
  const app = await startApp();
  try {
    const f = await requestReset(app);
    await forgot(app, { email: f.email }); await forgot(app, { email: f.email }); await app.idle();
    assert.equal(app.outbox.length, 1, 'cool-down: one email per minute per account');
  } finally { await app.close(); }

  const app2 = await startApp({ resetCooldownSeconds: 0 });
  try {
    const f = await requestReset(app2);
    await forgot(app2, { email: f.email }); await app2.idle();
    assert.equal(app2.outbox.length, 2);
    const [first, second] = app2.outbox.map(tokenFrom);
    assert.notEqual(first, second);
    assert.equal((await reset(app2, { token: first, password: 'old-link-pass' })).status, 400, 'the earlier link is dead');
    assert.equal((await reset(app2, { token: second, password: 'new-link-pass' })).status, 200);
  } finally { await app2.close(); }
});

test('the link is built from configuration, never from request headers (no link poisoning)', withApp({}, async (app) => {
  const f = await app.signup();
  await app.request('POST', '/api/auth/forgot-password', { body: { email: f.email }, headers: { 'X-Forwarded-Host': 'evil.example.com', Origin: 'https://evil.example.com' } });
  await app.idle();
  assert.ok(app.outbox[0].text.includes('https://farm.example.com/reset-password'));
  assert.ok(!app.outbox[0].text.includes('evil.example.com') && !app.outbox[0].html.includes('evil.example.com'));
}));

test('Tamil emails when the farmer is using the Tamil site; anything else falls back to English', withApp({ resetCooldownSeconds: 0 }, async (app) => {
  const f = await app.signup('மீனா');
  await forgot(app, { email: f.email, lang: 'ta' }); await app.idle();
  assert.match(app.outbox[0].subject, /[\u0B80-\u0BFF]/); assert.match(app.outbox[0].text, /^வணக்கம் மீனா,/);
  assert.match(app.outbox[0].text, /reset-password\?token=/);
  await forgot(app, { email: f.email, lang: 'fr' }); await forgot(app, { email: f.email }); await app.idle();
  assert.ok(app.outbox.slice(1).every((m) => /^Hi /.test(m.text)));
}));

test('a name containing HTML cannot inject markup into the email', withApp({}, async (app) => {
  const f = await requestReset(app, '<script>alert(1)</script>');
  assert.ok(!f.mail.html.includes('<script>')); assert.ok(f.mail.html.includes('&lt;script&gt;'));
}));

test('if the mail server is down the farmer sees no difference, and the server does not crash', withApp({}, async (app) => {
  app.mailer.fail = true;
  const f = await app.signup();
  const orig = console.error; console.error = () => {};
  const r = await forgot(app, { email: f.email });
  await app.idle();
  console.error = orig;
  assert.equal(r.status, 200); assert.deepEqual(r.body, { ok: true });
  assert.equal((await app.request('GET', '/api/health')).status, 200, 'server still healthy');
}));

test('"forgot password" is rate-limited much harder than login', async () => {
  const app = await startApp({ rateLimits: { auth: { windowMs: 60000, limit: 1000 }, api: { windowMs: 60000, limit: 1000 }, forgot: { windowMs: 60000, limit: 3 } } });
  try {
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await forgot(app, { email: 'x@example.com' })).status);
    assert.deepEqual(codes, [200, 200, 200, 429, 429]);
    assert.equal((await app.request('POST', '/api/auth/login', { body: { email: 'x@example.com', password: 'wrong-wrong' } })).status, 401, 'login has its own budget');
  } finally { await app.close(); }
});

test('the reset page is not leaked through the Referer header', withApp({}, async (app) => {
  assert.equal((await app.request('GET', '/api/health')).headers.get('referrer-policy'), 'no-referrer');
}));
