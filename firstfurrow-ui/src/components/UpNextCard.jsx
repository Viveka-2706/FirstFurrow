import { stageTotalCost } from '../data/dummyData';
import { iconFor } from './StageNav';
import { useLang } from '../i18n/useLang';
import './UpNextCard.css';

export default function UpNextCard({ stage }) {
  const { t } = useLang();
  if (!stage) return null;
  const hasCosts = (stage.costItems || []).length > 0;
  return (
    <div className="upnext-card">
      <div className="upnext-head">
        <span className="eyebrow">{t('upnext.eyebrow')}</span>
        <h4 className="upnext-title">{iconFor(stage)} {stage.stage}</h4>
      </div>
      <p className="upnext-hint">
        {hasCosts ? t('upnext.hint') : t('upnext.hintNoCost')}
      </p>
      {hasCosts && <div className="upnext-items">
        {(stage.costItems || []).map((ci) => (
          <div className="upnext-item" key={ci.item}>
            <span>{ci.item}</span>
            <span className="upnext-item-cost">{ci.cost}</span>
          </div>
        ))}
      </div>}
      {hasCosts && (
        <div className="upnext-total">
          <span>{t('upnext.total')}</span>
          <span className="upnext-total-value">{stageTotalCost(stage)}</span>
        </div>
      )}
    </div>
  );
}
