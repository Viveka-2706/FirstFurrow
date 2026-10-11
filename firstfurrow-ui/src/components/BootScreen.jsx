import { useEffect, useState } from 'react';
import { useLang } from '../i18n/useLang';
import './BootScreen.css';

// Shown while a saved login is being checked against the server (and plans are loading).
export default function BootScreen({ failed, onRetry }) {
  const { t } = useLang();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), 5000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="boot">
      <span className="boot-brand">FirstFurrow</span>
      {failed ? (
        <>
          <p className="boot-text">{t('boot.failed')}</p>
          <button className="btn btn-primary" onClick={onRetry}>{t('boot.retry')}</button>
        </>
      ) : (
        <>
          <span className="boot-spinner" aria-hidden="true" />
          <p className="boot-text" role="status">{slow ? t('boot.slow') : t('boot.loading')}</p>
        </>
      )}
    </div>
  );
}
