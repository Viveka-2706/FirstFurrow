import 'dotenv/config';
import mongoose from 'mongoose';
import { loadConfig } from './config.js';
import { createApp } from './app.js';
import { createMailer } from './mail/mailer.js';

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(`Configuration error: ${err.message}`);
  process.exit(1);
}

let repo;
if (config.useMemoryDb) {
  const { createMemoryRepo } = await import('./repo/memory.js');
  const { loadSeedForMemory } = await import('../seed/load.js');
  repo = createMemoryRepo(loadSeedForMemory());
  console.warn('⚠ USE_MEMORY_DB is on: nothing is saved — all accounts and plans vanish when the server stops. Demo mode only.');
} else {
  if (!config.mongoUri) {
    console.error(config.isProd
      ? 'MONGODB_URI is not set. Add it to the environment variables of your host.'
      : 'MONGODB_URI is not set. Copy .env.example to .env and fill it in (or run `npm run dev:memory` for a throw-away demo with no database).');
    process.exit(1);
  }
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    console.error('Local install: is the "mongod" service running?  Atlas: check the password in the URI and that your IP / 0.0.0.0/0 is on the Network Access list.');
    process.exit(1);
  }
  // make sure the unique-email index exists before the first signup is accepted
  const [{ User }, { Plan }, { PasswordReset }, { createMongoRepo }] = await Promise.all([import('./models/User.js'), import('./models/Plan.js'), import('./models/PasswordReset.js'), import('./repo/mongo.js')]);
  await Promise.all([User.init(), Plan.init(), PasswordReset.init()]);
  repo = createMongoRepo();

  const { Crop } = await import('./models/Crop.js');
  if ((await Crop.estimatedDocumentCount()) === 0) {
    console.warn('⚠ The crops collection is empty — run "npm run seed" once, or the recommendation screen will have nothing to show.');
  }
}

const mailer = createMailer(config);
const server = createApp(repo, config, { mailer }).listen(config.port, () => {
  console.log(`FirstFurrow API listening on port ${config.port} (${config.isProd ? 'production' : 'development'})`);
});

// "Forgot password" needs working email and the website's address — check both now, so a mistake shows up
// at start-up and not when a farmer is locked out.
if (mailer.kind === 'none') {
  console.warn('✘ Email is NOT set up: "Forgot password" will show an error. Add MAIL_USER and MAIL_APP_PASSWORD to server/.env (see DEPLOY.md, step 4).');
} else {
  mailer.verify()
    .then(() => console.log(`✔ Email ready — reset links will be sent from ${config.mail.user}`))
    .catch((err) => {
      console.error(`✘ Could not log in to the mail service as ${config.mail.user}: ${err.message}`);
      console.error('  Gmail: use a 16-letter App password (not your normal password); 2-Step Verification must be on. If this is a hosting site, it may block outgoing email.');
    });
}
if (config.isProd && !config.appUrl) console.warn('✘ APP_URL is not set — reset links cannot be built. Set it to your website address, e.g. https://your-app.onrender.com');

// hosts send SIGTERM when redeploying — finish in-flight requests, close the DB, then exit
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down…`);
  server.close(async () => {
    await mongoose.disconnect().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
