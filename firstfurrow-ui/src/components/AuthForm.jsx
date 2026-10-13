import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import PasswordField from './PasswordField';
import './AuthForm.css';

export default function AuthForm({
  mode,
  onSubmit,
  onSwitchMode,
  onBack,
  onForgot,
  error,
  notice,
  busy,
  verifyEmailAddress,
  onVerifyEmail,
  onResendVerification,
  onCancelVerification,
}) {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState(false);

  const isSignup = mode === 'signup';
  const isVerify = Boolean(verifyEmailAddress);

  // Free hosting wakes up server slowly
  const [attempt, setAttempt] = useState(0);
  const [slowAttempt, setSlowAttempt] = useState(-1);
  useEffect(() => {
    if (!busy) return undefined;
    const id = setTimeout(() => setSlowAttempt(attempt), 4000);
    return () => clearTimeout(id);
  }, [busy, attempt]);
  const waking = busy && slowAttempt === attempt;

  // Resend cooldown timer countdown
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const interval = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    setAttempt((n) => n + 1);

    if (isVerify) {
      onVerifyEmail({ email: verifyEmailAddress, code: verificationCode });
      return;
    }

    onSubmit(isSignup ? { name, email, password } : { email, password });
  };

  const handleResend = async () => {
    if (cooldown > 0 || busy) return;
    setResendNotice(false);
    const ok = await onResendVerification(verifyEmailAddress);
    if (ok) {
      setCooldown(60);
      setResendNotice(true);
    }
  };

  return (
    <div className="auth-screen">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {isVerify ? (
          <>
            <p className="eyebrow auth-eyebrow">{t('auth.verifyEyebrow')}</p>
            <h2 className="auth-title">{t('auth.verifyTitle')}</h2>
            <p className="auth-lead">{t('auth.verifySub', { email: verifyEmailAddress })}</p>

            {resendNotice && <p className="auth-success" role="status">{t('auth.codeSent')}</p>}

            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field">
                <span>{t('auth.verifyCode')}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="auth-code-input"
                  autoFocus
                  required
                />
              </label>

              {error && <p className="auth-error" role="alert">{t(errKey(error))}</p>}
              {waking && <p className="auth-waking" role="status">{t('auth.waking')}</p>}

              <motion.button
                className="btn btn-primary auth-submit"
                type="submit"
                disabled={busy || verificationCode.length !== 6}
                whileHover={{ scale: busy || verificationCode.length !== 6 ? 1 : 1.03 }}
                whileTap={{ scale: busy || verificationCode.length !== 6 ? 1 : 0.97 }}
              >
                {busy ? t('auth.busy') : t('auth.verifyBtn')}
              </motion.button>

              <div className="auth-verify-actions">
                <button
                  type="button"
                  className="auth-resend-btn"
                  onClick={handleResend}
                  disabled={cooldown > 0 || busy}
                >
                  {cooldown > 0 ? t('auth.resendIn', { s: cooldown }) : t('auth.resendCode')}
                </button>
              </div>
            </form>

            <button type="button" className="auth-back" onClick={onCancelVerification}>
              {t('auth.backToSignup')}
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow auth-eyebrow">{isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}</p>
            <h2 className="auth-title">{isSignup ? t('auth.startFirstPlan') : t('auth.loginToFarm')}</h2>
            {notice && <p className="auth-success" role="status">{t(`notice.${notice}`)}</p>}

            <form className="auth-form" onSubmit={submit}>
              {isSignup && (
                <label className="auth-field">
                  <span>{t('auth.name')}</span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('auth.namePh')}
                    maxLength={80}
                    required
                  />
                </label>
              )}
              <label className="auth-field">
                <span>{t('auth.email')}</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                />
              </label>
              <label className="auth-field">
                <span>{t('auth.password')}</span>
                <PasswordField
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  showRules={isSignup}
                  required
                />
                {isSignup && <small className="auth-hint">{t('auth.pwHint')}</small>}
                {!isSignup && (
                  <button type="button" className="auth-forgot" onClick={onForgot}>
                    {t('auth.forgot')}
                  </button>
                )}
              </label>

              {error && <p className="auth-error" role="alert">{t(errKey(error))}</p>}
              {waking && <p className="auth-waking" role="status">{t('auth.waking')}</p>}

              <motion.button
                className="btn btn-primary auth-submit"
                type="submit"
                disabled={busy}
                whileHover={{ scale: busy ? 1 : 1.03 }}
                whileTap={{ scale: busy ? 1 : 0.97 }}
              >
                {busy ? t('auth.busy') : isSignup ? t('auth.createBtn') : t('auth.loginBtn')}
              </motion.button>
            </form>

            <p className="auth-switch">
              {isSignup ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              <button className="auth-switch-link" onClick={onSwitchMode}>
                {isSignup ? t('auth.loginBtn') : t('auth.signup')}
              </button>
            </p>

            <button className="auth-back" onClick={onBack}>
              {t('auth.backHome')}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
