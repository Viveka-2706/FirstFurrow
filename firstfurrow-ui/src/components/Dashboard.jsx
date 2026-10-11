import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cropDisplayName, landingImages } from '../data/dummyData';
import TodaysFocus from './TodaysFocus';
import ProfitChart from './ProfitChart';
import LangToggle from './LangToggle';
import { useLang } from '../i18n/useLang';
import './Dashboard.css';

export default function Dashboard({ user, plans, onOpenPlan, onOpenCompleted, onNewPlan, onLogout, onDeletePlan }) {
  const { t, crop: loc, region, soilName } = useLang();
  const [tab, setTab] = useState('active');
  const [confirmId, setConfirmId] = useState(null);
  const activePlans = plans.filter((p) => !p.completed);
  const completedPlans = plans.filter((p) => p.completed);

  const totalLand = plans.reduce((sum, p) => sum + p.land, 0);
  const totalPlanned = plans.reduce((sum, p) => sum + p.crop.investment, 0);
  const profitedPlans = completedPlans.filter((p) => p.profit != null);
  const totalProfit = profitedPlans.reduce((sum, p) => sum + p.profit, 0);
  const bestPlan = profitedPlans.length
    ? profitedPlans.reduce((best, p) => (p.profit > best.profit ? p : best), profitedPlans[0])
    : null;

  const askDelete = (e, id) => {
    e.stopPropagation();
    setConfirmId(id);
  };
  const cancelDelete = (e) => {
    e.stopPropagation();
    setConfirmId(null);
  };
  const confirmDelete = (e, id) => {
    e.stopPropagation();
    onDeletePlan(id);
    setConfirmId(null);
  };

  return (
    <section
      className="dashboard"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(246,242,231,0.55) 0%, rgba(246,242,231,0.4) 35%, rgba(246,242,231,0.65) 100%), url(${landingImages.dashboardBackground})`,
      }}
    >
      <motion.nav
        className="dashboard-nav"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="wordmark-inline dark">
          <motion.span
            className="wordmark-dot"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          FirstFurrow
        </div>
        <div className="nav-actions">
          <LangToggle variant="dark" />
          <span className="dashboard-user">{t('dash.hi', { name: user.name.split(' ')[0] })}</span>
          <motion.button className="btn btn-ghost-dark" onClick={onLogout} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {t('dash.logout')}
          </motion.button>
        </div>
      </motion.nav>

      <div className="dashboard-inner">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div>
            <p className="eyebrow dashboard-eyebrow">{t('dash.myFarm')}</p>
            <h2 className="dashboard-title">
              {plans.length ? (plans.length > 1 ? t('dash.plansTotal', { n: plans.length }) : t('dash.planTotalOne')) : t('dash.noPlans')}
            </h2>
          </div>
          <motion.button className="btn btn-primary" onClick={onNewPlan} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {t('dash.addLand')}
          </motion.button>
        </motion.div>

        {plans.length > 0 && (
          <motion.div
            className="farm-overview"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
          >
            <OverviewStat icon="🌍" label={t('dash.ov.land')} value={`${totalLand.toFixed(2)} ${t('acres')}`} />
            <OverviewStat icon="💰" label={t('dash.ov.invest')} value={`₹${totalPlanned.toLocaleString('en-IN')}`} />
            <OverviewStat
              icon="📈"
              label={t('dash.ov.profit')}
              value={profitedPlans.length ? `₹${totalProfit.toLocaleString('en-IN')}` : '—'}
              accent={profitedPlans.length > 0}
            />
            <OverviewStat
              icon="🏆"
              label={t('dash.ov.best')}
              value={bestPlan ? cropDisplayName(loc(bestPlan.crop)) : '—'}
              accent={!!bestPlan}
            />
          </motion.div>
        )}

        <div className="dashboard-tabs">
          <button className={`dashboard-tab ${tab === 'active' ? 'is-active' : ''}`} onClick={() => setTab('active')}>
            {t('dash.tabActive', { n: activePlans.length })}
            {tab === 'active' && <motion.span className="tab-underline" layoutId="tab-underline" />}
          </button>
          <button className={`dashboard-tab ${tab === 'completed' ? 'is-active' : ''}`} onClick={() => setTab('completed')}>
            {t('dash.tabCompleted', { n: completedPlans.length })}
            {tab === 'completed' && <motion.span className="tab-underline" layoutId="tab-underline" />}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === 'active' && (
              activePlans.length === 0 ? (
                <EmptyState
                  text={t('dash.emptyActive')}
                  cta={t('dash.emptyActiveCta')}
                  onClick={onNewPlan}
                />
              ) : (
                <>
                  <TodaysFocus plans={activePlans} onOpenPlan={onOpenPlan} />
                  <div className="plan-grid">
                  <AnimatePresence>
                    {activePlans.map((plan, i) => {
                      const doneCount = plan.stageStatus.filter(Boolean).length;
                      const pct = Math.round((doneCount / plan.stageStatus.length) * 100);
                      const firstIncomplete = plan.stageStatus.findIndex((s) => !s);
                      const nextStageName = firstIncomplete !== -1 ? loc(plan.crop).guide[firstIncomplete]?.stage : null;
                      return (
                        <PlanTile
                          key={plan.id}
                          plan={plan}
                          index={i}
                          confirming={confirmId === plan.id}
                          onOpen={() => onOpenPlan(plan)}
                          onAskDelete={(e) => askDelete(e, plan.id)}
                          onCancelDelete={cancelDelete}
                          onConfirmDelete={(e) => confirmDelete(e, plan.id)}
                        >
                          <p className="plan-tile-meta">{t('plan.metaLine', { land: plan.land, region: region(plan.region), soil: soilName(plan.soilId, plan.soilName) })}</p>
                          <div className="plan-tile-bar">
                            <motion.div
                              className="plan-tile-fill"
                              style={{ background: plan.crop.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                          <span className="plan-tile-badge">{pct}%</span>
                          {nextStageName && <span className="plan-tile-next">{t('dash.next', { stage: nextStageName })}</span>}
                          <span className="plan-tile-cta">{t('dash.openTracker')}</span>
                        </PlanTile>
                      );
                    })}
                  </AnimatePresence>
                  </div>
                </>
              )
            )}

            {tab === 'completed' && (
              completedPlans.length === 0 ? (
                <EmptyState text={t('dash.emptyDone')} />
              ) : (
                <>
                  {profitedPlans.length > 0 && <ProfitChart plans={profitedPlans} />}
                  <div className="plan-grid">
                  <AnimatePresence>
                    {completedPlans.map((plan, i) => (
                      <PlanTile
                        key={plan.id}
                        plan={plan}
                        index={i}
                        completed
                        confirming={confirmId === plan.id}
                        onOpen={() => onOpenCompleted(plan)}
                        onAskDelete={(e) => askDelete(e, plan.id)}
                        onCancelDelete={cancelDelete}
                        onConfirmDelete={(e) => confirmDelete(e, plan.id)}
                      >
                        <span className="plan-tile-badge is-done">{t('dash.done')}</span>
                        <p className="plan-tile-meta">
                          {plan.land} {t('acres')} · {region(plan.region)}
                          {plan.profit != null ? ` · ${t('dash.profit', { n: plan.profit.toLocaleString('en-IN') })}` : ''}
                        </p>
                        <span className="plan-tile-cta">{t('dash.viewSummary')}</span>
                      </PlanTile>
                    ))}
                  </AnimatePresence>
                  </div>
                </>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function OverviewStat({ icon, label, value, accent }) {
  return (
    <div className={`overview-stat ${accent ? 'is-accent' : ''}`}>
      <span className="overview-stat-icon">{icon}</span>
      <div className="overview-stat-text">
        <span className="overview-stat-value">{value}</span>
        <span className="overview-stat-label">{label}</span>
      </div>
    </div>
  );
}

function EmptyState({ text, cta, onClick }) {
  return (
    <motion.div className="dashboard-empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p>{text}</p>
      {cta && (
        <motion.button className="btn btn-dark" onClick={onClick} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          {cta}
        </motion.button>
      )}
    </motion.div>
  );
}

function PlanTile({ plan, index, completed, confirming, onOpen, onAskDelete, onCancelDelete, onConfirmDelete, children }) {
  const { t, crop: loc } = useLang();
  return (
    <motion.div
      layout
      className={`plan-tile ${completed ? 'plan-tile-completed' : ''}`}
      style={{ borderTopColor: plan.crop.color }}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.22 } }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -5 }}
    >
      <button className="plan-tile-remove" onClick={onAskDelete} aria-label={t('dash.removeAria')}>✕</button>

      <button className="plan-tile-body" onClick={onOpen}>
        <div className="plan-tile-top">
          <span className="plan-tile-crop">{cropDisplayName(loc(plan.crop))}</span>
        </div>
        {children}
      </button>

      <AnimatePresence>
        {confirming && (
          <motion.div
            className="plan-tile-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p>{t('dash.removeQ')}</p>
            <div className="plan-tile-confirm-actions">
              <button className="btn btn-ghost-dark" onClick={onCancelDelete}>{t('cancel')}</button>
              <button className="btn btn-primary plan-tile-confirm-yes" onClick={onConfirmDelete}>{t('remove')}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
