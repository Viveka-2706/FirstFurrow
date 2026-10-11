// Pure function: dataset + hand-written guides + extras  →  the crop documents stored in MongoDB.
// No database access here, so it can be unit-tested and dry-run without MongoDB.
//
// The document shape deliberately matches the object the React app already uses
// (name, localName, investment, returnMin, returnMax, guide[], water{} …) so the
// frontend components keep working unchanged. Tamil text lives in `ta`.

import {
  CROP_EXTRA, PALETTE, NOTE_OVERRIDES, NOTE_TA, CATEGORY_TA, TASKTYPE_TA,
  WATER_LEVEL_TA, WATER_FREQ_FALLBACK, DESC_TA,
} from './data/extra.js';
import { STAGE_EXTRA, STAGE_COST_WEIGHT, WATER_TIER_EXTRA } from './data/stage-extra.js';

const mid = (r) => Math.round((r.min + r.max) / 2);
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// Turns a crop's whole-season investment range into a believable per-stage cost estimate,
// scaled by how much of the budget that task type typically needs, then splits it across
// that task type's 1–2 cost-item labels so numbers are crop-specific, not arbitrary.
function stageCostRange(taskType, investmentRange) {
  const weight = STAGE_COST_WEIGHT[taskType] ?? 0.1;
  const lo = Math.max(50, Math.round((investmentRange.min * weight) / 50) * 50);
  const hi = Math.max(lo + 50, Math.round((investmentRange.max * weight) / 50) * 50);
  return { lo, hi, mid: Math.round(((lo + hi) / 2) / 50) * 50 };
}
function buildCostItems(taskType, investmentRange, lang) {
  const extra = STAGE_EXTRA[taskType];
  if (!extra) return [];
  const { lo, hi, mid: midPoint } = stageCostRange(taskType, investmentRange);
  const labels = lang === 'ta' ? extra.ta.items.map((it) => it.ta) : extra.en.items.map((it) => it.en);
  if (labels.length === 1) {
    return [{ item: labels[0], cost: `${inr(lo)}–${inr(hi)}` }];
  }
  return [
    { item: labels[0], cost: `${inr(lo)}–${inr(midPoint)}` },
    { item: labels[1], cost: `${inr(midPoint)}–${inr(hi)}` },
  ];
}

function need(map, key, what) {
  if (map[key] === undefined) throw new Error(`Missing ${what}: "${key}"`);
  return map[key];
}

// "Begin regular irrigation cycle (every 5-7 days)" → { en: 'Every 5-7 days', ta: 'ஒவ்வொரு 5–7 நாளுக்கும்' }
function irrigationFrequency(tasks) {
  const t = tasks.find((x) => x.taskType === 'Irrigation');
  const m = t?.description.match(/every (\d+(?:-\d+)?) days/i);
  if (!m) return null;
  return { en: `Every ${m[1]} days`, ta: `ஒவ்வொரு ${m[1].replace('-', '–')} நாளுக்கும்` };
}

function basicGuide(tasks, investmentRange) {
  const total = {};
  tasks.forEach((t) => { total[t.taskType] = (total[t.taskType] || 0) + 1; });
  const seen = {};
  const en = [];
  const ta = [];
  tasks.forEach((t, i) => {
    seen[t.taskType] = (seen[t.taskType] || 0) + 1;
    const suffix = total[t.taskType] > 1 ? ` ${seen[t.taskType]}` : ''; // "Fertilizing 1", "Fertilizing 2"
    const last = i === tasks.length - 1;
    const day = t.dayOffset;
    const extra = need(STAGE_EXTRA, t.taskType, 'stage content template');
    en.push({
      stage: `${t.taskType}${suffix}`,
      stageId: t.taskType, // used to pick the stage icon
      dayRange: last ? `Day ${day} onward` : `Day ${day}`,
      whatToDo: t.description,
      why: extra.en.why,
      beginnerTip: extra.en.beginnerTip,
      warningSign: extra.en.warningSign,
      costItems: buildCostItems(t.taskType, investmentRange, 'en'),
    });
    ta.push({
      stage: `${need(TASKTYPE_TA, t.taskType, 'stage name translation')}${suffix}`,
      dayRange: last ? `நாள் ${day} முதல்` : `நாள் ${day}`,
      whatToDo: need(DESC_TA, t.description, 'task description translation'),
      why: extra.ta.why,
      beginnerTip: extra.ta.beginnerTip,
      warningSign: extra.ta.warningSign,
      costItems: buildCostItems(t.taskType, investmentRange, 'ta'),
    });
  });
  return { en, ta };
}

export function buildCrops(dataset, richGuides) {
  const scales = dataset.referenceScales;
  const docs = [];
  let basicIndex = 0;

  for (const d of dataset.crops) {
    const extra = need(CROP_EXTRA, d.id, 'CROP_EXTRA entry');
    const slug = extra.slug;
    const rich = richGuides[slug];

    // ---- numbers: the dataset is the source of truth for every crop ----
    const numbers = {
      datasetId: d.id,
      category: d.category,
      investment: mid(d.investmentPerAcreINR),
      investmentRange: d.investmentPerAcreINR,
      returnMin: d.expectedReturnPerAcreINR.min,
      returnMax: d.expectedReturnPerAcreINR.max,
      durationDays: d.durationDays,
      risk: cap(d.riskLevel),
      waterNeed: d.waterNeed,
      landRange: d.suitableLandAcres,
      seasons: d.suitableSeasons,
      perUnit: Boolean(extra.perUnit),
    };

    if (rich) {
      // hand-written, full guide (English + Tamil) — keep it, only refresh the numbers
      const { match, ...en } = rich.en; // `match` is now computed per request, not stored
      void match;
      docs.push({ _id: slug, ...en, ...numbers, guideLevel: 'full', ta: rich.ta });
      continue;
    }

    // ---- basic guide generated from the dataset's task template ----
    const { en: guide, ta: taGuide } = basicGuide(d.taskTemplate, d.investmentPerAcreINR);
    const freq = irrigationFrequency(d.taskTemplate) ?? WATER_FREQ_FALLBACK[d.waterNeed];
    const levelText = scales.waterNeed[d.waterNeed];
    const blurb = NOTE_OVERRIDES[d.id] ?? d.notes;
    const waterTier = need(WATER_TIER_EXTRA, d.waterNeed, 'water-tier content template');

    docs.push({
      _id: slug,
      ...numbers,
      name: extra.name,
      localName: extra.localName,
      tagline: d.category,
      blurb,
      color: PALETTE[basicIndex++ % PALETTE.length],
      suitableSoils: extra.soils,
      water: {
        totalSeasonWater: levelText,
        method: waterTier.en.method,
        frequency: freq.en,
        criticalStages: waterTier.en.criticalStages,
        warning: waterTier.en.warning,
      },
      guide,
      guideLevel: 'basic',
      ta: {
        name: extra.name,
        localName: extra.taTamil,
        tagline: need(CATEGORY_TA, d.category, 'category translation'),
        blurb: NOTE_TA[d.id] ?? need(NOTE_TA, d.id, 'note translation'),
        water: {
          totalSeasonWater: need(WATER_LEVEL_TA, levelText, 'water-need translation'),
          method: waterTier.ta.method,
          frequency: freq.ta,
          criticalStages: waterTier.ta.criticalStages,
          warning: waterTier.ta.warning,
        },
        guide: taGuide,
      },
    });
  }
  return docs;
}
