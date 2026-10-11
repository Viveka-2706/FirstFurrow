import { motion } from 'framer-motion';
import { cropDisplayName } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './TodaysFocus.css';

export default function TodaysFocus({ plans, onOpenPlan }) {
  const { t, crop: loc } = useLang();
  const items = plans
    .map((plan) => {
      const idx = plan.stageStatus.findIndex((s) => !s);
      if (idx === -1) return null;
      return { plan, crop: loc(plan.crop), stage: loc(plan.crop).guide[idx] };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  return (
    <motion.div
      className="focus-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <p className="eyebrow focus-eyebrow">{t('focus.eyebrow')}</p>
      <div className="focus-list">
        {items.map(({ plan, crop, stage }, i) => (
          <motion.button
            key={plan.id}
            className="focus-item"
            onClick={() => onOpenPlan(plan)}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            whileHover={{ x: 4 }}
          >
            <span className="focus-item-crop" style={{ background: plan.crop.color }}>{cropDisplayName(crop).slice(0, 1)}</span>
            <span className="focus-item-body">
              <span className="focus-item-title">{cropDisplayName(crop)}</span>
              <span className="focus-item-stage">{t('focus.nextUp', { stage: stage.stage, days: stage.dayRange })}</span>
            </span>
            <span className="focus-item-arrow">→</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
