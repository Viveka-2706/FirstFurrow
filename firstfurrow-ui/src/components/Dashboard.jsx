import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cropDisplayName, landingImages, totalActualSpend } from '../data/dummyData';
import TodaysFocus from './TodaysFocus';
import ProfitChart from './ProfitChart';
import LangToggle from './LangToggle';
import { useLang } from '../i18n/useLang';
import './Dashboard.css';

const PAGE_SIZE = 3;

export default function Dashboard({
  user,
  plans,
  onOpenPlan,
  onOpenCompleted,
  onNewPlan,
  onOpenSettings,
  onLogout,
  onDeletePlan,
}) {
  const { t, crop: loc, region, soilName } = useLang();
  const [tab, setTab] = useState('active');
  const [confirmId, setConfirmId] = useState(null);

  // Pagination states
  const [activePage, setActivePage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);

  const activePlans = plans.filter((p) => !p.completed);
  const completedPlans = plans.filter((p) => p.completed);

  // Requirement: latest finished completed crops first
  const sortedCompletedPlans = [...completedPlans].sort((a, b) => {
    const timeA = a.endDate ? new Date(a.endDate).getTime() : (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
    const timeB = b.endDate ? new Date(b.endDate).getTime() : (b.updatedAt ? new Date(b.updatedAt).getTime() : 0);
    if (timeB !== timeA) return timeB - timeA;
    const startA = a.startDate ? new Date(a.startDate).getTime() : 0;
    const startB = b.startDate ? new Date(b.startDate).getTime() : 0;
    if (startB !== startA) return startB - startA;
    return (b.id || '').localeCompare(a.id || '');
  });

  // Active plans pagination
  const totalActivePages = Math.max(1, Math.ceil(activePlans.length / PAGE_SIZE));
  const currentActivePage = Math.min(activePage, totalActivePages);
  const activeStartIndex = (currentActivePage - 1) * PAGE_SIZE;
  const pagedActivePlans = activePlans.slice(activeStartIndex, activeStartIndex + PAGE_SIZE);

  // Completed plans pagination
  const totalCompletedPages = Math.max(1, Math.ceil(sortedCompletedPlans.length / PAGE_SIZE));
  const currentCompletedPage = Math.min(completedPage, totalCompletedPages);
  const completedStartIndex = (currentCompletedPage - 1) * PAGE_SIZE;
  const pagedCompletedPlans = sortedCompletedPlans.slice(completedStartIndex, completedStartIndex + PAGE_SIZE);

  // Requirement: if user completed 2 or more crops, show "Plan my next crop" instead of "Plan my first crop"
  const hasCompletedTwoOrMore = completedPlans.length >= 2;

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
        backgroundImage: `linear-gradient(180deg, rgba(246,242,231,0.6) 0%, rgba(246,242,231,0.45) 35%, rgba(246,242,231,0.7) 100%), url(${landingImages.dashboardBackground})`,
      }}
    >
      {/* Enterprise Organization Top Bar */}
      <motion.nav
        className="dashboard-nav"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="dashboard-nav-brand">
          <div className="wordmark-inline dark">
            <motion.span
              className="wordmark-dot"
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            FirstFurrow
          </div>
          <span className="org-portal-tag">AgTech Enterprise Suite</span>
        </div>

        <div className="nav-actions">
          <LangToggle variant="dark" />
          <div className="user-badge-chip">
            <span className="user-status-dot" />
            <span className="dashboard-user">{t('dash.hi', { name: user.name.split(' ')[0] })}</span>
          </div>
          <motion.button
            className="btn btn-ghost-dark"
            onClick={onOpenSettings}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {t('dash.settings')}
          </motion.button>
          <motion.button
            className="btn btn-ghost-dark"
            onClick={onLogout}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {t('dash.logout')}
          </motion.button>
        </div>
      </motion.nav>

      <div className="dashboard-inner">
        {/* Organization Status & Operations Masthead */}
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div>
            <div className="org-sub-banner">
              <span className="org-pill">
                <span className="org-pulse-dot" />
                {t('dash.orgBadge')}
              </span>
            </div>
            <h2 className="dashboard-title">
              {plans.length
                ? plans.length > 1
                  ? t('dash.plansTotal', { n: plans.length })
                  : t('dash.planTotalOne')
                : t('dash.noPlans')}
            </h2>
          </div>

          <motion.button
            className="btn btn-primary dash-cta-btn"
            onClick={onNewPlan}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            {hasCompletedTwoOrMore ? t('dash.planNextCropHeader') : t('dash.addLand')}
          </motion.button>
        </motion.div>

        {/* Seasonal Agro-Climate Extension Advisory */}
        <motion.div
          className="org-advisory-banner"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.14 }}
        >
          <div className="advisory-icon-col">
            <span className="advisory-symbol">🌱</span>
          </div>
          <div className="advisory-content">
            <div className="advisory-tag">{t('dash.advisoryEyebrow')}</div>
            <h4 className="advisory-heading">{t('dash.advisoryTitle')}</h4>
            <p className="advisory-text">{t('dash.advisoryBody')}</p>
          </div>
        </motion.div>

        {/* Agricultural Performance KPI Overview Cards */}
        {plans.length > 0 && (
          <motion.div
            className="farm-overview"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.18 }}
          >
            <OverviewStat
              icon="🌍"
              label={t('dash.ov.land')}
              value={`${totalLand.toFixed(2)} ${t('acres')}`}
            />
            <OverviewStat
              icon="💼"
              label={t('dash.ov.invest')}
              value={`₹${totalPlanned.toLocaleString('en-IN')}`}
            />
            <OverviewStat
              icon="📈"
              label={t('dash.ov.profit')}
              value={profitedPlans.length ? `₹${totalProfit.toLocaleString('en-IN')}` : '—'}
              accent={profitedPlans.length > 0}
            />
            <OverviewStat
              icon="🔄"
              label={t('dash.cycleRate')}
              value={`${completedPlans.length} ${t('print.done')}`}
            />
            <OverviewStat
              icon="🏆"
              label={t('dash.ov.best')}
              value={bestPlan ? cropDisplayName(loc(bestPlan.crop)) : '—'}
              accent={!!bestPlan}
            />
          </motion.div>
        )}

        {/* Portfolio Tabs */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${tab === 'active' ? 'is-active' : ''}`}
            onClick={() => setTab('active')}
          >
            {t('dash.tabActive', { n: activePlans.length })}
            {tab === 'active' && <motion.span className="tab-underline" layoutId="tab-underline" />}
          </button>
          <button
            className={`dashboard-tab ${tab === 'completed' ? 'is-active' : ''}`}
            onClick={() => setTab('completed')}
          >
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
            {tab === 'active' &&
              (activePlans.length === 0 ? (
                <EmptyState
                  text={t('dash.emptyActive')}
                  cta={hasCompletedTwoOrMore ? t('dash.planNextCrop') : t('dash.emptyActiveCta')}
                  onClick={onNewPlan}
                />
              ) : (
                <>
                  <TodaysFocus plans={activePlans} onOpenPlan={onOpenPlan} />
                  <div className="plan-grid">
                    <AnimatePresence>
                      {pagedActivePlans.map((plan, i) => {
                        const doneCount = plan.stageStatus.filter(Boolean).length;
                        const pct = Math.round((doneCount / plan.stageStatus.length) * 100);
                        const firstIncomplete = plan.stageStatus.findIndex((s) => !s);
                        const nextStageName =
                          firstIncomplete !== -1 ? loc(plan.crop).guide[firstIncomplete]?.stage : null;
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
                            <p className="plan-tile-meta">
                              {t('plan.metaLine', {
                                land: plan.land,
                                region: region(plan.region),
                                soil: soilName(plan.soilId, plan.soilName),
                              })}
                            </p>
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
                            {nextStageName && (
                              <span className="plan-tile-next">
                                {t('dash.next', { stage: nextStageName })}
                              </span>
                            )}
                            <span className="plan-tile-cta">{t('dash.openTracker')}</span>
                          </PlanTile>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Active Crops Pagination */}
                  <PaginationControls
                    currentPage={currentActivePage}
                    totalPages={totalActivePages}
                    totalItems={activePlans.length}
                    startIndex={activeStartIndex}
                    pageSize={PAGE_SIZE}
                    onPageChange={setActivePage}
                  />
                </>
              ))}

            {tab === 'completed' &&
              (sortedCompletedPlans.length === 0 ? (
                <EmptyState text={t('dash.emptyDone')} />
              ) : (
                <>
                  {profitedPlans.length > 0 && <ProfitChart plans={profitedPlans} />}
                  <div className="plan-grid">
                    <AnimatePresence>
                      {pagedCompletedPlans.map((plan, i) => {
                        const actualSpend = totalActualSpend(plan);
                        const inv = actualSpend > 0 ? actualSpend : plan.crop.investment;
                        const roi =
                          plan.profit != null && inv > 0
                            ? Math.round((plan.profit / inv) * 100)
                            : null;

                        return (
                          <CompletedPlanTile
                            key={plan.id}
                            plan={plan}
                            index={i}
                            roi={roi}
                            confirming={confirmId === plan.id}
                            onOpen={() => onOpenCompleted(plan)}
                            onAskDelete={(e) => askDelete(e, plan.id)}
                            onCancelDelete={cancelDelete}
                            onConfirmDelete={(e) => confirmDelete(e, plan.id)}
                          />
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Completed Crops Pagination */}
                  <PaginationControls
                    currentPage={currentCompletedPage}
                    totalPages={totalCompletedPages}
                    totalItems={sortedCompletedPlans.length}
                    startIndex={completedStartIndex}
                    pageSize={PAGE_SIZE}
                    onPageChange={setCompletedPage}
                  />
                </>
              ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function OverviewStat({ icon, label, value, accent }) {
  return (
    <div className={`overview-stat ${accent ? 'is-accent' : ''}`}>
      <div className="overview-stat-header">
        <span className="overview-stat-icon-badge">{icon}</span>
        <span className="overview-stat-label">{label}</span>
      </div>
      <div className="overview-stat-value" title={value}>{value}</div>
    </div>
  );
}

function PaginationControls({ currentPage, totalPages, totalItems, startIndex, pageSize, onPageChange }) {
  const { t } = useLang();
  if (totalItems <= pageSize) return null;

  const start = startIndex + 1;
  const end = Math.min(startIndex + pageSize, totalItems);

  return (
    <div className="dashboard-pagination">
      <div className="pagination-count-label">
        {t('dash.paginationShowing', { start, end, total: totalItems })}
      </div>
      <div className="pagination-nav-group">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label={t('dash.pagePrev')}
        >
          ← {t('dash.pagePrev')}
        </button>

        <div className="pagination-page-indicator">
          {t('dash.pageOf', { current: currentPage, total: totalPages })}
        </div>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label={t('dash.pageNext')}
        >
          {t('dash.pageNext')} →
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text, cta, onClick }) {
  return (
    <motion.div className="dashboard-empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p>{text}</p>
      {cta && (
        <motion.button
          className="btn btn-dark"
          onClick={onClick}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
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
      <button className="plan-tile-remove" onClick={onAskDelete} aria-label={t('dash.removeAria')}>
        ✕
      </button>

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
              <button className="btn btn-ghost-dark" onClick={onCancelDelete}>
                {t('cancel')}
              </button>
              <button className="btn btn-primary plan-tile-confirm-yes" onClick={onConfirmDelete}>
                {t('remove')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CompletedPlanTile({ plan, index, roi, confirming, onOpen, onAskDelete, onCancelDelete, onConfirmDelete }) {
  const { t, crop: loc, region } = useLang();
  const crop = loc(plan.crop);

  return (
    <motion.div
      layout
      className="plan-tile plan-tile-completed org-completed-tile"
      style={{ borderTopColor: crop.color }}
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.22 } }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -5 }}
    >
      <button className="plan-tile-remove" onClick={onAskDelete} aria-label={t('dash.removeAria')}>
        ✕
      </button>

      <button className="plan-tile-body" onClick={onOpen}>
        <div className="completed-tile-header">
          <div className="completed-badge-row">
            <span className="verified-seal-tag">{t('completed.verifiedBadge')}</span>
            {roi != null && (
              <span className={`completed-roi-tag ${roi >= 0 ? 'is-pos' : 'is-neg'}`}>
                {roi >= 0 ? `+${roi}% ROI` : `${roi}% ROI`}
              </span>
            )}
          </div>
          <h4 className="plan-tile-crop">{cropDisplayName(crop)}</h4>
          <p className="plan-tile-meta">
            {plan.land} {t('acres')} · {region(plan.region)}
          </p>
        </div>

        <div className="completed-tile-finance">
          <div className="tile-finance-row">
            <span className="tile-finance-label">{t('chart.investment')}:</span>
            <span className="tile-finance-val">₹{plan.crop.investment.toLocaleString('en-IN')}</span>
          </div>
          {plan.profit != null && (
            <div className="tile-finance-row">
              <span className="tile-finance-label">{t('chart.profit')}:</span>
              <strong className="tile-finance-val gain-text">
                ₹{plan.profit.toLocaleString('en-IN')}
              </strong>
            </div>
          )}
        </div>

        <div className="completed-tile-footer">
          <span className="plan-tile-cta">{t('completed.reportTitle')} →</span>
        </div>
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
              <button className="btn btn-ghost-dark" onClick={onCancelDelete}>
                {t('cancel')}
              </button>
              <button className="btn btn-primary plan-tile-confirm-yes" onClick={onConfirmDelete}>
                {t('remove')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
