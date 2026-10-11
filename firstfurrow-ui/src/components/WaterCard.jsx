import { useLang } from '../i18n/useLang';
import './WaterCard.css';

export default function WaterCard({ water }) {
  const { t } = useLang();
  return (
    <div className="water-card">
      <span className="water-card-title">{t('water.title')}</span>
      <Row label={t('water.needed')} value={water.totalSeasonWater} />
      <Row label={t('water.method')} value={water.method} />
      <Row label={t('water.frequency')} value={water.frequency} />
      <Row label={t('water.critical')} value={water.criticalStages} accent />
      {water.warning && <p className="water-card-warning">⚠ {water.warning}</p>}
    </div>
  );
}

function Row({ label, value, accent }) {
  if (!value) return null; // not every crop has every piece of irrigation advice
  return (
    <div className="water-card-row">
      <span className="water-card-label">{label}</span>
      <span className={`water-card-value ${accent ? 'is-accent' : ''}`}>{value}</span>
    </div>
  );
}
