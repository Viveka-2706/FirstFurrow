// One suite, run against EVERY data layer. If the in-memory repo and the MongoDB repo both pass it,
// the API behaves the same on both — this is how the MongoDB code is verified against the real thing.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { DuplicateEmailError } from '../src/errors.js';

const planData = (crop, over = {}) => ({
  cropId: crop.id, land: 0.5, soilId: 'red', soilName: 'Red Soil', region: 'Coimbatore', season: 'Kharif (Jun–Oct)',
  crop, startDate: new Date('2026-06-01T08:00:00Z'), endDate: null,
  stageStatus: crop.guide.map(() => false), actualCosts: crop.guide.map(() => null), journal: [], completed: false, profit: null,
  ...over,
});
const time = (d) => new Date(d).getTime();

export function defineRepoContract(label, setup) {
  describe(label, () => {
    let ctx; let repo;
    before(async () => { ctx = await setup(); repo = ctx.repo; });
    after(async () => { await ctx.teardown(); });

    it('crops: lists all 18 and finds one by id, with the nested guide and Tamil intact', async () => {
      const all = await repo.crops.all();
      assert.equal(all.length, 18); assert.equal(new Set(all.map((c) => c.id)).size, 18);
      const okra = await repo.crops.byId('okra');
      assert.equal(okra.id, 'okra'); assert.ok(!('_id' in okra));
      assert.ok(okra.guide.length > 0 && okra.guide[0].why && okra.ta.guide[0].whatToDo);
      assert.deepEqual(okra.suitableSoils.sort(), [...okra.suitableSoils].sort());
      assert.equal(await repo.crops.byId('banana'), null);
    });

    it('reference data: soils and districts come back in display order', async () => {
      const soils = await repo.reference.soils(); const regions = await repo.reference.regions();
      assert.equal(soils.length, 6); assert.equal(soils[0].id, 'red'); assert.ok(soils[0].regions.length && soils[0].ta.name);
      assert.equal(regions.length, 9); assert.equal(regions[0].id, 'Coimbatore'); assert.ok(Number.isFinite(regions[0].lat));
    });

    it('symptom rules: groups, symptoms and problems (weights stay a plain object)', async () => {
      assert.equal((await repo.symptoms.groups()).length, 5);
      assert.equal((await repo.symptoms.all()).length, 25);
      const problems = await repo.symptoms.problems();
      assert.equal(problems.length, 15);
      const borer = problems.find((p) => p.id === 'borer');
      assert.equal(borer.weights.borer, 3); assert.ok(borer.en.fix.length && borer.ta.fix.length); assert.deepEqual(borer.crops, ['okra']);
    });

    it('users: create, find by email (any case) and by id; a duplicate email is refused', async () => {
      const u = await repo.users.create({ name: 'Ravi', email: 'Ravi.Contract@Example.com', passwordHash: '$2a$04$hash' });
      assert.match(u.id, /^[a-f0-9]{24}$/); assert.equal(u.email, 'ravi.contract@example.com');
      assert.equal((await repo.users.findByEmail('RAVI.contract@example.COM')).id, u.id);
      assert.equal((await repo.users.findByEmail('RAVI.contract@example.COM')).passwordHash, '$2a$04$hash');
      assert.equal((await repo.users.findById(u.id)).name, 'Ravi');
      assert.equal(await repo.users.findByEmail('nobody@example.com'), null);
      assert.equal(await repo.users.findById('f'.repeat(24)), null);
      await assert.rejects(() => repo.users.create({ name: 'Other', email: 'ravi.contract@example.com', passwordHash: 'x' }), DuplicateEmailError);
    });

    it('users: updatePassword stores the new hash and records when', async () => {
      const u = await repo.users.create({ name: 'Pw', email: 'pw@example.com', passwordHash: 'old' });
      assert.equal(u.passwordChangedAt, null);
      const before = Date.now();
      const after = await repo.users.updatePassword(u.id, 'new-hash');
      assert.equal(after.passwordHash, 'new-hash'); assert.ok(time(after.passwordChangedAt) >= before - 5);
      assert.equal((await repo.users.findById(u.id)).passwordHash, 'new-hash');
      assert.equal(await repo.users.updatePassword('f'.repeat(24), 'x'), null);
    });

    it('password resets: create replaces older links, latest, consume is single-use, delete', async () => {
      const u = await repo.users.create({ name: 'Reset', email: 'reset@example.com', passwordHash: 'x' });
      const future = new Date(Date.now() + 60000);
      const first = await repo.resets.create({ userId: u.id, tokenHash: 'hash-one', expiresAt: future });
      assert.match(first.id, /^[a-f0-9]{24}$/); assert.equal(first.userId, u.id);
      assert.equal(time((await repo.resets.latestForUser(u.id)).expiresAt), time(future));

      await repo.resets.create({ userId: u.id, tokenHash: 'hash-two', expiresAt: future });
      assert.equal((await repo.resets.latestForUser(u.id)).tokenHash, 'hash-two');
      assert.equal(await repo.resets.consume('hash-one'), null, 'creating a new link killed the old one');

      const used = await repo.resets.consume('hash-two');
      assert.equal(used.userId, u.id);
      assert.equal(await repo.resets.consume('hash-two'), null, 'second use finds nothing');
      assert.equal(await repo.resets.latestForUser(u.id), null);

      await repo.resets.create({ userId: u.id, tokenHash: 'hash-three', expiresAt: future });
      await repo.resets.deleteForUser(u.id);
      assert.equal(await repo.resets.consume('hash-three'), null);
      assert.equal(await repo.resets.latestForUser('f'.repeat(24)), null);
    });

    it('plans: create → get → list → update → remove, scoped to the owner', async () => {
      const owner = await repo.users.create({ name: 'Owner', email: 'owner@example.com', passwordHash: 'x' });
      const other = await repo.users.create({ name: 'Other', email: 'other@example.com', passwordHash: 'x' });
      const crop = await repo.crops.byId('tomato');

      const a = await repo.plans.create(owner.id, planData(crop));
      const b = await repo.plans.create(owner.id, planData(crop, { land: 2 }));
      assert.match(a.id, /^[a-f0-9]{24}$/); assert.equal(a.userId, owner.id);
      assert.equal(time(a.startDate), time('2026-06-01T08:00:00Z'));
      assert.deepEqual(a.crop.guide, crop.guide, 'the crop snapshot round-trips exactly');
      assert.deepEqual(a.crop.ta.guide, crop.ta.guide);

      assert.deepEqual((await repo.plans.listByUser(owner.id)).map((p) => p.id), [a.id, b.id], 'creation order');
      assert.equal(await repo.plans.countByUser(owner.id), 2); assert.equal(await repo.plans.countByUser(other.id), 0);

      assert.equal((await repo.plans.get(owner.id, a.id)).land, 0.5);
      assert.equal(await repo.plans.get(other.id, a.id), null, "someone else's plan is invisible");
      assert.equal(await repo.plans.update(other.id, a.id, { completed: true }), null, "…and cannot be changed");
      assert.equal(await repo.plans.remove(other.id, a.id), false, "…or deleted");
      assert.equal((await repo.plans.get(owner.id, a.id)).completed, false);

      const n = crop.guide.length;
      const updated = await repo.plans.update(owner.id, a.id, {
        stageStatus: [true, true, ...Array(n - 2).fill(false)],
        actualCosts: [100, null, ...Array(n - 2).fill(null)],
        journal: [{ id: 'note_1', text: 'ஒரு குறிப்பு — first note', date: new Date('2026-06-02T10:00:00Z') }],
        completed: true, profit: -2500, endDate: new Date('2026-09-01T00:00:00Z'),
      });
      assert.deepEqual(updated.stageStatus.slice(0, 3), [true, true, false]);
      assert.deepEqual(updated.actualCosts.slice(0, 3), [100, null, null], 'null costs are preserved');
      assert.equal(updated.journal[0].text, 'ஒரு குறிப்பு — first note'); assert.equal(time(updated.journal[0].date), time('2026-06-02T10:00:00Z'));
      assert.equal(updated.completed, true); assert.equal(updated.profit, -2500); assert.equal(time(updated.endDate), time('2026-09-01T00:00:00Z'));
      assert.deepEqual(updated.crop.guide, crop.guide, 'an update never disturbs the snapshot');

      assert.equal(await repo.plans.remove(owner.id, a.id), true);
      assert.equal(await repo.plans.remove(owner.id, a.id), false);
      assert.equal(await repo.plans.get(owner.id, a.id), null);
      assert.equal(await repo.plans.countByUser(owner.id), 1);
    });

    it('plans: update() can only write the whitelisted progress fields', async () => {
      const u = await repo.users.create({ name: 'Guard', email: 'guard@example.com', passwordHash: 'x' });
      const crop = await repo.crops.byId('okra');
      const p = await repo.plans.create(u.id, planData(crop));
      const after = await repo.plans.update(u.id, p.id, { land: 999, userId: 'f'.repeat(24), crop: { id: 'hacked' }, cropId: 'hacked', profit: 5 });
      assert.equal(after.land, 0.5); assert.equal(after.userId, u.id); assert.equal(after.crop.id, 'okra'); assert.equal(after.cropId, 'okra');
      assert.equal(after.profit, 5, 'whitelisted fields still apply');
    });
  });
}
