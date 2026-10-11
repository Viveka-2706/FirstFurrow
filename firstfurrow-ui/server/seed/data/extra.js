// Everything the crop dataset does NOT contain, kept in one reviewable place.
//
// ⚠ REVIEW BEFORE PRESENTING
//   • `soils`  — the dataset has no soil data, so these soil suitabilities are general
//                agronomy knowledge assigned by the developer, not survey data.
//   • Tamil    — all Tamil text below was written by the developer; have a Tamil speaker check it.

export const ALL_SOILS = ['red', 'black', 'alluvial', 'laterite', 'sandy_coastal', 'clay_loam'];

// dataset id → our slug + naming + soils
// (okra / spinach / marigold already have soils in their hand-written guides, so they are not repeated here)
export const CROP_EXTRA = {
  crop_001: { slug: 'tomato', name: 'Tomato', localName: 'Thakkali', taTamil: 'தக்காளி', soils: ['red', 'alluvial', 'clay_loam'] },
  crop_002: { slug: 'okra' },
  crop_003: { slug: 'green_chilli', name: 'Green Chilli', localName: 'Pachai Milagai', taTamil: 'பச்சை மிளகாய்', soils: ['red', 'black', 'alluvial'] },
  crop_004: { slug: 'brinjal', name: 'Brinjal', localName: 'Kathirikkai', taTamil: 'கத்தரிக்காய்', soils: ['red', 'black', 'alluvial', 'clay_loam'] },
  crop_005: { slug: 'spinach' },
  crop_006: { slug: 'coriander', name: 'Coriander', localName: 'Kothamalli', taTamil: 'கொத்தமல்லி', soils: ['red', 'black', 'alluvial'] },
  crop_007: { slug: 'cucumber', name: 'Cucumber', localName: 'Vellarikkai', taTamil: 'வெள்ளரிக்காய்', soils: ['red', 'alluvial', 'laterite', 'sandy_coastal'] },
  crop_008: { slug: 'bitter_gourd', name: 'Bitter Gourd', localName: 'Pavakkai', taTamil: 'பாகற்காய்', soils: ['red', 'alluvial', 'laterite', 'sandy_coastal'] },
  crop_009: { slug: 'radish', name: 'Radish', localName: 'Mullangi', taTamil: 'முள்ளங்கி', soils: ['red', 'alluvial', 'laterite', 'sandy_coastal'] },
  crop_010: { slug: 'cluster_beans', name: 'Cluster Beans', localName: 'Kothavarangai', taTamil: 'கொத்தவரங்காய்', soils: ['red', 'black', 'alluvial', 'sandy_coastal'] },
  crop_011: { slug: 'onion', name: 'Onion', localName: 'Vengayam', taTamil: 'வெங்காயம்', soils: ['red', 'alluvial', 'clay_loam'] },
  crop_012: { slug: 'garlic', name: 'Garlic', localName: 'Poondu', taTamil: 'பூண்டு', soils: ['red', 'alluvial', 'laterite'] },
  crop_013: { slug: 'groundnut', name: 'Groundnut', localName: 'Nilakadalai', taTamil: 'நிலக்கடலை', soils: ['red', 'laterite', 'sandy_coastal'] },
  crop_014: { slug: 'sweet_corn', name: 'Sweet Corn', localName: 'Makka Cholam', taTamil: 'மக்காச்சோளம்', soils: ['red', 'black', 'alluvial', 'clay_loam'] },
  // grown indoors on straw/bags, so the field soil does not matter
  crop_015: { slug: 'oyster_mushroom', name: 'Oyster Mushroom', localName: 'Sippi Kalan', taTamil: 'சிப்பிக் காளான்', soils: ALL_SOILS, perUnit: true },
  crop_016: { slug: 'muskmelon', name: 'Muskmelon', localName: 'Mulampazham', taTamil: 'முலாம்பழம்', soils: ['red', 'alluvial', 'sandy_coastal'] },
  crop_017: { slug: 'moringa', name: 'Moringa', localName: 'Murungai', taTamil: 'முருங்கை', soils: ['red', 'alluvial', 'laterite', 'sandy_coastal'] },
  crop_018: { slug: 'marigold' },
};

// Card/accent colours for crops that do not have a hand-picked one
export const PALETTE = ['#9acb6b', '#6fa347', '#e7a93e', '#e9b872', '#8fc1a9', '#d9a066'];

// ---- user-facing text rewritten from the dataset's developer-style notes ----
export const NOTE_OVERRIDES = {
  crop_015: 'Indoor / controlled setup that needs almost no land. Note: the figures for this crop are per setup, not per acre.',
};

