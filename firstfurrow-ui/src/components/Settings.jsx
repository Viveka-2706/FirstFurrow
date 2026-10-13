import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { errKey } from '../api/errorKey';
import LangToggle from './LangToggle';
import PasswordField from './PasswordField';
import './AuthForm.css';
import './Settings.css';

// Account settings: change the name, login email, password, and delete account.
//   onSaveProfile({ name, email, currentPassword }) → resolves to the updated user
//   onChangePassword(currentPassword, newPassword)  → resolves when done
//   onDeleteAccount(password)                       → resolves when deleted
export default function Settings({ user, onBack, onSaveProfile, onChangePassword, onDeleteAccount }) {
  const { t } = useLang();

  // ── details ──
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [pwForEmail, setPwForEmail] = useState('');
  const [profBusy, setProfBusy] = useState(false);
  const [profError, setProfError] = useState('');
  const [profSaved, setProfSaved] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== user.email;
  const nameChanged = name.trim() !== user.name;
  const profDirty = emailChanged || nameChanged;

  const saveProfile = async (e) => {
    e.preventDefault();
    if (profBusy || !profDirty) return;
    setProfBusy(true); setProfError(''); setProfSaved(false);
    try {
      const updated = await onSaveProfile({
        ...(nameChanged ? { name } : {}),
        ...(emailChanged ? { email, currentPassword: pwForEmail } : {}),
      });
      setName(updated.name); setEmail(updated.email); setPwForEmail('');
      setProfSaved(true);
    } catch (err) {
      setProfError(err.code || 'generic');
    } finally {
      setProfBusy(false);
    }
  };

  // ── password ──
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const savePassword = async (e) => {
    e.preventDefault();
    if (pwBusy) return;
    setPwSaved(false);
    if (next !== again) { setPwError('mismatch'); return; }
    setPwBusy(true); setPwError('');
    try {
      await onChangePassword(cur, next);
      setCur(''); setNext(''); setAgain('');
      setPwSaved(true);
    } catch (err) {
      setPwError(err.code || 'generic');
    } finally {
      setPwBusy(false);
    }
  };

  // ── delete account ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePw, setDeletePw] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (deleteBusy || !deletePw) return;
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await onDeleteAccount(deletePw);
    } catch (err) {
      setDeleteError(err.code || 'generic');
      setDeleteBusy(false);
    }
  };

  const message = (code) => (code === 'mismatch' ? t('reset.mismatch') : t(errKey(code)));

  return (
    <div className="set-page">
      <header className="set-top">
        <div className="set-top-inner">
          <button type="button" className="set-back" onClick={onBack} aria-label={t('set.back')}>←</button>
          <div className="set-heading">
            <p className="eyebrow">{t('set.eyebrow')}</p>
            <h2>{t('set.title')}</h2>
          </div>
          <div className="set-lang"><LangToggle variant="dark" /></div>
        </div>
      </header>

      <main className="set-main">
        {/* Profile Card */}
        <motion.section className="set-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h3>{t('set.profileTitle')}</h3>
          <form className="auth-form" onSubmit={saveProfile}>
            <label className="auth-field">
              <span>{t('set.name')}</span>
              <input type="text" value={name} onChange={(e) => { setName(e.target.value); setProfSaved(false); }} maxLength={80} autoComplete="name" required />
            </label>
            <label className="auth-field">
              <span>{t('set.email')}</span>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setProfSaved(false); }} maxLength={254} autoComplete="email" required />
              <small className="auth-hint">{t('set.emailHint')}</small>
            </label>
            {emailChanged && (
              <label className="auth-field">
                <span>{t('set.curPwEmail')}</span>
                <PasswordField
                  value={pwForEmail}
                  onChange={(e) => setPwForEmail(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
            )}
            {profError && <p className="auth-error" role="alert">{message(profError)}</p>}
            {profSaved && !profError && <p className="set-ok" role="status">{t('set.saved')}</p>}
            <motion.button className="btn btn-primary auth-submit" type="submit" disabled={profBusy || !profDirty} whileHover={{ scale: profBusy || !profDirty ? 1 : 1.03 }} whileTap={{ scale: profBusy || !profDirty ? 1 : 0.97 }}>
              {profBusy ? t('auth.busy') : t('set.saveProfile')}
            </motion.button>
          </form>
        </motion.section>

        {/* Password Card */}
        <motion.section className="set-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }}>
          <h3>{t('set.pwTitle')}</h3>
          <p className="set-lead">{t('set.pwLead')}</p>
          <form className="auth-form" onSubmit={savePassword}>
            <label className="auth-field">
              <span>{t('set.curPw')}</span>
              <PasswordField
                value={cur}
                onChange={(e) => setCur(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            <label className="auth-field">
              <span>{t('set.newPw')}</span>
              <PasswordField
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                showRules={true}
                required
              />
              <small className="auth-hint">{t('auth.pwHint')}</small>
            </label>
            <label className="auth-field">
              <span>{t('set.confirmPw')}</span>
              <PasswordField
                value={again}
                onChange={(e) => setAgain(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
            {pwError && <p className="auth-error" role="alert">{message(pwError)}</p>}
            {pwSaved && !pwError && <p className="set-ok" role="status">{t('set.pwSaved')}</p>}
            <motion.button className="btn btn-primary auth-submit" type="submit" disabled={pwBusy} whileHover={{ scale: pwBusy ? 1 : 1.03 }} whileTap={{ scale: pwBusy ? 1 : 0.97 }}>
              {pwBusy ? t('auth.busy') : t('set.savePw')}
            </motion.button>
          </form>
        </motion.section>

        {/* Danger Zone: Delete Account */}
        <motion.section className="set-card is-danger" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
          <h3>{t('set.deleteTitle')}</h3>
          <p className="set-lead">{t('set.deleteLead')}</p>
          <button
            type="button"
            className="btn-danger"
            onClick={() => { setShowDeleteModal(true); setDeletePw(''); setDeleteError(''); }}
          >
            {t('set.deleteBtn')}
          </button>
        </motion.section>
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if (!deleteBusy) setShowDeleteModal(false); }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>{t('set.deleteModalTitle')}</h3>
              <p className="modal-warning-text">{t('set.deleteModalWarning')}</p>

              <form onSubmit={confirmDelete}>
                <label className="auth-field">
                  <span>{t('set.deleteModalPw')}</span>
                  <PasswordField
                    value={deletePw}
                    onChange={(e) => setDeletePw(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </label>

                {deleteError && <p className="auth-error" style={{ marginTop: '12px' }} role="alert">{message(deleteError)}</p>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost-dark"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleteBusy}
                  >
                    {t('set.deleteModalCancel')}
                  </button>
                  <button
                    type="submit"
                    className="btn-danger"
                    disabled={deleteBusy || !deletePw}
                  >
                    {deleteBusy ? t('auth.busy') : t('set.deleteModalConfirm')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
