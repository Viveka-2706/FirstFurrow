import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import './AuthForm.css';

export default function AuthForm({ mode, onSubmit, onSwitchMode, onBack, onForgot, error, notice, busy }) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isSignup = mode === 'signup';

  // Free hosting puts idle servers to sleep; the first request can take ~a minute. Say so instead of looking frozen.
  const [attempt, setAttempt] = useState(0);
  const [slowAttempt, setSlowAttempt] = useState(-1);
  useEffect(() => {
    if (!busy) return undefined;
    const id = setTimeout(() => setSlowAttempt(attempt), 4000);
    return () => clearTimeout(id);
  }, [busy, attempt]);
  const waking = busy && slowAttempt === attempt;

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    setAttempt((n) => n + 1);
    onSubmit(isSignup ? { name, email, password } : { email, password });
  };

  return (
    <div className="auth-screen">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="eyebrow auth-eyebrow">{isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}</p>
        <h2 className="auth-title">{isSignup ? t('auth.startFirstPlan') : t('auth.loginToFarm')}</h2>
        {notice && <p className="auth-success" role="status">{t(`notice.${notice}`)}</p>}

        <form className="auth-form" onSubmit={submit}>
          {isSignup && (
            <label className="auth-field">
              <span>{t('auth.name')}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.namePh')} required />
            </label>
          )}
          <label className="auth-field">
            <span>{t('auth.email')}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          <label className="auth-field">
            <span>{t('auth.password')}</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={8} maxLength={72} autoComplete={isSignup ? 'new-password' : 'current-password'} required />
            {isSignup && <small className="auth-hint">{t('auth.pwHint')}</small>}
            {!isSignup && <button type="button" className="auth-forgot" onClick={onForgot}>{t('auth.forgot')}</button>}
          </label>

          {error && <p className="auth-error" role="alert">{t(errKey(error))}</p>}
          {waking && <p className="auth-waking" role="status">{t('auth.waking')}</p>}

          <motion.button className="btn btn-primary auth-submit" type="submit" disabled={busy} whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: busy ? 1 : 0.97 }}>
            {busy ? t('auth.busy') : isSignup ? t('auth.createBtn') : t('auth.loginBtn')}
          </motion.button>
        </form>

        <p className="auth-switch">
          {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
          <button className="auth-switch-link" onClick={onSwitchMode}>
            {isSignup ? t('auth.loginBtn') : t('auth.signup')}
          </button>
        </p>

        <button className="auth-back" onClick={onBack}>{t('auth.backHome')}</button>
      </motion.div>
    </div>
  );
}
