import { motion } from 'framer-motion';
import { useReference } from '../data/useReference';
import { useLang } from '../i18n/useLang';
import './CropCard.css';

export default function CropCard({ crop: rawCrop, onChoose, index, selectedSoil }) {
  const { t, crop: loc, soilName } = useLang();
  const { soilTypes } = useReference();
  const crop = loc(rawCrop); // translated copy for display; onChoose still gets the original
  const soilMatch = selectedSoil && crop.suitableSoils.includes(selectedSoil);
  const suitableSoilNames = crop.suitableSoils
    .map((id) => soilName(id, soilTypes.find((s) => s.id === id)?.name))
    .filter(Boolean)
    .join(', ');

  return (
    <motion.div
      className="seed-packet"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
    >
      <div className="packet-header" style={{ background: crop.color }}>
        <span className="packet-match">{t('crop.match', { n: crop.match })}</span>
        <PlantGlyph />
        <div className="packet-name">
          <h3>{crop.localName}</h3>
          <span>{crop.name}</span>
        </div>
      </div>

      <div className="packet-body">
        <p className="packet-tagline">"{crop.tagline}"</p>
        <p className="packet-blurb">{crop.blurb}</p>

        <div className="packet-soil-tag">
          <span className={`soil-badge ${soilMatch ? 'is-match' : ''}`}>
            {soilMatch ? t('crop.suitsSoil') : t('crop.bestIn', { soils: suitableSoilNames })}
          </span>
        </div>

        <div className="packet-stats">
          <Stat label={t('crop.investment')} value={`₹${crop.investment.toLocaleString('en-IN')}`} />
          <Stat label={t('crop.duration')} value={`${crop.durationDays} ${t('days')}`} />
          <Stat label={t('crop.risk')} value={t(`risk.${crop.risk}`)} />
          <Stat label={t('crop.watering')} value={(crop.water.frequency || '').split(';')[0] || '—'} />
        </div>

        <p className="packet-water-detail">
          <strong>{t('crop.waterNeed')}</strong> {[crop.water.totalSeasonWater, crop.water.method].filter(Boolean).join(' · ')}
        </p>

        <div className="packet-return">
          <span className="eyebrow">{t('crop.expectedReturn')}</span>
          <span className="packet-return-value">
            ₹{crop.returnMin.toLocaleString('en-IN')} – ₹{crop.returnMax.toLocaleString('en-IN')}
          </span>
        </div>

        <motion.button
          className="btn btn-dark packet-cta"
          onClick={() => onChoose(rawCrop)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {t('crop.build')}
        </motion.button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function PlantGlyph() {
  return (
    <motion.svg
      width="34" height="34" viewBox="0 0 34 34" fill="none" className="packet-glyph"
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <circle cx="17" cy="17" r="17" fill="rgba(255,255,255,0.25)" />
      <path d="M17 25V14" stroke="#1a1410" strokeWidth="2" strokeLinecap="round" />
      <path d="M17 16c0-6-5-8-10-7 .5 5 4 8.5 10 7Z" fill="#1a1410" opacity="0.85" />
      <path d="M17 13c0-5 4-7 9-6-.5 4.5-4 7.5-9 6Z" fill="#1a1410" opacity="0.6" />
    </motion.svg>
  );
}
