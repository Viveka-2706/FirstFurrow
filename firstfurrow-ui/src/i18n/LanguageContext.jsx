import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './useLang';
import { strings } from './strings';
import { seasonsTa, budgetTa, cropsTa } from './content.ta';
import { useReference } from '../data/useReference';

const LANG_KEY = 'ff_lang';

function initialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'en' || saved === 'ta') return saved;
  } catch { /* ignore */ }
  return 'en';
}

export function LanguageProvider({ children }) {
  const { soilsTa, regionsTa } = useReference(); // Tamil soil/district names come from the database
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l === 'ta' ? 'ta' : 'en'), []);

  const t = useCallback(
    (key, vars) => {
      const raw = strings[lang][key] ?? strings.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
    },
    [lang]
  );

  const value = useMemo(() => {
    const isTa = lang === 'ta';

    const localizeCost = (cost) =>
      isTa ? cost.replace(' per session', strings.ta['cost.perSession']) : cost;

    // Returns the crop with all human-readable text swapped to the active language.
    // Numbers / ids / colours are untouched, so cost maths and stage matching keep working.
    const crop = (c) => {
      if (!c) return c;
      const overlay = isTa ? c.ta ?? cropsTa[c.id] : null; // API crops carry their own Tamil
      return {
        ...c,
        ...(overlay ? { name: overlay.name, localName: overlay.localName, tagline: overlay.tagline, blurb: overlay.blurb } : {}),
        water: overlay ? { ...c.water, ...overlay.water } : c.water,
        guide: c.guide.map((s, i) => {
          const o = overlay?.guide?.[i];
          return {
            ...s,
            ...(o
              ? { stage: o.stage, dayRange: o.dayRange, whatToDo: o.whatToDo, why: o.why, beginnerTip: o.beginnerTip, warningSign: o.warningSign }
              : {}),
            stageId: s.stageId ?? s.stage, // original English name — used for icons
            costItems: (s.costItems || []).map((ci, j) => ({
              item: o?.costItems?.[j] ?? ci.item,
              cost: localizeCost(ci.cost),
            })),
          };
        }),
      };
    };

    const soil = (s) => (isTa && soilsTa[s.id] ? { ...s, ...soilsTa[s.id] } : s);
    const soilName = (id, fallback) => (isTa && soilsTa[id] ? soilsTa[id].name : fallback);
    const region = (r) => (isTa ? regionsTa[r] || r : r);
    const season = (s) => (isTa ? seasonsTa[s] || s : s);
    const budget = (b) => (isTa && budgetTa[b.id] ? { ...b, ...budgetTa[b.id] } : b);

    return {
      lang,
      setLang,
      t,
      locale: isTa ? 'ta-IN' : 'en-IN',
      speechLang: isTa ? 'ta-IN' : 'en-IN',
      crop,
      soil,
      soilName,
      region,
      season,
      budget,
    };
  }, [lang, setLang, t, soilsTa, regionsTa]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
