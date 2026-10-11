import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp } from './helpers.js';

let app;
before(async () => { app = await startApp(); });
after(() => app.close());
const get = (p) => app.request('GET', p);

test('GET /api/health', async () => {
  const { status, body } = await get('/api/health');
  assert.equal(status, 200); assert.equal(body.ok, true); assert.equal(body.db, 'connected');
});

test('GET /api/crops lists all 18', async () => {
  const { body } = await get('/api/crops');
  assert.equal(body.count, 18); assert.equal(body.crops.length, 18);
});

test('GET /api/crops/:id returns the full crop in the shape the React app uses', async () => {
  const { status, body } = await get('/api/crops/okra');
  assert.equal(status, 200);
  for (const k of ['id', 'name', 'localName', 'investment', 'returnMin', 'returnMax', 'durationDays', 'risk', 'color', 'suitableSoils', 'water', 'guide', 'ta']) assert.ok(k in body, `missing ${k}`);
  assert.equal(body.id, 'okra'); assert.ok(!('_id' in body));
});

test('GET /api/crops/:id → 404 for an unknown crop', async () => {
  const { status, body } = await get('/api/crops/banana');
  assert.equal(status, 404); assert.match(body.error, /banana/);
});

test('GET /api/crops/recommend returns ranked crops with a computed match', async () => {
  const q = new URLSearchParams({ soil: 'red', season: 'Kharif (Jun–Oct)', budget: 'mid', land: '0.5', region: 'Coimbatore' });
  const { status, body } = await get(`/api/crops/recommend?${q}`);
  assert.equal(status, 200);
  assert.equal(body.count, body.crops.length); assert.ok(body.count > 0 && body.count <= 3);
  assert.ok(body.crops.every((c) => typeof c.match === 'number'));
  assert.equal(body.query.region, 'Coimbatore');
});

test('recommend rejects bad input with 400 and says what is wrong', async () => {
  for (const bad of ['', 'soil=mud&season=Kharif&budget=mid&land=1', 'soil=red&season=Winter&budget=mid&land=1', 'soil=red&season=Kharif&budget=rich&land=1', 'soil=red&season=Kharif&budget=mid&land=-2', 'soil=red&season=Kharif&budget=mid&land=abc', 'soil=red&soil=black&season=Kharif&budget=mid&land=1']) {
    const { status, body } = await get(`/api/crops/recommend?${bad}`);
    assert.equal(status, 400, bad); assert.ok(body.problems.length > 0);
  }
});

test('"recommend" is not mistaken for a crop id', async () => {
  assert.equal((await get('/api/crops/recommend?soil=red&season=Rabi&budget=low&land=0.2')).status, 200);
});

test('unknown API route → 404 JSON', async () => {
  const { status, body } = await get('/api/nope');
  assert.equal(status, 404); assert.ok(body.error);
});
