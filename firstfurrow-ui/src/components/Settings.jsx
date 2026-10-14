import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { useReference } from '../data/useReference';
import { errKey } from '../api/errorKey';
import LangToggle from './LangToggle';
import PasswordField from './PasswordField';
import './AuthForm.css';
import './Settings.css';

// Institutional Account Settings:
// Enhanced multi-tab dashboard with Profile, Farm Preferences, Advisory Alerts,
// 2FA Security, Farm Data Export, and Account Deletion.
export default function Settings({
  user,
  plans = [],
  onBack,
  onSaveProfile,
  onChangePassword,
  onDeleteAccount,
}) {
  const { t, region, soilName } = useLang();
  const { soilTypes, regions } = useReference();

  // Active category tab
  const [activeTab, setActiveTab] = useState('profile');

  // ── 1. Farmer Profile (Server Synced) ──
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
    setProfBusy(true);
    setProfError('');
    setProfSaved(false);
    try {
      const updated = await onSaveProfile({
        ...(nameChanged ? { name } : {}),
        ...(emailChanged ? { email, currentPassword: pwForEmail } : {}),
      });
      setName(updated.name);
      setEmail(updated.email);
      setPwForEmail('');
      setProfSaved(true);
    } catch (err) {
      setProfError(err.code || 'generic');
    } finally {
      setProfBusy(false);
    }
  };

  // ── 2. Agricultural & Regional Preferences (Persisted locally per user) ──
  const PREFS_KEY = `ff_prefs_${user.id || 'default'}`;
  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      phone: '',
      district: regions?.[0] || 'Coimbatore',
      farmerType: 'small', // marginal | small | medium | commercial
      landUnit: 'acres', // acres | hectares | cents
      defaultSoil: soilTypes?.[0]?.id || 'red',
      defaultSeason: 'all',
      currencyFormat: 'standard', // standard | lakhs
      farmingMethod: 'inm', // organic | inm | scientific
      alertsWeather: true,
      alertsPests: true,
      alertsStages: true,
      alertsMarket: false,
    };
  });

  const [prefSaved, setPrefSaved] = useState(false);

  const updatePref = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // quota
      }
      return next;
    });
    setPrefSaved(false);
  };

  const handleSavePrefs = (e) => {
    e?.preventDefault?.();
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      setPrefSaved(true);
      setTimeout(() => setPrefSaved(false), 3500);
    } catch {
      // ignore
    }
  };

  // ── 3. Password & Security ──
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
    if (next !== again) {
      setPwError('mismatch');
      return;
    }
    setPwBusy(true);
    setPwError('');
    try {
      await onChangePassword(cur, next);
      setCur('');
      setNext('');
      setAgain('');
      setPwSaved(true);
    } catch (err) {
      setPwError(err.code || 'generic');
    } finally {
      setPwBusy(false);
    }
  };

  // ── 4. Data Export & Backup ──
  const [exportNotice, setExportNotice] = useState('');

  const exportJson = () => {
    if (!plans || plans.length === 0) {
      setExportNotice(t('set.noPlansExport'));
      return;
    }
    const exportData = {
      portal: 'FirstFurrow Tamil Nadu Agro Portal',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      farmer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: prefs.phone,
        district: prefs.district,
        farmerType: prefs.farmerType,
        landUnit: prefs.landUnit,
      },
      summary: {
        totalPlans: plans.length,
        activePlans: plans.filter((p) => !p.completed).length,
        completedPlans: plans.filter((p) => p.completed).length,
      },
      plans: plans.map((p) => ({
        id: p.id,
        crop: p.crop?.name,
        cropTamil: p.crop?.ta?.name,
        landAcres: p.land,
        soilId: p.soilId,
        region: p.region,
        season: p.season,
        isCompleted: Boolean(p.completed),
        profit: p.profit,
        stages: p.stages,
        journal: p.journal,
        createdAt: p.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstfurrow_farm_records_${(user.name || 'farmer').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(t('set.exportSuccess'));
    setTimeout(() => setExportNotice(''), 4000);
  };

  const exportCsv = () => {
    if (!plans || plans.length === 0) {
      setExportNotice(t('set.noPlansExport'));
      return;
    }
    const headers = [
      'Plan ID',
      'Crop Name',
      'Land (Acres)',
      'Soil Type',
      'Region',
      'Season',
      'Status',
      'Profit (INR)',
      'Created Date',
    ];
    const rows = plans.map((p) => [
      p.id,
      `"${p.crop?.name || 'Crop'}"`,
      p.land,
      p.soilId,
      `"${p.region || ''}"`,
      p.season,
      p.completed ? 'Completed' : 'Active',
      p.profit !== null && p.profit !== undefined ? p.profit : 'N/A',
      p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstfurrow_ledger_${(user.name || 'farmer').replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(t('set.exportSuccess'));
    setTimeout(() => setExportNotice(''), 4000);
  };

  const clearCache = () => {
    try {
      sessionStorage.clear();
      setExportNotice(t('set.cacheCleared'));
      setTimeout(() => setExportNotice(''), 4000);
    } catch {
      // ignore
    }
  };

  // ── 5. Danger Zone: Delete Account ──
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

  // Derived aggregate stats for header card
  const totalLand = plans.reduce((sum, p) => sum + (Number(p.land) || 0), 0);
  const activeCount = plans.filter((p) => !p.completed).length;
  const completedCount = plans.filter((p) => p.completed).length;
  const initials = user.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'FF';
  const memberId = `FF-TN-${user.id ? String(user.id).slice(-6).toUpperCase() : '849201'}`;

  const tabs = [
    { id: 'profile', icon: '👤', label: t('set.tabProfile') },
    { id: 'agro', icon: '🌾', label: t('set.tabAgro') },
    { id: 'alerts', icon: '🔔', label: t('set.tabAlerts') },
    { id: 'security', icon: '🔒', label: t('set.tabSecurity') },
    { id: 'data', icon: '📊', label: t('set.tabData') },
    { id: 'danger', icon: '⚠️', label: t('set.tabDanger') },
  ];

  return (
    <div className="set-page">
      {/* Top Institutional Header */}
      <header className="set-top">
        <div className="set-top-inner">
          <button type="button" className="set-back" onClick={onBack} aria-label={t('set.back')}>
            ←
          </button>
          <div className="set-heading">
            <span className="eyebrow set-portal-badge">{t('set.eyebrow')}</span>
            <h2>{t('set.title')}</h2>
          </div>
          <div className="set-lang">
            <LangToggle variant="dark" />
          </div>
        </div>
      </header>

      <main className="set-main">
        {/* Farmer Official Identity Card */}
        <motion.section
          className="set-identity-hero"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="set-avatar-ring">
            <div className="set-avatar">{initials}</div>
            <span className="set-online-pulse" title="Verified Farm Session" />
          </div>

          <div className="set-identity-info">
            <div className="set-identity-row">
              <h3 className="set-farmer-name">{user.name}</h3>
              <span className="set-verified-pill">
                <span className="set-pill-dot" /> {t('set.verifiedFarmer')}
              </span>
              <span className="set-sec-pill">🛡️ {t('set.securityShield')}</span>
            </div>

            <p className="set-farmer-email">{user.email}</p>

            <div className="set-meta-pills">
              <span className="set-meta-tag">
                <strong>{t('set.memberId')}:</strong> {memberId}
              </span>
              <span className="set-meta-tag">
                📍 {region(prefs.district || 'Coimbatore')}
              </span>
              <span className="set-meta-tag">
                🌱 {plans.length} {plans.length === 1 ? 'Crop Plan' : 'Crop Plans'}
              </span>
            </div>
          </div>

          <div className="set-quick-stats">
            <div className="set-stat-box">
              <span className="stat-num">{totalLand.toFixed(totalLand % 1 === 0 ? 0 : 2)}</span>
              <span className="stat-label">Total Acres</span>
            </div>
            <div className="set-stat-divider" />
            <div className="set-stat-box">
              <span className="stat-num active-num">{activeCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="set-stat-divider" />
            <div className="set-stat-box">
              <span className="stat-num completed-num">{completedCount}</span>
              <span className="stat-label">Harvested</span>
            </div>
          </div>
        </motion.section>

        {/* Category Navigation Tabs */}
        <nav className="set-tabs-bar" aria-label="Settings Categories">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`set-tab-btn ${activeTab === tab.id ? 'active' : ''} ${
                tab.id === 'danger' ? 'danger-tab' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="set-tab-icon">{tab.icon}</span>
              <span className="set-tab-label">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabPill"
                  className="set-tab-active-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        {/* Tab Content Display */}
        <AnimatePresence mode="wait">
          {/* TAB 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <motion.section
              key="profile"
              className="set-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-card-header">
                <div>
                  <h3>{t('set.profileTitle')}</h3>
                  <p className="set-lead">{t('set.profileLead')}</p>
                </div>
              </div>

              <form className="auth-form" onSubmit={saveProfile}>
                <div className="set-grid-2col">
                  <label className="auth-field">
                    <span>{t('set.name')} *</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setProfSaved(false);
                      }}
                      maxLength={80}
                      autoComplete="name"
                      required
                    />
                  </label>

                  <label className="auth-field">
                    <span>{t('set.email')} *</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setProfSaved(false);
                      }}
                      maxLength={254}
                      autoComplete="email"
                      required
                    />
                  </label>
                </div>

                <small className="auth-hint">{t('set.emailHint')}</small>

                {emailChanged && (
                  <motion.div
                    className="auth-field set-pw-required"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <span>{t('set.curPwEmail')}</span>
                    <PasswordField
                      value={pwForEmail}
                      onChange={(e) => setPwForEmail(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </motion.div>
                )}

                <div className="set-grid-2col" style={{ marginTop: '16px' }}>
                  <label className="auth-field">
                    <span>{t('set.phone')}</span>
                    <input
                      type="tel"
                      value={prefs.phone || ''}
                      onChange={(e) => updatePref('phone', e.target.value)}
                      placeholder="+91 98765 43210"
                      maxLength={15}
                    />
                    <small className="auth-hint">{t('set.phoneHint')}</small>
                  </label>

                  <label className="auth-field">
                    <span>{t('set.district')}</span>
                    <select
                      value={prefs.district || ''}
                      onChange={(e) => updatePref('district', e.target.value)}
                      className="set-select"
                    >
                      {regions?.map((r) => (
                        <option key={r} value={r}>
                          {region(r)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="auth-field" style={{ marginTop: '8px' }}>
                  <span>{t('set.farmerType')}</span>
                  <div className="set-radio-cards">
                    {[
                      { id: 'marginal', label: t('set.typeMarginal') },
                      { id: 'small', label: t('set.typeSmall') },
                      { id: 'medium', label: t('set.typeMedium') },
                      { id: 'commercial', label: t('set.typeCommercial') },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={`set-radio-card ${prefs.farmerType === opt.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="farmerType"
                          value={opt.id}
                          checked={prefs.farmerType === opt.id}
                          onChange={() => updatePref('farmerType', opt.id)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </label>

                {profError && (
                  <p className="auth-error" role="alert">
                    {message(profError)}
                  </p>
                )}
                {profSaved && !profError && (
                  <p className="set-ok" role="status">
                    {t('set.saved')}
                  </p>
                )}

                <div className="set-form-actions">
                  <motion.button
                    className="btn btn-primary auth-submit"
                    type="submit"
                    disabled={profBusy || !profDirty}
                    whileHover={{ scale: profBusy || !profDirty ? 1 : 1.02 }}
                    whileTap={{ scale: profBusy || !profDirty ? 1 : 0.98 }}
                  >
                    {profBusy ? t('auth.busy') : t('set.saveProfile')}
                  </motion.button>
                </div>
              </form>
            </motion.section>
          )}

          {/* TAB 2: Agricultural Defaults */}
          {activeTab === 'agro' && (
            <motion.section
              key="agro"
              className="set-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-card-header">
                <div>
                  <h3>{t('set.agroTitle')}</h3>
                  <p className="set-lead">{t('set.agroLead')}</p>
                </div>
              </div>

              <form onSubmit={handleSavePrefs} className="auth-form">
                <label className="auth-field">
                  <span>{t('set.landUnit')}</span>
                  <div className="set-segment-group">
                    {[
                      { id: 'acres', label: t('set.unitAcres') },
                      { id: 'hectares', label: t('set.unitHectares') },
                      { id: 'cents', label: t('set.unitCents') },
                    ].map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        className={`set-segment-btn ${prefs.landUnit === u.id ? 'active' : ''}`}
                        onClick={() => updatePref('landUnit', u.id)}
                      >
                        {u.label}
                      </button>
                    ))}
                  </div>
                </label>

                <div className="set-grid-2col" style={{ marginTop: '16px' }}>
                  <label className="auth-field">
                    <span>{t('set.defaultSoil')}</span>
                    <select
                      value={prefs.defaultSoil || ''}
                      onChange={(e) => updatePref('defaultSoil', e.target.value)}
                      className="set-select"
                    >
                      {soilTypes?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {soilName(s.id, s.name)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="auth-field">
                    <span>{t('set.defaultSeason')}</span>
                    <select
                      value={prefs.defaultSeason || 'all'}
                      onChange={(e) => updatePref('defaultSeason', e.target.value)}
                      className="set-select"
                    >
                      <option value="all">{t('set.seasonAll')}</option>
                      <option value="Kharif">{t('set.seasonKharif')}</option>
                      <option value="Rabi">{t('set.seasonRabi')}</option>
                      <option value="Zaid">{t('set.seasonZaid')}</option>
                    </select>
                  </label>
                </div>

                <div className="set-grid-2col" style={{ marginTop: '16px' }}>
                  <label className="auth-field">
                    <span>{t('set.currencyFormat')}</span>
                    <select
                      value={prefs.currencyFormat || 'standard'}
                      onChange={(e) => updatePref('currencyFormat', e.target.value)}
                      className="set-select"
                    >
                      <option value="standard">{t('set.currStandard')}</option>
                      <option value="lakhs">{t('set.currLakhs')}</option>
                    </select>
                  </label>

                  <label className="auth-field">
                    <span>{t('set.farmingMethod')}</span>
                    <select
                      value={prefs.farmingMethod || 'inm'}
                      onChange={(e) => updatePref('farmingMethod', e.target.value)}
                      className="set-select"
                    >
                      <option value="organic">{t('set.methodOrganic')}</option>
                      <option value="inm">{t('set.methodInm')}</option>
                      <option value="scientific">{t('set.methodScientific')}</option>
                    </select>
                  </label>
                </div>

                {prefSaved && <p className="set-ok">{t('set.prefSaved')}</p>}

                <div className="set-form-actions">
                  <motion.button
                    className="btn btn-primary auth-submit"
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t('set.savePref')}
                  </motion.button>
                </div>
              </form>
            </motion.section>
          )}

          {/* TAB 3: Advisory & Alerts */}
          {activeTab === 'alerts' && (
            <motion.section
              key="alerts"
              className="set-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-card-header">
                <div>
                  <h3>{t('set.alertsTitle')}</h3>
                  <p className="set-lead">{t('set.alertsLead')}</p>
                </div>
              </div>

              <div className="set-toggles-list">
                {[
                  {
                    key: 'alertsWeather',
                    icon: '⛈️',
                    title: t('set.alertWeatherTitle'),
                    desc: t('set.alertWeatherDesc'),
                  },
                  {
                    key: 'alertsPests',
                    icon: '🐛',
                    title: t('set.alertPestsTitle'),
                    desc: t('set.alertPestsDesc'),
                  },
                  {
                    key: 'alertsStages',
                    icon: '📅',
                    title: t('set.alertStagesTitle'),
                    desc: t('set.alertStagesDesc'),
                  },
                  {
                    key: 'alertsMarket',
                    icon: '📈',
                    title: t('set.alertMarketTitle'),
                    desc: t('set.alertMarketDesc'),
                  },
                ].map((item) => (
                  <div key={item.key} className="set-toggle-row">
                    <span className="set-toggle-icon">{item.icon}</span>
                    <div className="set-toggle-text">
                      <h4>{item.title}</h4>
                      <p>{item.desc}</p>
                    </div>
                    <label className="set-switch" aria-label={item.title}>
                      <input
                        type="checkbox"
                        checked={Boolean(prefs[item.key])}
                        onChange={(e) => updatePref(item.key, e.target.checked)}
                      />
                      <span className="set-slider" />
                    </label>
                  </div>
                ))}
              </div>

              {prefSaved && (
                <p className="set-ok" style={{ marginTop: '18px' }}>
                  {t('set.prefSaved')}
                </p>
              )}

              <div className="set-form-actions" style={{ marginTop: '22px' }}>
                <motion.button
                  className="btn btn-primary auth-submit"
                  type="button"
                  onClick={handleSavePrefs}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('set.savePref')}
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* TAB 4: Security & 2FA */}
          {activeTab === 'security' && (
            <motion.section
              key="security"
              className="set-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-card-header">
                <div>
                  <h3>{t('set.secTitle')}</h3>
                  <p className="set-lead">{t('set.secLead')}</p>
                </div>
              </div>

              {/* 2FA Status Card */}
              <div className="set-sec-banner">
                <div className="set-sec-icon-wrap">🛡️</div>
                <div className="set-sec-copy">
                  <div className="set-sec-title-row">
                    <h4>{t('set.secStatusTitle')}</h4>
                    <span className="set-status-badge is-active">
                      ● {t('set.secStatusActive')}
                    </span>
                  </div>
                  <p>{t('set.secStatusDesc')}</p>
                  <span className="set-defense-note">
                    🔒 {t('set.secStatusShield')}
                  </span>
                </div>
              </div>

              {/* Session Protection Card */}
              <div className="set-session-banner">
                <div className="set-session-icon">💻</div>
                <div className="set-session-copy">
                  <h4>{t('set.secSessionTitle')}</h4>
                  <p>{t('set.secSessionDesc')}</p>
                </div>
              </div>

              {/* Change Password Form */}
              <div className="set-pw-section">
                <h4 className="set-section-subhead">{t('set.pwTitle')}</h4>
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

                  {pwError && (
                    <p className="auth-error" role="alert">
                      {message(pwError)}
                    </p>
                  )}
                  {pwSaved && !pwError && (
                    <p className="set-ok" role="status">
                      {t('set.pwSaved')}
                    </p>
                  )}

                  <motion.button
                    className="btn btn-primary auth-submit"
                    type="submit"
                    disabled={pwBusy}
                    whileHover={{ scale: pwBusy ? 1 : 1.02 }}
                    whileTap={{ scale: pwBusy ? 1 : 0.98 }}
                  >
                    {pwBusy ? t('auth.busy') : t('set.savePw')}
                  </motion.button>
                </form>
              </div>
            </motion.section>
          )}

          {/* TAB 5: Data & Farm Records */}
          {activeTab === 'data' && (
            <motion.section
              key="data"
              className="set-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-card-header">
                <div>
                  <h3>{t('set.dataTitle')}</h3>
                  <p className="set-lead">{t('set.dataLead')}</p>
                </div>
              </div>

              <div className="set-export-grid">
                <div className="set-export-box">
                  <div className="set-export-icon">📑</div>
                  <h4>{t('set.exportJson')}</h4>
                  <p>{t('set.exportHint')}</p>
                  <button
                    type="button"
                    className="btn btn-ghost-dark set-export-btn"
                    onClick={exportJson}
                  >
                    ⬇ {t('set.exportJson')}
                  </button>
                </div>

                <div className="set-export-box">
                  <div className="set-export-icon">📊</div>
                  <h4>{t('set.exportCsv')}</h4>
                  <p>Tabular spreadsheet suitable for Excel, Google Sheets, or Bank loan audit.</p>
                  <button
                    type="button"
                    className="btn btn-ghost-dark set-export-btn"
                    onClick={exportCsv}
                  >
                    ⬇ {t('set.exportCsv')}
                  </button>
                </div>
              </div>

              <div className="set-cache-box">
                <div className="set-cache-info">
                  <h4>{t('set.clearCache')}</h4>
                  <p>Re-synchronize crop schedules, weather data, and diagnostics from server.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary set-cache-btn"
                  onClick={clearCache}
                >
                  🔄 {t('set.clearCache')}
                </button>
              </div>

              {exportNotice && <p className="set-ok" style={{ marginTop: '18px' }}>{exportNotice}</p>}
            </motion.section>
          )}

          {/* TAB 6: Danger Zone */}
          {activeTab === 'danger' && (
            <motion.section
              key="danger"
              className="set-card is-danger"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="set-danger-badge">⚠️ Critical Zone</div>
              <h3>{t('set.deleteTitle')}</h3>
              <p className="set-lead">{t('set.deleteLead')}</p>

              <div className="set-danger-warning-box">
                <ul>
                  <li>Your user account and cryptographic session credentials will be permanently erased.</li>
                  <li>All active crop monitors ({activeCount} active plans) will be terminated.</li>
                  <li>Historical yields, input expenses, and field journal archives will be purged.</li>
                </ul>
              </div>

              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeletePw('');
                  setDeleteError('');
                }}
              >
                🗑️ {t('set.deleteBtn')}
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleteBusy) setShowDeleteModal(false);
            }}
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

                {deleteError && (
                  <p className="auth-error" style={{ marginTop: '12px' }} role="alert">
                    {message(deleteError)}
                  </p>
                )}

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
