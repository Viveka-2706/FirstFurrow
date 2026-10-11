import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import './AuthForm.css';

// "I forgot my password": ask for the email, then tell the farmer to check their inbox.
// `onSubmit(email)` returns a promise; it throws if the request fails.
export default function ForgotPasswordForm({ onSubmit, onBack }) {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(err.code || 'generic');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        {sentTo ? (
          <>
            <p className="eyebrow auth-eyebrow">✉️ {t('forgot.sentEyebrow')}</p>
            <h2 className="auth-title">{t('forgot.sentTitle')}</h2>
            <p className="auth-lead" role="status">{t('forgot.sentBody', { email: sentTo })}</p>
            <button className="btn btn-ghost-dark auth-submit" type="button" onClick={() => setSentTo(null)}>{t('forgot.different')}</button>
          </>
        ) : (
          <>
            <p className="eyebrow auth-eyebrow">{t('forgot.eyebrow')}</p>
            <h2 className="auth-title">{t('forgot.title')}</h2>
            <p className="auth-lead">{t('forgot.sub')}</p>
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field">
                <span>{t('auth.email')}</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required autoFocus />
              </label>
              {error && <p className="auth-error" role="alert">{t(errKey(error))}</p>}
              <motion.button className="btn btn-primary auth-submit" type="submit" disabled={busy} whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: busy ? 1 : 0.97 }}>
                {busy ? t('auth.busy') : t('forgot.send')}
              </motion.button>
            </form>
          </>
        )}
        <button className="auth-back" onClick={onBack}>{t('forgot.back')}</button>
      </motion.div>
    </div>
  );
}
