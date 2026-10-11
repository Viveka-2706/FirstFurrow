import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, planBody } from './helpers.js';

let app;
before(async () => { app = await startApp({ maxPlansPerUser: 4 }); });
after(() => app.close());

const create = async (token, over) => app.request('POST', '/api/plans', { token, body: planBody(over) });
const finishAll = async (token, plan) => {
  for (let i = 0; i < plan.stageStatus.length; i++) {
    const r = await app.request('PATCH', `/api/plans/${plan.id}/stages/${i}`, { token, body: { done: true, actualCost: 100 * (i + 1) } });
    assert.equal(r.status, 200, `stage ${i}`);
  }
};

test('every plan route needs a login', async () => {
  for (const [m, u] of [['GET', '/api/plans'], ['POST', '/api/plans'], ['PATCH', '/api/plans/' + 'a'.repeat(24) + '/stages/0'], ['POST', '/api/plans/' + 'a'.repeat(24) + '/complete'], ['DELETE', '/api/plans/' + 'a'.repeat(24)]]) {
    assert.equal((await app.request(m, u, { body: {} })).status, 401, `${m} ${u}`);
  }
});

test('creating a plan snapshots the crop on the server and starts every stage undone', async () => {
  const { token } = await app.signup();
  const r = await create(token);
  assert.equal(r.status, 201);
  const p = r.body.plan;
  assert.equal(p.cropId, 'okra'); assert.equal(p.soilName, 'Red Soil'); assert.equal(p.region, 'Coimbatore');
  assert.equal(p.crop.id, 'okra'); assert.ok(p.crop.guide.length > 0 && p.crop.ta, 'full crop incl. Tamil is embedded');
  assert.ok(!('match' in p.crop), 'per-request match score is not stored');
  assert.deepEqual(p.stageStatus, p.crop.guide.map(() => false));
  assert.deepEqual(p.actualCosts, p.crop.guide.map(() => null));
  assert.equal(p.completed, false); assert.equal(p.profit, null); assert.deepEqual(p.journal, []);
  assert.ok(!Number.isNaN(Date.parse(p.startDate)));
  assert.ok(!('userId' in p), 'internal fields are not exposed');
});

test('the client cannot choose the crop contents — only the crop id', async () => {
  const { token } = await app.signup();
  const r = await create(token, { crop: { id: 'okra', guide: [], investment: 1 }, soilName: 'Hacked Soil' });
  assert.equal(r.status, 201);
  assert.notEqual(r.body.plan.crop.guide.length, 0); assert.equal(r.body.plan.soilName, 'Red Soil');
});

test('plan validation: unknown crop/soil/region, bad land, bad season, wrong types, injection', async () => {
  const { token } = await app.signup();
  const bad = [
    [{ cropId: 'banana' }, 'unknown_crop'], [{ soilId: 'mud' }, 'unknown_soil'], [{ region: 'Atlantis' }, 'unknown_region'],
    [{ land: 0 }, 'validation'], [{ land: -1 }, 'validation'], [{ land: '1' }, 'validation'], [{ land: 5000 }, 'validation'],
    [{ season: 'Winter' }, 'validation'], [{ cropId: { $ne: null } }, 'validation'], [{ region: ['Coimbatore'] }, 'validation'],
  ];
  for (const [over, code] of bad) {
    const r = await create(token, over);
    assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(r.body.code, code, JSON.stringify(over));
  }
});

test('farmers only ever see and touch their own plans', async () => {
  const a = await app.signup(); const b = await app.signup();
  const planA = (await create(a.token)).body.plan;

  assert.equal((await app.request('GET', '/api/plans', { token: b.token })).body.plans.length, 0);
  assert.equal((await app.request('GET', '/api/plans', { token: a.token })).body.plans.length, 1);

  const id = planA.id;
  for (const [m, u, body] of [
    ['PATCH', `/api/plans/${id}/stages/0`, { done: true }], ['POST', `/api/plans/${id}/complete`, {}],
    ['POST', `/api/plans/${id}/journal`, { text: 'mine now' }], ['DELETE', `/api/plans/${id}`],
  ]) {
    const r = await app.request(m, u, { token: b.token, body });
    assert.equal(r.status, 404, `${m} ${u} must look like a missing plan`);
  }
  // …and A's plan is untouched
  const after = (await app.request('GET', '/api/plans', { token: a.token })).body.plans[0];
  assert.deepEqual(after.stageStatus, planA.stageStatus); assert.equal(after.journal.length, 0);
});

test('malformed plan ids are rejected cleanly', async () => {
  const { token } = await app.signup();
  for (const id of ['abc', '123', '{"$ne":1}', 'z'.repeat(24)]) {
    const r = await app.request('DELETE', `/api/plans/${encodeURIComponent(id)}`, { token });
    assert.equal(r.status, 400, id); assert.equal(r.body.code, 'bad_id');
  }
});

test('stages must be finished in order, and costs are recorded', async () => {
  const { token } = await app.signup();
  const plan = (await create(token)).body.plan;

  const skip = await app.request('PATCH', `/api/plans/${plan.id}/stages/1`, { token, body: { done: true } });
  assert.equal(skip.status, 409); assert.equal(skip.body.code, 'stage_locked');

  const first = await app.request('PATCH', `/api/plans/${plan.id}/stages/0`, { token, body: { done: true, actualCost: 1200 } });
  assert.equal(first.status, 200);
  assert.equal(first.body.plan.stageStatus[0], true); assert.equal(first.body.plan.actualCosts[0], 1200);

  const second = await app.request('PATCH', `/api/plans/${plan.id}/stages/1`, { token, body: { done: true } }); // cost skipped
  assert.equal(second.status, 200); assert.equal(second.body.plan.actualCosts[1], null);
});

