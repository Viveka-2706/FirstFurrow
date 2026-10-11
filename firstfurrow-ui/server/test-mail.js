// Run from the server folder:  node test-mail.js your@email.com
import 'dotenv/config';
import { loadConfig } from './src/config.js';
import { createMailer } from './src/mail/mailer.js';

const to = process.argv[2];
if (!to) { console.log('Usage: node test-mail.js your@email.com'); process.exit(1); }

const config = loadConfig();
const mailer = createMailer(config);
console.log('Mail mode:', mailer.kind, '(should say "brevo")');
console.log('Sender:', config.mail.from || '(none)');
try {
  await mailer.send({ to, subject: 'FirstFurrow test', text: 'Test email from FirstFurrow.', html: '<p>Test email from FirstFurrow.</p>' });
  console.log('DONE: the mail service accepted the email. Check the inbox and Spam of', to);
} catch (e) {
  console.log('FAILED:', e.message);
}
