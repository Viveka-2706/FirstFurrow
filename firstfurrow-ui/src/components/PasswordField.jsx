import { useState } from 'react';
import { useLang } from '../i18n/useLang';
import './PasswordField.css';

export default function PasswordField({
  value = '',
  onChange,
  placeholder = '••••••••',
  minLength = 8,
  maxLength = 72,
  autoComplete = 'current-password',
  required = true,
  showRules = false,
  id,
  className = '',
}) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  const hasLength = value.length >= 8 && value.length <= 72;
  const hasLetter = /[a-zA-Z]/.test(value);
  const hasNumber = /[0-9]/.test(value);

  return (
    <div className="pw-field-container">
      <div className="pw-wrapper">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          required={required}
          className={className}
        />
        <button
          type="button"
          className="pw-toggle-btn"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.hidePw') : t('auth.showPw')}
          title={visible ? t('auth.hidePw') : t('auth.showPw')}
          tabIndex={-1}
        >
          {visible ? (
            // Eye-off icon (slash)
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // Eye icon (open)
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {showRules && (
        <div className="pw-rules" aria-live="polite">
          <span className={`pw-rule-item ${hasLength ? 'is-valid' : ''}`}>
            {hasLength ? '✓' : '○'} 8+ chars
          </span>
          <span className={`pw-rule-item ${hasLetter ? 'is-valid' : ''}`}>
            {hasLetter ? '✓' : '○'} 1 letter
          </span>
          <span className={`pw-rule-item ${hasNumber ? 'is-valid' : ''}`}>
            {hasNumber ? '✓' : '○'} 1 number
          </span>
        </div>
      )}
    </div>
  );
}
