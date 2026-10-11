import { Router } from 'express';
import { badRequest } from '../errors.js';
import { isStr } from '../validate.js';
import { wrap } from '../middleware/wrap.js';
import { diagnose } from '../services/diagnose.js';

export function symptomRoutes(repo) {
  const router = Router();

  // GET /api/symptoms?crop=okra → the tick-list, grouped, with signs that don't apply to this crop removed
  router.get('/', wrap(async (req, res) => {
    const crop = isStr(req.query.crop) ? req.query.crop : null;
    const [groups, symptoms] = await Promise.all([repo.symptoms.groups(), repo.symptoms.all()]);
    const byId = new Map(symptoms.map((s) => [s.id, s]));
    const applies = (s) => !s.crops?.length || !crop || s.crops.includes(crop);
    res.json({
      groups: groups
        .map((g) => ({
          id: g.id, en: g.en, ta: g.ta,
          items: g.symptomIds.map((id) => byId.get(id)).filter((s) => s && applies(s)).map(({ id, icon, en, ta }) => ({ id, icon, en, ta })),
        }))
        .filter((g) => g.items.length),
    });
  }));

  // POST /api/symptoms/diagnose { crop, symptoms: [ids] } → up to 3 likely problems with fixes
  router.post('/diagnose', wrap(async (req, res) => {
    const { crop, symptoms } = req.body ?? {};
    if (!Array.isArray(symptoms) || symptoms.length === 0 || symptoms.length > 60 || !symptoms.every(isStr)) {
      throw badRequest('Pick at least one symptom.');
    }
    if (crop !== undefined && crop !== null && !isStr(crop)) throw badRequest('crop must be text');
    res.json({ results: diagnose(await repo.symptoms.problems(), symptoms, crop ?? null) });
  }));

  return router;
}
