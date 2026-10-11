import { motion } from 'framer-motion';
import './FurrowStepper.css';

export default function FurrowStepper({ steps, current }) {
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <div className="furrow-stepper">
      <div className="furrow-track">
        <div className="furrow-track-bg" />
        <motion.div
          className="furrow-track-fill"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        />
        <motion.div
          className="furrow-seed"
          animate={{ left: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
        >
          🌱
        </motion.div>
      </div>
      <div className="furrow-labels">
        {steps.map((s, i) => (
          <span key={s} className={`furrow-label ${i <= current ? 'is-planted' : ''} ${i === current ? 'is-current' : ''}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