export const NOTE_TA = {
  crop_001: 'வேகமாக வளரும், அதிகத் தேவை உள்ளது; ஆனால் வரத்து அதிகமாகும்போது விலை ஏறி இறங்கும்.',
  crop_003: 'உள்நாட்டில் வலுவான தேவை; பறிப்புக்கு மிதமான ஆள் உழைப்பு தேவை.',
  crop_004: 'உறுதியான, தவறுகளைப் பொறுக்கும் பயிர்; உள்ளூர்ச் சந்தையில் நிலையான தேவை.',
  crop_006: 'மிகக் குறைந்த முதலீடு, நிலையான தேவை; சிறிய நிலங்களுக்கு ஏற்றது.',
  crop_007: 'வேகமான வளர்ச்சி; கோடையில் நல்ல தேவை.',
  crop_008: 'பந்தல் தேவை, உழைப்பு சற்று அதிகம்; நகர்ப்புறத்தில் நிலையான தேவை.',
  crop_009: 'குறுகிய காலப் பயிர்; குறைந்த பராமரிப்பே போதும்.',
  crop_010: 'வறட்சியைத் தாங்கும், குறைந்த நீர்த் தேவை; வறண்ட பகுதிகளுக்கு ஏற்றது.',
  crop_011: 'நம்பகமான அன்றாடத் தேவை; நாடு முழுவதும் வரத்தைப் பொறுத்து விலை மாறும்.',
  crop_012: 'அதிக மதிப்புள்ள பயிர்; வேர் பிடித்தபின் குறைந்த நீர் போதும்; நீண்ட காலப் பயிர்.',
  crop_013: 'வறட்சியைத் தாங்கும்; நிலையான ஆனால் மிதமான வருமானம்; மண்ணின் நைட்ரஜனை அதிகரிக்கும்.',
  crop_014: 'குறைந்த அபாயமுள்ள முக்கிய உணவுப் பயிர்; ஸ்வீட் கார்ன் ரகத்துக்கு நகர்ப்புறத்தில் நல்ல விலை.',
  crop_015: 'நிலம் தேவையில்லாத உள்ளரங்கு / கட்டுப்படுத்தப்பட்ட அமைப்பு. குறிப்பு: இப்பயிரின் எண்கள் ஒரு ஏக்கருக்கு அல்ல, ஒரு அமைப்புக்கானவை.',
  crop_016: 'கோடைப் பழம், நகரச் சந்தைகளில் வேகமாக விற்கும்; வேர் பிடித்தபின் குறைந்த நீர் போதும்.',
  crop_017: 'முதல் அறுவடைக்குப் பின் பல ஆண்டுப் பயிர்; குறைந்த நீர்த் தேவை; ஊடுபயிராகவும் ஏற்றது. முதல் சுழற்சி நீண்டது; பின்வரும் அறுவடைகள் மிக விரைவு.',
};

export const CATEGORY_TA = {
  Vegetable: 'காய்கறிப் பயிர்',
  'Leafy Green': 'கீரைப் பயிர்',
  Herb: 'மணமூட்டும் கீரை',
  'Root Vegetable': 'கிழங்கு வகைக் காய்கறி',
  Oilseed: 'எண்ணெய் வித்துப் பயிர்',
  Cereal: 'தானியப் பயிர்',
  Specialty: 'சிறப்புப் பயிர்',
  Fruit: 'பழப் பயிர்',
  'Tree Crop': 'மரப் பயிர்',
  Flower: 'மலர்ப் பயிர்',
};

// ---- stage names ----
export const TASKTYPE_TA = {
  'Land Preparation': 'நிலம் தயாரித்தல்',
  Sowing: 'விதைப்பு',
  'Sowing/Transplanting': 'விதைப்பு / நடவு',
  Fertilizing: 'உரமிடுதல்',
  Irrigation: 'பாசனம்',
  'Pest Check': 'பூச்சி கண்காணிப்பு',
  Harvest: 'அறுவடை',
  Setup: 'அமைப்பு தயாரிப்பு',
  Spawning: 'காளான் விதை இடுதல்',
  Incubation: 'அடைகாத்தல்',
  'Fruiting Care': 'காளான் உருவாக்கப் பராமரிப்பு',
  Pruning: 'கவாத்து',
};

// ---- water-need wording (from the dataset's referenceScales) ----
export const WATER_LEVEL_TA = {
  'Can rely mostly on rainfall + occasional irrigation': 'பெரும்பாலும் மழையே போதும், அவ்வப்போது பாசனம் தேவை',
  'Needs consistent irrigation access (well/borewell/canal)': 'கிணறு / ஆழ்துளைக் கிணறு / கால்வாய் மூலம் சீரான பாசன வசதி தேவை',
  'Needs reliable, frequent irrigation infrastructure': 'நம்பகமான, அடிக்கடி பாசன வசதி தேவை',
};
export const WATER_FREQ_FALLBACK = {
  low: { en: 'Low water need', ta: 'குறைந்த நீர்த் தேவை' },
  medium: { en: 'Medium water need', ta: 'மிதமான நீர்த் தேவை' },
  high: { en: 'High water need', ta: 'அதிக நீர்த் தேவை' },
};

