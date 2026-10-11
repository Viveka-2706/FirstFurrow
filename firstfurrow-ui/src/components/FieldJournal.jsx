import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import './FieldJournal.css';

const PROMPT_KEYS = ['journal.p1', 'journal.p2', 'journal.p3', 'journal.p4'];

export default function FieldJournal({ entries, onAdd, onDelete }) {
  const { t, locale } = useLang();
  const [text, setText] = useState('');
  const promptIdx = entries.length % PROMPT_KEYS.length;

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
  };

  return (
    <div className="journal">
      <form className="journal-form" onSubmit={submit}>
        <span className="journal-prompt">💭 {t(PROMPT_KEYS[promptIdx])}</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('journal.placeholder')}
          rows={3}
        />
        <motion.button className="btn btn-dark journal-submit" type="submit" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          {t('journal.add')}
        </motion.button>
      </form>

      <div className="journal-list">
        {entries.length === 0 ? (
          <p className="journal-empty">{t('journal.empty')}</p>
        ) : (
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                className="journal-entry"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                layout
              >
                <div className="journal-entry-head">
                  <span className="journal-entry-date">
                    {new Date(entry.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(entry.date).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button className="journal-entry-delete" onClick={() => onDelete(entry.id)} aria-label={t('journal.deleteAria')}>✕</button>
                </div>
                <p className="journal-entry-text">{entry.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
