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

  const { soil: fSoil, season: fSeason, budget: fBudget, land: fLand, region: fRegion } = form;
  const key = [fSoil, fSeason, fBudget, fLand, fRegion].join('|');
  const [result, setResult] = useState({ key: null, crops: [], offline: false });

  useEffect(() => {
    const controller = new AbortController();
    fetchRecommendations({ soil: fSoil, season: fSeason, budget: fBudget, land: fLand, region: fRegion }, controller.signal)
      .then((crops) => setResult({ key, crops, offline: false }))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setResult({ key, crops: builtInCrops, offline: true });
      });
    return () => controller.abort();
  }, [key, fSoil, fSeason, fBudget, fLand, fRegion]);

  const loading = result.key !== key;
  const crops = result.crops;

  return (
    <section className="results">
      <div className="results-inner">
        {/* Organization Advisory Masthead */}
        <motion.div
          className="results-masthead"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="masthead-badge">
            <span className="masthead-dot" />
            {t('res.orgBadge')}
          </div>
          <span className="masthead-ref">TNAU & ICAR Agronomic Benchmark Engine</span>
        </motion.div>

        {/* Header Block */}
        <motion.div
          className="results-header"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="results-params-chips">
            <span className="param-chip">🌍 {form.land.toFixed(2)} {t('acres')}</span>
            <span className="param-chip">🧱 {soilName}</span>
            <span className="param-chip">📍 {region(form.region)}</span>
            <span className="param-chip">🌦 {season(form.season)}</span>
          </div>

          <h1 className="results-title">{t('res.title')}</h1>
          <p className="results-sub">{t('res.sub')}</p>

          {result.offline && !loading && (
            <div className="results-offline-alert">
              <span>ℹ️</span> {t('res.offline')}
            </div>
          )}
        </motion.div>

        {/* Loading State with Shimmer */}
        {loading && (
          <div className="results-loading-box">
            <motion.div
              className="results-spinner"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            >
              🌱
            </motion.div>
            <p className="results-status">{t('res.loading')}</p>
          </div>
        )}

        {!loading && crops.length === 0 && (
          <div className="results-empty-box">
            <p className="results-status">{t('res.none')}</p>
          </div>
        )}

        {/* Recommendation Cards Grid */}
        <div className="results-grid">
          {!loading &&
            crops.map((crop, i) => (
              <CropCard
                key={crop.id}
                crop={crop}
                index={i}
                onChoose={onChoose}
                selectedSoil={form.soil}
                totalAcres={form.land}
              />
            ))}
        </div>

        {/* Adjust Parameters Action */}
        <motion.div
          className="results-footer-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button type="button" className="btn btn-ghost-dark results-back" onClick={onBack}>
            {t('res.adjust')}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
