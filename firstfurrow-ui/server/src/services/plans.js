// The rules for a farmer's plan, as pure functions: each takes a plan and returns the fields to change.
// Keeping them separate from Express/Mongo makes them easy to test.
import crypto from 'node:crypto';
import { badRequest, conflict, notFound } from '../errors.js';

export function buildPlan({ crop, soil, region, land, season }, now = new Date()) {
  const { match, ...snapshot } = crop; // `match` belongs to one recommendation request, not to the crop
  void match;
  return {
    cropId: crop.id,
    land,
    soilId: soil.id,
    soilName: soil.name,
    region,
    season,
    crop: snapshot,
    startDate: now,
    endDate: null,
    stageStatus: crop.guide.map(() => false),
    actualCosts: crop.guide.map(() => null),
    journal: [],
    completed: false,
    profit: null,
  };
}

export function applyStage(plan, index, done, actualCost) {
  if (plan.completed) throw conflict('This crop is already finished.', 'plan_completed');
  if (!Number.isInteger(index) || index < 0 || index >= plan.stageStatus.length) throw badRequest('No such stage.', 'bad_stage');
  if (typeof done !== 'boolean') throw badRequest('done must be true or false');

  const status = [...plan.stageStatus];
  const costs = plan.actualCosts.length === status.length ? [...plan.actualCosts] : status.map(() => null);

  if (done) {
    // stages unlock in order — you cannot finish stage 3 before stage 2
    if (!status.slice(0, index).every(Boolean)) throw conflict('Finish the earlier stages first.', 'stage_locked');
    status[index] = true;
    costs[index] = actualCost ?? costs[index] ?? null;
  } else {
    // un-finishing a stage also re-opens everything after it
    for (let i = index; i < status.length; i++) { status[i] = false; costs[i] = null; }
  }
  return { stageStatus: status, actualCosts: costs };
}

export function applyComplete(plan, profit) {
  if (plan.completed) throw conflict('This crop is already finished.', 'plan_completed');
  if (!plan.stageStatus.every(Boolean)) throw conflict('Finish every stage before completing the crop.', 'not_finished');
  return { completed: true, profit: profit ?? null, endDate: new Date() };
}

export function applyJournalAdd(plan, text, now = new Date()) {
  const entry = { id: `note_${crypto.randomBytes(8).toString('hex')}`, text, date: now };
  return { journal: [entry, ...plan.journal] }; // newest first, like the old local version
}

export function applyJournalRemove(plan, entryId) {
  if (!plan.journal.some((j) => j.id === entryId)) throw notFound('No such journal entry.');
  return { journal: plan.journal.filter((j) => j.id !== entryId) };
}

// what the API sends back — everything the React app reads, minus internal fields
export function publicPlan({ userId, ...plan }) {
  void userId;
  return plan;
}