test('stage input is validated; un-finishing a stage re-opens the later ones', async () => {
  const { token } = await app.signup();
  const plan = (await create(token)).body.plan;
  const patch = (i, body) => app.request('PATCH', `/api/plans/${plan.id}/stages/${i}`, { token, body });

  assert.equal((await patch(99, { done: true })).status, 400);
  assert.equal((await patch('x', { done: true })).status, 400);
  assert.equal((await patch(-1, { done: true })).status, 400);
  assert.equal((await patch(0, { done: 'yes' })).status, 400);
  assert.equal((await patch(0, { done: true, actualCost: -5 })).status, 400);
  assert.equal((await patch(0, { done: true, actualCost: '100' })).status, 400);

  await patch(0, { done: true, actualCost: 100 }); await patch(1, { done: true, actualCost: 200 }); await patch(2, { done: true, actualCost: 300 });
  const undone = (await patch(1, { done: false })).body.plan;
  assert.deepEqual(undone.stageStatus.slice(0, 4), [true, false, false, false]);
  assert.deepEqual(undone.actualCosts.slice(0, 4), [100, null, null, null]);
});

test('completing: only after every stage, once, with optional (even negative) profit — then it is locked', async () => {
  const { token } = await app.signup();
  const plan = (await create(token)).body.plan;

  const early = await app.request('POST', `/api/plans/${plan.id}/complete`, { token, body: { profit: 1000 } });
  assert.equal(early.status, 409); assert.equal(early.body.code, 'not_finished');

  await finishAll(token, plan);
  assert.equal((await app.request('POST', `/api/plans/${plan.id}/complete`, { token, body: { profit: 'lots' } })).status, 400);

  const done = await app.request('POST', `/api/plans/${plan.id}/complete`, { token, body: { profit: -2500 } });
  assert.equal(done.status, 200);
  assert.equal(done.body.plan.completed, true); assert.equal(done.body.plan.profit, -2500);
  assert.ok(!Number.isNaN(Date.parse(done.body.plan.endDate)));

  assert.equal((await app.request('POST', `/api/plans/${plan.id}/complete`, { token, body: {} })).body.code, 'plan_completed');
  assert.equal((await app.request('PATCH', `/api/plans/${plan.id}/stages/0`, { token, body: { done: false } })).status, 409);

  // profit is optional
  const p2 = (await create(token)).body.plan; await finishAll(token, p2);
  assert.equal((await app.request('POST', `/api/plans/${p2.id}/complete`, { token, body: {} })).body.plan.profit, null);
});

test('journal: add (newest first), validate, delete', async () => {
  const { token } = await app.signup();
  const plan = (await create(token)).body.plan;
  const add = (text) => app.request('POST', `/api/plans/${plan.id}/journal`, { token, body: { text } });

  const one = (await add('first note')).body.plan;
  const two = (await add('second note')).body.plan;
  assert.deepEqual(two.journal.map((j) => j.text), ['second note', 'first note']);
  assert.ok(two.journal[0].id && !Number.isNaN(Date.parse(two.journal[0].date)));
  assert.notEqual(one.journal[0].id, two.journal[0].id);

  for (const bad of ['', '   ', 'x'.repeat(2001), 123, null, { $ne: 1 }]) assert.equal((await add(bad)).status, 400, JSON.stringify(bad)?.slice(0, 20));

  const removed = await app.request('DELETE', `/api/plans/${plan.id}/journal/${two.journal[0].id}`, { token });
  assert.deepEqual(removed.body.plan.journal.map((j) => j.text), ['first note']);
  assert.equal((await app.request('DELETE', `/api/plans/${plan.id}/journal/note_nope`, { token })).status, 404);
});

test('deleting a plan removes it; deleting again is a 404', async () => {
  const { token } = await app.signup();
  const plan = (await create(token)).body.plan;
  assert.equal((await app.request('DELETE', `/api/plans/${plan.id}`, { token })).status, 204);
  assert.equal((await app.request('GET', '/api/plans', { token })).body.plans.length, 0);
  assert.equal((await app.request('DELETE', `/api/plans/${plan.id}`, { token })).status, 404);
});

test('plans list in the order they were created, and there is a per-farmer cap', async () => {
  const { token } = await app.signup();
  const ids = [];
  for (const cropId of ['okra', 'spinach', 'marigold', 'tomato']) ids.push((await create(token, { cropId })).body.plan.id);
  assert.deepEqual((await app.request('GET', '/api/plans', { token })).body.plans.map((p) => p.id), ids);
  const over = await create(token);
  assert.equal(over.status, 409); assert.equal(over.body.code, 'plan_limit');
});

test('a plan keeps its own copy of the crop (changing crop data later does not alter it)', async () => {
  const { token } = await app.signup();
  const plan = (await create(token, { cropId: 'tomato' })).body.plan;
  const live = await app.repo.crops.byId('tomato');
  assert.deepEqual(plan.crop.guide, live.guide);
  assert.notEqual(plan.crop, live); // a copy, not a reference
});
