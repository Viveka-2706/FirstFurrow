// Dummy / mock data — stands in for the real crop knowledge base + API responses.

export const regions = ['Coimbatore', 'Thanjavur', 'Trichy', 'Madurai', 'Salem', 'Tirunelveli', 'Nagapattinam', 'Ramanathapuram', 'Nilgiris'];
export const seasons = ['Kharif (Jun–Oct)', 'Rabi (Nov–Mar)', 'Zaid (Apr–Jun)'];
export const budgetTiers = [
  { id: 'low', label: 'Under ₹20,000', hint: 'Tight budget, maybe borrowed' },
  { id: 'mid', label: '₹20,000 – ₹45,000', hint: 'Some savings or a small loan' },
  { id: 'flex', label: 'Above ₹45,000', hint: 'Comfortable to invest more' },
];

// Which regions realistically carry which soil — used to narrow the
// wizard's region step once a soil type has been picked.
export const soilRegionMap = {
  red: ['Coimbatore', 'Madurai', 'Salem'],
  black: ['Coimbatore', 'Tirunelveli'],
  alluvial: ['Thanjavur', 'Trichy'],
  laterite: ['Nilgiris'],
  sandy_coastal: ['Nagapattinam', 'Ramanathapuram'],
  clay_loam: ['Thanjavur', 'Trichy'],
};

// Approximate coordinates for each region — used to fetch real weather (Open-Meteo).
export const regionCoordinates = {
  Coimbatore: { lat: 11.0168, lon: 76.9558 },
  Thanjavur: { lat: 10.787, lon: 79.1378 },
  Trichy: { lat: 10.7905, lon: 78.7047 },
  Madurai: { lat: 9.9252, lon: 78.1198 },
  Salem: { lat: 11.6643, lon: 78.146 },
  Tirunelveli: { lat: 8.7139, lon: 77.7567 },
  Nagapattinam: { lat: 10.7661, lon: 79.842 },
  Ramanathapuram: { lat: 9.3639, lon: 78.8395 },
  Nilgiris: { lat: 11.4064, lon: 76.6932 },
};

// "<Tamil name> (<English name>)" — the one display format used everywhere a crop name appears.
export function cropDisplayName(crop) {
  return `${crop.localName} (${crop.name})`;
}

// Sums whatever actual amounts a farmer has logged for a plan's stages so far.
export function totalActualSpend(plan) {
  if (!Array.isArray(plan.actualCosts)) return 0;
  return plan.actualCosts.reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0);
}

// Parses "₹800–1,200" or "₹300–500 per session" into a [min, max] number range.
function parseCostRange(str) {
  const nums = (str.match(/[\d,]+/g) || ['0']).map((n) => parseInt(n.replace(/,/g, ''), 10));
  if (nums.length === 1) return [nums[0], nums[0]];
  return [nums[0], nums[1]];
}

// Sums a stage's costItems into a formatted "₹X–₹Y" range.
export function stageTotalCost(stage) {
  if (!stage || !stage.costItems || stage.costItems.length === 0) return '—';
  const totals = stage.costItems.reduce(
    (acc, ci) => {
      const [min, max] = parseCostRange(ci.cost);
      return [acc[0] + min, acc[1] + max];
    },
    [0, 0]
  );
  const fmt = (n) => `₹${n.toLocaleString('en-IN')}`;
  return totals[0] === totals[1] ? fmt(totals[0]) : `${fmt(totals[0])}–${fmt(totals[1])}`;
}

// The midpoint of a stage's estimated cost range — used as a sensible
// starting number when asking the farmer what they actually spent.
export function stageEstimateMidpoint(stage) {
  if (!stage || !stage.costItems || stage.costItems.length === 0) return 0;
  const totals = stage.costItems.reduce(
    (acc, ci) => {
      const [min, max] = parseCostRange(ci.cost);
      return [acc[0] + min, acc[1] + max];
    },
    [0, 0]
  );
  return Math.round((totals[0] + totals[1]) / 2);
}

