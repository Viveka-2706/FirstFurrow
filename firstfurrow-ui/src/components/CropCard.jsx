import { motion } from 'framer-motion';
import { useReference } from '../data/useReference';
import { useLang } from '../i18n/useLang';
import './CropCard.css';

export default function CropCard({ crop: rawCrop, onChoose, index, selectedSoil }) {
  const { t, crop: loc, soilName } = useLang();
  const { soilTypes } = useReference();
  const crop = loc(rawCrop);
  const soilMatch = selectedSoil && crop.suitableSoils.includes(selectedSoil);
  const suitableSoilNames = crop.suitableSoils
    .map((id) => soilName(id, soilTypes.find((s) => s.id === id)?.name))
    .filter(Boolean)
    .join(', ');

  const multiplier = ((crop.returnMin + crop.returnMax) / (2 * (crop.investment || 1))).toFixed(1);
  const rankLabel = index === 0 ? '#1 Top Match' : index === 1 ? '#2 High Return' : '#3 Balanced';

  return (
    <motion.div
      className={`seed-packet ${index === 0 ? 'is-top-pick' : ''}`}
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8, boxShadow: '0 16px 36px rgba(26,20,16,0.12)' }}
    >
      {/* Top Banner with Crop Color & Match Score */}
      <div className="packet-header" style={{ background: crop.color }}>
        <div className="packet-header-top">
          <span className="packet-rank-tag">{rankLabel}</span>
          <span className="packet-match">
            <span className="match-dot" />
            {t('crop.match', { n: crop.match })}
          </span>
        </div>

        <div className="packet-title-wrap">
          <PlantGlyph />
          <div className="packet-name">
            <h3 className="packet-crop-title">{crop.localName}</h3>
            <span className="packet-crop-sub">{crop.name}</span>
          </div>
        </div>
      </div>

      <div className="packet-body">
        <p className="packet-tagline">"{crop.tagline}"</p>
        <p className="packet-blurb">{crop.blurb}</p>

        {/* Soil Compatibility Tag */}
        <div className="packet-soil-tag">
          <span className={`soil-badge ${soilMatch ? 'is-match' : ''}`}>
            {soilMatch ? `✓ ${t('crop.suitsSoil')}` : t('crop.bestIn', { soils: suitableSoilNames })}
          </span>
        </div>

        {/* Agronomic Specifications Grid */}
        <div className="packet-stats">
          <Stat label={t('crop.investment')} value={`₹${crop.investment.toLocaleString('en-IN')}`} />
          <Stat label={t('crop.duration')} value={`${crop.durationDays} ${t('days')}`} />
          <Stat
            label={t('crop.risk')}
            value={t(`risk.${crop.risk}`)}
            riskClass={`risk-${(crop.risk || 'low').toLowerCase()}`}
          />
          <Stat label={t('res.multiLabel')} value={`${multiplier}x`} accent />
        </div>

        {/* Irrigation requirement */}
        <div className="packet-water-detail">
          <span className="water-icon">💧</span>
          <div className="water-text">
            <strong>{t('crop.waterNeed')}</strong> {[crop.water.totalSeasonWater, crop.water.method].filter(Boolean).join(' · ')}
          </div>
        </div>

        {/* Financial Return Forecast Card */}
        <div className="packet-return-box">
          <span className="packet-return-label">{t('crop.expectedReturn')}</span>
          <span className="packet-return-value">
            ₹{crop.returnMin.toLocaleString('en-IN')} – ₹{crop.returnMax.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Action Button */}
        <motion.button
          type="button"
          className="btn btn-primary packet-cta"
          onClick={() => onChoose(rawCrop)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          {t('crop.selectCta')} →
        </motion.button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, riskClass, accent }) {
  return (
    <div className={`stat ${accent ? 'is-stat-accent' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${riskClass || ''}`}>{value}</span>
    </div>
  );
}

function PlantGlyph() {
  return (
    <motion.svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      className="packet-glyph"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="17" cy="17" r="17" fill="rgba(255,255,255,0.3)" />
      <path d="M17 25V14" stroke="#1a1410" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M17 16c0-6-5-8-10-7 .5 5 4 8.5 10 7Z" fill="#1a1410" opacity="0.85" />
      <path d="M17 13c0-5 4-7 9-6-.5 4.5-4 7.5-9 6Z" fill="#1a1410" opacity="0.6" />
    </motion.svg>
  );
}
