// Offline checks of the Mongoose schemas (no database connection needed).
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Plan } from '../src/models/Plan.js';
import { Crop } from '../src/models/Crop.js';
import { PasswordReset } from '../src/models/PasswordReset.js';

const oid = () => new mongoose.Types.ObjectId();
const validPlan = (over = {}) => ({
  userId: oid(), cropId: 'okra', land: 1, soilId: 'red', region: 'Salem', season: 'Rabi (Nov–Mar)', crop: { id: 'okra', guide: [] }, startDate: new Date(), ...over,
});

test('User: email is trimmed + lower-cased, and has a UNIQUE index (this is what stops duplicate accounts)', () => {
  const u = new User({ name: ' Ravi ', email: '  Ravi@Example.COM ', passwordHash: 'h' });
  assert.equal(u.email, 'ravi@example.com'); assert.equal(u.name, 'Ravi');
  assert.equal(u.validateSync(), undefined);
  assert.ok(User.schema.indexes().some(([f, o]) => f.email === 1 && o.unique === true), 'unique index on email');
  for (const bad of [{ name: 'x', email: 'a@b.co' }, { email: 'a@b.co', passwordHash: 'h' }, { name: 'x', passwordHash: 'h' }, { name: 'n'.repeat(81), email: 'a@b.co', passwordHash: 'h' }]) {
    assert.ok(new User(bad).validateSync(), JSON.stringify(bad));
  }
});

test('Plan: validates, keeps null costs and empty objects inside the snapshot, indexes userId', () => {
  const p = new Plan(validPlan({ actualCosts: [100, null, 300], crop: { id: 'okra', empty: {}, guide: [{ costItems: [] }] } }));
  assert.equal(p.validateSync(), undefined);
  const o = p.toObject();
  assert.deepEqual(o.actualCosts, [100, null, 300]);
  assert.deepEqual(o.crop.empty, {}, 'minimize:false keeps empty objects');
  assert.deepEqual(o.stageStatus, []); assert.equal(o.completed, false); assert.equal(o.profit, null); assert.equal(o.endDate, null);
  assert.ok(Plan.schema.indexes().some(([f]) => f.userId === 1), 'index on userId');
});

test('Plan: rejects bad data', () => {
  assert.ok(new Plan(validPlan({ userId: 'not-an-object-id' })).validateSync());
  assert.ok(new Plan(validPlan({ land: 'lots' })).validateSync());
  assert.ok(new Plan(validPlan({ crop: undefined })).validateSync());
  assert.ok(new Plan(validPlan({ journal: [{ id: 'a', text: 'x'.repeat(2001), date: new Date() }] })).validateSync());
  assert.ok(new Plan(validPlan({ journal: [{ text: 'no id', date: new Date() }] })).validateSync());
  assert.equal(new Plan(validPlan({ journal: [{ id: 'a', text: 'fine', date: new Date() }] })).validateSync(), undefined);
});

test('Plan: filters cast string ids to ObjectIds, and a malformed id throws (the routes check ids first)', () => {
  const q = Plan.findOne({ _id: 'a'.repeat(24), userId: 'b'.repeat(24) });
  q._castConditions();
  assert.ok(q.getFilter()._id instanceof mongoose.Types.ObjectId);
  const bad = Plan.findOne({ _id: 'nope' }); bad._castConditions();
  assert.ok(bad.error(), 'cast error recorded for a malformed id');
});

test('Crop: risk must be Low/Medium/High', () => {
  const base = { _id: 'x', name: 'X', localName: 'X', investment: 1 };
  assert.equal(new Crop({ ...base, risk: 'Low' }).validateSync(), undefined);
  assert.ok(new Crop({ ...base, risk: 'Extreme' }).validateSync());
});

test('PasswordReset: tokenHash is unique, and expired rows delete themselves (TTL index)', () => {
  const idx = PasswordReset.schema.indexes();
  assert.ok(idx.some(([f, o]) => f.tokenHash === 1 && o.unique === true), 'unique tokenHash');
  assert.ok(idx.some(([f, o]) => f.expiresAt === 1 && o.expireAfterSeconds === 0), 'TTL index on expiresAt');
  assert.equal(new PasswordReset({ userId: oid(), tokenHash: 'h', expiresAt: new Date() }).validateSync(), undefined);
  assert.ok(new PasswordReset({ userId: oid(), expiresAt: new Date() }).validateSync(), 'tokenHash required');
});

test('User: passwordChangedAt defaults to null', () => {
  assert.equal(new User({ name: 'x', email: 'a@b.co', passwordHash: 'h' }).passwordChangedAt, null);
});
