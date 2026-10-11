import test from 'node:test';
import assert from 'node:assert/strict';
import { startApp, tempClientDir } from './helpers.js';

// runs a test body against a fresh app and ALWAYS closes it, so a failing assertion can't leave the process hanging
const withApp = (opts, fn) => async () => {
  const app = await startApp(opts);
  try { await fn(app); } finally { await app.close(); }
};

test('security headers are set and the server does not advertise Express', withApp({}, async (app) => {
  const r = await app.request('GET', '/api/health');
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /default-src 'self'/); assert.match(csp, /connect-src 'self' https:\/\/api\.open-meteo\.com/); assert.match(csp, /object-src 'none'/);
}));

test('malformed or oversized request bodies are refused with a clean JSON error', withApp({}, async (app) => {
  const bad = await app.request('POST', '/api/auth/login', { raw: '{not json', headers: { 'Content-Type': 'application/json' } });
  assert.equal(bad.status, 400); assert.equal(bad.body.code, 'validation');
  const big = await app.request('POST', '/api/auth/login', { raw: JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200_000) }), headers: { 'Content-Type': 'application/json' } });
  assert.equal(big.status, 413);
}));

test('login and signup are rate-limited; health checks and other routes are not', withApp({ rateLimits: { auth: { windowMs: 60000, limit: 3 }, api: { windowMs: 60000, limit: 10000 } } }, async (app) => {
  const attempt = () => app.request('POST', '/api/auth/login', { body: { email: 'x@example.com', password: 'wrong-password' } });
  assert.deepEqual([(await attempt()).status, (await attempt()).status, (await attempt()).status], [401, 401, 401]);
  const limited = await attempt();
  assert.equal(limited.status, 429); assert.equal(limited.body.code, 'rate_limited');
  // login and signup share one counter per IP, so a bot can't dodge the limit by alternating
  assert.equal((await app.request('POST', '/api/auth/signup', { body: { name: 'a', email: 'a@b.co', password: 'longenough1' } })).status, 429);
  assert.equal((await app.request('GET', '/api/health')).status, 200);
  assert.equal((await app.request('GET', '/api/crops/okra')).status, 200);
}));

test('the general API limit applies too', withApp({ rateLimits: { auth: { windowMs: 60000, limit: 100 }, api: { windowMs: 60000, limit: 3 } } }, async (app) => {
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await app.request('GET', '/api/crops/okra')).status);
  assert.deepEqual(codes, [200, 200, 200, 429, 429]);
  assert.equal((await app.request('GET', '/api/health')).status, 200);
}));

test('CORS: only listed origins are allowed in production-style config', withApp({ clientOrigins: ['https://farm.example.com'], isProd: true }, async (app) => {
  const ok = await app.request('GET', '/api/health', { headers: { Origin: 'https://farm.example.com' } });
  const evil = await app.request('GET', '/api/health', { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(ok.headers.get('access-control-allow-origin'), 'https://farm.example.com');
  assert.equal(evil.headers.get('access-control-allow-origin'), null);

  // and with no origin configured at all (same-origin deployment), no CORS headers are sent
  await withApp({ clientOrigins: [], isProd: true }, async (same) => {
    const r = await same.request('GET', '/api/health', { headers: { Origin: 'https://anything.example.com' } });
    assert.equal(r.headers.get('access-control-allow-origin'), null);
  })();
}));

test('the built React app is served by the same server, with client-side routes falling back to index.html', withApp({ serveClient: true, clientDir: tempClientDir() }, async (app) => {
  const home = await app.request('GET', '/');
  assert.equal(home.status, 200); assert.match(home.text, /FirstFurrow/); assert.match(home.headers.get('cache-control'), /no-cache/);
  const deep = await app.request('GET', '/dashboard/anything');
  assert.equal(deep.status, 200); assert.match(deep.text, /id="root"/);
  const asset = await app.request('GET', '/assets/app-abc123.js');
  assert.equal(asset.status, 200); assert.match(asset.headers.get('cache-control'), /immutable/);
  const api404 = await app.request('GET', '/api/does-not-exist');
  assert.equal(api404.status, 404); assert.ok(api404.body.error, 'API 404s stay JSON, not the HTML page');
}));

test('errors never leak internals', withApp({}, async (app) => {
  app.repo.crops.all = async () => { throw new Error('secret connection string mongodb://user:pw@host'); };
  const origError = console.error; console.error = () => {};
  const r = await app.request('GET', '/api/crops');
  console.error = origError;
  assert.equal(r.status, 500); assert.ok(!r.text.includes('mongodb://') && !r.text.includes('secret'));
  assert.equal(r.body.code, 'server_error');
}));

test('health reports 503 when the database is unreachable', withApp({}, async (app) => {
  app.repo.ping = async () => false;
  const r = await app.request('GET', '/api/health');
  assert.equal(r.status, 503); assert.equal(r.body.db, 'disconnected');
}));
