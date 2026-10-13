import crypto from 'node:crypto';

// 32 random bytes → 43 URL-safe characters. Unguessable, so the link itself is the proof of owning the mailbox.
export const newToken = () => crypto.randomBytes(32).toString('base64url');
export const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
// only this hash is stored; the real token exists just in the email
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const COPY = {
  en: {
    resetSubject: 'Reset your FirstFurrow password',
    resetIntro: (name) => `Hi ${name},`,
    resetBody: (min) => `We got a request to reset the password for your FirstFurrow account. Open the link below to choose a new one. It works once and expires in ${min} minutes.`,
    resetButton: 'Choose a new password',
    resetIgnore: "If you didn't ask for this, you can ignore this email — your password will not change.",
    changedSubject: 'Your FirstFurrow password was changed',
    changedBody: 'The password for your FirstFurrow account was just changed.',
    changedWarn: "If this wasn't you, reset your password again straight away:",
    emailSubject: 'Your FirstFurrow login email was changed',
    emailBody: (to) => `The login email for your FirstFurrow account was just changed to ${to}. From now on, log in with the new address.`,
    emailWarn: "If this wasn't you, reset your password straight away using the link below, then check your account.",
  },
  ta: {
    resetSubject: 'உங்கள் FirstFurrow கடவுச்சொல்லை மீட்டமைக்க',
    resetIntro: (name) => `வணக்கம் ${name},`,
    resetBody: (min) => `உங்கள் FirstFurrow கணக்கின் கடவுச்சொல்லை மீட்டமைக்க ஒரு கோரிக்கை வந்தது. புதிய கடவுச்சொல்லை அமைக்க கீழுள்ள இணைப்பைத் திறக்கவும். இது ஒரு முறை மட்டுமே செல்லும்; ${min} நிமிடங்களில் காலாவதியாகும்.`,
    resetButton: 'புதிய கடவுச்சொல்லை அமை',
    resetIgnore: 'நீங்கள் இதைக் கேட்கவில்லை என்றால், இந்த மின்னஞ்சலை அலட்சியம் செய்யுங்கள் — உங்கள் கடவுச்சொல் மாறாது.',
    changedSubject: 'உங்கள் FirstFurrow கடவுச்சொல் மாற்றப்பட்டது',
    changedBody: 'உங்கள் FirstFurrow கணக்கின் கடவுச்சொல் இப்போதுதான் மாற்றப்பட்டது.',
    changedWarn: 'இதை நீங்கள் செய்யவில்லை என்றால், உடனே மீண்டும் கடவுச்சொல்லை மீட்டமைக்கவும்:',
    emailSubject: 'உங்கள் FirstFurrow உள்நுழைவு மின்னஞ்சல் மாற்றப்பட்டது',
    emailBody: (to) => `உங்கள் FirstFurrow கணக்கின் உள்நுழைவு மின்னஞ்சல் இப்போதுதான் ${to} என மாற்றப்பட்டது. இனி புதிய முகவரியில் உள்நுழையுங்கள்.`,
    emailWarn: 'இதை நீங்கள் செய்யவில்லை என்றால், கீழுள்ள இணைப்பில் உடனே கடவுச்சொல்லை மீட்டமைத்து, உங்கள் கணக்கைச் சரிபார்க்கவும்.',
  },
};

const wrap = (inner) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1410;line-height:1.6">${inner}</div>`;
const button = (href, label) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#e7a93e;color:#1a1410;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;display:inline-block">${esc(label)}</a></p>`;

export function resetEmail({ lang, name, link, minutes }) {
  const c = COPY[lang] ?? COPY.en;
  const text = `${c.resetIntro(name)}\n\n${c.resetBody(minutes)}\n\n${link}\n\n${c.resetIgnore}\n`;
  const html = wrap(
    `<p>${esc(c.resetIntro(name))}</p><p>${esc(c.resetBody(minutes))}</p>${button(link, c.resetButton)}` +
      `<p style="font-size:13px;color:#666">${esc(link)}</p><p style="font-size:13px;color:#666">${esc(c.resetIgnore)}</p>`
  );
  return { subject: c.resetSubject, text, html };
}

export function changedEmail({ lang, name, forgotUrl }) {
  const c = COPY[lang] ?? COPY.en;
  const text = `${c.resetIntro(name)}\n\n${c.changedBody}\n\n${c.changedWarn}\n${forgotUrl}\n`;
  const html = wrap(`<p>${esc(c.resetIntro(name))}</p><p>${esc(c.changedBody)}</p><p>${esc(c.changedWarn)}</p>${button(forgotUrl, COPY[lang]?.resetButton ?? COPY.en.resetButton)}`);
  return { subject: c.changedSubject, text, html };
}

// Sent to the OLD address when the login email is changed, so a stolen session can't quietly take over an account.
export function emailChangedEmail({ lang, name, newEmail, forgotUrl }) {
  const c = COPY[lang] ?? COPY.en;
  const text = `${c.resetIntro(name)}\n\n${c.emailBody(newEmail)}\n\n${c.emailWarn}\n${forgotUrl}\n`;
  const html = wrap(`<p>${esc(c.resetIntro(name))}</p><p>${esc(c.emailBody(newEmail))}</p><p>${esc(c.emailWarn)}</p>${button(forgotUrl, c.resetButton)}`);
  return { subject: c.emailSubject, text, html };
}
