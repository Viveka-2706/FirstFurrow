import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './LangToggle.css';

// Two-way English / தமிழ் switch. `variant` controls colours: "light" for dark
// backgrounds (landing nav), "dark" for light backgrounds, "floating" for the fixed pill.
export default function LangToggle({ variant = 'dark' }) {
  const { lang, setLang, t } = useLang();
  const options = [
    { id: 'en', label: 'EN' },
    { id: 'ta', label: 'த' },
  ];
  return (
    <div className={`lang-toggle lang-toggle-${variant}`} role="group" aria-label={t('lang.toggleLabel')}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`lang-toggle-btn ${lang === o.id ? 'is-active' : ''}`}
          onClick={() => setLang(o.id)}
          aria-pressed={lang === o.id}
          title={o.id === 'en' ? 'English' : 'தமிழ்'}
        >
          {lang === o.id && <motion.span className="lang-toggle-pill" layoutId={`lang-pill-${variant}`} transition={{ type: 'spring', stiffness: 380, damping: 30 }} />}
          <span className="lang-toggle-text">{o.id === 'en' ? 'English' : 'தமிழ்'}</span>
          <span className="lang-toggle-short">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
