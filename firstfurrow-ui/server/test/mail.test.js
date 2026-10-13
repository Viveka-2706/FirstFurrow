// Sends a REAL email over the SMTP protocol to a local fake mail server, so the whole mailing path
// (nodemailer → SMTP conversation → message with a working link) is exercised without needing Gmail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { createMailer } from '../src/mail/mailer.js';
import { loadConfig } from '../src/config.js';
import { startApp } from './helpers.js';

function fakeSmtp() {
  const received = [];
  const server = new SMTPServer({
    authOptional: false,
    disabledCommands: ['STARTTLS'],
    allowInsecureAuth: true,
    onAuth(auth, _s, cb) { return auth.username === 'farm@gmail.test' && auth.password === 'abcdefghijklmnop' ? cb(null, { user: auth.username }) : cb(new Error('Invalid login')); },
    async onData(stream, session, cb) { received.push({ mail: await simpleParser(stream), rcpt: session.envelope.rcptTo.map((r) => r.address) }); cb(); },
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, received, port: server.server.address().port })));
}

const smtpConfig = (port, over = {}) => loadConfig({
  JWT_SECRET: 'x'.repeat(40), SMTP_HOST: '127.0.0.1', SMTP_PORT: String(port), SMTP_SECURE: 'false',
  MAIL_USER: 'farm@gmail.test', MAIL_APP_PASSWORD: 'abcd efgh ijkl mnop', SKIP_EMAIL_VERIFICATION: 'true', ...over,
});

test('the mailer delivers a message over SMTP, authenticating with the app password', async () => {
  const { server, received, port } = await fakeSmtp();
  try {
    const mailer = createMailer(smtpConfig(port));
    assert.equal(mailer.kind, 'smtp');
    await mailer.send({ to: 'ravi@gmail.com', subject: 'Hello', text: 'plain body', html: '<p>html body</p>' });
    assert.equal(received.length, 1);
    assert.deepEqual(received[0].rcpt, ['ravi@gmail.com']);
    assert.equal(received[0].mail.subject, 'Hello');
    assert.equal(received[0].mail.from.value[0].address, 'farm@gmail.test');
    assert.match(received[0].mail.from.text, /FirstFurrow/);
    assert.match(received[0].mail.text, /plain body/);
  } finally { server.close(); }
});

test('a wrong app password is an error, not a silent success', async () => {
  const { server, port } = await fakeSmtp();
  try {
    const mailer = createMailer(smtpConfig(port, { MAIL_APP_PASSWORD: 'wrongwrongwrong1' }));
    await assert.rejects(() => mailer.send({ to: 'a@b.co', subject: 's', text: 't' }), /Invalid login|auth/i);
  } finally { server.close(); }
});

test('END TO END: "forgot password" really emails a link that really resets the password', async () => {
  const { server, received, port } = await fakeSmtp();
  const app = await startApp({ ...smtpConfig(port), appUrl: 'https://farm.example.com' });
  try {
    // swap the in-memory mailbox for the real SMTP mailer
    const real = createMailer(smtpConfig(port));
    app.mailer.send = (m) => real.send(m);
    const f = await app.signup('Ravi');
    await app.request('POST', '/api/auth/forgot-password', { body: { email: f.email } });
    await app.idle();

    assert.equal(received.length, 1);
    assert.deepEqual(received[0].rcpt, [f.email]);
    const link = received[0].mail.text.match(/https:\/\/farm\.example\.com\/reset-password\?token=([A-Za-z0-9_-]{43})/);
    assert.ok(link, 'the delivered email contains the reset link');
    assert.ok(received[0].mail.html.includes(link[1]));

    const r = await app.request('POST', '/api/auth/reset-password', { body: { token: link[1], password: 'reset-over-smtp1' } });
    assert.equal(r.status, 200);
    assert.equal((await app.request('POST', '/api/auth/login', { body: { email: f.email, password: 'reset-over-smtp1' } })).status, 200);
  } finally { await app.close(); server.close(); }
});

