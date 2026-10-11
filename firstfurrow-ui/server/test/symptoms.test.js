import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, seed } from './helpers.js';

let app;
before(async () => { app = await startApp(); });
after(() => app.close());

const diagnose = (crop, symptoms) => app.request('POST', '/api/symptoms/diagnose', { body: { crop, symptoms } });
const top = (r) => r.body.results.map((x) => `${x.problem.id}:${x.confidence}`);

test('reference data: 6 soils and 9 districts, each soil points at real districts, Tamil included', async () => {
  const { status, body } = await app.request('GET', '/api/reference');
  assert.equal(status, 200);
  assert.equal(body.soils.length, 6); assert.equal(body.regions.length, 9);
  assert.equal(body.crops.length, 18); assert.ok(body.crops.every((c) => c.name && c.localName && c.ta.localName) && !('guide' in body.crops[0]), 'short names only, not the full guides');
  const names = new Set(body.regions.map((r) => r.id));
  for (const s of body.soils) {
    assert.ok(s.name && s.where && s.feel && s.ta?.name, s.id);
    assert.ok(s.regions.length > 0 && s.regions.every((r) => names.has(r)), `${s.id} regions`);
  }
  for (const r of body.regions) assert.ok(Number.isFinite(r.lat) && Number.isFinite(r.lon) && r.ta?.name, r.id);
});

test('symptom list is grouped, and signs for other crops are hidden', async () => {
  const okra = (await app.request('GET', '/api/symptoms?crop=okra')).body.groups;
  const spinach = (await app.request('GET', '/api/symptoms?crop=spinach')).body.groups;
  const ids = (g) => g.flatMap((x) => x.items.map((i) => i.id));
  assert.ok(okra.length === 5 && okra.every((g) => g.en && g.ta && g.items.length));
  assert.ok(ids(okra).includes('borer') && !ids(okra).includes('tall_stalk'));
  assert.ok(ids(spinach).includes('tall_stalk') && !ids(spinach).includes('borer'));
  assert.ok(okra[0].items[0].en && okra[0].items[0].ta && okra[0].items[0].icon);
});

test('diagnosis: the key sign decides, the crop breaks ties, results are ranked', async () => {
  assert.match(top(await diagnose('okra', ['borer']))[0], /^borer/);
  assert.match(top(await diagnose('spinach', ['tall_stalk']))[0], /^bolting/);
  assert.ok(top(await diagnose('okra', ['wilt_wet', 'base_rot', 'waterlogged', 'yellow_lower']))[0].startsWith('overwatering:high'));
  const r = (await diagnose('okra', ['white_insects', 'sticky', 'curled'])).body.results;
  assert.equal(r[0].problem.id, 'whitefly');
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});

test('crop-specific problems never appear for other crops', async () => {
  assert.ok(!top(await diagnose('spinach', ['borer', 'yellow_veins'])).some((x) => /borer|yellow_vein/.test(x)));
  assert.ok(!top(await diagnose('okra', ['tall_stalk'])).some((x) => x.startsWith('bolting')));
});

test('a weak sign alone gives no answer; unknown ids are ignored', async () => {
  assert.deepEqual((await diagnose('okra', ['fert_recent'])).body.results, []);
  assert.deepEqual((await diagnose('okra', ['made_up_sign'])).body.results, []);
});

test('results carry the full English + Tamil advice, but not the internal weights', async () => {
  const r = (await diagnose('okra', ['borer'])).body.results[0];
  for (const l of ['en', 'ta']) { assert.ok(r.problem[l].name && r.problem[l].cause && r.problem[l].prevent && r.problem[l].fix.length, l); }
  assert.match(r.problem.ta.name, /[\u0B80-\u0BFF]/);
  assert.ok(!('weights' in r.problem));
});

test('diagnose rejects bad input', async () => {
  for (const symptoms of [[], 'borer', undefined, [1, 2], [{ $ne: 1 }], Array(61).fill('x')]) assert.equal((await diagnose('okra', symptoms)).status, 400, JSON.stringify(symptoms)?.slice(0, 30));
  assert.equal((await diagnose({ $ne: 1 }, ['borer'])).status, 400);
  assert.equal((await diagnose(undefined, ['borer'])).status, 200); // crop is optional
});

test('every symptom is reachable: some problem uses it', () => {
  const used = new Set(seed.problems.flatMap((p) => Object.keys(p.weights)));
  for (const s of seed.symptoms) assert.ok(used.has(s.id), `${s.id} is offered to farmers but no problem uses it`);
  for (const p of seed.problems) for (const id of Object.keys(p.weights)) assert.ok(seed.symptoms.some((s) => s.id === id), `${p.id} references unknown symptom ${id}`);
  for (const g of seed.groups) for (const id of g.symptomIds) assert.ok(seed.symptoms.some((s) => s.id === id), `group ${g.id} references unknown ${id}`);
});
