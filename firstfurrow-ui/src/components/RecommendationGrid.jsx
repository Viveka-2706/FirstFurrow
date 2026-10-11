import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import CropCard from './CropCard';
import { crops as builtInCrops } from '../data/dummyData';
import { useReference } from '../data/useReference';
import { fetchRecommendations } from '../api/crops';
import { useLang } from '../i18n/useLang';
import './RecommendationGrid.css';

export default function RecommendationGrid({ form, onChoose, onBack }) {
  const { t, soilName: soilLabel, region, season } = useLang();
  const { soilTypes } = useReference();
  const soilName = soilLabel(form.soil, soilTypes.find((s) => s.id === form.soil)?.name);

  // results are tagged with the answers they were fetched for, so changing the answers shows "loading" again
  const { soil: fSoil, season: fSeason, budget: fBudget, land: fLand, region: fRegion } = form;
  const key = [fSoil, fSeason, fBudget, fLand, fRegion].join('|');
  const [result, setResult] = useState({ key: null, crops: [], offline: false });

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendations({ soil: fSoil, season: fSeason, budget: fBudget, land: fLand, region: fRegion }, controller.signal)
      .then((crops) => setResult({ key, crops, offline: false }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setResult({ key, crops: builtInCrops, offline: true }); // server unreachable → keep the app usable
      });
    return () => controller.abort();
  }, [key, fSoil, fSeason, fBudget, fLand, fRegion]);

  const loading = result.key !== key;
  const crops = result.crops;
  return (
    <section className="results">
      <div className="results-inner">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="eyebrow results-eyebrow">{t('res.basedOn', { land: form.land.toFixed(2), soil: soilName, region: region(form.region), season: season(form.season) })}</p>
          <h2 className="results-title">{t('res.title')}</h2>
          <p className="results-sub">
            {t('res.sub')}
          </p>
          {result.offline && !loading && <p className="results-note">{t('res.offline')}</p>}
        </motion.div>

        {loading && <p className="results-status">{t('res.loading')}</p>}
        {!loading && crops.length === 0 && <p className="results-status">{t('res.none')}</p>}

        <div className="results-grid">
          {!loading && crops.map((crop, i) => (
            <CropCard key={crop.id} crop={crop} index={i} onChoose={onChoose} selectedSoil={form.soil} />
          ))}
        </div>

        <button className="btn btn-ghost-dark results-back" onClick={onBack}>
          {t('res.adjust')}
        </button>
      </div>
    </section>
  );
}