test('mailer mode follows the configuration', () => {
  assert.equal(createMailer(loadConfig({})).kind, 'none', 'nothing configured → cannot send (and never prints emails)');
  assert.equal(createMailer(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) })).kind, 'none');
  assert.equal(createMailer(loadConfig({ MAIL_USER: 'me@gmail.com', MAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' })).kind, 'smtp');
});

test('without email settings, sending fails loudly and NOTHING is printed to the terminal', async () => {
  const lines = []; const origLog = console.log; const origErr = console.error;
  console.log = (s) => lines.push(String(s)); console.error = (s) => lines.push(String(s));
  try {
    const mailer = createMailer(loadConfig({}));
    await assert.rejects(() => mailer.send({ to: 'a@b.co', subject: 's', text: 'secret https://x/reset-password?token=abc' }), /not configured/i);
  } finally { console.log = origLog; console.error = origErr; }
  assert.ok(!lines.join('\n').includes('reset-password?token'), 'the link must never reach the logs');
});

test('"forgot password" tells the truth when the server cannot send email', async () => {
  const app = await startApp();
  try {
    const f = await app.signup();
    // an app built WITHOUT the fake mailbox → the real "no email configured" mailer
    const { createApp } = await import('../src/app.js');
    const bare = await new Promise((resolve) => { const s = createApp(app.repo, { ...app.config }).listen(0, () => resolve(s)); });
    const r = await fetch(`http://127.0.0.1:${bare.address().port}/api/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email }) });
    const body = await r.json();
    bare.close();
    assert.equal(r.status, 503); assert.equal(body.code, 'email_unavailable');
    assert.ok(!JSON.stringify(body).includes(f.email), 'and it reveals nothing about the account');
  } finally { await app.close(); }
});

test('start-up self-check: verify() accepts a good app password and rejects a wrong one', async () => {
  const { server, port } = await fakeSmtp();
  try {
    await createMailer(smtpConfig(port)).verify();
    await assert.rejects(() => createMailer(smtpConfig(port, { MAIL_APP_PASSWORD: 'wrongwrongwrong1' })).verify(), /Invalid login|auth/i);
  } finally { server.close(); }
});

test('Gmail settings: spaces in the app password are ignored, sender defaults to the Gmail address, APP_URL loses a trailing slash', () => {
  const c = loadConfig({ MAIL_USER: ' me@gmail.com ', MAIL_APP_PASSWORD: 'abcd efgh ijkl mnop', APP_URL: 'https://farm.example.com/' });
  assert.equal(c.mail.pass, 'abcdefghijklmnop'); assert.equal(c.mail.user, 'me@gmail.com');
  assert.equal(c.mail.from, 'FirstFurrow <me@gmail.com>'); assert.equal(c.appUrl, 'https://farm.example.com');
  assert.equal(loadConfig({}).appUrl, 'http://localhost:5173', 'development default');
  assert.equal(loadConfig({ NODE_ENV: 'production', JWT_SECRET: 'x'.repeat(40) }).appUrl, '', 'production has no guessed address');
});

test('Brevo mode: sends over HTTPS with the API key and a verified sender, and reports errors', async () => {
  const calls = []; const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => { calls.push({ url, opts }); return String(url).endsWith('/account') || calls.length < 3 ? { ok: true, status: 201, text: async () => '' } : { ok: false, status: 401, text: async () => 'unauthorized' }; };
  try {
    const mailer = createMailer(loadConfig({ MAIL_USER: 'me@gmail.com', BREVO_API_KEY: 'xkeysib-test' }));
    assert.equal(mailer.kind, 'brevo');
    await mailer.verify();
    await mailer.send({ to: 'ravi@gmail.com', subject: 'Hi', text: 'plain', html: '<p>html</p>' });
    const sent = calls[1];
    assert.equal(sent.url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(sent.opts.headers['api-key'], 'xkeysib-test');
    const body = JSON.parse(sent.opts.body);
    assert.deepEqual(body.sender, { name: 'FirstFurrow', email: 'me@gmail.com' });
    assert.deepEqual(body.to, [{ email: 'ravi@gmail.com' }]);
    assert.equal(body.subject, 'Hi'); assert.equal(body.textContent, 'plain'); assert.equal(body.htmlContent, '<p>html</p>');
    await assert.rejects(() => mailer.send({ to: 'a@b.co', subject: 's', text: 't' }), /Brevo rejected/);
  } finally { globalThis.fetch = realFetch; }
});
