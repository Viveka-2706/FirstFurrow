import { motion } from 'framer-motion';
import { cropDisplayName, totalActualSpend } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './CompletedDetail.css';

export default function CompletedDetail({ plan, onBack }) {
  const { t, locale, crop: loc, soilName, region } = useLang();
  const crop = loc(plan.crop);
  const startDate = new Date(plan.startDate);
  const endDate = plan.endDate ? new Date(plan.endDate) : null;
  const daysTaken = endDate ? Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) : null;

  const actualSpend = totalActualSpend(plan);
  const hasActualSpend = actualSpend > 0;
  const investmentForRoi = hasActualSpend ? actualSpend : crop.investment;
  const roi = plan.profit != null ? Math.round((plan.profit / investmentForRoi) * 100) : null;
  const spendDelta = hasActualSpend ? actualSpend - crop.investment : null;

  return (
    <section className="completed-detail">
      <div className="completed-inner">
        <button className="btn btn-ghost-dark plan-back" onClick={onBack}>
          {t('plan.back')}
        </button>

        <motion.div
          className="completed-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ background: crop.color }}
        >
          <p className="eyebrow">{t('completed.eyebrow')}</p>
          <h2 className="completed-hero-title">{cropDisplayName(crop)}</h2>
          <p className="completed-hero-sub">{plan.land} {t('acres')} · {soilName(plan.soilId, plan.soilName)} · {region(plan.region)}</p>
        </motion.div>

        <div className="completed-grid">
          <StatCard label={t('completed.planned')} value={`₹${crop.investment.toLocaleString('en-IN')}`} />
          <StatCard
            label={t('completed.actual')}
            value={hasActualSpend ? `₹${actualSpend.toLocaleString('en-IN')}` : t('completed.notLogged')}
            accent={hasActualSpend}
          />
          <StatCard label={t('completed.profit')} value={plan.profit != null ? `₹${plan.profit.toLocaleString('en-IN')}` : t('completed.notRecorded')} accent={plan.profit != null} />
          <StatCard label={t('completed.roi')} value={roi != null ? `${roi}%` : '—'} accent={roi != null && roi > 0} />
          <StatCard label={t('completed.daysTaken')} value={daysTaken != null ? `${daysTaken} ${t('days')}` : '—'} />
          <StatCard label={t('completed.started')} value={startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })} />
          <StatCard label={t('completed.harvested')} value={endDate ? endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
        </div>

        {hasActualSpend && (
          <motion.div
            className="completed-note"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h3 className="cost-title">{t('completed.plannedVsActual')}</h3>
            <p className="completed-blurb">
              {t('completed.pva', { planned: crop.investment.toLocaleString('en-IN'), actual: actualSpend.toLocaleString('en-IN') })}
              {spendDelta > 0
                ? t('completed.over', { n: spendDelta.toLocaleString('en-IN') })
                : spendDelta < 0
                ? t('completed.under', { n: Math.abs(spendDelta).toLocaleString('en-IN') })
                : t('completed.exact')}
            </p>
          </motion.div>
        )}

        <div className="completed-note">
          <h3 className="cost-title">{t('completed.about')}</h3>
          <p className="completed-blurb">{crop.blurb}</p>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`completed-stat ${accent ? 'is-accent' : ''}`}>
      <span className="completed-stat-label">{label}</span>
      <span className="completed-stat-value">{value}</span>
    </div>
  );
}
