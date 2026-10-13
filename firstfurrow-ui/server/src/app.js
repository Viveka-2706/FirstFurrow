import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { HttpError } from './errors.js';
import { createMailer } from './mail/mailer.js';
import { authRoutes } from './routes/auth.js';
import { planRoutes } from './routes/plans.js';
import { cropRoutes } from './routes/crops.js';
import { referenceRoutes } from './routes/reference.js';
import { symptomRoutes } from './routes/symptoms.js';

const limiter = ({ windowMs, limit }, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({ error: message, code: 'rate_limited' }),
  });

// `repo` is the data layer (MongoDB or in-memory) and `config` comes from loadConfig() — both are
// passed in so tests can build the whole API without a database or environment variables.
export function createApp(repo, config, { mailer = createMailer(config) } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', config.trustProxy); // so rate limits see the real client IP behind a host's proxy

  app.use(
    helmet({
      // The built React app is served from this same server, so the policy has to allow what it uses:
      // Google Fonts, remote images, and the Open-Meteo weather API.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://api.open-meteo.com'],
          objectSrc: ["'none'"],
          frameAncestors: ["'self'"],
          upgradeInsecureRequests: config.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // the API may be called from a separately hosted frontend
    })
  );

  // Same-origin deployments need no CORS. Allow other origins only when explicitly listed (or in development).
  if (config.clientOrigins.length) app.use(cors({ origin: config.clientOrigins }));
  else if (!config.isProd) app.use(cors());

  app.use(express.json({ limit: '100kb' }));

  // platform health check — before the rate limiter so it is never throttled
  app.get('/api/health', async (_req, res) => {
    const up = await repo.ping().catch(() => false);
    res.status(up ? 200 : 503).json({ ok: up, db: up ? 'connected' : 'disconnected', store: repo.kind });
  });

  app.use('/api', limiter(config.rateLimits.api, 'Too many requests. Please slow down.'));
  const authLimit = limiter(config.rateLimits.auth, 'Too many attempts. Please wait a few minutes and try again.');
  app.use('/api/auth/login', authLimit);
  app.use('/api/auth/signup', authLimit);
  app.use('/api/auth/reset-password', authLimit);
  app.use('/api/auth/change-password', authLimit); // each try checks the current password, so guessing is limited like logging in
  app.use('/api/auth/profile', authLimit);
  // asking for reset emails is limited much harder than logging in
  app.use('/api/auth/forgot-password', limiter(config.rateLimits.forgot ?? config.rateLimits.auth, 'Too many reset requests. Please wait a few minutes and try again.'));

  const auth = authRoutes(repo, config, mailer);
  app.locals.idle = auth.idle;
  app.use('/api/auth', auth);
  app.use('/api/plans', planRoutes(repo, config));
  app.use('/api/crops', cropRoutes(repo));
  app.use('/api/reference', referenceRoutes(repo));
  app.use('/api/symptoms', symptomRoutes(repo));
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found', code: 'not_found' }));

  // Serve the built React app when it exists (single-service deployment). Skipped if frontend is hosted elsewhere.
  const indexHtml = path.join(config.clientDir, 'index.html');
  if (config.serveClient && fs.existsSync(indexHtml)) {
    app.use('/assets', express.static(path.join(config.clientDir, 'assets'), { immutable: true, maxAge: '1y' })); // hashed filenames
    app.use(express.static(config.clientDir, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.set('Cache-Control', 'no-cache'); // always fetch the latest index.html so new deploys show up
      res.sendFile(indexHtml);
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, code: err.code });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON', code: 'validation' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Request too large', code: 'too_large' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.', code: 'server_error' });
  });

  return app;
}
