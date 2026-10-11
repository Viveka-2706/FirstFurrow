// Crop matching — pure functions, no database. The API passes in crops loaded from MongoDB.
//
// How a crop is chosen:
//   1. HARD FILTERS (a crop that fails these is never shown):
//        • season  — the farmer's season must be one the crop grows in (or the crop is year-round)
//        • budget  — the cheapest realistic cost for this much land must fit the budget tier
//   2. SOIL — crops suited to the farmer's soil come first. Only if fewer than 3 crops
//      qualify do we fill the gap with less-suited ones (the card then says "Best in: …").
//   3. SCORE out of 100 (this is the "% match" on the card):
//        soil fit 35 · budget comfort 20 · land-size fit 15 · risk 15 · quick payback 10 · season fit 5

export const SOILS = ['red', 'black', 'alluvial', 'laterite', 'sandy_coastal', 'clay_loam'];
export const BUDGET_CAPS = { low: 20000, mid: 45000, flex: Infinity }; // total ₹ the farmer can put in
export const SEASON_KEYS = ['Kharif', 'Rabi', 'Zaid'];

// "Kharif (Jun–Oct)" → "Kharif"
export const seasonKey = (s) => String(s || '').split(/[\s(]/)[0];

const mid = (r) => (r.min + r.max) / 2;

// per-unit crops (indoor mushroom) are priced per setup, so land size does not multiply the cost
const costFor = (crop, land, which) => {
  const per = which === 'min' ? crop.investmentRange.min : mid(crop.investmentRange);
  return crop.perUnit ? per : per * land;
};

export function growsInSeason(crop, season) {
  return crop.seasons.some((s) => s.startsWith('Year-round') || s === season);
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function scoreCrop(crop, { soil, season, budget, land }) {
  const cap = BUDGET_CAPS[budget];
  const soilOk = crop.suitableSoils.includes(soil);

  // budget comfort: lots of headroom → full marks, easing off as the cost nears the limit;
  // if only the cheap end of the range fits, the crop is a stretch
  let budgetPts = 20;
  if (Number.isFinite(cap)) {
    const ratio = costFor(crop, land, 'mid') / cap;
    budgetPts = ratio <= 0.3 ? 20 : ratio <= 1 ? 20 - ((ratio - 0.3) / 0.7) * 12 : 4;
  }

  // land fit: inside the crop's suitable range, and higher the nearer the middle of it
  const { min, max } = crop.landRange;
  const half = Math.max((max - min) / 2, 1e-9);
  const landPts = land >= min && land <= max ? 10 + 5 * clamp(1 - Math.abs(land - (min + max) / 2) / half, 0, 1) : 3;

  const riskPts = crop.risk === 'Low' ? 15 : crop.risk === 'Medium' ? (budget === 'low' ? 4 : 8) : 0;

  // money back sooner is safer for a first-timer: 30 days → 10 pts, 180+ days → 0
  const paybackPts = 10 * clamp(1 - (crop.durationDays - 30) / 150, 0, 1);

  // a crop traditionally grown in this season beats one that is merely "year-round"
  const seasonPts = crop.seasons.includes(season) ? 5 : 2;

  const score = (soilOk ? 35 : 0) + budgetPts + landPts + riskPts + paybackPts + seasonPts;
  return { score: Math.round(score), soilOk };
}

export function recommend(crops, query, limit = 3) {
  const { season, budget, land } = query;
  const cap = BUDGET_CAPS[budget];

  const eligible = crops
    .filter((c) => growsInSeason(c, season))
    .filter((c) => !Number.isFinite(cap) || costFor(c, land, 'min') <= cap)
    .map((c) => {
      const { score, soilOk } = scoreCrop(c, query);
      const roi = mid({ min: c.returnMin, max: c.returnMax }) / c.investment;
      return { crop: c, score, soilOk, roi };
    });

  const byFit = (a, b) => b.score - a.score || b.roi - a.roi;
  const suited = eligible.filter((e) => e.soilOk).sort(byFit);
  const others = eligible.filter((e) => !e.soilOk).sort(byFit);

  return [...suited, ...others].slice(0, limit).map((e) => ({ ...e.crop, match: e.score }));
}