// ---- task descriptions (every distinct description in the 15 basic-guide crops) ----
export const DESC_TA = {
  'Apply basal fertilizer dose': 'அடியுரத்தை இடுங்கள்',
  'Basal dose application': 'அடியுரம் இடுதல்',
  'Basal fertilizer application': 'அடியுரம் இடுதல்',
  'Basal fertilizer dose': 'அடியுரத் தவணை இடுங்கள்',
  'Begin drip/furrow irrigation': 'சொட்டுநீர் / வாய்க்கால் பாசனத்தைத் தொடங்குங்கள்',
  'Begin first harvest, continue picking every 4-5 days': 'முதல் அறுவடையைத் தொடங்கி, ஒவ்வொரு 4–5 நாளுக்கும் தொடர்ந்து பறியுங்கள்',
  'Begin harvest every 3-4 days': 'ஒவ்வொரு 3–4 நாளுக்கும் அறுவடையைத் தொடங்குங்கள்',
  'Begin harvest, pick every 5-7 days': 'அறுவடையைத் தொடங்கி, ஒவ்வொரு 5–7 நாளுக்கும் பறியுங்கள்',
  'Begin irrigation': 'பாசனத்தைத் தொடங்குங்கள்',
  'Begin irrigation cycle': 'பாசனச் சுழற்சியைத் தொடங்குங்கள்',
  'Begin picking every 2-3 days': 'ஒவ்வொரு 2–3 நாளுக்கும் பறிக்கத் தொடங்குங்கள்',
  'Begin pod harvest': 'காய் அறுவடையைத் தொடங்குங்கள்',
  'Begin regular irrigation': 'வழக்கமான பாசனத்தைத் தொடங்குங்கள்',
  'Begin regular irrigation cycle (every 5-7 days)': 'வழக்கமான பாசனச் சுழற்சியைத் தொடங்குங்கள் (ஒவ்வொரு 5–7 நாளுக்கும்)',
  'Broadcast seed sowing': 'விதையைத் தூவி விதையுங்கள்',
  'Bulb development dose': 'குமிழ் வளர்ச்சிக் கட்ட உரத் தவணை',
  'Bulb development top dressing': 'குமிழ் வளர்ச்சிக் கட்டத்தில் மேலுரம் இடுங்கள்',
  'Cut and bundle for market': 'அறுத்து, சந்தைக்காகக் கட்டுகளாகக் கட்டுங்கள்',
  'Deep ploughing, well-drained beds': 'ஆழமாக உழுது, நீர் நன்கு வடியும் பாத்திகளை அமையுங்கள்',
  'Deep tilth for root development': 'வேர் வளர்ச்சிக்காக ஆழமாக உழுது மண்ணைப் பொலபொலப்பாக்குங்கள்',
  'Direct seed sowing': 'விதையை நேரடியாக விதையுங்கள்',
  'Establish regular light irrigation': 'இலேசான பாசனத்தை வழக்கமாக்குங்கள்',
  'Fine tilth preparation': 'மண்ணை நுண்ணிய பதத்துக்குத் தயார் செய்யுங்கள்',
  'First flush harvest, 2-3 flushes possible': 'முதல் சுற்று அறுவடை; 2–3 சுற்றுகள் சாத்தியம்',
  'First irrigation if dry spell': 'வறண்ட வானிலை இருந்தால் முதல் பாசனம் செய்யுங்கள்',
  'First irrigation if no rain': 'மழை இல்லையெனில் முதல் பாசனம் செய்யுங்கள்',
  'First picking, continue every 10-15 days': 'முதல் பறிப்பு; பிறகு ஒவ்வொரு 10–15 நாளுக்கும் தொடருங்கள்',
  'First pod harvest; subsequent harvests every 45-60 days': 'முதல் காய் அறுவடை; அடுத்த அறுவடைகள் ஒவ்வொரு 45–60 நாளுக்கும்',
  'First top dressing': 'முதல் மேலுரம்',
  'Growth-stage fertilizing': 'வளர்ச்சிக் கட்டத்தில் உரமிடுங்கள்',
  'Gypsum application at flowering': 'பூக்கும் நேரத்தில் ஜிப்சம் இடுங்கள்',
  'Harvest cobs': 'சோளக் கதிர்களை அறுவடை செய்யுங்கள்',
  'Harvest ripe fruits': 'பழுத்த பழங்களை அறுவடை செய்யுங்கள்',
  'Inoculate spawn into substrate': 'காளான் விதையை (ஸ்பான்) வளர்ப்பு ஊடகத்தில் கலந்து இடுங்கள்',
  'Light frequent irrigation': 'இலேசாக, அடிக்கடி பாசனம் செய்யுங்கள்',
  'Light irrigation': 'இலேசான பாசனம் செய்யுங்கள்',
  'Light irrigation cycle': 'இலேசான பாசனச் சுழற்சி',
  'Line sowing': 'வரிசையில் விதையுங்கள்',
  'Maintain dark, humid incubation conditions': 'இருட்டான, ஈரப்பதமான அடைகாக்கும் சூழலைப் பராமரியுங்கள்',
  'Monitor for fruit borer / whitefly': 'காய்த்துளைப்பான் / வெள்ளை ஈ உள்ளதா எனக் கவனியுங்கள்',
  'Monitor for shoot/fruit borer': 'தண்டு / காய்த்துளைப்பான் உள்ளதா எனக் கவனியுங்கள்',
  'Move to light, maintain humidity for pinning': 'வெளிச்சம் உள்ள இடத்துக்கு மாற்றி, காளான் மொட்டுகள் உருவாக ஈரப்பதத்தைப் பராமரியுங்கள்',
  'Pit preparation and planting': 'குழி எடுத்து நடவு செய்யுங்கள்',
  'Plant cloves': 'பூண்டுப் பற்களை நடுங்கள்',
  'Plant seeds/saplings': 'விதைகள் / கன்றுகளை நடுங்கள்',
  'Plough and prepare field': 'வயலை உழுது தயார் செய்யுங்கள்',
  'Plough and prepare raised beds': 'உழுது மேட்டுப்பாத்திகளைத் தயார் செய்யுங்கள்',
  'Plough field': 'வயலை உழுங்கள்',
  'Prepare beds and set up trellis': 'பாத்திகளைத் தயாரித்து பந்தல் (படர்ப்புக் கட்டமைப்பு) அமையுங்கள்',
  'Prepare beds, apply farmyard manure': 'பாத்திகளைத் தயாரித்து தொழுவுரம் இடுங்கள்',
  'Prepare growing shed and substrate bags': 'வளர்ப்புக் கொட்டகையையும் வளர்ப்பு ஊடகப் பைகளையும் தயார் செய்யுங்கள்',
  'Prepare raised beds': 'மேட்டுப்பாத்திகளைத் தயார் செய்யுங்கள்',
  'Prepare raised beds/mounds': 'மேட்டுப்பாத்திகள் / மேடுகளைத் தயார் செய்யுங்கள்',
  'Prepare raised mounds': 'மேடுகளைத் தயார் செய்யுங்கள்',
  'Prepare raised nursery beds': 'நாற்றங்காலுக்கான மேட்டுப்பாத்திகளைத் தயார் செய்யுங்கள்',
  'Prune for branching and pod yield': 'கிளைகள் பெருகவும் காய் மகசூல் கூடவும் கவாத்து செய்யுங்கள்',
  'Pull and bundle roots': 'கிழங்குகளைப் பிடுங்கிக் கட்டுகளாகக் கட்டுங்கள்',
  'Regular irrigation begins': 'வழக்கமான பாசனம் தொடங்குகிறது',
  'Regular irrigation cycle': 'வழக்கமான பாசனச் சுழற்சி',
  'Regular irrigation cycle begins': 'வழக்கமான பாசனச் சுழற்சி தொடங்குகிறது',
  'Second top dressing': 'இரண்டாம் மேலுரம்',
  'Top dressing': 'மேலுரம் இடுங்கள்',
  'Top dressing at flowering': 'பூக்கும் நேரத்தில் மேலுரம் இடுங்கள்',
  'Top dressing at flowering stage': 'பூக்கும் கட்டத்தில் மேலுரம் இடுங்கள்',
  'Top dressing at vine stage': 'கொடி வளரும் கட்டத்தில் மேலுரம் இடுங்கள்',
  'Transplant nursery-raised seedlings': 'நாற்றங்காலில் வளர்த்த நாற்றுகளை நடுங்கள்',
  'Transplant seedlings': 'நாற்றுகளை நடுங்கள்',
  'Transplant seedlings from nursery': 'நாற்றங்காலிலிருந்து நாற்றுகளைப் பிடுங்கி நடுங்கள்',
  'Transplant seedlings to main field': 'நாற்றுகளை முக்கிய வயலில் நடுங்கள்',
  'Uproot and cure bulbs': 'குமிழ்களைப் பிடுங்கி, உலர்த்திப் பக்குவப்படுத்துங்கள்',
  'Uproot and dry pods': 'செடிகளைப் பிடுங்கி, காய்களை உலர்த்துங்கள்',
};
