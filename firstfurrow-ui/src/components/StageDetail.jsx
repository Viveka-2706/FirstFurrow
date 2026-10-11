import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { stageTotalCost, stageEstimateMidpoint } from '../data/dummyData';
import { iconFor } from './StageNav';
import ReadAloud from './ReadAloud';
import { useLang } from '../i18n/useLang';
import './StageDetail.css';

export default function StageDetail({ crop, stage, active, unlockedIndex, isDone, loggedSpend, onToggleStage, onNavigate }) {
  const { t } = useLang();
  const [askingSpend, setAskingSpend] = useState(false);
  const [spendValue, setSpendValue] = useState('');

  const hasEstimate = (stage.costItems || []).length > 0;

  const openSpendPrompt = () => {
    const est = stageEstimateMidpoint(stage);
    setSpendValue(est ? String(est) : '');
    setAskingSpend(true);
  };

  // everything a farmer would want to hear for this stage, in the active language
  const spokenText = [
    t('speak.stageIntro', { stage: stage.stage, days: stage.dayRange }),
    stage.whatToDo && `${t('stage.whatToDo')}. ${stage.whatToDo}`,
    stage.why && `${t('stage.why')}. ${stage.why}`,
    stage.beginnerTip && `${t('stage.tip')}. ${stage.beginnerTip}`,
    stage.warningSign && `${t('stage.warning')}. ${stage.warningSign}`,
  ].filter(Boolean).join(' ');

  const finishStage = (amount) => {
    onToggleStage(active, amount);
    setAskingSpend(false);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={active}
        className="detail-panel"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="detail-head">
          <div>
            <span className="detail-day">{stage.dayRange}</span>
            <h3 className="detail-title">{iconFor(stage)} {stage.stage}</h3>
          </div>
          <div className="detail-actions">
            <ReadAloud text={spokenText} variant="icon" />
            {active === unlockedIndex && !isDone ? (
              <button className="btn btn-primary detail-toggle" onClick={openSpendPrompt}>
                {t('stage.markComplete')}
              </button>
            ) : (
              <span className="detail-done-badge">
                {t('stage.completed')}{typeof loggedSpend === 'number' ? t('stage.spent', { n: loggedSpend.toLocaleString('en-IN') }) : ''}
              </span>
            )}
          </div>
        </div>

        <AnimatePresence>
          {askingSpend && (
            <motion.div
              className="spend-prompt"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <label className="spend-prompt-field">
                <span>{hasEstimate ? t('stage.spendQ', { est: stageTotalCost(stage) }) : t('stage.spendQNoEst')}</span>
                <div className="spend-prompt-row">
                  <span className="spend-prompt-rupee">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={spendValue}
                    onChange={(e) => setSpendValue(e.target.value)}
                    autoFocus
                  />
                </div>
              </label>
              <div className="spend-prompt-actions">
                <button className="btn btn-ghost-dark" onClick={() => finishStage(null)}>{t('stage.skip')}</button>
                <button className="btn btn-primary" onClick={() => finishStage(spendValue === '' ? null : Number(spendValue))}>
                  {t('stage.confirm')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="detail-body">
          <DetailRow label={t('stage.whatToDo')} text={stage.whatToDo} />
          <DetailRow label={t('stage.why')} text={stage.why} />
          {(stage.beginnerTip || stage.warningSign) && (
            <div className="detail-two-col">
              <DetailRow label={t('stage.tip')} text={stage.beginnerTip} tone="tip" />
              <DetailRow label={t('stage.warning')} text={stage.warningSign} tone="warn" />
            </div>
          )}
        </div>

        <div className="detail-nav">
          <button className="btn btn-ghost-dark" disabled={active === 0} onClick={() => onNavigate(active - 1)}>{t('stage.prev')}</button>
          <button className="btn btn-ghost-dark" disabled={active >= unlockedIndex} onClick={() => onNavigate(active + 1)}>{t('stage.next')}</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function DetailRow({ label, text, tone }) {
  if (!text) return null;
  return (
    <div className={`detail-row ${tone ? `tone-${tone}` : ''}`}>
      <span className="detail-row-label">{label}</span>
      <p className="detail-row-text">{text}</p>
    </div>
  );
}