export const soilTypes = [
  {
    id: 'red',
    name: 'Red Soil',
    where: 'Common around Coimbatore, Madurai, Salem',
    feel: 'Reddish, gritty, drains fast — dries out within a day or two after watering',
  },
  {
    id: 'black',
    name: 'Black Soil (Regur)',
    where: 'Parts of Coimbatore, Tirunelveli belt',
    feel: 'Dark, sticky when wet, cracks into deep fissures when dry — holds water well',
  },
  {
    id: 'alluvial',
    name: 'Alluvial Soil',
    where: 'Cauvery Delta — Thanjavur, Trichy',
    feel: 'Fine, soft, dark brown — the most fertile, holds moisture without waterlogging easily',
  },
  {
    id: 'laterite',
    name: 'Laterite Soil',
    where: 'Nilgiris and the Western Ghats belt',
    feel: 'Reddish-brown, porous, slightly acidic — needs compost to grow most vegetables well',
  },
  {
    id: 'sandy_coastal',
    name: 'Sandy Coastal Soil',
    where: 'Nagapattinam, Ramanathapuram, coastal belt',
    feel: 'Loose, pale, gritty — water and nutrients drain through it very quickly',
  },
  {
    id: 'clay_loam',
    name: 'Clay Loam',
    where: 'Delta and canal-irrigated tracts',
    feel: 'Smooth, holds a ball shape when squeezed damp — retains water and nutrients well',
  },
];

