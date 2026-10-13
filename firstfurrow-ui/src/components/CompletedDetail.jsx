import { motion } from 'framer-motion';
import { cropDisplayName, totalActualSpend } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './CompletedDetail.css';

export default function CompletedDetail({ plan, onBack, onPlanNext }) {
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

  const dossierId = plan.id ? String(plan.id).slice(-6).toUpperCase() : '001';

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="completed-detail">
      <div className="completed-inner">
        {/* Navigation & Document Actions */}
        <div className="completed-action-bar">
          <button type="button" className="btn btn-ghost-dark plan-back" onClick={onBack}>
            {t('plan.back')}
          </button>
          <div className="doc-action-group">
            <button type="button" className="btn btn-ghost-dark print-btn" onClick={handlePrint}>
              🖨 {t('completed.printReport')}
            </button>
            {onPlanNext && (
              <button type="button" className="btn btn-primary" onClick={onPlanNext}>
                {t('completed.planNextFromHere')}
              </button>
            )}
          </div>
        </div>

        {/* Organization Harvest Dossier Masthead */}
        <div className="dossier-masthead">
          <div className="dossier-org-badge">
            <span className="dossier-org-dot" />
            FirstFurrow AgTech · Agronomic Operations
          </div>
          <span className="dossier-ref-code">REF: FF-DOSSIER-{dossierId}</span>
        </div>

        {/* Hero Banner */}
        <motion.div
          className="completed-hero"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ borderTopColor: crop.color }}
        >
          <div className="hero-top-row">
            <div className="hero-badges">
              <span className="badge-verified">{t('completed.verifiedBadge')}</span>
              <span className="badge-protocol">{t('completed.protocolBadge')}</span>
            </div>
            {daysTaken != null && (
              <span className="cycle-duration-pill">
                {daysTaken} {t('days')} {t('print.season')}
              </span>
            )}
          </div>

          <h1 className="completed-hero-title">{cropDisplayName(crop)}</h1>
          <p className="completed-hero-sub">
            {plan.land} {t('acres')} · {soilName(plan.soilId, plan.soilName)} · {region(plan.region)}
            {plan.season ? ` · ${plan.season}` : ''}
          </p>
        </motion.div>

        {/* Section: Financial Performance & Capital Efficiency */}
        <div className="dossier-section-heading">
          <h3>{t('completed.financialOverview')}</h3>
          <span className="section-rule" />
        </div>

        <div className="completed-grid">
          <StatCard
            label={t('completed.planned')}
            value={`₹${crop.investment.toLocaleString('en-IN')}`}
            sub={t('completed.stageEst')}
          />
          <StatCard
            label={t('completed.actual')}
            value={hasActualSpend ? `₹${actualSpend.toLocaleString('en-IN')}` : t('completed.notLogged')}
            sub={hasActualSpend ? (spendDelta > 0 ? `+₹${spendDelta.toLocaleString('en-IN')}` : `-₹${Math.abs(spendDelta || 0).toLocaleString('en-IN')}`) : ''}
            accent={hasActualSpend}
          />
          <StatCard
            label={t('completed.profit')}
            value={plan.profit != null ? `₹${plan.profit.toLocaleString('en-IN')}` : t('completed.notRecorded')}
            sub={plan.profit != null ? 'Realized Gain' : ''}
            accent={plan.profit != null}
          />
          <StatCard
            label={t('completed.roi')}
            value={roi != null ? (roi >= 0 ? `+${roi}%` : `${roi}%`) : '—'}
            sub={roi != null ? 'Capital ROI' : ''}
            accent={roi != null && roi > 0}
          />
          <StatCard
            label={t('completed.daysTaken')}
            value={daysTaken != null ? `${daysTaken} ${t('days')}` : '—'}
            sub={t('print.harvest')}
          />
          <StatCard
            label={t('completed.started')}
            value={startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })}
            sub={t('print.start')}
          />
          <StatCard
            label={t('completed.harvested')}
            value={endDate ? endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            sub={t('print.done')}
          />
        </div>

        {/* Budget Variance Analysis */}
        {hasActualSpend && (
          <motion.div
            className="completed-card budget-variance-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="card-header-row">
              <h4 className="card-section-title">{t('completed.plannedVsActual')}</h4>
              <span className={`variance-pill ${spendDelta > 0 ? 'is-over' : 'is-under'}`}>
                {spendDelta > 0
                  ? t('completed.overBudget', { n: spendDelta.toLocaleString('en-IN') })
                  : spendDelta < 0
                  ? t('completed.underBudget', { n: Math.abs(spendDelta).toLocaleString('en-IN') })
                  : t('completed.exact')}
              </span>
            </div>
            <p className="completed-blurb">
              {t('completed.pva', {
                planned: crop.investment.toLocaleString('en-IN'),
                actual: actualSpend.toLocaleString('en-IN'),
              })}
              {' '}
              {spendDelta > 0
                ? t('completed.over', { n: spendDelta.toLocaleString('en-IN') })
                : spendDelta < 0
                ? t('completed.under', { n: Math.abs(spendDelta).toLocaleString('en-IN') })
                : t('completed.exact')}
            </p>
          </motion.div>
        )}

        {/* Section: Agronomic Stage Audit Trail */}
        {crop.guide && crop.guide.length > 0 && (
          <div className="stage-audit-section">
            <div className="dossier-section-heading">
              <h3>{t('completed.cycleStages')}</h3>
              <span className="section-rule" />
            </div>

            <div className="stage-audit-list">
              {crop.guide.map((stage, idx) => {
                const stageCost = plan.stageCosts?.[idx];
                return (
                  <div key={idx} className="stage-audit-item">
                    <div className="audit-stage-number">
                      <span className="audit-check">✓</span>
                    </div>
                    <div className="audit-stage-body">
                      <div className="audit-stage-header">
                        <h4 className="audit-stage-title">
                          {t('print.stageOf', { n: idx + 1, total: crop.guide.length })}: {stage.stage}
                        </h4>
                        <span className="audit-badge-done">{t('stage.completed')}</span>
                      </div>
                      <p className="audit-stage-text">{stage.action}</p>
                      <div className="audit-stage-meta">
                        {stage.cost != null && (
                          <span className="audit-est-cost">
                            {t('completed.stageEst')}: ₹{stage.cost.toLocaleString('en-IN')}
                          </span>
                        )}
                        {stageCost != null && (
                          <span className="audit-actual-cost">
                            {t('completed.stageLogged')}: ₹{stageCost.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section: Agronomic Profile & Field Learnings */}
        <div className="completed-card">
          <h4 className="card-section-title">{t('completed.aboutCrop')}</h4>
          <p className="completed-blurb">{crop.blurb}</p>
          {crop.risk && (
            <div className="crop-spec-grid">
              <div className="crop-spec-item">
                <span className="spec-label">{t('crop.risk')}:</span>
                <span className="spec-value">{t(`risk.${crop.risk}`)}</span>
              </div>
              <div className="crop-spec-item">
                <span className="spec-label">{t('crop.duration')}:</span>
                <span className="spec-value">{crop.duration}</span>
              </div>
              <div className="crop-spec-item">
                <span className="spec-label">{t('water.needed')}:</span>
                <span className="spec-value">{crop.watering}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="dossier-footer">
          {onPlanNext && (
            <button type="button" className="btn btn-primary dossier-cta-large" onClick={onPlanNext}>
              {t('completed.planNextFromHere')}
            </button>
          )}
          <button type="button" className="btn btn-ghost-dark" onClick={onBack}>
            {t('plan.backDash')}
          </button>
        </div>
      </div>
    </section>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`completed-stat ${accent ? 'is-accent' : ''}`}>
      <span className="completed-stat-label">{label}</span>
      <span className="completed-stat-value">{value}</span>
      {sub && <span className="completed-stat-sub">{sub}</span>}
    </div>
  );
}
