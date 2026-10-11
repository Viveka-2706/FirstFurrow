import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import './Toast.css';

// A short message at the top of the screen when something fails to save. `notice` = { id, code }.
export default function Toast({ notice, onClose }) {
  const { t } = useLang();
  const id = notice?.id;
  useEffect(() => {
    if (!id) return undefined;
    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <AnimatePresence>
      {notice && (
        <motion.div key={notice.id} className="toast" role="alert" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>
          <span>{t(errKey(notice.code))}</span>
          <button type="button" onClick={onClose} aria-label={t('cancel')}>✕</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