export const crops = [
  {
    id: 'okra',
    name: 'Ladies Finger',
    localName: 'Vendakkai',
    tagline: 'The forgiving first crop',
    investment: 16000,
    durationDays: 55,
    returnMin: 50000,
    returnMax: 100000,
    risk: 'Low',
    match: 96,
    color: '#9acb6b',
    suitableSoils: ['red', 'alluvial', 'clay_loam'],
    blurb:
      'Fast-maturing and steady in demand — okra tolerates beginner mistakes better than most vegetables, making it the safest first planting on a small plot.',
    water: {
      totalSeasonWater: '350–400 mm across the full crop cycle',
      method: 'Furrow irrigation, or drip if you have access to it — okra does not like waterlogging',
      frequency: 'Every 6–7 days in cool weather; every 3–4 days once daytime temperature crosses 32°C',
      criticalStages: 'Flowering (day 30–40) and pod formation — a dry spell here causes flower drop and stunted pods',
      warning: 'Never let water stand around the base for more than a few hours — root rot sets in fast in okra',
    },
    guide: [
      {
        stage: 'Land Preparation',
        dayRange: 'Day 0–3',
        whatToDo:
          'Plough the plot 2 times to a depth of about 20–25 cm, breaking up large clods. Mix in well-rotted farmyard manure or compost — roughly 2–3 kg per square metre — and form raised beds or ridges about 45 cm apart so water drains away from the stem.',
        why: 'Okra roots need loose, well-aerated soil to establish. Raised beds prevent the waterlogging that causes root rot, especially important on clay loam or black soil.',
        beginnerTip: 'If your soil crumbles easily and drains fast (red or sandy soil), skip raised beds and plant on the flat instead — you will need the moisture closer to the surface.',
        warningSign: 'If water still pools 4–5 hours after your test watering, add more organic matter or raise the beds higher before sowing.',
        costItems: [
          { item: 'Farmyard manure / compost', cost: '₹800–1,200' },
          { item: 'Plough or tiller rental (if hired)', cost: '₹600–900' },
        ],
      },
      {
        stage: 'Sowing',
        dayRange: 'Day 3',
        whatToDo:
          'Soak seeds in plain water for 12–24 hours before sowing to speed up germination. Sow 2 seeds per hole, 2–3 cm deep, spaced 30 cm apart along the rows. Cover lightly with loose soil and water immediately.',
        why: 'Pre-soaking softens the hard seed coat — unsoaked okra seeds can take 10+ days to germinate instead of 5–6.',
        beginnerTip: 'Sow slightly more seeds than you need. Once seedlings are 10 cm tall, pull out the weaker of each pair — this is normal, not a mistake.',
        warningSign: 'No germination by day 8–9 usually means the seed rotted from overwatering, not that the seed was bad — ease off watering on the next attempt.',
        costItems: [
          { item: 'Okra (vendakkai) seeds, for 0.1–0.2 acre', cost: '₹150–250' },
        ],
      },
      {
        stage: 'First Irrigation & Establishment',
        dayRange: 'Day 10',
        whatToDo:
          'Once seedlings show their first true leaves (not the small round first leaves, but the jagged okra-shaped ones), water gently at the base. Avoid wetting the leaves directly to reduce fungal risk.',
        why: 'The first true leaves mean the seedling has a working root system and can handle a full watering without rotting.',
        beginnerTip: 'Water early morning, not at midday — midday watering on hot soil can shock young roots.',
        warningSign: 'Yellowing lower leaves at this stage usually means overwatering, not a nutrient problem — hold off on the next watering by a day or two.',
        costItems: [
          { item: 'Watering can or hose (one-time, if you don\'t have one)', cost: '₹150–400' },
        ],
      },
      {
        stage: 'Fertilizing (Top Dressing)',
        dayRange: 'Day 20',
        whatToDo:
          'Apply a nitrogen-rich fertilizer (like urea, roughly 15–20 g per plant) or a matching quantity of well-composted manure, worked lightly into the soil about 5 cm from the stem, then water it in.',
        why: 'This is when the plant shifts from establishing roots to rapid leaf and branch growth — it needs a nitrogen boost to support the flowering that follows.',
        beginnerTip: 'Never place fertilizer touching the stem directly — it can burn the plant. Keep a small gap.',
        warningSign: 'Pale, small leaves at this stage are a sign of nitrogen deficiency — a light second dose a week later usually corrects it.',
        costItems: [
          { item: 'Urea / nitrogen fertilizer', cost: '₹200–350' },
        ],
      },
      {
        stage: 'Pest & Disease Check',
        dayRange: 'Day 30–45',
        whatToDo:
          'Check the underside of leaves and young pods every 3–4 days for shoot & fruit borer (small holes with sawdust-like waste near the entry point) and whitefly (tiny white insects that fly up when the leaf is disturbed). Remove and destroy any visibly infested shoot tips by hand.',
        why: 'This is the highest-risk window for pest damage. Catching an infestation in its first week is far cheaper and easier than treating a spread infestation later.',
        beginnerTip: 'A homemade neem-oil spray (5 ml neem oil + a few drops of soap in 1 litre water) sprayed weekly is enough for most beginner-scale infestations — you usually don\'t need chemical pesticide for a small plot.',
        warningSign: 'Wilting shoot tips with a visible entry hole means borer has already tunnelled in — cut off and destroy that shoot below the hole immediately so it doesn\'t spread to nearby plants.',
        costItems: [
          { item: 'Neem oil (for homemade spray)', cost: '₹150–250' },
          { item: 'Soap / spray additive', cost: '₹20–40' },
        ],
      },
      {
        stage: 'Harvest',
        dayRange: 'Day 55 onward',
        whatToDo:
          'Begin harvesting when pods are 7–10 cm long and snap easily with a light bend — this is usually 4–6 days after the flower opens. Harvest every 2–3 days; okra grows fast and overripe pods turn fibrous and unsellable within a day or two of the ideal size.',
        why: 'Okra left on the plant too long doesn\'t just spoil — it also signals the plant to stop producing new flowers, cutting your total yield.',
        beginnerTip: 'Wear gloves or long sleeves when harvesting — okra leaves and pods have fine spines that irritate skin.',
        warningSign: 'If pods feel hard and don\'t snap cleanly, they are overripe — remove and discard them anyway so the plant keeps producing new ones.',
        costItems: [
          { item: 'Harvest baskets / bags', cost: '₹100–200' },
          { item: 'Labor for picking (if hired)', cost: '₹300–500 per session' },
        ],
      },
    ],
  },
  {
    id: 'spinach',
    name: 'Spinach',
    localName: 'Pasalai Keerai',
    tagline: 'Fastest cash-back crop',
    investment: 8000,
    durationDays: 30,
    returnMin: 25000,
    returnMax: 45000,
    risk: 'Low',
    match: 89,
    color: '#6fa347',
    suitableSoils: ['alluvial', 'clay_loam', 'red'],
    blurb:
      'Ready in a month. Ideal if you want to see your first harvest — and first income — before committing more capital to a longer crop.',
    water: {
      totalSeasonWater: '180–220 mm across the full crop cycle',
      method: 'Light sprinkling by watering can or hose spray — spinach roots are shallow',
      frequency: 'Every 2–3 days, lighter amounts each time rather than one heavy watering',
      criticalStages: 'First 10 days after sowing — the shallow root system dries out fast if the top soil is allowed to crust over',
      warning: 'Spinach bolts (flowers early and turns bitter) quickly in high heat with irregular watering — keep moisture consistent, not just frequent',
    },
    guide: [
      {
        stage: 'Land Preparation',
        dayRange: 'Day 0',
        whatToDo:
          'Rake the bed to a fine, crumbly tilth — spinach seeds are small and cannot push through large clods. Mix in a thin layer of well-rotted compost, about 1–1.5 kg per square metre.',
        why: 'A fine seedbed is the single biggest factor in even germination for leafy greens — patchy tilth means patchy sprouting.',
        beginnerTip: 'If your soil clumps a lot when you squeeze it, sieve out the larger clods from the top 3–4 cm by hand before sowing.',
        warningSign: 'If the surface forms a hard crust after your prep watering, lightly scratch it open with a rake before sowing — seeds struggle to break through a crusted surface.',
        costItems: [
          { item: 'Well-rotted compost', cost: '₹400–600' },
        ],
      },
      {
        stage: 'Sowing',
        dayRange: 'Day 2',
        whatToDo:
          'Sow seeds thinly in shallow lines about 1–1.5 cm deep, rows 20 cm apart. Cover with a very light layer of soil and water gently with a fine spray so seeds aren\'t washed out of place.',
        why: 'Spinach seeds are small and near the surface — a heavy watering stream will displace them before they anchor.',
        beginnerTip: 'Mixing the tiny seeds with a handful of dry sand before sowing makes it much easier to spread them evenly by hand.',
        warningSign: 'Seeds clumped together will sprout as a tangled cluster that competes for space — thin these out as soon as you notice them.',
        costItems: [
          { item: 'Spinach seeds', cost: '₹80–150' },
        ],
      },
      {
        stage: 'Regular Light Irrigation',
        dayRange: 'Day 6 onward',
        whatToDo:
          'Once seedlings emerge (usually by day 5–7), water lightly every 2–3 days, keeping the top soil consistently moist but never waterlogged.',
        why: 'Spinach has a shallow root system with almost no reserve — it cannot survive even a short dry spell the way deeper-rooted crops can.',
        beginnerTip: 'Water in the early morning or evening, never at midday — leaves scorch easily under direct hot-sun watering.',
        warningSign: 'Leaves turning pale yellow at the edges is usually early water stress, not a nutrient issue — increase watering frequency slightly before adding any fertilizer.',
        costItems: [
          { item: 'Watering can or sprinkler head', cost: '₹100–250' },
        ],
      },
      {
        stage: 'Light Fertilizing',
        dayRange: 'Day 15',
        whatToDo:
          'Apply a light dose of nitrogen fertilizer (about 8–10 g urea per square metre) or diluted liquid compost, watered in immediately.',
        why: 'Spinach is grown purely for leaf mass, so a mid-cycle nitrogen boost directly improves both yield and leaf colour.',
        beginnerTip: 'Skip fertilizing entirely if your compost at planting was generous — over-fertilized spinach can develop bitter, overly fibrous leaves.',
        warningSign: 'Dark green, floppy leaves after fertilizing usually mean you\'ve overdone the nitrogen — hold off on any further doses.',
        costItems: [
          { item: 'Urea (light dose) or liquid compost', cost: '₹100–150' },
        ],
      },
      {
        stage: 'Harvest',
        dayRange: 'Day 28–30',
        whatToDo:
          'Harvest either by cutting the whole plant 2–3 cm above soil level, or by picking outer leaves only and letting the centre keep growing for a second cutting 10–12 days later.',
        why: 'The outer-leaf method gives you two harvests from one sowing instead of one, nearly doubling your return from the same plot.',
        beginnerTip: 'Harvest in the cool of early morning — leaves stay crisper and last longer before wilting than if picked in midday heat.',
        warningSign: 'If plants start growing a tall central stalk with small flower buds, harvest immediately — this is bolting, and leaves turn bitter within a day or two after it starts.',
        costItems: [
          { item: 'Harvest bags', cost: '₹50–100' },
        ],
      },
    ],
  },
  {
    id: 'marigold',
    name: 'Marigold',
    localName: 'Thagarai Poo',
    tagline: 'Steady festival demand',
    investment: 13000,
    durationDays: 50,
    returnMin: 40000,
    returnMax: 80000,
    risk: 'Low',
    match: 84,
    color: '#e7a93e',
    suitableSoils: ['red', 'black', 'alluvial'],
    blurb:
      'Temple and festival demand keeps prices dependable year-round, and the plant forgives irregular watering better than vegetables do.',
    water: {
      totalSeasonWater: '300–350 mm across the full crop cycle',
      method: 'Furrow irrigation between rows works well; avoid wetting flower heads directly once buds form',
      frequency: 'Every 5–6 days in cool weather; every 3 days during hot, dry spells',
      criticalStages: 'Transplanting week and early bud formation (around day 35) — stress in either window reduces flower size and count',
      warning: 'Overwatering close to harvest causes flower heads to rot before they can be picked — ease off watering slightly as flowering peaks',
    },
    guide: [
      {
        stage: 'Nursery Preparation',
        dayRange: 'Day 0',
        whatToDo:
          'Prepare a small nursery bed with fine, well-drained soil mixed with compost. Sow seeds thinly in rows 5 cm apart, cover lightly, and water with a fine spray.',
        why: 'Raising marigold in a nursery first, rather than sowing directly in the field, gives much higher survival rates and lets you select only the strongest seedlings to transplant.',
        beginnerTip: 'A shaded corner of your plot, or even large trays, works fine as a nursery for a small first crop — you don\'t need a separate structure.',
        warningSign: 'Thin, leggy, pale seedlings usually mean too little sunlight in the nursery spot — move it to a brighter location for the next batch.',
        costItems: [
          { item: 'Marigold seeds', cost: '₹150–250' },
          { item: 'Nursery trays (optional)', cost: '₹200–350' },
        ],
      },
      {
        stage: 'Transplanting',
        dayRange: 'Day 20',
        whatToDo:
          'When seedlings are about 10–12 cm tall with 4–5 true leaves, transplant them into the main field, spaced 30 cm apart in rows 40 cm apart. Water immediately after transplanting.',
        why: 'This spacing gives each plant enough room to branch out fully, which directly increases the number of flowers per plant.',
        beginnerTip: 'Transplant in the evening, not midday — seedlings recover from root disturbance far better without the added stress of hot sun.',
        warningSign: 'Wilting that doesn\'t recover within 2 days of transplanting usually means root damage during the move — water gently and provide light shade for a few days.',
        costItems: [
          { item: 'Labor for transplanting (if hired)', cost: '₹300–500' },
        ],
      },
      {
        stage: 'Establishment Irrigation',
        dayRange: 'Day 25',
        whatToDo:
          'Water every 5–6 days, keeping soil moist but not soaked, as the transplanted seedlings establish new roots in the field.',
        why: 'This is the most vulnerable period after transplanting — the plant is rebuilding root hairs that were damaged in the move.',
        beginnerTip: 'A thin layer of dry mulch (straw or dried leaves) around the base helps retain moisture and reduces how often you need to water.',
        warningSign: 'Drooping during the hottest part of the day that recovers by evening is normal heat response, not a watering problem — only worry if it hasn\'t recovered by the next morning.',
        costItems: [
          { item: 'Mulch material (straw or dried leaves)', cost: '₹100–200' },
        ],
      },
      {
        stage: 'Fertilizing (Top Dressing)',
        dayRange: 'Day 35',
        whatToDo:
          'Apply a balanced fertilizer (roughly 10 g each of nitrogen and potassium-rich fertilizer per plant) just before bud formation begins, worked into the soil around the base and watered in.',
        why: 'Potassium at this stage specifically improves flower size and colour, not just plant growth — this is the single most impactful fertilizing window for marigold.',
        beginnerTip: 'Pinch off the very first flower bud that forms on each plant — it feels wasteful, but it forces the plant to branch out and produce many more flowers later.',
        warningSign: 'All-leaf, no-flower growth by day 40 usually means too much nitrogen and not enough potassium — correct the ratio in your next dose.',
        costItems: [
          { item: 'Balanced NPK fertilizer', cost: '₹250–400' },
        ],
      },
      {
        stage: 'Harvest',
        dayRange: 'Day 50 onward',
        whatToDo:
          'Pick fully open flowers in the early morning, snapping or cutting the stem just below the flower head. Harvest every 3–4 days as new buds continue opening through the season.',
        why: 'Morning-picked flowers stay fresh longer and fetch better prices at market than flowers picked and wilted by midday heat.',
        beginnerTip: 'Regular picking actually encourages the plant to produce more flowers — an unpicked plant slows down flowering much faster than a regularly harvested one.',
        warningSign: 'Flower heads that feel damp or show early browning at the base are starting to rot from excess moisture — pick these immediately even if not fully open, and ease off watering.',
        costItems: [
          { item: 'Collection baskets', cost: '₹100–150' },
        ],
      },
    ],
  },
];

// ---- Images used on the public landing page (Unsplash, free license) ----
export const landingImages = {
  heroFarmer: 'https://images.unsplash.com/photo-1753123198359-e69454f63a5c?auto=format&fit=crop&w=1600&q=80',
  aerialField: 'https://images.unsplash.com/photo-1646928998317-6855a396e55b?auto=format&fit=crop&w=1200&q=80',
  seedlings: 'https://images.unsplash.com/photo-1741027911956-db63415dcedf?auto=format&fit=crop&w=1200&q=80',
  dashboardBackground: 'https://images.unsplash.com/photo-1688054004870-b6057c0020b2?auto=format&fit=crop&w=1800&q=80',
};
