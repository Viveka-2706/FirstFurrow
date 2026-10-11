// Sends email. Three modes, picked from the configuration:
//   brevo BREVO_API_KEY + MAIL_USER (a sender verified in Brevo) → email over HTTPS, so it works on hosts that
//         block SMTP ports (Render's free plan). Checked first.
//   smtp  MAIL_USER + MAIL_APP_PASSWORD are set → real email, delivered to the recipient's inbox
//         (Gmail by default, or SMTP_HOST for another provider)
//   none  no mail settings → nothing can be sent. The server says so at start-up and the
//         "forgot password" screen tells the farmer, instead of pretending an email went out.
// Emails are never printed in the terminal: a reset link in a log file is a secret leaking.
import nodemailer from 'nodemailer';

const BREVO = 'https://api.brevo.com/v3';

// "FirstFurrow <me@gmail.com>" → { name, email }
function parseSender(from, fallbackEmail) {
  const m = /^\s*(?:"?([^"<]*)"?\s*)?<([^>]+)>\s*$/.exec(from || '');
  return m ? { name: (m[1] || '').trim() || 'FirstFurrow', email: m[2].trim() } : { name: 'FirstFurrow', email: fallbackEmail };
}

export function createMailer(config) {
  const { mail } = config;

  if (mail.brevoKey && mail.user) {
    const headers = { 'api-key': mail.brevoKey, accept: 'application/json', 'content-type': 'application/json' };
    const sender = parseSender(mail.from, mail.user);
    return {
      kind: 'brevo',
      async send({ to, subject, text, html }) {
        const res = await fetch(`${BREVO}/smtp/email`, {
          method: 'POST', headers, signal: AbortSignal.timeout(15000),
          body: JSON.stringify({ sender, to: [{ email: to }], subject, textContent: text, htmlContent: html }),
        });
        if (!res.ok) throw new Error(`Brevo rejected the email (${res.status}): ${(await res.text()).slice(0, 200)}`);
      },
      // checks the API key without sending anything
      async verify() {
        const res = await fetch(`${BREVO}/account`, { headers, signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`Brevo API key not accepted (${res.status})`);
      },
    };
  }

  if (mail.user && mail.pass) {
    const common = { auth: { user: mail.user, pass: mail.pass }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };
    const transport = nodemailer.createTransport(
      mail.host ? { host: mail.host, port: mail.port, secure: mail.secure, ...common } : { service: 'gmail', ...common }
    );
    return {
      kind: 'smtp',
      send: (message) => transport.sendMail({ from: mail.from, ...message }),
      // logs in to the mail server without sending anything — used at start-up to catch a wrong app password early
      verify: () => transport.verify(),
    };
  }

  return {
    kind: 'none',
    async send() {
      throw new Error('Email is not configured: set MAIL_USER and MAIL_APP_PASSWORD on the server.');
    },
  };
}
