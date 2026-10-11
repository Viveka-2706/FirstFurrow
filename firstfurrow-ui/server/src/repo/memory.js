// In-memory implementation of the SAME interface as mongo.js.
// Used by the test-suite, and by `npm run dev:memory` for a no-database demo (never in production).
import crypto from 'node:crypto';
import { DuplicateEmailError } from '../errors.js';

const clone = (x) => structuredClone(x);
const newId = () => crypto.randomBytes(12).toString('hex'); // same shape as a Mongo ObjectId
const PLAN_WRITABLE = ['stageStatus', 'actualCosts', 'journal', 'completed', 'profit', 'endDate'];

export function createMemoryRepo(seed) {
  const users = new Map();
  const plans = new Map();
  const resets = new Map(); // tokenHash → record
  const get = (arr) => async () => clone(arr);

  return {
    kind: 'memory',
    ping: async () => true,

    crops: {
      all: get(seed.crops),
      byId: async (id) => clone(seed.crops.find((c) => c.id === id) ?? null),
    },
    reference: { soils: get(seed.soils), regions: get(seed.regions) },
    symptoms: { groups: get(seed.groups), all: get(seed.symptoms), problems: get(seed.problems) },

    users: {
      async create({ name, email, passwordHash }) {
        const lower = email.toLowerCase();
        if ([...users.values()].some((u) => u.email === lower)) throw new DuplicateEmailError();
        const user = { id: newId(), name, email: lower, passwordHash, createdAt: new Date(), passwordChangedAt: null };
        users.set(user.id, user);
        return clone(user);
      },
      findByEmail: async (email) => clone([...users.values()].find((u) => u.email === email.toLowerCase()) ?? null),
      findById: async (id) => clone(users.get(id) ?? null),
      async updatePassword(id, passwordHash) {
        const u = users.get(id);
        if (!u) return null;
        u.passwordHash = passwordHash;
        u.passwordChangedAt = new Date();
        return clone(u);
      },
    },

    resets: {
      async create({ userId, tokenHash, expiresAt }) {
        for (const [k, r] of resets) if (r.userId === userId) resets.delete(k);
        const rec = { id: newId(), userId, tokenHash, expiresAt, createdAt: new Date() };
        resets.set(tokenHash, rec);
        return clone(rec);
      },
      latestForUser: async (userId) => clone([...resets.values()].filter((r) => r.userId === userId).sort((a, b) => b.createdAt - a.createdAt)[0] ?? null),
      async consume(tokenHash) {
        const rec = resets.get(tokenHash);
        if (!rec) return null;
        resets.delete(tokenHash);
        return clone(rec);
      },
      async deleteForUser(userId) {
        for (const [k, r] of resets) if (r.userId === userId) resets.delete(k);
      },
    },

    plans: {
      listByUser: async (userId) => clone([...plans.values()].filter((p) => p.userId === userId)),
      countByUser: async (userId) => [...plans.values()].filter((p) => p.userId === userId).length,
      async create(userId, data) {
        const plan = { endDate: null, completed: false, profit: null, journal: [], ...clone(data), id: newId(), userId };
        plans.set(plan.id, plan);
        return clone(plan);
      },
      async get(userId, id) {
        const p = plans.get(id);
        return p && p.userId === userId ? clone(p) : null;
      },
      async update(userId, id, patch) {
        const p = plans.get(id);
        if (!p || p.userId !== userId) return null;
        for (const [k, v] of Object.entries(clone(patch))) if (PLAN_WRITABLE.includes(k)) p[k] = v;
        return clone(p);
      },
      async remove(userId, id) {
        const p = plans.get(id);
        if (!p || p.userId !== userId) return false;
        plans.delete(id);
        return true;
      },
    },
  };
}
