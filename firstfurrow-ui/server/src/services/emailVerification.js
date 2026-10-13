import crypto from 'node:crypto';

// 6-digit numeric verification code
export const newVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000));

// SHA-256 hash of the verification code
export const hashVerificationCode = (code) => crypto.createHash('sha256').update(String(code).trim()).digest('hex');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const COPY = {
  en: {
    verifySubject: 'Verify your FirstFurrow email address',
    verifyIntro: (name) => `Hi ${name},`,
    verifyBody: (min) => `Welcome to FirstFurrow! To protect your account and verify your email address, please use the 6-digit verification code below. It expires in ${min} minutes.`,
    verifyCodeLabel: 'Your verification code:',
    verifyIgnore: "If you did not create a FirstFurrow account, you can safely ignore this email.",
  },
  ta: {
    verifySubject: 'உங்கள் FirstFurrow மின்னஞ்சலைச் சரிபார்க்கவும்',
    verifyIntro: (name) => `வணக்கம் ${name},`,
    verifyBody: (min) => `FirstFurrow-க்கு வரவேற்கிறோம்! உங்கள் கணக்கைப் பாதுகாக்கவும், மின்னஞ்சலைச் சரிபார்க்கவும் கீழுள்ள 6-இலக்க சரிபார்ப்புக் குறியீட்டைப் பயன்படுத்தவும். இது ${min} நிமிடங்களில் காலாவதியாகும்.`,
    verifyCodeLabel: 'உங்கள் சரிபார்ப்புக் குறியீடு:',
    verifyIgnore: 'நீங்கள் FirstFurrow கணக்கை உருவாக்கவில்லை என்றால், இந்த மின்னஞ்சலை அலட்சியம் செய்யலாம்.',
  },
};

const wrap = (inner) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1410;line-height:1.6;border:1px solid #e2ddd3;border-radius:12px;background:#fbf9f5">${inner}</div>`;

export function verificationEmail({ lang = 'en', name, code, minutes = 15 }) {
  const c = COPY[lang] ?? COPY.en;
  const text = `${c.verifyIntro(name)}\n\n${c.verifyBody(minutes)}\n\n${c.verifyCodeLabel} ${code}\n\n${c.verifyIgnore}\n`;
  const html = wrap(
    `<h2 style="color:#2d5016;margin-top:0">FirstFurrow</h2>` +
    `<p>${esc(c.verifyIntro(name))}</p>` +
    `<p>${esc(c.verifyBody(minutes))}</p>` +
    `<div style="background:#eaf2e3;border:2px dashed #6fa347;border-radius:10px;padding:16px;text-align:center;margin:24px 0">` +
      `<span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#2d5016;font-family:monospace">${esc(code)}</span>` +
    `</div>` +
    `<p style="font-size:13px;color:#666">${esc(c.verifyIgnore)}</p>`
  );
  return { subject: c.verifySubject, text, html };
}
