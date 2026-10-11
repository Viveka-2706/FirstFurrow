import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cropDisplayName } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './CompletionModal.css';

const CONFETTI_EMOJI = ['🌾', '🎉', '🌱', '✨', '🎊', '🌿', '🍃', '⭐'];

export default function CompletionModal({ plan, onSubmit }) {
  const { t, crop: loc } = useLang();
  const [profit, setProfit] = useState('');

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        emoji: CONFETTI_EMOJI[i % CONFETTI_EMOJI.length],
        left: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 2.5,
        size: 0.9 + Math.random() * 0.9,
        drift: Math.random() * 60 - 30,
      })),
    []
  );

  const submit = (e) => {
    e.preventDefault();
    onSubmit(profit === '' ? null : Number(profit));
  };

  return (
    <div className="completion-overlay">
      {/* Full-screen confetti rain */}
      <div className="confetti-field" aria-hidden="true">
        {confettiPieces.map((c) => (
          <motion.span
            key={c.id}
            className="confetti-fall"
            style={{ left: `${c.left}%`, fontSize: `${c.size}rem` }}
            initial={{ y: '-10vh', opacity: 0, rotate: 0 }}
            animate={{ y: '110vh', opacity: [0, 1, 1, 0], rotate: 360, x: [0, c.drift, 0] }}
            transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'linear' }}
          >
            {c.emoji}
          </motion.span>
        ))}
      </div>

      <AnimatePresence>
        <motion.div
          className="completion-card"
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="completion-band">
            <div className="completion-band-pattern" />
            <motion.div
              className="completion-badge"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.2 }}
            >
              <motion.span
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
              >
                🏆
              </motion.span>
            </motion.div>
          </div>

          <div className="completion-body">
            <p className="eyebrow completion-eyebrow">{t('done.eyebrow')}</p>
            <motion.h2
              className="completion-title"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.35 }}
            >
              {t('done.title')}
            </motion.h2>
            <p className="completion-sub">
              {t('done.sub', { crop: cropDisplayName(loc(plan.crop)) })}
            </p>

            <form className="completion-form" onSubmit={submit}>
              <label className="completion-field">
                <span>{t('done.profitQ')}</span>
                <div className="completion-input-row">
                  <span className="completion-rupee">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                    placeholder={t('done.profitPh')}
                    autoFocus
                  />
                </div>
              </label>
              <p className="completion-hint">
                {t('done.hint', { n: plan.crop.investment.toLocaleString('en-IN') })}
              </p>
              <motion.button className="btn btn-primary completion-submit" type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                {t('done.save')}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
