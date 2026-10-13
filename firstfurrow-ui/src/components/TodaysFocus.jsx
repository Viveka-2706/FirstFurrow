import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cropDisplayName } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './TodaysFocus.css';

const FOCUS_PAGE_SIZE = 3;

export default function TodaysFocus({ plans, onOpenPlan }) {
  const { t, crop: loc } = useLang();
  const [page, setPage] = useState(1);

  const items = plans
    .map((plan) => {
      const idx = plan.stageStatus.findIndex((s) => !s);
      if (idx === -1) return null;
      return { plan, crop: loc(plan.crop), stage: loc(plan.crop).guide[idx] };
    })
    .filter(Boolean);

  if (items.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / FOCUS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * FOCUS_PAGE_SIZE;
  const pagedItems = items.slice(startIndex, startIndex + FOCUS_PAGE_SIZE);

  return (
    <motion.div
      className="focus-panel"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="focus-header">
        <div className="focus-header-left">
          <p className="eyebrow focus-eyebrow">{t('focus.eyebrow')}</p>
          {totalPages > 1 && (
            <span className="focus-range-tag">
              {t('dash.paginationShowing', {
                start: startIndex + 1,
                end: Math.min(startIndex + FOCUS_PAGE_SIZE, items.length),
                total: items.length,
              })}
            </span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="focus-pagination-nav">
            <button
              type="button"
              className="focus-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label={t('dash.pagePrev')}
            >
              ← {t('dash.pagePrev')}
            </button>
            <span className="focus-page-num">
              {t('dash.pageOf', { current: safePage, total: totalPages })}
            </span>
            <button
              type="button"
              className="focus-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label={t('dash.pageNext')}
            >
              {t('dash.pageNext')} →
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={safePage}
          className="focus-list"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {pagedItems.map(({ plan, crop, stage }, i) => (
            <motion.button
              key={plan.id}
              className="focus-item"
              onClick={() => onOpenPlan(plan)}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
              whileHover={{ x: 4 }}
            >
              <span className="focus-item-crop" style={{ background: plan.crop.color }}>
                {cropDisplayName(crop).slice(0, 1)}
              </span>
              <span className="focus-item-body">
                <span className="focus-item-title">{cropDisplayName(crop)}</span>
                <span className="focus-item-stage">
                  {t('focus.nextUp', { stage: stage.stage, days: stage.dayRange })}
                </span>
              </span>
              <span className="focus-item-arrow">→</span>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
