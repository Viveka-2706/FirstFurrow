import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './HarvestCountdown.css';

export default function HarvestCountdown({ plan }) {
  const { t } = useLang();
  const start = new Date(plan.startDate);
  const harvestDate = new Date(start.getTime() + plan.crop.durationDays * 86400000);
  const today = new Date();
  const msLeft = harvestDate.setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil(msLeft / 86400000);
  const daysElapsed = plan.crop.durationDays - daysLeft;
  const pct = Math.min(100, Math.max(0, (daysElapsed / plan.crop.durationDays) * 100));

  return (
    <div className="harvest-countdown">
      <div className="harvest-countdown-ring">
        <svg viewBox="0 0 60 60" width="56" height="56">
          <circle cx="30" cy="30" r="26" stroke="rgba(246,242,231,0.2)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="30" cy="30" r="26"
            stroke="#e7a93e" strokeWidth="6" fill="none"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 26}
            initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 26 * (1 - pct / 100) }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            transform="rotate(-90 30 30)"
          />
        </svg>
        <span className="harvest-countdown-emoji">🌾</span>
      </div>
      <div className="harvest-countdown-body">
        <span className="harvest-countdown-number">
          {daysLeft > 0 ? daysLeft : 0}
        </span>
        <span className="harvest-countdown-label">
          {daysLeft > 0 ? t('harvest.daysLeft') : t('harvest.arrived')}
        </span>
      </div>
    </div>
  );
}
