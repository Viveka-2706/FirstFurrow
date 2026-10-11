import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import './AuthForm.css';

// The page the emailed link opens. `onSubmit(newPassword)` returns a promise; it throws if the link is bad.
export default function ResetPasswordForm({ hasToken, onSubmit, onRequestNew }) {
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(hasToken ? '' : 'invalid_reset_token'); // a link with no token at all can't work

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (password !== confirm) { setError('mismatch'); return; }
    setBusy(true);
    setError('');
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.code || 'generic');
      setBusy(false);
    }
  };

  const deadLink = error === 'invalid_reset_token';

  return (
    <div className="auth-screen">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
        <p className="eyebrow auth-eyebrow">{t('reset.eyebrow')}</p>
        <h2 className="auth-title">{t('reset.title')}</h2>

        {deadLink ? (
          <>
            <p className="auth-error" role="alert">{t('err.invalid_reset_token')}</p>
            <button className="btn btn-primary auth-submit" type="button" onClick={onRequestNew}>{t('reset.newLink')}</button>
          </>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field">
              <span>{t('reset.new')}</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} maxLength={72} autoComplete="new-password" required autoFocus />
              <small className="auth-hint">{t('auth.pwHint')}</small>
            </label>
            <label className="auth-field">
              <span>{t('reset.confirm')}</span>
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" minLength={8} maxLength={72} autoComplete="new-password" required />
            </label>
            {error && <p className="auth-error" role="alert">{error === 'mismatch' ? t('reset.mismatch') : t(errKey(error))}</p>}
            <motion.button className="btn btn-primary auth-submit" type="submit" disabled={busy} whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: busy ? 1 : 0.97 }}>
              {busy ? t('auth.busy') : t('reset.save')}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
