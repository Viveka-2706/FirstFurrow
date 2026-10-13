import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);

// All environment handling lives here so the rest of the code never touches process.env.
export function loadConfig(env = process.env) {
  const isProd = env.NODE_ENV === 'production';

  let jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProd) throw new Error('JWT_SECRET is not set. Generate one: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    jwtSecret = 'dev-only-insecure-secret-do-not-use-in-production';
  }
  if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters in production.');

  const smtpPort = Number(env.SMTP_PORT) || 465;
  const mailUser = (env.MAIL_USER || '').trim();

  return {
    isProd,
    port: Number(env.PORT) || 5000,
    mongoUri: env.MONGODB_URI || '',
    useMemoryDb: env.USE_MEMORY_DB === 'true' && !isProd, // demo mode only — never in production
    jwtSecret,
    jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: isProd ? 12 : 10,
    // Where the website lives — reset links in emails point here. Taken from config, never from the request,
    // so nobody can poison a link by sending a fake Host header.
    appUrl: (env.APP_URL || (isProd ? '' : 'http://localhost:5173')).trim().replace(/\/+$/, ''),
    // Outgoing email (password-reset links). Gmail by default: MAIL_USER + a Google "App password".
    // Set SMTP_HOST to use any other provider instead.
    mail: {
      user: mailUser,
      pass: (env.MAIL_APP_PASSWORD || '').replace(/\s+/g, ''), // Google shows app passwords in 4 groups; spaces are not part of it
      from: env.MAIL_FROM || (mailUser ? `FirstFurrow <${mailUser}>` : ''),
      brevoKey: (env.BREVO_API_KEY || '').trim(), // email over HTTPS (works on free Render, where SMTP is blocked)
      host: env.SMTP_HOST || '',
      port: smtpPort,
      secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : smtpPort === 465,
    },
    resetTokenMinutes: Number(env.RESET_TOKEN_MINUTES) || 30,
    resetCooldownSeconds: 60, // at most one reset email per account per minute (stops email-bombing)
    verificationCodeMinutes: Number(env.VERIFICATION_CODE_MINUTES) || 15,
    verificationCooldownSeconds: 60, // 1 minute cooldown between resending codes
    maxFailedLogins: Number(env.MAX_FAILED_LOGINS) || 5,
    lockoutMinutes: Number(env.LOCKOUT_MINUTES) || 10,
    skipEmailVerification: env.SKIP_EMAIL_VERIFICATION === 'true',
    clientOrigins: list(env.CLIENT_ORIGIN), // only needed when the frontend is hosted on a different domain
    clientDir: env.CLIENT_DIST ? path.resolve(env.CLIENT_DIST) : path.resolve(here, '../../dist'),
    serveClient: env.SERVE_CLIENT !== 'false',
    trustProxy: env.TRUST_PROXY === undefined ? 1 : Number(env.TRUST_PROXY), // hosts like Render/Railway sit behind one proxy
    maxPlansPerUser: 50,
    rateLimits: {
      auth: { windowMs: 15 * 60 * 1000, limit: 30 },
      api: { windowMs: 15 * 60 * 1000, limit: 600 },
      forgot: { windowMs: 15 * 60 * 1000, limit: 5 },
    },
  };
}
