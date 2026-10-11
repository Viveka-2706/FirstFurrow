import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCrops } from '../seed/build-crops.js';
import { loadSeedForMemory } from '../seed/load.js';
import { loadConfig } from '../src/config.js';
import { createApp } from '../src/app.js';
import { createMemoryRepo } from '../src/repo/memory.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, '..', 'seed', 'data', f), 'utf8'));

export const dataset = read('crop_dataset.json');
export const rich = read('rich_guides.json');
export const docs = buildCrops(dataset, rich);
export const apiCrops = docs.map(({ _id, ...rest }) => ({ id: _id, ...rest }));
export const seed = loadSeedForMemory();

export function testConfig(overrides = {}) {
  return {
    ...loadConfig({ JWT_SECRET: 'test-secret-test-secret-test-secret-123' }),
    bcryptRounds: 4, // fast hashing for tests
    rateLimits: { auth: { windowMs: 60000, limit: 10000 }, api: { windowMs: 60000, limit: 10000 }, forgot: { windowMs: 60000, limit: 10000 } },
    appUrl: 'https://farm.example.com',
    serveClient: false,
    ...overrides,
  };
}

// Starts the real Express app on a random port, backed by an in-memory data layer.
export async function startApp(overrides = {}) {
  const repo = createMemoryRepo(seed);
  const config = testConfig(overrides);
  // a fake mailbox: every email the server "sends" lands in `outbox` instead of going out
  const outbox = [];
  const mailer = { kind: 'memory', fail: false, send: async (m) => { if (mailer.fail) throw new Error('mail server is down'); outbox.push(m); } };
  const expressApp = createApp(repo, config, { mailer });
  const server = await new Promise((resolve) => { const s = expressApp.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;

  const request = async (method, url, { body, token, headers = {}, raw } = {}) => {
    if (method === 'GET' || method === 'HEAD') { body = undefined; raw = undefined; } // fetch refuses bodies on GET
    const res = await fetch(base + url, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
      body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
    return { status: res.status, body: json, text, headers: res.headers };
  };

  let counter = 0;
  // registers a fresh farmer and returns their token
  const signup = async (name = 'Test Farmer') => {
    const email = `farmer${++counter}-${Math.random().toString(36).slice(2, 7)}@example.com`;
    const r = await request('POST', '/api/auth/signup', { body: { name, email, password: 'correct-horse' } });
    return { token: r.body.token, user: r.body.user, email, password: 'correct-horse' };
  };

  return { repo, config, base, request, signup, outbox, mailer, idle: () => expressApp.locals.idle(), close: () => new Promise((r) => server.close(r)) };
}

// a valid plan request body
export const planBody = (over = {}) => ({ cropId: 'okra', land: 0.5, soilId: 'red', region: 'Coimbatore', season: 'Kharif (Jun–Oct)', ...over });

export function tempClientDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-client-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>FirstFurrow</title><div id="root"></div>');
  fs.writeFileSync(path.join(dir, 'assets', 'app-abc123.js'), 'console.log("hi")');
  return dir;
}
