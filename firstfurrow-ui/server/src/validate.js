import { badRequest } from './errors.js';

// Strict type checks. Everything from the network is untrusted — in particular, a value like
// {"$gt": ""} must never reach a database query where a string is expected (NoSQL injection).
export const isStr = (v) => typeof v === 'string';
export const isObjectId = (v) => isStr(v) && /^[a-f0-9]{24}$/i.test(v);

export function str(v, field, { min = 1, max = 200 } = {}) {
  if (!isStr(v)) throw badRequest(`${field} must be text`);
  const s = v.trim();
  if (s.length < min) throw badRequest(`${field} is required`);
  if (s.length > max) throw badRequest(`${field} is too long`);
  return s;
}

export function num(v, field, { min = -Infinity, max = Infinity } = {}) {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw badRequest(`${field} must be a number`);
  if (v < min || v > max) throw badRequest(`${field} must be between ${min} and ${max}`);
  return v;
}

export function objectId(v, what = 'id') {
  if (!isObjectId(v)) throw badRequest(`Invalid ${what}`, 'bad_id');
  return v;
}
