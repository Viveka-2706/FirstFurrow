import { Router } from 'express';
import { wrap } from '../middleware/wrap.js';

// Soils and districts — the lists behind the wizard, plus the Tamil names and weather coordinates.
// Also a short list of crop names (not the full guides) for the landing page.
export function referenceRoutes(repo) {
  const router = Router();
  router.get('/', wrap(async (_req, res) => {
    const [soils, regions, crops] = await Promise.all([repo.reference.soils(), repo.reference.regions(), repo.crops.all()]);
    res.json({
      soils,
      regions,
      crops: crops.map(({ id, name, localName, ta }) => ({ id, name, localName, ta: { name: ta?.name, localName: ta?.localName } })),
    });
  }));
  return router;
}
