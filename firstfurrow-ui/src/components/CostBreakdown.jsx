import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './CostBreakdown.css';

export default function CostBreakdown({ crop }) {
  const { t } = useLang();
  const maxScale = crop.returnMax * 1.1;
  const investPct = (crop.investment / maxScale) * 100;
  const returnMinPct = (crop.returnMin / maxScale) * 100;
  const returnMaxPct = (crop.returnMax / maxScale) * 100;

  return (
    <div className="cost-card">
      <h3 className="cost-title">{t('cost.title')}</h3>
      <p className="cost-sub">{t('cost.sub')}</p>

      <div className="cost-bars">
        <div className="cost-row">
          <div className="cost-row-top">
            <span className="cost-row-label">{t('cost.invest')}</span>
            <span className="cost-row-value">₹{crop.investment.toLocaleString('en-IN')}</span>
          </div>
          <div className="cost-track">
            <motion.div
              className="cost-fill cost-fill-invest"
              initial={{ width: 0 }}
              animate={{ width: `${investPct}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <div className="cost-row">
          <div className="cost-row-top">
            <span className="cost-row-label">{t('cost.return')}</span>
            <span className="cost-row-value">
              ₹{crop.returnMin.toLocaleString('en-IN')}–{crop.returnMax.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="cost-track">
            <motion.div
              className="cost-fill cost-fill-return"
              initial={{ width: 0 }}
              animate={{ width: `${returnMinPct}%` }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              className="cost-fill cost-fill-return-max"
              initial={{ width: `${returnMinPct}%` }}
              animate={{ width: `${returnMaxPct}%` }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      <div className="cost-multiple">
        <span className="cost-multiple-number">
          {(crop.returnMin / crop.investment).toFixed(1)}×–{(crop.returnMax / crop.investment).toFixed(1)}×
        </span>
        <span className="cost-multiple-label">{t('cost.multiple')}</span>
      </div>
    </div>
  );
}
