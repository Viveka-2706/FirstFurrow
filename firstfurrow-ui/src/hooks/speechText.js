// Turns on-screen text into text that a speech engine reads naturally.
// Screen text is full of symbols (₹, –, °C, %) and abbreviations (செ.மீ, cm, NPK)
// that TTS engines skip or mispronounce, so we spell them out in the sentence's own language.

const TAMIL = /[\u0B80-\u0BFF]/;
export const isTamil = (s) => TAMIL.test(s);

const stripEmoji = (s) => s.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '');
const num = String.raw`\d[\d,]*(?:\.\d+)?`;
const clean = (n) => n.replace(/,/g, '');

function tamil(s) {
  return s
    // money: "₹800–1,200" → "800 முதல் 1200 ரூபாய்"
    .replace(new RegExp(`₹\\s*(${num})\\s*[–—-]\\s*₹?\\s*(${num})`, 'g'), (_, a, b) => `${clean(a)} முதல் ${clean(b)} ரூபாய்`)
    .replace(new RegExp(`₹\\s*(${num})`, 'g'), (_, a) => `${clean(a)} ரூபாய்`)
    // ranges: "30–40" → "30 முதல் 40"
    .replace(new RegExp(`(${num})\\s*[–—-]\\s*(${num})`, 'g'), (_, a, b) => `${clean(a)} முதல் ${clean(b)}`)
    .replace(/(\d)\s*°\s*C/g, '$1 டிகிரி செல்சியஸ்')
    .replace(/(\d)\s*%/g, '$1 சதவீதம்')
    .replace(/செ\.\s*மீ\.?/g, 'சென்டிமீட்டர்')
    .replace(/மி\.\s*மீ\.?/g, 'மில்லிமீட்டர்')
    .replace(/மி\.\s*லி\.?/g, 'மில்லிலிட்டர்')
    .replace(/(\d)\s*g\b/g, '$1 கிராம்')
    .replace(/\bNPK\b/g, 'என் பி கே')
    .replace(/\bvs\.?/gi, 'எதிர்')
    .replace(/[()]/g, ', ')
    .replace(/[—–]/g, ', ')
    .replace(/(\d),(\d{3})/g, '$1$2');
}

function english(s) {
  return s
    .replace(new RegExp(`₹\\s*(${num})\\s*[–—-]\\s*₹?\\s*(${num})`, 'g'), (_, a, b) => `${clean(a)} to ${clean(b)} rupees`)
    .replace(new RegExp(`₹\\s*(${num})`, 'g'), (_, a) => `${clean(a)} rupees`)
    .replace(new RegExp(`(${num})\\s*[–—-]\\s*(${num})`, 'g'), (_, a, b) => `${clean(a)} to ${clean(b)}`)
    .replace(/(\d)\s*°\s*C/g, '$1 degrees Celsius')
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/(\d)\s*cm\b/g, '$1 centimetres')
    .replace(/(\d)\s*mm\b/g, '$1 millimetres')
    .replace(/(\d)\s*ml\b/g, '$1 millilitres')
    .replace(/(\d)\s*kg\b/g, '$1 kilograms')
    .replace(/(\d)\s*g\b/g, '$1 grams')
    .replace(/\bNPK\b/g, 'N P K')
    .replace(/\bm²|\bsq\.? ?m\b/g, 'square metre')
    .replace(/&/g, ' and ')
    .replace(/\bvs\.?/gi, 'versus')
    .replace(/[()]/g, ', ')
    .replace(/[—–]/g, ', ')
    .replace(/(\d),(\d{3})/g, '$1$2');
}

export function normalizeForSpeech(sentence) {
  const s = stripEmoji(sentence).replace(/\s+/g, ' ').trim();
  return isTamil(s) ? tamil(s) : english(s);
}

// Sentence-sized pieces. Browsers cut long utterances off after ~15s, and it also
// lets every sentence be spoken in its own language.
export function splitSentences(text) {
  return stripEmoji(text)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?।])\s+/)
    .flatMap((sentence) => {
      if (sentence.length <= 200) return [sentence];
      // very long sentence: break at clause boundaries
      const parts = sentence.split(/(?<=[,;:—])\s+/);
      const out = [];
      let cur = '';
      for (const p of parts) {
        if (cur && (cur + ' ' + p).length > 200) { out.push(cur); cur = p; } else cur = cur ? `${cur} ${p}` : p;
      }
      if (cur) out.push(cur);
      return out;
    })
    .filter((s) => /[\p{L}\p{N}]/u.test(s));
}
