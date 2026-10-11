// Rules-based symptom matcher. Problems come from MongoDB; each lists the symptoms that point to
// it, weighted 3 = key sign, 2 = supporting, 1 = weak. A problem needs at least one key sign to
// appear at all, crop-specific problems get a small boost for the active crop, and the top
// three matches are returned.

const CROP_BOOST = 0.1;

export function diagnose(problems, selectedIds, cropId, limit = 3) {
  const selected = new Set(selectedIds);
  const results = [];

  for (const problem of problems) {
    const restricted = problem.crops?.length > 0;
    if (restricted && cropId && !problem.crops.includes(cropId)) continue; // belongs to a different crop

    const entries = Object.entries(problem.weights);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    const matched = entries.filter(([id]) => selected.has(id));
    if (!matched.some(([, w]) => w >= 3)) continue; // no key sign → not a candidate

    let score = matched.reduce((s, [, w]) => s + w, 0) / total;
    if (restricted && problem.crops.includes(cropId)) score += CROP_BOOST;
    score = Math.min(1, score);
    if (score < 0.3) continue;

    results.push({
      problem: { id: problem.id, icon: problem.icon, severity: problem.severity, en: problem.en, ta: problem.ta },
      score,
      confidence: score >= 0.7 ? 'high' : score >= 0.45 ? 'mid' : 'low',
      matched: matched.map(([id]) => id),
    });
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
