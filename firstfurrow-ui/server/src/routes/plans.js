import { Router } from 'express';
import { HttpError, badRequest, conflict, notFound } from '../errors.js';
import { str, num, objectId, isStr } from '../validate.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../middleware/wrap.js';
import { buildPlan, applyStage, applyComplete, applyJournalAdd, applyJournalRemove, publicPlan } from '../services/plans.js';

export function planRoutes(repo, config) {
  const router = Router();
  router.use(requireAuth(config, repo));

  // loads a plan the logged-in user owns; someone else's plan looks exactly like a missing one
  const owned = async (req) => {
    const plan = await repo.plans.get(req.userId, objectId(req.params.id, 'plan id'));
    if (!plan) throw notFound('No such plan.');
    return plan;
  };

  router.get('/', wrap(async (req, res) => {
    res.json({ plans: (await repo.plans.listByUser(req.userId)).map(publicPlan) });
  }));

  router.post('/', wrap(async (req, res) => {
    const b = req.body ?? {};
    const cropId = str(b.cropId, 'cropId', { max: 60 });
    const land = num(b.land, 'land', { min: 0.01, max: 1000 });
    const soilId = str(b.soilId, 'soilId', { max: 40 });
    const region = str(b.region, 'region', { max: 60 });
    const season = str(b.season, 'season', { max: 60 });
    if (!/^(Kharif|Rabi|Zaid)\b/.test(season)) throw badRequest('Unknown season');

    const [crop, soils, regions] = await Promise.all([repo.crops.byId(cropId), repo.reference.soils(), repo.reference.regions()]);
    if (!crop) throw badRequest('Unknown crop', 'unknown_crop');
    const soil = soils.find((s) => s.id === soilId);
    if (!soil) throw badRequest('Unknown soil type', 'unknown_soil');
    if (!regions.some((r) => r.id === region)) throw badRequest('Unknown region', 'unknown_region');

    if ((await repo.plans.countByUser(req.userId)) >= config.maxPlansPerUser) {
      throw new HttpError(409, `You can have at most ${config.maxPlansPerUser} plans. Remove one to add another.`, 'plan_limit');
    }
    const plan = await repo.plans.create(req.userId, buildPlan({ crop, soil, region, land, season }));
    res.status(201).json({ plan: publicPlan(plan) });
  }));

  router.patch('/:id/stages/:index', wrap(async (req, res) => {
    const plan = await owned(req);
    const index = Number(req.params.index);
    const { done, actualCost } = req.body ?? {};
    let cost = null;
    if (actualCost !== undefined && actualCost !== null) cost = num(actualCost, 'actualCost', { min: 0, max: 100_000_000 });
    const updated = await repo.plans.update(req.userId, plan.id, applyStage(plan, index, done, cost));
    res.json({ plan: publicPlan(updated) });
  }));

  router.post('/:id/complete', wrap(async (req, res) => {
    const plan = await owned(req);
    const { profit } = req.body ?? {};
    const p = profit === undefined || profit === null ? null : num(profit, 'profit', { min: -1_000_000_000, max: 1_000_000_000 });
    const updated = await repo.plans.update(req.userId, plan.id, applyComplete(plan, p));
    res.json({ plan: publicPlan(updated) });
  }));

  router.post('/:id/journal', wrap(async (req, res) => {
    const plan = await owned(req);
    if (!isStr(req.body?.text)) throw badRequest('text must be text');
    const text = str(req.body.text, 'text', { max: 2000 });
    if (plan.journal.length >= 500) throw conflict('This journal is full.', 'journal_full');
    const updated = await repo.plans.update(req.userId, plan.id, applyJournalAdd(plan, text));
    res.status(201).json({ plan: publicPlan(updated) });
  }));

  router.delete('/:id/journal/:entryId', wrap(async (req, res) => {
    const plan = await owned(req);
    const entryId = str(req.params.entryId, 'entry id', { max: 60 });
    const updated = await repo.plans.update(req.userId, plan.id, applyJournalRemove(plan, entryId));
    res.json({ plan: publicPlan(updated) });
  }));

  router.delete('/:id', wrap(async (req, res) => {
    const plan = await owned(req);
    await repo.plans.remove(req.userId, plan.id);
    res.status(204).end();
  }));

  return router;
}
