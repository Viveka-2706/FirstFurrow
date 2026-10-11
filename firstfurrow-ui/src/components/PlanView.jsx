import { useState } from 'react';
import { motion } from 'framer-motion';
import CostBreakdown from './CostBreakdown';
import WeatherWidget from './WeatherWidget';
import WaterCard from './WaterCard';
import HarvestCountdown from './HarvestCountdown';
import StageDetail from './StageDetail';
import UpNextCard from './UpNextCard';
import FieldJournal from './FieldJournal';
import SymptomChecker from './SymptomChecker';
import { useLang } from '../i18n/useLang';
import { cropDisplayName } from '../data/dummyData';
import { iconFor } from './StageNav';
import './PlanView.css';

export default function PlanView({ plan, onBack, onToggleStage, onAddJournal, onDeleteJournal }) {
  const { t, crop: loc, region } = useLang();
  const { stageStatus } = plan;
  const crop = loc(plan.crop); // translated for display; numbers are unchanged
  const firstIncomplete = stageStatus.findIndex((s) => !s);
  const unlockedIndex = firstIncomplete === -1 ? crop.guide.length - 1 : firstIncomplete;

  const [active, setActive] = useState(unlockedIndex);
  const [tab, setTab] = useState('guide');

  const selectStage = (i) => setActive(Math.min(i, unlockedIndex));
  const stage = crop.guide[active];
  const nextLockedStage = unlockedIndex < crop.guide.length - 1 ? crop.guide[unlockedIndex + 1] : null;

  const doneCount = stageStatus.filter(Boolean).length;
  const overallPct = Math.round((doneCount / crop.guide.length) * 100);

  return (
    <div className="plan-layout">
      {/* Sidebar for stages */}
      <aside className="plan-sidebar">
        <div className="plan-sidebar-header">
           <button className="btn-back" onClick={onBack}>{t('plan.backDash')}</button>
           <div className="plan-title-block">
             <h2>{cropDisplayName(crop)}</h2>
             <p>{plan.land} {t('acres')} · {region(plan.region)}</p>
           </div>
           
           <div className="plan-progress-bar-wrap">
             <div className="plan-progress-info">
               <span>{t('plan.overall')}</span>
               <span>{overallPct}%</span>
             </div>
             <div className="plan-progress-track">
               <motion.div 
                 className="plan-progress-fill"
                 initial={{ width: 0 }}
                 animate={{ width: `${overallPct}%` }}
               />
             </div>
           </div>
        </div>

        <div className="plan-stages-list">
          {crop.guide.map((s, i) => {
             const done = stageStatus[i];
             const locked = i > unlockedIndex;
             const isActive = i === active;
             return (
               <button 
                 key={s.stage}
                 className={`plan-stage-item ${done ? 'is-done' : ''} ${isActive ? 'is-active' : ''} ${locked ? 'is-locked' : ''}`}
                 onClick={() => !locked && selectStage(i)}
                 disabled={locked}
               >
                 <div className="stage-icon-circle">
                   {done ? '✓' : locked ? '🔒' : iconFor(s)}
                 </div>
                 <div className="stage-item-info">
                   <span className="stage-item-title">{s.stage}</span>
                   <span className="stage-item-date">{s.dayRange}</span>
                 </div>
               </button>
             )
          })}
        </div>
      </aside>

      <main className="plan-content">
        <header className="plan-header">
          <div className="plan-tabs-modern">
            <button className={tab === 'guide' ? 'active' : ''} onClick={() => setTab('guide')}>{t('plan.tabGuide')}</button>
            <button className={tab === 'journal' ? 'active' : ''} onClick={() => setTab('journal')}
>{t('plan.tabJournal')}</button>
            <button className={tab === 'symptoms' ? 'active' : ''} onClick={() => setTab('symptoms')}>{t('plan.tabSymptoms')}</button>
          </div>
          <button className="btn-print" onClick={() => window.print()}>{t('plan.print')}</button>
        </header>
        
        <div className="plan-scroll-area">
          {tab === 'guide' ? (
             <div className="plan-dashboard-grid">
               {/* Left Column: Stats */}
               <div className="plan-stats-col">
                 <HarvestCountdown plan={plan} />
                 <WeatherWidget region={plan.region} />
                 <CostBreakdown crop={crop} />
                 <WaterCard water={crop.water} />
               </div>

               {/* Right Column: Stage Detail */}
               <div className="plan-detail-col">
                 <StageDetail
                   crop={crop}
                   stage={stage}
                   active={active}
                   unlockedIndex={unlockedIndex}
                   isDone={stageStatus[active]}
                   loggedSpend={plan.actualCosts?.[active]}
                   onToggleStage={onToggleStage}
                   onNavigate={selectStage}
                 />
                 {active === unlockedIndex && <UpNextCard stage={nextLockedStage} />}
               </div>
             </div>
          ) : tab === 'journal' ? (
             <div className="plan-journal-view">
               <FieldJournal entries={plan.journal || []} onAdd={onAddJournal} onDelete={onDeleteJournal} />
             </div>
          ) : (
             <div className="plan-journal-view">
               <SymptomChecker crop={crop} onSaveToJournal={onAddJournal} />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
