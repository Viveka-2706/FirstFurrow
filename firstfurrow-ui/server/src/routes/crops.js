import { Router } from 'express';
import { recommend, SOILS, BUDGET_CAPS, SEASON_KEYS, seasonKey } from '../recommend.js';
import { wrap } from '../middleware/wrap.js';
import { badRequest, notFound } from '../errors.js';

export function cropRoutes(repo) {
  const router = Router();

  // GET /api/crops/recommend?soil=red&season=Kharif%20(Jun–Oct)&budget=mid&land=0.5[&region=Coimbatore]
  router.get('/recommend', wrap(async (req, res) => {
    const { soil, budget } = req.query;
    const season = seasonKey(req.query.season);
    const land = Number(req.query.land);

    const problems = [];
    if (!SOILS.includes(soil)) problems.push(`soil must be one of: ${SOILS.join(', ')}`);
    if (!SEASON_KEYS.includes(season)) problems.push(`season must start with one of: ${SEASON_KEYS.join(', ')}`);
    if (!Object.keys(BUDGET_CAPS).includes(budget)) problems.push(`budget must be one of: ${Object.keys(BUDGET_CAPS).join(', ')}`);
    if (!Number.isFinite(land) || land <= 0 || land > 100) problems.push('land must be a number of acres between 0 and 100');
    if (problems.length) return res.status(400).json({ error: 'Invalid query', code: 'validation', problems });

    const crops = recommend(await repo.crops.all(), { soil, season, budget, land });
    res.json({ query: { soil, season, budget, land, region: typeof req.query.region === 'string' ? req.query.region : null }, count: crops.length, crops });
  }));

  router.get('/', wrap(async (_req, res) => {
    const crops = await repo.crops.all();
    res.json({ count: crops.length, crops });
  }));

  router.get('/:id', wrap(async (req, res) => {
    if (typeof req.params.id !== 'string' || req.params.id.length > 60) throw badRequest('Invalid crop id');
    const crop = await repo.crops.byId(req.params.id);
    if (!crop) throw notFound(`No crop with id "${req.params.id}"`);
    res.json(crop);
  }));

  return router;
}
