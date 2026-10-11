import { useEffect, useState } from 'react';
import { useLang } from '../i18n/useLang';
import { useSpeech } from '../hooks/useSpeech';
import { isTamil } from '../hooks/speechText';
import './ReadAloud.css';

// variant "icon": small round button that sits beside existing controls (tracker).
// variant "pill": labelled button for cards.
export default function ReadAloud({ text, variant = 'pill' }) {
  const { t } = useLang();
  const { supported, speaking, speak, stop, missingTamilVoice } = useSpeech();
  const [noteFor, setNoteFor] = useState(null); // the passage the note belongs to
  const showNote = noteFor === text;

  // stop when the passage changes (next stage, other language)
  useEffect(() => { stop(); }, [text, stop]);

  if (!supported) return null;

  const toggle = () => {
    if (speaking) { stop(); return; }
    setNoteFor(missingTamilVoice && isTamil(text) ? text : null);
    speak(text);
  };

  const label = speaking ? t('speak.stop') : t('speak.read');
  const glyph = speaking ? (
    <span className="ra-bars" aria-hidden="true"><i /><i /><i /></span>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );

  return (
    <div className={`ra ra-${variant}`}>
      <button type="button" className={`ra-btn ${speaking ? 'is-speaking' : ''}`} onClick={toggle} aria-pressed={speaking} aria-label={label} title={label}>
        {glyph}
        {variant === 'pill' && <span>{label.replace(/^[^\p{L}]+/u, '')}</span>}
      </button>
      {showNote && (
        <p className="ra-note" role="status">
          {t('speak.noVoice')}
          <button type="button" onClick={() => setNoteFor(null)} aria-label={t('cancel')}>✕</button>
        </p>
      )}
    </div>
  );
}
