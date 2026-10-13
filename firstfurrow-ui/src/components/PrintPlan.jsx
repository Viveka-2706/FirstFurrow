import { useLang } from '../i18n/useLang';
import { cropDisplayName, stageTotalCost, totalActualSpend } from '../data/dummyData';
import './PrintPlan.css';

const DAY = 86400000;

// "Plough the field. Level it; add manure." → separate tick-able steps
function splitSteps(text) {
  if (!text) return [];
  const parts = text.split(/(?<=[.;।])\s+/).map((p) => p.trim().replace(/[.;]$/, '')).filter((p) => p.length > 0);
  return parts.length > 1 && parts.every((p) => p.length > 6) ? parts : [text.trim().replace(/\.$/, '')];
}

// The paper version of a plan. It is invisible on screen and is the ONLY thing that prints, so the printout is a
// clean, complete checklist — every stage, not just the one open on screen — in the language the farmer is using.
export default function PrintPlan({ plan, crop }) {
  const { t, lang, region, soilName, season } = useLang();
  const guide = crop.guide;
  const total = guide.length;
  const done = plan.stageStatus.filter(Boolean).length;
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN';
  const fmtDate = (d) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

  const start = new Date(plan.startDate);
  const harvest = crop.durationDays ? new Date(start.getTime() + crop.durationDays * DAY) : null;
  const spent = totalActualSpend(plan);
  const water = crop.water || {};
  const soil = soilName(plan.soilId, plan.soilName);
  const waterRows = [
    ['water.needed', water.totalSeasonWater],
    ['water.method', water.method],
    ['water.frequency', water.frequency],
    ['water.critical', water.criticalStages],
  ].filter(([, v]) => v);

  return (
    <article className="pp" aria-hidden="true">
      <header className="pp-head">
        <p className="pp-brand">FirstFurrow</p>
        <h1>{cropDisplayName(crop)}</h1>
        <p className="pp-line">
          {plan.land} {t('acres')} · {region(plan.region)}{soil ? ` · ${soil}` : ''}
        </p>
      </header>

      <section className="pp-facts">
        <div><b>{t('print.season')}</b><span>{season(plan.season)}</span></div>
        <div><b>{t('print.start')}</b><span>{fmtDate(start)}</span></div>
        {harvest && <div><b>{t('print.harvest')}</b><span>{fmtDate(harvest)}</span></div>}
        <div><b>{t('plan.overall')}</b><span>{t('print.progress', { done, total })}</span></div>
        {crop.investment != null && <div><b>{t('print.invest')}</b><span>{money(crop.investment)}</span></div>}
        {crop.returnMin != null && <div><b>{t('print.return')}</b><span>{money(crop.returnMin)}–{Number(crop.returnMax).toLocaleString('en-IN')}</span></div>}
        {spent > 0 && <div><b>{t('print.spent')}</b><span>{money(spent)}</span></div>}
      </section>

      {waterRows.length > 0 && (
        <section className="pp-water">
          <h2>{t('water.title')}</h2>
          <dl>
            {waterRows.map(([k, v]) => (
              <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </section>
      )}

      {guide.map((stage, i) => {
        const isDone = Boolean(plan.stageStatus[i]);
        const logged = plan.actualCosts?.[i];
        const est = stageTotalCost(stage);
        return (
          <section className="pp-stage" key={i}>
            <h2>
              <span className={`pp-box ${isDone ? 'is-done' : ''}`}>{isDone ? '✓' : ''}</span>
              <span className="pp-stage-name">{stage.stage}</span>
              <span className="pp-stage-day">{stage.dayRange}</span>
            </h2>
            <p className="pp-stage-sub">
              {t('print.stageOf', { n: i + 1, total })}{isDone ? ` · ${t('print.done')}` : ''}
            </p>

            {stage.whatToDo && (
              <>
                <h3>{t('stage.whatToDo')}</h3>
                <ul className="pp-steps">
                  {splitSteps(stage.whatToDo).map((step, j) => (
                    <li key={j}><span className="pp-tick" />{step}</li>
                  ))}
                </ul>
              </>
            )}
            {stage.why && <p className="pp-note"><b>{t('stage.why')}:</b> {stage.why}</p>}
            {stage.beginnerTip && <p className="pp-note"><b>{t('stage.tip')}:</b> {stage.beginnerTip}</p>}
            {stage.warningSign && <p className="pp-note pp-warn"><b>{t('stage.warning')}:</b> {stage.warningSign}</p>}

            {(stage.costItems || []).length > 0 && (
              <table className="pp-cost">
                <tbody>
                  {stage.costItems.map((c, j) => (
                    <tr key={j}><td>{c.item}</td><td>{c.cost}</td></tr>
                  ))}
                  <tr className="pp-cost-total">
                    <td>{t('print.estCost')}</td>
                    <td>{est}</td>
                  </tr>
                  {typeof logged === 'number' && (
                    <tr><td>{t('print.spent')}</td><td>{money(logged)}</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </section>
        );
      })}

      <section className="pp-notes">
        <h2>{t('print.notes')}</h2>
        <div className="pp-lines"><i /><i /><i /><i /><i /></div>
      </section>

      <footer className="pp-foot">{t('print.printedOn', { date: fmtDate(new Date()) })}</footer>
    </article>
  );
}
