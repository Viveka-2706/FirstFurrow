import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { fetchSymptoms, diagnose } from '../api/symptoms';
import ReadAloud from './ReadAloud';
import './SymptomChecker.css';

export default function SymptomChecker({ crop, onSaveToJournal }) {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState([]);
  const [results, setResults] = useState(null); // null = not run yet
  const [savedId, setSavedId] = useState(null);
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  // The tick-list comes from the database, already limited to signs that make sense for this crop
  // (no "tall stalk" for okra). Tagged with the crop it was loaded for, so switching crops shows "loading".
  const [list, setList] = useState({ cropId: null, groups: [], error: false });
  useEffect(() => {
    const controller = new AbortController();
    fetchSymptoms(crop.id, controller.signal)
      .then((groups) => setList({ cropId: crop.id, groups, error: false }))
      .catch((err) => { if (err.name !== 'AbortError') setList({ cropId: crop.id, groups: [], error: true }); });
    return () => controller.abort();
  }, [crop.id]);
  const loadingList = list.cropId !== crop.id;
  const groups = useMemo(() => (loadingList ? [] : list.groups), [loadingList, list.groups]);
  const label = (id) => groups.flatMap((g) => g.items).find((s) => s.id === id)?.[lang] ?? id;

  const toggle = (id) => {
    setResults(null);
    setSavedId(null);
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };
  const run = async () => {
    if (!selected.length || checking) return;
    setChecking(true);
    setFailed(false);
    try {
      setResults(await diagnose(crop.id, selected));
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };
  const clear = () => { setSelected([]); setResults(null); setSavedId(null); setFailed(false); };

  const saveToJournal = (r) => {
    onSaveToJournal(t('sym.journalNote', { symptoms: selected.map(label).join('; '), problem: r.problem[lang].name }));
    setSavedId(r.problem.id);
  };

  const spokenText = (r) => {
    const c = r.problem[lang];
    return [t('sym.aloudIntro', { problem: c.name }), `${t('sym.cause')}. ${c.cause}`, `${t('sym.fix')}. ${c.fix.join(' ')}`].join(' ');
  };

  return (
    <div className="symptom">
      <div className="symptom-intro">
        <h3>{t('sym.title')}</h3>
        <p>{t('sym.sub', { crop: crop.localName })}</p>
      </div>

      {loadingList && <p className="symptom-status">{t('sym.loading')}</p>}
      {!loadingList && list.error && <p className="symptom-status is-error">{t('sym.loadError')}</p>}

      <div className="symptom-groups">
        {groups.map((g) => (
          <section key={g.id} className="symptom-group">
            <h4 className="symptom-group-title">{g[lang]}</h4>
            <div className="symptom-chips">
              {g.items.map((s) => {
                const on = selected.includes(s.id);
                return (
                  <button key={s.id} type="button" className={`symptom-chip ${on ? 'is-on' : ''}`} onClick={() => toggle(s.id)} aria-pressed={on}>
                    <span className="symptom-chip-mark" aria-hidden="true">{on ? '✓' : s.icon}</span>
                    <span>{s[lang]}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="symptom-bar">
        <span className="symptom-count">{selected.length ? t('sym.selected', { n: selected.length }) : t('sym.pickFirst')}</span>
        <div className="symptom-bar-actions">
          <button className="btn btn-ghost-dark" type="button" onClick={clear} disabled={!selected.length && !results}>{t('sym.clear')}</button>
          <button className="btn btn-primary" type="button" onClick={run} disabled={!selected.length || checking}>{checking ? t('sym.checking') : t('sym.diagnose')}</button>
        </div>
      </div>
      {failed && <p className="symptom-status is-error">{t('sym.checkError')}</p>}

      <AnimatePresence>
        {results && (
          <motion.div className="symptom-results" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <h4 className="symptom-results-title">{t('sym.results')}</h4>
            {results.length === 0 && <p className="symptom-nomatch">{t('sym.noMatch')}</p>}
            {results.map((r) => {
              const c = r.problem[lang];
              return (
                <article key={r.problem.id} className="symptom-card">
                  <header className="symptom-card-head">
                    <span className="symptom-card-icon" aria-hidden="true">{r.problem.icon}</span>
                    <div>
                      <h5>{c.name}</h5>
                      <div className="symptom-badges">
                        <span className={`symptom-badge conf-${r.confidence}`}>{t(`sym.conf.${r.confidence}`)}</span>
                        <span className={`symptom-badge sev-${r.problem.severity}`}>{t(`sym.severity.${r.problem.severity}`)}</span>
                      </div>
                    </div>
                    <ReadAloud text={spokenText(r)} variant="icon" />
                  </header>
                  <div className="symptom-block">
                    <span className="symptom-label">{t('sym.cause')}</span>
                    <p>{c.cause}</p>
                  </div>
                  <div className="symptom-block">
                    <span className="symptom-label">{t('sym.fix')}</span>
                    <ol>{c.fix.map((step) => <li key={step}>{step}</li>)}</ol>
                  </div>
                  <div className="symptom-block symptom-tip">
                    <span className="symptom-label">{t('sym.prevent')}</span>
                    <p>{c.prevent}</p>
                  </div>
                  <button type="button" className="btn btn-ghost-dark symptom-save" onClick={() => saveToJournal(r)} disabled={savedId === r.problem.id}>
                    {savedId === r.problem.id ? t('sym.saved') : t('sym.saveJournal')}
                  </button>
                </article>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="symptom-disclaimer">{t('sym.disclaimer')}</p>
    </div>
  );
}
