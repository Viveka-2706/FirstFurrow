// Fills in the fields the dataset's task template doesn't carry: why / beginnerTip /
// warningSign / costItems for every stage, and method / criticalStages / warning for
// water info — for the 15 crops that only have a bare task list, not a hand-written guide.
//
// These are genuine, task-type-specific agronomic guidance (not placeholder text), but they
// are templated by task type + scaled by each crop's own investment numbers, not individually
// researched per crop the way okra/spinach/marigold are. Flag this if asked how "basic" and
// "full" guides differ in depth.

// Share of a crop's total investment typically spent at each stage — used to turn one
// investment range into a believable per-stage cost estimate.
export const STAGE_COST_WEIGHT = {
  'Land Preparation': 0.22,
  Sowing: 0.12,
  'Sowing/Transplanting': 0.16,
  Fertilizing: 0.16,
  Irrigation: 0.10,
  'Pest Check': 0.08,
  Harvest: 0.14,
  Setup: 0.35,
  Spawning: 0.18,
  Incubation: 0.06,
  'Fruiting Care': 0.10,
  Pruning: 0.06,
};

export const STAGE_EXTRA = {
  'Land Preparation': {
    en: {
      why: 'Loosened, well-drained soil lets roots establish quickly — most early-stage failures trace back to compacted or waterlogged ground, not the seed itself.',
      beginnerTip: "Don't skip the organic matter even if your budget is tight — a thin layer of compost now is cheaper than correcting poor soil later.",
      warningSign: 'If water still stands 4–5 hours after a test watering, improve drainage (raised beds or more organic matter) before sowing.',
      items: [
        { en: 'Farmyard manure / compost' },
        { en: 'Plough or tiller rental (if hired)' },
      ],
    },
    ta: {
      why: 'தளர்வான, நீர் நன்கு வடியும் மண் வேர்கள் வேகமாக வேரூன்ற உதவும் — பெரும்பாலான ஆரம்பக் கட்ட தோல்விகள் விதையின் தரத்தால் அல்ல, இறுக்கமான அல்லது நீர் தேங்கும் மண்ணால் ஏற்படுகின்றன.',
      beginnerTip: 'பட்ஜெட் குறைவாக இருந்தாலும் தொழுவுரம் இடுவதைத் தவிர்க்காதீர்கள் — இப்போது இடும் மெல்லிய உரப் படை, பின்னர் மோசமான மண்ணைச் சரிசெய்வதை விட மலிவானது.',
      warningSign: 'சோதனை நீர் பாய்ச்சிய 4–5 மணி நேரத்திற்குப் பிறகும் நீர் தேங்கியிருந்தால், விதைப்பதற்கு முன் வடிகால் வசதியை (மேட்டுப்பாத்தி அல்லது கூடுதல் உரம்) மேம்படுத்துங்கள்.',
      items: [
        { ta: 'தொழுவுரம் / மக்கிய உரம்' },
        { ta: 'உழவு / டில்லர் வாடகை (வாடகைக்கு எடுத்தால்)' },
      ],
    },
  },

  Sowing: {
    en: {
      why: 'Correct seed depth and spacing decide germination rate and how much each plant can branch out later — crowded or too-deep sowing is one of the most common beginner mistakes.',
      beginnerTip: 'Sow slightly more seed than you think you need; thinning out weaker seedlings later is normal, not a sign of failure.',
      warningSign: 'No visible germination by the expected date usually means overwatering rotted the seed, not that the seed was bad — ease off watering next time.',
      items: [
        { en: 'Seeds' },
        { en: 'Sowing labour' },
      ],
    },
    ta: {
      why: 'சரியான விதை ஆழமும் இடைவெளியும் முளைப்பு விகிதத்தையும், பின்னர் செடி எவ்வளவு கிளைக்கும் என்பதையும் தீர்மானிக்கும் — நெருக்கமாகவோ, மிக ஆழமாகவோ விதைப்பது ஆரம்பநிலையாளர்கள் செய்யும் பொதுவான தவறு.',
      beginnerTip: 'தேவைக்கு சற்று அதிகமாக விதையுங்கள்; பலவீனமான நாற்றுகளை பின்னர் நீக்குவது இயல்பானதே, தோல்வி அல்ல.',
      warningSign: 'எதிர்பார்த்த நாளுக்குள் முளைக்கவில்லை என்றால், பெரும்பாலும் அதிக நீரால் விதை அழுகியதே காரணம், விதையின் தரம் அல்ல — அடுத்த முறை நீர் பாய்ச்சுவதைக் குறையுங்கள்.',
      items: [
        { ta: 'விதைகள்' },
        { ta: 'விதைப்பு ஆள் உழைப்பு' },
      ],
    },
  },

  'Sowing/Transplanting': {
    en: {
      why: 'Healthy, correctly-spaced seedlings establish faster and branch out more, which directly affects how much the plant will yield later.',
      beginnerTip: 'Transplant in the evening, not midday heat — seedlings recover from root disturbance far better without added heat stress.',
      warningSign: "Wilting that doesn't recover within 2 days of transplanting usually means root damage — water gently and give light shade for a few days.",
      items: [
        { en: 'Seedlings / saplings' },
        { en: 'Transplanting labour' },
      ],
    },
    ta: {
      why: 'ஆரோக்கியமான, சரியான இடைவெளியில் நடப்பட்ட நாற்றுகள் வேகமாக வேரூன்றி, அதிகமாகக் கிளைக்கும் — இது பின்னர் கிடைக்கும் மகசூலை நேரடியாகப் பாதிக்கும்.',
      beginnerTip: 'மதியம் வெயிலில் அல்ல, மாலை நேரத்தில் நடவு செய்யுங்கள் — வேர் பாதிப்பிலிருந்து நாற்றுகள் வெப்ப அழுத்தம் இல்லாமல் வேகமாக மீளும்.',
      warningSign: 'நடவுக்குப் பிறகு 2 நாட்களுக்குள் தளிர்ந்த செடி மீளவில்லை எனில், வேர் பாதிக்கப்பட்டிருக்கலாம் — மெதுவாக நீர் பாய்ச்சி, சில நாட்கள் லேசான நிழல் கொடுங்கள்.',
      items: [
        { ta: 'நாற்றுகள் / கன்றுகள்' },
        { ta: 'நடவு ஆள் உழைப்பு' },
      ],
    },
  },

  Irrigation: {
    en: {
      why: 'Consistent moisture at this stage avoids the stop-start stress that stunts growth and reduces flowering — irregular watering is harder on a plant than slightly less water applied steadily.',
      beginnerTip: 'Water early morning or evening, never at midday — watering hot soil under direct sun wastes water and can shock roots.',
      warningSign: "Leaves that are pale and drooping even when soil looks moist usually mean waterlogged roots, not thirst — ease off the next watering.",
      items: [
        { en: 'Irrigation labour / pump running cost' },
      ],
    },
    ta: {
      why: 'இந்தக் கட்டத்தில் சீரான ஈரப்பதம் இருந்தால், வளர்ச்சியைக் குன்றச் செய்யும் திடீர் நீர்த் தட்டுப்பாட்டைத் தவிர்க்கலாம் — ஒழுங்கற்ற நீர்ப்பாசனம், சற்று குறைவாக ஆனால் சீராக நீர் கொடுப்பதை விட செடிக்குக் கடினமானது.',
      beginnerTip: 'காலையிலோ மாலையிலோ நீர் பாய்ச்சுங்கள், மதியம் வெயிலில் வேண்டாம் — வெய்யில் மண்ணில் நீர் பாய்ச்சுவது நீரை வீணாக்கி வேர்களுக்கு அதிர்ச்சி தரும்.',
      warningSign: 'மண் ஈரமாகத் தெரிந்தும் இலைகள் வெளிறி தொங்கினால், அது தாகம் அல்ல, நீர் தேங்கிய வேர் பிரச்சினை — அடுத்த நீர்ப்பாசனத்தைத் தவிருங்கள்.',
      items: [
        { ta: 'பாசன ஆள் உழைப்பு / மோட்டார் செலவு' },
      ],
    },
  },

  Fertilizing: {
    en: {
      why: 'This is usually when the plant shifts from establishing roots to active growth or flowering — a timely nutrient boost here has an outsized effect on final yield.',
      beginnerTip: "Keep fertilizer a few centimetres away from the stem — direct contact can burn the plant instead of helping it.",
      warningSign: 'Pale, small leaves after this stage usually mean the dose was too light — a small top-up a week later generally corrects it.',
      items: [
        { en: 'Fertilizer (urea / compost / NPK mix)' },
      ],
    },
    ta: {
      why: 'இந்த நேரத்தில் பொதுவாக செடி வேரூன்றும் கட்டத்திலிருந்து வளர்ச்சி / பூக்கும் கட்டத்திற்கு மாறும் — சரியான நேரத்தில் தரும் ஊட்டச்சத்து இறுதி மகசூலில் பெரிய மாற்றத்தை ஏற்படுத்தும்.',
      beginnerTip: 'உரத்தை தண்டிலிருந்து சற்று இடைவெளி விட்டு இடுங்கள் — நேரடித் தொடர்பு செடியை எரிக்கக்கூடும்.',
      warningSign: 'இந்தக் கட்டத்திற்குப் பிறகு இலைகள் வெளிறி சிறியதாக இருந்தால், உரத்தின் அளவு குறைவாக இருந்திருக்கலாம் — ஒரு வாரம் கழித்து சிறிதளவு கூடுதலாக இடுங்கள்.',
      items: [
        { ta: 'உரம் (யூரியா / உரம் / NPK கலவை)' },
      ],
    },
  },

  'Pest Check': {
    en: {
      why: 'Catching a pest or disease in its first week is far cheaper and easier than treating a spread infestation later — this is usually the highest-risk window for the whole crop.',
      beginnerTip: 'A homemade neem-oil spray (a few ml of neem oil + a drop of soap in a litre of water), sprayed weekly, is usually enough for a small beginner plot — chemical pesticide is rarely needed at this scale.',
      warningSign: 'Any wilting shoot tip, sticky residue, or visible holes with powdery waste near them means pest activity has already started — remove and destroy the affected part immediately.',
      items: [
        { en: 'Neem oil / bio-pesticide' },
        { en: 'Monitoring labour' },
      ],
    },
    ta: {
      why: 'பூச்சி அல்லது நோயை முதல் வாரத்திலேயே கண்டுபிடிப்பது, பின்னர் பரவிய தொற்றைக் கட்டுப்படுத்துவதை விட மிகவும் எளிதானது, மலிவானது — இதுவே பொதுவாக முழுப் பயிருக்கும் அதிக ஆபத்துள்ள நேரம்.',
      beginnerTip: 'வீட்டில் தயாரிக்கும் வேப்ப எண்ணெய் தெளிப்பு (ஒரு லிட்டர் தண்ணீரில் சிறிது வேப்ப எண்ணெய் + ஒரு துளி சோப்பு), வாரம் ஒருமுறை தெளித்தால், சிறிய தொடக்க நிலத்திற்குப் போதுமானது — இந்த அளவில் வேதிப் பூச்சிக்கொல்லி பொதுவாகத் தேவையில்லை.',
      warningSign: 'தளிர் நுனி வாடுவது, ஒட்டும் பசை, அல்லது தூள் போன்ற கழிவுடன் கூடிய துளைகள் தென்பட்டால் பூச்சித் தாக்குதல் ஏற்கெனவே தொடங்கிவிட்டது — பாதிக்கப்பட்ட பகுதியை உடனே அகற்றி அழியுங்கள்.',
      items: [
        { ta: 'வேப்ப எண்ணெய் / உயிர் பூச்சிக்கொல்லி' },
        { ta: 'கண்காணிப்பு ஆள் உழைப்பு' },
      ],
    },
  },

  Harvest: {
    en: {
      why: "Picking at the right size and promptly matters more than it seems — produce left too long doesn't just lose quality, it often signals the plant to slow down further production.",
      beginnerTip: 'Harvest in the cool of early morning — produce stays fresher and fetches a better price than something picked and wilted by midday heat.',
      warningSign: "Overripe or damaged produce left on the plant should still be removed even if you won't sell it — leaving it on reduces the plant's further output.",
      items: [
        { en: 'Harvest labour' },
        { en: 'Baskets / crates / transport to market' },
      ],
    },
    ta: {
      why: 'சரியான அளவில், சரியான நேரத்தில் பறிப்பது தோன்றுவதை விட முக்கியமானது — அதிக நேரம் செடியில் விட்டால் தரம் குறைவது மட்டுமின்றி, செடி மேலும் உற்பத்தியைக் குறைக்கக்கூடும்.',
      beginnerTip: 'அதிகாலையில் அறுவடை செய்யுங்கள் — மதிய வெயிலில் பறித்து வாடுவதை விட, பொருள் அதிக நேரம் புத்துணர்ச்சியுடன் இருக்கும், நல்ல விலையும் கிடைக்கும்.',
      warningSign: 'விற்க முடியாத அளவுக்கு முற்றிய அல்லது சேதமடைந்த பொருளையும் செடியிலிருந்து அகற்றுங்கள் — விட்டால் செடியின் மேலும் உற்பத்தி குறையும்.',
      items: [
        { ta: 'அறுவடை ஆள் உழைப்பு' },
        { ta: 'கூடைகள் / பெட்டிகள் / சந்தைக்கு போக்குவரத்து' },
      ],
    },
  },

  Setup: {
    en: {
      why: 'A clean, controlled growing space is what makes an indoor/controlled crop like this work at all — contamination at setup is the single biggest cause of a failed first attempt.',
      beginnerTip: 'Clean and sanitise the growing area thoroughly before bringing in any growing material — this single step prevents most early failures.',
      warningSign: 'Any unusual smell, mould colour other than what you expect, or visible pests at this stage means contamination — it is safer to restart than continue.',
      items: [
        { en: 'Shed / structure materials' },
        { en: 'Substrate / growing medium' },
      ],
    },
    ta: {
      why: 'தூய்மையான, கட்டுப்படுத்தப்பட்ட வளர்ப்பு இடம்தான் இது போன்ற உள்ளரங்கு பயிரை வெற்றிகரமாக்குகிறது — அமைப்பின்போது ஏற்படும் அசுத்தமே முதல் முயற்சி தோல்வியடைவதற்கு முக்கியக் காரணம்.',
      beginnerTip: 'வளர்ப்புப் பொருட்களை கொண்டு வருவதற்கு முன் வளர்ப்பு இடத்தை நன்கு சுத்தம் செய்து கிருமி நீக்கம் செய்யுங்கள் — இது பெரும்பாலான ஆரம்பத் தோல்விகளைத் தடுக்கும்.',
      warningSign: 'வழக்கத்திற்கு மாறான வாசனை, எதிர்பாராத நிற பூஞ்சை, அல்லது பூச்சிகள் தென்பட்டால் அசுத்தம் ஏற்பட்டிருக்கலாம் — தொடர்வதை விட மீண்டும் தொடங்குவது பாதுகாப்பானது.',
      items: [
        { ta: 'கொட்டகை / கட்டமைப்புப் பொருட்கள்' },
        { ta: 'வளர்ப்பு ஊடகம்' },
      ],
    },
  },

  Spawning: {
    en: {
      why: 'Even, clean spawn distribution through the substrate is what determines how fully and evenly the final yield develops.',
      beginnerTip: 'Work with clean hands and a clean surface — spawning is the step most sensitive to contamination in the whole process.',
      warningSign: 'Any green, black, or unusually coloured patches appearing on the substrate in the days after spawning usually mean contamination — isolate or discard that batch.',
      items: [
        { en: 'Spawn (seed culture)' },
      ],
    },
    ta: {
      why: 'வளர்ப்பு ஊடகம் முழுவதும் சீராக, சுத்தமாக விதை பரவுவதே இறுதி மகசூல் எவ்வளவு முழுமையாகவும் சீராகவும் வளரும் என்பதைத் தீர்மானிக்கும்.',
      beginnerTip: 'சுத்தமான கைகளுடனும் சுத்தமான இடத்திலும் வேலை செய்யுங்கள் — இந்தச் செயல்முறையில் அசுத்தத்திற்கு மிகவும் உணர்திறன் கொண்ட கட்டம் இதுவே.',
      warningSign: 'விதை இட்ட சில நாட்களுக்குள் பச்சை, கருப்பு அல்லது வழக்கத்திற்கு மாறான நிற படிவுகள் தோன்றினால் அசுத்தம் ஏற்பட்டிருக்கலாம் — அந்தத் தொகுதியை தனியே வைக்கவும் அல்லது அகற்றவும்.',
      items: [
        { ta: 'விதை (ஸ்பான்)' },
      ],
    },
  },

  Incubation: {
    en: {
      why: 'Stable darkness, humidity and temperature during this window is what lets the growth spread fully through the substrate before fruiting begins.',
      beginnerTip: 'Resist the urge to check too often — opening the space repeatedly disturbs the humidity and temperature it needs to stay stable.',
      warningSign: 'A sour or ammonia-like smell during incubation usually means contamination, not normal progress — investigate rather than wait it out.',
      items: [
        { en: 'Humidity / temperature control materials' },
      ],
    },
    ta: {
      why: 'இந்தக் கட்டத்தில் நிலையான இருள், ஈரப்பதம், வெப்பநிலை இருந்தால்தான் காளான் உருவாகும் முன் வளர்ப்பு ஊடகம் முழுவதும் வளர்ச்சி பரவும்.',
      beginnerTip: 'அடிக்கடி திறந்து பார்க்க வேண்டாம் — மீண்டும் மீண்டும் திறப்பது தேவையான ஈரப்பதத்தையும் வெப்பநிலையையும் பாதிக்கும்.',
      warningSign: 'அடைகாக்கும்போது புளிப்பு அல்லது அம்மோனியா போன்ற வாசனை வந்தால் அது சாதாரண முன்னேற்றம் அல்ல, அசுத்தமாக இருக்கலாம் — காத்திருக்காமல் சரிபார்க்கவும்.',
      items: [
        { ta: 'ஈரப்பதம் / வெப்பநிலைக் கட்டுப்பாட்டுப் பொருட்கள்' },
      ],
    },
  },

  'Fruiting Care': {
    en: {
      why: 'Light and humidity management in this window is what triggers and sustains actual fruiting — getting this wrong is the most common reason yield falls short of expectation.',
      beginnerTip: 'Mist lightly and regularly rather than soaking occasionally — steady humidity matters more than the total water given.',
      warningSign: 'Dry, curling edges mean humidity has dropped too low — increase misting frequency rather than the amount per misting.',
      items: [
        { en: 'Misting / humidity maintenance' },
      ],
    },
    ta: {
      why: 'இந்த நேரத்தில் வெளிச்சமும் ஈரப்பதமும் சரியாக பராமரிக்கப்பட்டால்தான் காளான் உருவாகும் — இதில் தவறினால்தான் எதிர்பார்த்த மகசூல் கிடைக்காமல் போகும்.',
      beginnerTip: 'அவ்வப்போது நனைப்பதை விட, லேசாக தொடர்ந்து தெளிக்கவும் — மொத்த நீரை விட, சீரான ஈரப்பதமே முக்கியம்.',
      warningSign: 'ஓரங்கள் உலர்ந்து சுருண்டால் ஈரப்பதம் மிகவும் குறைந்துவிட்டது — ஒவ்வொரு முறையும் அதிகமாக தெளிப்பதை விட, அடிக்கடி தெளிக்கவும்.',
      items: [
        { ta: 'ஈரப்பதம் பராமரிப்பு தெளிப்பு' },
      ],
    },
  },

  Pruning: {
    en: {
      why: 'Removing the right growth at the right time redirects the plant\'s energy into branching and yield instead of unproductive height.',
      beginnerTip: 'Use a clean, sharp blade — a ragged cut heals slower and is more likely to let in disease than a clean one.',
      warningSign: "Heavy sap or wilting beyond the cut point within a day or two can mean the cut was too aggressive — prune lighter next round.",
      items: [
        { en: 'Pruning tools / labour' },
      ],
    },
    ta: {
      why: 'சரியான நேரத்தில் சரியான வளர்ச்சியை நீக்குவது செடியின் ஆற்றலை, பயனற்ற உயரத்திற்குப் பதிலாக, கிளைவிடுதலிலும் மகசூலிலும் செலுத்தும்.',
      beginnerTip: 'சுத்தமான, கூர்மையான கத்தியைப் பயன்படுத்துங்கள் — கூர் குறைந்த வெட்டு மெதுவாக ஆறும், நோய் தாக்கும் வாய்ப்பும் அதிகம்.',
      warningSign: 'வெட்டிய ஓரிரு நாட்களுக்குள் அதிக பிசின் வடிதல் அல்லது அதற்கு அப்பால் வாடுதல் தென்பட்டால் வெட்டு அதிகமாக இருந்திருக்கலாம் — அடுத்த முறை குறைவாக வெட்டுங்கள்.',
      items: [
        { ta: 'கவாத்து கருவிகள் / ஆள் உழைப்பு' },
      ],
    },
  },
};

