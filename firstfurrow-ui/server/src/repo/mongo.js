// MongoDB implementation of the data layer. Deliberately plain: find / create / update / delete,
// no clever aggregation, so it is easy to read and to reason about.
import mongoose from 'mongoose';
import { Crop } from '../models/Crop.js';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { PasswordReset } from '../models/PasswordReset.js';
import { Soil, Region, SymptomGroup, Symptom, Problem } from '../models/Reference.js';
import { DuplicateEmailError } from '../errors.js';

const rename = ({ _id, ...rest }) => ({ id: String(_id), ...rest });

const toUser = ({ _id, name, email, passwordHash, createdAt, passwordChangedAt }) => ({ id: String(_id), name, email, passwordHash, createdAt, passwordChangedAt: passwordChangedAt ?? null });
const toReset = ({ _id, userId, tokenHash, expiresAt, createdAt }) => ({ id: String(_id), userId: String(userId), tokenHash, expiresAt, createdAt });

function toPlan(d) {
  const { _id, userId, createdAt, updatedAt, ...rest } = d;
  void createdAt; void updatedAt;
  return { id: String(_id), userId: String(userId), ...rest };
}

// only these fields may ever be written by update(), whatever the caller passes
const PLAN_WRITABLE = ['stageStatus', 'actualCosts', 'journal', 'completed', 'profit', 'endDate'];

export function createMongoRepo() {
  return {
    kind: 'mongo',
    ping: async () => mongoose.connection.readyState === 1,

    crops: {
      all: async () => (await Crop.find().lean()).map(rename),
      byId: async (id) => {
        const d = await Crop.findById(id).lean();
        return d ? rename(d) : null;
      },
    },

    reference: {
      soils: async () => (await Soil.find().sort({ order: 1 }).lean()).map(rename),
      regions: async () => (await Region.find().sort({ order: 1 }).lean()).map(rename),
    },

    symptoms: {
      groups: async () => (await SymptomGroup.find().sort({ order: 1 }).lean()).map(rename),
      all: async () => (await Symptom.find().sort({ order: 1 }).lean()).map(rename),
      problems: async () => (await Problem.find().lean()).map(rename),
    },

    users: {
      async create({ name, email, passwordHash }) {
        try {
          const doc = await User.create({ name, email, passwordHash });
          return toUser(doc.toObject());
        } catch (err) {
          if (err?.code === 11000) throw new DuplicateEmailError();
          throw err;
        }
      },
      async findByEmail(email) {
        const d = await User.findOne({ email: email.toLowerCase() }).lean();
        return d ? toUser(d) : null;
      },
      async findById(id) {
        const d = await User.findById(id).lean();
        return d ? toUser(d) : null;
      },
      // name and/or email. A taken email throws DuplicateEmailError, same as signing up.
      async updateProfile(id, { name, email }) {
        const set = {};
        if (name !== undefined) set.name = name;
        if (email !== undefined) set.email = email.toLowerCase();
        try {
          const d = await User.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
          return d ? toUser(d) : null;
        } catch (err) {
          if (err?.code === 11000) throw new DuplicateEmailError();
          throw err;
        }
      },
      async updatePassword(id, passwordHash) {
        const d = await User.findByIdAndUpdate(id, { $set: { passwordHash, passwordChangedAt: new Date() } }, { new: true }).lean();
        return d ? toUser(d) : null;
      },
    },

    // password-reset links (hashes only)
    resets: {
      async create({ userId, tokenHash, expiresAt }) {
        await PasswordReset.deleteMany({ userId }); // a new link replaces any earlier one
        const d = await PasswordReset.create({ userId, tokenHash, expiresAt });
        return toReset(d.toObject());
      },
      async latestForUser(userId) {
        const d = await PasswordReset.findOne({ userId }).sort({ createdAt: -1 }).lean();
        return d ? toReset(d) : null;
      },
      // finds AND deletes in one atomic step, so a link can be used exactly once even if two requests race
      async consume(tokenHash) {
        const d = await PasswordReset.findOneAndDelete({ tokenHash }).lean();
        return d ? toReset(d) : null;
      },
      async deleteForUser(userId) {
        await PasswordReset.deleteMany({ userId });
      },
    },

    plans: {
      listByUser: async (userId) => (await Plan.find({ userId }).sort({ createdAt: 1, _id: 1 }).lean()).map(toPlan),
      countByUser: (userId) => Plan.countDocuments({ userId }),
      async create(userId, data) {
        const doc = await Plan.create({ ...data, userId });
        return toPlan(doc.toObject());
      },
      async get(userId, id) {
        const d = await Plan.findOne({ _id: id, userId }).lean();
        return d ? toPlan(d) : null;
      },
      async update(userId, id, patch) {
        const $set = Object.fromEntries(Object.entries(patch).filter(([k]) => PLAN_WRITABLE.includes(k)));
        const d = await Plan.findOneAndUpdate({ _id: id, userId }, { $set }, { new: true, runValidators: true }).lean();
        return d ? toPlan(d) : null;
      },
      async remove(userId, id) {
        const r = await Plan.deleteOne({ _id: id, userId });
        return r.deletedCount === 1;
      },
    },
  };
}
