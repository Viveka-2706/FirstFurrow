import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './components/Landing';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import WizardForm from './components/WizardForm';
import RecommendationGrid from './components/RecommendationGrid';
import PlanView from './components/PlanView';
import CompletionModal from './components/CompletionModal';
import CompletedDetail from './components/CompletedDetail';
import WelcomeAnimation from './components/WelcomeAnimation';
import LangToggle from './components/LangToggle';
import BootScreen from './components/BootScreen';
import Toast from './components/Toast';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import ResetPasswordForm from './components/ResetPasswordForm';
import Settings from './components/Settings';
import { useLang } from './i18n/useLang';
import * as store from './api/store';
import './App.css';

const pageVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

// The link in the reset email looks like  https://site/reset-password?token=…
// Read it once when the page opens. null = a normal visit, '' = the link had no token.
function readResetLink() {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  if (url.pathname.replace(/\/+$/, '') !== '/reset-password') return null;
  return url.searchParams.get('token') ?? '';
}
const RESET_AT_LOAD = readResetLink();

export default function App() {
  const { lang } = useLang();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [view, setView] = useState(RESET_AT_LOAD !== null ? 'reset' : 'landing');
  const [resetToken, setResetToken] = useState(RESET_AT_LOAD);
  const [authNotice, setAuthNotice] = useState('');
  const [authMode, setAuthMode] = useState('signup');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState(null);
  const [wizardForm, setWizardForm] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null);
  const [welcomeName, setWelcomeName] = useState(null);
  const [completionPlanId, setCompletionPlanId] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [notice, setNotice] = useState(null);

  // Start-up: if a login is saved, check it with the server and load that farmer's plans.
  const [booting, setBooting] = useState(() => RESET_AT_LOAD === null && store.hasSession());
  const [bootError, setBootError] = useState(false);
  const [bootTry, setBootTry] = useState(0);

  useEffect(() => {
    if (RESET_AT_LOAD !== null || !store.hasSession()) return undefined; // opening a reset link: don't auto-resume an old login
    let alive = true;
    (async () => {
      try {
        const current = await store.getCurrentUser();
        if (current) {
          const list = await store.getPlans();
          if (!alive) return;
          setUser(current);
          setPlans(list);
          setView('dashboard');
        }
        if (alive) setBooting(false);
      } catch {
        if (alive) setBootError(true); // server unreachable: offer a retry instead of silently logging out
      }
    })();
    return () => { alive = false; };
  }, [bootTry]);

  // the secret token must not linger in the address bar, browser history or a bookmark
  useEffect(() => {
    if (RESET_AT_LOAD !== null) window.history.replaceState(null, '', '/');
  }, []);

  const retryBoot = () => { setBootError(false); setBootTry((n) => n + 1); };

  // The server said the saved login is no longer valid (expired, or the account is gone).
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setPlans([]);
      setActivePlanId(null);
      setCompletionPlanId(null);
      setAuthMode('login');
      setAuthError('unauthorized');
      setView('auth');
    };
    window.addEventListener('ff:unauthorized', onExpired);
    return () => window.removeEventListener('ff:unauthorized', onExpired);
  }, []);

  const closeNotice = useCallback(() => setNotice(null), []);
  // runs a server call; on failure shows a short message and returns null
  const attempt = async (fn) => {
    try {
      return await fn();
    } catch (err) {
      if (err.code !== 'unauthorized') setNotice({ id: Date.now(), code: err.code });
      return null;
    }
  };
  const replacePlan = (updated) => setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

  const activePlan = plans.find((p) => p.id === activePlanId) || null;
  const completionPlan = plans.find((p) => p.id === completionPlanId) || null;

  const goPrimaryCta = () => {
    if (user) {
      setView('dashboard');
    } else {
      setAuthMode('login');
      setAuthError('');
      setView('auth');
    }
  };

  const handleAuthSubmit = async (payload) => {
    if (authBusy) return;
    setAuthError('');
    setAuthNotice('');
    setAuthBusy(true);
    try {
      if (authMode === 'signup') {
        const res = await store.signup({ ...payload, lang });
        if (res.requiresVerification) {
          setVerifyEmailAddress(res.email || payload.email);
          return;
        }
        const list = await store.getPlans();
        setUser(res.user);
        setPlans(list);
        setWelcomeName(res.user.name.split(' ')[0]);
        setView('dashboard');
      } else {
        const res = await store.login({ ...payload, lang });
        if (res.requiresVerification) {
          setVerifyEmailAddress(res.email || payload.email);
          return;
        }
        const list = await store.getPlans();
        setUser(res.user);
        setPlans(list);
        setWelcomeName(res.user.name.split(' ')[0]);
        setView('dashboard');
      }
    } catch (err) {
      if (err.code === 'email_not_verified') {
        setVerifyEmailAddress(payload.email);
      }
      setAuthError(err.code || 'generic');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyEmail = async ({ email, code }) => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError('');
    try {
      const user = await store.verifyEmail({ email, code });
      const list = await store.getPlans();
      setUser(user);
      setPlans(list);
      setVerifyEmailAddress(null);
      setWelcomeName(user.name.split(' ')[0]);
      setView('dashboard');
    } catch (err) {
      setAuthError(err.code || 'generic');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleResendVerification = async (email) => {
    try {
      await store.resendVerification({ email, lang });
      return true;
    } catch (err) {
      setAuthError(err.code || 'generic');
      return false;
    }
  };

  const handleCancelVerification = () => {
    setVerifyEmailAddress(null);
    setAuthError('');
  };

  const handleDeleteAccount = async (password) => {
    await store.deleteAccount(password);
    setUser(null);
    setPlans([]);
    setActivePlanId(null);
    setCompletionPlanId(null);
    setAuthMode('login');
    setAuthNotice('account_deleted');
    setView('auth');
  };

  const goForgot = () => { setAuthError(''); setAuthNotice(''); setView('forgot'); };
  const goLogin = () => { setAuthMode('login'); setAuthError(''); setView('auth'); };

  const handleResetSubmit = async (password) => {
    await store.resetPassword(resetToken, password, lang); // throws if the link is bad; the form shows why
    store.logout(); // any old login on this device is dead now anyway
    setResetToken(null);
    setAuthMode('login');
    setAuthError('');
    setAuthNotice('password_reset');
    setView('auth');
  };

  // Settings: let the page show the error itself (it throws), and keep the shown name in step with the server
  const handleSaveProfile = async (changes) => {
    const updated = await store.updateProfile({ ...changes, lang });
    setUser(updated);
    return updated;
  };
  const handleChangePassword = (current, next) => store.changePassword(current, next, lang);

  const handleLogout = () => {
    store.logout();
    setUser(null);
    setPlans([]);
    setActivePlanId(null);
    setCompletionPlanId(null);
    setView('landing');
  };

  const handleWizardComplete = (formData) => {
    setWizardForm(formData);
    setView('results');
  };

  // The browser only says WHICH crop; the server copies the full crop (guide, Tamil text) from the database.
  const handleChooseCrop = async (crop) => {
    if (creatingPlan) return;
    setCreatingPlan(true);
    const plan = await attempt(() =>
      store.createPlan({ cropId: crop.id, land: wizardForm.land, soilId: wizardForm.soil, region: wizardForm.region, season: wizardForm.season })
    );
    setCreatingPlan(false);
    if (!plan) return;
    setPlans((prev) => [...prev, plan]);
    setActivePlanId(plan.id);
    setView('plan');
  };

  const handleToggleStage = async (index, actualCost) => {
    const nextDone = !activePlan.stageStatus[index];
    const updated = await attempt(() => store.setStage(activePlan.id, index, nextDone, actualCost));
    if (!updated) return;
    replacePlan(updated);
    if (updated.stageStatus.every(Boolean) && !updated.completed) {
      setCompletionPlanId(updated.id);
    }
  };

  const handleCompletionSubmit = async (profit) => {
    const updated = await attempt(() => store.completePlan(completionPlanId, profit));
    if (!updated) return;
    replacePlan(updated);
    setCompletionPlanId(null);
    setView('dashboard');
  };

  const handleDeletePlan = async (planId) => {
    const done = await attempt(async () => { await store.deletePlan(planId); return true; });
    if (!done) return;
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    if (activePlanId === planId) setActivePlanId(null);
  };

  const handleAddJournal = async (text) => {
    const updated = await attempt(() => store.addJournalEntry(activePlan.id, text));
    if (updated) replacePlan(updated);
  };

  const handleDeleteJournal = async (entryId) => {
    const updated = await attempt(() => store.deleteJournalEntry(activePlan.id, entryId));
    if (updated) replacePlan(updated);
  };

  if (booting) return <BootScreen failed={bootError} onRetry={retryBoot} />;

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <Landing
              isLoggedIn={!!user}
              onPrimaryCta={goPrimaryCta}
              onLogin={() => { setAuthMode('login'); setAuthError(''); setView('auth'); }}
              onSignup={() => { setAuthMode('signup'); setAuthError(''); setView('auth'); }}
            />
          </motion.div>
        )}

        {view === 'auth' && (
          <motion.div key="auth" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <AuthForm
              mode={authMode}
              error={authError}
              busy={authBusy}
              onSubmit={handleAuthSubmit}
              onSwitchMode={() => { setAuthMode(authMode === 'signup' ? 'login' : 'signup'); setAuthError(''); setAuthNotice(''); setVerifyEmailAddress(null); }}
              onForgot={goForgot}
              notice={authNotice}
              onBack={() => { setVerifyEmailAddress(null); setView('landing'); }}
              verifyEmailAddress={verifyEmailAddress}
              onVerifyEmail={handleVerifyEmail}
              onResendVerification={handleResendVerification}
              onCancelVerification={handleCancelVerification}
            />
          </motion.div>
        )}

        {view === 'forgot' && (
          <motion.div key="forgot" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ForgotPasswordForm onSubmit={(email) => store.requestPasswordReset(email, lang)} onBack={goLogin} />
          </motion.div>
        )}

        {view === 'reset' && (
          <motion.div key="reset" variants={pageVariants} initial="initial" animate="animate" exit="exit">
            <ResetPasswordForm hasToken={Boolean(resetToken)} onSubmit={handleResetSubmit} onRequestNew={goForgot} />
          </motion.div>
        )}

        {view === 'dashboard' && user && (
          <motion.div key="dashboard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <Dashboard
              user={user}
              plans={plans}
              onOpenPlan={(plan) => { setActivePlanId(plan.id); setView('plan'); }}
              onOpenCompleted={(plan) => { setActivePlanId(plan.id); setView('completed-detail'); }}
              onNewPlan={() => { setWizardForm(null); setView('wizard'); }}
              onOpenSettings={() => setView('settings')}
              onLogout={handleLogout}
              onDeletePlan={handleDeletePlan}
            />
          </motion.div>
        )}

        {view === 'settings' && user && (
          <motion.div key="settings" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <Settings
              user={user}
              plans={plans}
              onBack={() => setView('dashboard')}
              onSaveProfile={handleSaveProfile}
              onChangePassword={handleChangePassword}
              onDeleteAccount={handleDeleteAccount}
            />
          </motion.div>
        )}

        {view === 'wizard' && (
          <motion.div key="wizard" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <WizardForm onBack={() => setView(user ? 'dashboard' : 'landing')} onComplete={handleWizardComplete} />
          </motion.div>
        )}

        {view === 'results' && wizardForm && (
          <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <RecommendationGrid form={wizardForm} onBack={() => setView('wizard')} onChoose={handleChooseCrop} />
          </motion.div>
        )}

        {view === 'plan' && activePlan && (
          <motion.div key="plan" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <PlanView
              plan={activePlan}
              onBack={() => setView('dashboard')}
              onToggleStage={handleToggleStage}
              onAddJournal={handleAddJournal}
              onDeleteJournal={handleDeleteJournal}
            />
          </motion.div>
        )}

        {view === 'completed-detail' && activePlan && (
          <motion.div key="completed-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
            <CompletedDetail
              plan={activePlan}
              onBack={() => setView('dashboard')}
              onPlanNext={() => { setWizardForm(null); setView('wizard'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* landing + dashboard have the switch in their nav; the tracker itself is left untouched */}
      {(view === 'auth' || view === 'forgot' || view === 'reset' || view === 'wizard' || view === 'results') && <LangToggle variant="corner" />}

      {completionPlan && (
        <CompletionModal plan={completionPlan} onSubmit={handleCompletionSubmit} />
      )}

      <Toast notice={notice} onClose={closeNotice} />

      {welcomeName && (
        <WelcomeAnimation name={welcomeName} onDone={() => setWelcomeName(null)} />
      )}
    </div>
  );
}
