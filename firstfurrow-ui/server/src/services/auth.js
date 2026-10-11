import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { badRequest, unauthorized } from '../errors.js';
import { isStr } from '../validate.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(v) {
  if (!isStr(v)) throw badRequest('Please enter a valid email address.', 'invalid_email');
  const email = v.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) throw badRequest('Please enter a valid email address.', 'invalid_email');
  return email;
}

export function validatePassword(pw) {
  // bcrypt only looks at the first 72 bytes, so refuse anything longer instead of silently truncating
  if (!isStr(pw) || pw.length < 8 || Buffer.byteLength(pw) > 72) {
    throw badRequest('Password must be 8 to 72 characters.', 'weak_password');
  }
  return pw;
}

export function validateSignup(body = {}) {
  const email = validateEmail(body.email);
  if (!isStr(body.name) || !body.name.trim()) throw badRequest('Please enter your name.', 'validation');
  const name = body.name.trim();
  if (name.length > 80) throw badRequest('That name is too long.', 'validation');
  return { name, email, password: validatePassword(body.password) };
}

export function validateLogin(body = {}) {
  const email = validateEmail(body.email);
  // type check only — wrong passwords must look identical to unknown emails
  if (!isStr(body.password) || !body.password) throw badRequest('Please enter your password.', 'validation');
  return { email, password: body.password };
}

export const hashPassword = (password, rounds) => bcrypt.hash(password, rounds);
export const checkPassword = (password, hash) => bcrypt.compare(password, hash);

export const signToken = (userId, { jwtSecret, jwtExpiresIn }) =>
  jwt.sign({}, jwtSecret, { subject: userId, expiresIn: jwtExpiresIn, algorithm: 'HS256' });

export function verifyToken(token, { jwtSecret }) {
  try {
    const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    return { userId: String(payload.sub), issuedAt: payload.iat }; // iat = seconds since 1970
  } catch {
    throw unauthorized();
  }
}

export const publicUser = ({ id, name, email }) => ({ id, name, email });
