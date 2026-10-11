import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './StageNav.css';

const ICONS = {
  'Land Preparation': '🚜',
  'Nursery Preparation': '🏡',
  Sowing: '🌱',
  Transplanting: '🪴',
  'First Irrigation & Establishment': '💧',
  'Establishment Irrigation': '💧',
  'Regular Light Irrigation': '💧',
  'Fertilizing (Top Dressing)': '🌿',
  'Light Fertilizing': '🌿',
  'Pest & Disease Check': '🐛',
  Harvest: '🌾',
  'Sowing/Transplanting': '🌱',
  Fertilizing: '🌿',
  Irrigation: '💧',
  'Pest Check': '🐛',
  Setup: '🏠',
  Spawning: '🍄',
  Incubation: '🌡️',
  'Fruiting Care': '🍄',
  Pruning: '✂️',
};
// accepts either an English stage name or a (possibly translated) stage object
export const iconFor = (stage) => ICONS[typeof stage === 'string' ? stage : stage?.stageId ?? stage?.stage] || '🪴';

export default function StageNav({ crop, stageStatus, unlockedIndex, active, onSelect }) {
  const { t } = useLang();
  const doneCount = stageStatus.filter(Boolean).length;
  const pct = crop.guide.length > 1 ? (unlockedIndex / (crop.guide.length - 1)) * 100 : 0;

  return (
    <div className="stage-rail">
      <div className="stage-rail-line" />
      <motion.div
        className="stage-rail-line-fill"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="stage-rail-nodes">
        {crop.guide.map((s, i) => {
          const done = stageStatus[i];
          const locked = i > unlockedIndex;
          const isActive = i === active;
          return (
            <motion.button
              key={s.stage}
              className={`stage-rail-node ${done ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}
              onClick={() => !locked && onSelect(i)}
              disabled={locked}
              title={locked ? t('stage.locked') : s.stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 18 }}
              whileHover={!locked ? { scale: 1.08 } : {}}
              whileTap={!locked ? { scale: 0.94 } : {}}
            >
              <span className="stage-rail-icon">{done ? '✓' : locked ? '🔒' : iconFor(s)}</span>
              <span className="stage-rail-label">{s.stage}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