// Water-info gaps (method / criticalStages / warning) for basic-guide crops, by water-need tier.
export const WATER_TIER_EXTRA = {
  low: {
    en: {
      method: 'Furrow irrigation or light hand-watering is usually enough — this crop does not need elaborate irrigation infrastructure.',
      criticalStages: 'Establishment just after sowing/transplanting — a dry spell here is the main risk; once established the crop tolerates gaps well.',
      warning: 'Overwatering is the bigger risk for a low-water crop — waterlogging can do more damage here than a missed watering.',
    },
    ta: {
      method: 'வாய்க்கால் பாசனம் அல்லது லேசான கை-நீர்ப்பாசனமே பொதுவாகப் போதும் — இந்தப் பயிருக்கு விரிவான பாசன வசதி தேவையில்லை.',
      criticalStages: 'விதைப்பு / நடவுக்குப் பிறகு வேரூன்றும் கட்டமே முக்கியம் — அப்போது வறட்சி இருந்தால்தான் முக்கிய ஆபத்து; வேரூன்றியபின் இடைவெளிகளை இப்பயிர் தாங்கிக்கொள்ளும்.',
      warning: 'குறைந்த நீர்த் தேவை உள்ள பயிருக்கு அதிக நீர் பாய்ச்சுவதே பெரிய ஆபத்து — நீர் தேங்குவது, நீர் பாய்ச்சத் தவறியதை விட அதிக சேதம் தரும்.',
    },
  },
  medium: {
    en: {
      method: 'Furrow or drip irrigation between rows works well; avoid wetting the leaves/flowers directly where possible to reduce fungal risk.',
      criticalStages: 'Flowering and early fruit/pod formation — a dry spell during this window has the biggest impact on final yield.',
      warning: "Don't let watering become irregular right around flowering — inconsistent moisture here is a common cause of flower or fruit drop.",
    },
    ta: {
      method: 'வரிசைகளுக்கு இடையே வாய்க்கால் அல்லது சொட்டுநீர்ப் பாசனம் நன்றாக வேலை செய்யும்; பூஞ்சை அபாயத்தைக் குறைக்க இலை/பூக்களை நேரடியாக நனைக்காமல் பார்த்துக் கொள்ளுங்கள்.',
      criticalStages: 'பூக்கும் நேரமும் ஆரம்பக் காய்/குரு உருவாகும் கட்டமும் முக்கியம் — இந்த நேரத்தில் வறட்சி ஏற்பட்டால் இறுதி மகசூலில் பெரிய தாக்கம் ஏற்படும்.',
      warning: 'பூக்கும் நேரத்தில் நீர்ப்பாசனம் ஒழுங்கற்றதாக ஆகக் கூடாது — இந்த நேரத்தில் ஈரப்பதம் மாறிமாறி இருப்பது பூ/காய் உதிர்வதற்கு பொதுவான காரணம்.',
    },
  },
  high: {
    en: {
      method: 'Needs reliable, frequent irrigation — drip or well-managed furrow irrigation is strongly preferred over relying on rainfall alone.',
      criticalStages: 'Almost the entire growing cycle is water-sensitive for this crop — plan for consistent access before committing land to it.',
      warning: 'A missed watering cycle affects this crop faster than most — have a backup watering plan (borewell, tank) before relying on it as your main crop.',
    },
    ta: {
      method: 'நம்பகமான, அடிக்கடி பாசனம் தேவை — மழையை மட்டும் நம்பாமல் சொட்டுநீர் அல்லது நன்கு நிர்வகிக்கப்பட்ட வாய்க்கால் பாசனமே சிறந்தது.',
      criticalStages: 'இப்பயிரின் கிட்டத்தட்ட முழு வளர்ச்சிக் காலமும் நீருக்கு உணர்திறன் உடையது — நிலத்தை இதற்கு ஒதுக்கும் முன் சீரான நீர் வசதியைத் திட்டமிடுங்கள்.',
      warning: 'ஒரு நீர்ப்பாசனச் சுழற்சியைத் தவறவிட்டாலும் இப்பயிர் மற்றவற்றை விட வேகமாக பாதிக்கப்படும் — இதை முதன்மைப் பயிராகக் கொள்வதற்கு முன் மாற்று நீர் ஏற்பாடு (ஆழ்துளைக் கிணறு, தொட்டி) வைத்திருங்கள்.',
    },
  },
};
