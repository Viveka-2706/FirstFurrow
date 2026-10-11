import { useCallback, useEffect, useRef, useState } from 'react';
import { isTamil, normalizeForSpeech, splitSentences } from './speechText';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

const norm = (v) => v.lang.replace('_', '-').toLowerCase();

// Higher = better. Prefers the exact regional accent, then natural/online voices
// (Google / Microsoft "Natural") over the robotic offline ones.
function score(v, target) {
  const lang = norm(v);
  const t = target.toLowerCase();
  let s = 0;
  if (lang === t) s += 100;
  else if (lang.split('-')[0] === t.split('-')[0]) s += 40;
  else return -1;
  if (/natural|neural|online/i.test(v.name)) s += 30;
  if (/google/i.test(v.name)) s += 20;
  if (/microsoft/i.test(v.name)) s += 10;
  if (!v.localService) s += 5;
  return s;
}

function pickVoice(voices, targets) {
  for (const target of targets) {
    const ranked = voices.map((v) => [score(v, target), v]).filter(([s]) => s >= 100).sort((a, b) => b[0] - a[0]);
    if (ranked.length) return ranked[0][1];
  }
  // no exact regional voice: any voice in the same language family
  for (const target of targets) {
    const ranked = voices.map((v) => [score(v, target), v]).filter(([s]) => s >= 40).sort((a, b) => b[0] - a[0]);
    if (ranked.length) return ranked[0][1];
  }
  return null;
}

// Browser text-to-speech (Web Speech API) — no key, no backend.
// Every sentence is spoken with the voice, accent and pace that suits ITS language:
// Tamil script → a Tamil (ta-IN) voice; everything else → Indian English (en-IN),
// which is the accent a Tamil Nadu farmer is used to hearing.
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const tokenRef = useRef(0);

  useEffect(() => {
    if (!supported) return undefined;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const tamilVoice = pickVoice(voices, ['ta-IN', 'ta-LK', 'ta']);
  const englishVoice = pickVoice(voices, ['en-IN', 'en-GB', 'en-US']);
  const voicesReady = voices.length > 0;

  const stop = useCallback(() => {
    if (!supported) return;
    tokenRef.current += 1;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text) => {
      if (!supported || !text) return;
      window.speechSynthesis.cancel();
      const token = ++tokenRef.current;
      const sentences = splitSentences(text);
      if (!sentences.length) return;
      setSpeaking(true);

      sentences.forEach((sentence, i) => {
        const ta = isTamil(sentence);
        const u = new SpeechSynthesisUtterance(normalizeForSpeech(sentence));
        u.lang = ta ? 'ta-IN' : 'en-IN';
        const voice = ta ? tamilVoice : englishVoice;
        if (voice) u.voice = voice;
        // Tamil is clearer a touch slower; English instructions a bit brisker.
        u.rate = ta ? 0.86 : 0.93;
        u.pitch = 1;
        u.onend = () => {
          if (token === tokenRef.current && i === sentences.length - 1) setSpeaking(false);
        };
        u.onerror = () => {
          if (token === tokenRef.current) setSpeaking(false);
        };
        window.speechSynthesis.speak(u);
      });
    },
    [tamilVoice, englishVoice]
  );

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, []);

  return {
    supported,
    speaking,
    speak,
    stop,
    // true only once the voice list has loaded and no Tamil voice exists
    missingTamilVoice: voicesReady && !tamilVoice,
  };
}
