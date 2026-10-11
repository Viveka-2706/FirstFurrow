import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FurrowStepper from './FurrowStepper';
import { seasons, budgetTiers } from '../data/dummyData';
import { useReference } from '../data/useReference';
import { useLang } from '../i18n/useLang';
import './WizardForm.css';

const STEP_KEYS = ['wiz.steps.land', 'wiz.steps.soil', 'wiz.steps.budget', 'wiz.steps.region', 'wiz.steps.season'];

const slideVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function WizardForm({ onComplete, onBack }) {
  const { t, soil: loc, soilName, region: regionLabel, season: seasonLabel, budget: budgetLabel } = useLang();
  const { regions, soilTypes, soilRegionMap } = useReference();
  const STEPS = STEP_KEYS.map((k) => t(k));
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ land: 0.5, soil: null, budget: null, region: null, season: null });

  const canNext =
    (step === 0 && form.land > 0) ||
    (step === 1 && form.soil) ||
    (step === 2 && form.budget) ||
    (step === 3 && form.region) ||
    (step === 4 && form.season);

  const next = () => {
    if (step === STEPS.length - 1) {
      onComplete(form);
    } else {
      setStep((s) => s + 1);
    }
  };
  const prev = () => (step === 0 ? onBack() : setStep((s) => s - 1));

  const availableRegions = form.soil ? soilRegionMap[form.soil] || regions : regions;

  const chooseSoil = (soilId) => {
    // if the previously picked region doesn't grow on the new soil, clear it
    const stillValid = form.region && (soilRegionMap[soilId] || regions).includes(form.region);
    setForm({ ...form, soil: soilId, region: stillValid ? form.region : null });
  };

  return (
    <section className="wizard">
      <div className="wizard-inner">
        <p className="eyebrow wizard-eyebrow">{t('wiz.stepOf', { n: step + 1, total: STEPS.length })}</p>
        <FurrowStepper steps={STEPS} current={step} />

        <div className="wizard-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <StepBlock title={t('wiz.land.title')} subtitle={t('wiz.land.sub')}>
                  <div className="land-input">
                    <input
                      type="range"
                      min="0.05"
                      max="3"
                      step="0.05"
                      value={form.land}
                      onChange={(e) => setForm({ ...form, land: parseFloat(e.target.value) })}
                    />
                    <div className="land-value">
                      <span className="land-number">{form.land.toFixed(2)}</span>
                      <span className="land-unit">{t('acres')}</span>
                    </div>
                  </div>
                  <p className="land-helper">
                    {form.land < 0.25
                      ? t('wiz.land.small')
                      : form.land < 1
                      ? t('wiz.land.mid')
                      : t('wiz.land.big')}
                  </p>
                </StepBlock>
              )}

              {step === 1 && (
                <StepBlock title={t('wiz.soil.title')} subtitle={t('wiz.soil.sub')}>
                  <div className="option-grid soil-grid">
                    {soilTypes.map((raw) => {
                      const s = loc(raw);
                      return (
                      <OptionCard
                        key={s.id}
                        active={form.soil === s.id}
                        title={s.name}
                        subtitle={`${s.where} — ${s.feel}`}
                        onClick={() => chooseSoil(s.id)}
                      />
                      );
                    })}
                  </div>
                  <p className="land-helper">
                    {t('wiz.soil.help')}
                  </p>
                </StepBlock>
              )}

              {step === 2 && (
                <StepBlock title={t('wiz.budget.title')} subtitle={t('wiz.budget.sub')}>
                  <div className="option-grid">
                    {budgetTiers.map((raw) => {
                      const b = budgetLabel(raw);
                      return (
                      <OptionCard
                        key={b.id}
                        active={form.budget === b.id}
                        title={b.label}
                        subtitle={b.hint}
                        onClick={() => setForm({ ...form, budget: b.id })}
                      />
                      );
                    })}
                  </div>
                </StepBlock>
              )}

              {step === 3 && (
                <StepBlock title={t('wiz.region.title')} subtitle={t('wiz.region.sub', { soil: (soilName(form.soil, soilTypes.find((s) => s.id === form.soil)?.name) || '').toLowerCase() })}>
                  <div className="chip-grid">
                    {availableRegions.map((r) => (
                      <motion.button
                        key={r}
                        className={`chip ${form.region === r ? 'is-active' : ''}`}
                        onClick={() => setForm({ ...form, region: r })}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {regionLabel(r)}
                      </motion.button>
                    ))}
                  </div>
                </StepBlock>
              )}

              {step === 4 && (
                <StepBlock title={t('wiz.season.title')} subtitle={t('wiz.season.sub')}>
                  <div className="chip-grid chip-grid-wide">
                    {seasons.map((s) => (
                      <motion.button
                        key={s}
                        className={`chip ${form.season === s ? 'is-active' : ''}`}
                        onClick={() => setForm({ ...form, season: s })}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        {seasonLabel(s)}
                      </motion.button>
                    ))}
                  </div>
                </StepBlock>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="wizard-actions">
          <motion.button className="btn btn-ghost-dark" onClick={prev} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
            {step === 0 ? t('back') : t('previous')}
          </motion.button>
          <motion.button
            className="btn btn-primary"
            disabled={!canNext}
            onClick={next}
            whileHover={canNext ? { scale: 1.04 } : {}}
            whileTap={canNext ? { scale: 0.96 } : {}}
          >
            {step === STEPS.length - 1 ? t('wiz.showCrops') : t('next')}
          </motion.button>
        </div>
      </div>
    </section>
  );
}

function StepBlock({ title, subtitle, children }) {
  return (
    <div className="step-block">
      <h2 className="step-title">{title}</h2>
      <p className="step-subtitle">{subtitle}</p>
      <div className="step-body">{children}</div>
    </div>
  );
}

function OptionCard({ title, subtitle, active, onClick }) {
  return (
    <motion.button
      className={`option-card ${active ? 'is-active' : ''}`}
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      animate={active ? { scale: [1, 1.03, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <span className="option-title">{title}</span>
      <span className="option-subtitle">{subtitle}</span>
    </motion.button>
  );
}
