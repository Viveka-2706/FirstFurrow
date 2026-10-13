// Accounts and farm plans, stored in MongoDB through the API.
// Same function names as the old localStorage version (utils/storage.js) — but now async,
// and the data belongs to a real account instead of one browser.
import { api, getToken, setToken, clearToken } from './client';

export const hasSession = () => Boolean(getToken());

export async function signup({ name, email, password, lang }) {
  const res = await api('/auth/signup', { method: 'POST', body: { name, email, password, lang }, auth: false });
  if (res.token) {
    setToken(res.token);
  }
  return res;
}

export async function verifyEmail({ email, code }) {
  const { token, user } = await api('/auth/verify-email', { method: 'POST', body: { email, code }, auth: false });
  setToken(token);
  return user;
}

export async function resendVerification({ email, lang }) {
  return api('/auth/resend-verification', { method: 'POST', body: { email, lang }, auth: false });
}

export async function login({ email, password }) {
  const { token, user } = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  setToken(token);
  return user;
}

export const logout = () => clearToken(); // tokens are stateless: forgetting it is logging out

// null when nobody is logged in or the saved login has expired; throws only if the server can't be reached
export async function getCurrentUser() {
  if (!getToken()) return null;
  try {
    return (await api('/auth/me', { announce401: false })).user; // a stale login at start-up is not an "expired" event
  } catch (err) {
    if (err.code === 'unauthorized') return null;
    throw err;
  }
}

export const getPlans = async () => (await api('/plans')).plans;

// the server fills in the crop (full guide, English + Tamil) from the database — the browser only says which one
export const createPlan = async ({ cropId, land, soilId, region, season }) =>
  (await api('/plans', { method: 'POST', body: { cropId, land, soilId, region, season } })).plan;

export const setStage = async (planId, index, done, actualCost) =>
  (await api(`/plans/${planId}/stages/${index}`, { method: 'PATCH', body: { done, actualCost: actualCost ?? null } })).plan;

export const completePlan = async (planId, profit) =>
  (await api(`/plans/${planId}/complete`, { method: 'POST', body: { profit: profit ?? null } })).plan;

export const deletePlan = (planId) => api(`/plans/${planId}`, { method: 'DELETE' });

export const addJournalEntry = async (planId, text) =>
  (await api(`/plans/${planId}/journal`, { method: 'POST', body: { text } })).plan;

export const deleteJournalEntry = async (planId, entryId) =>
  (await api(`/plans/${planId}/journal/${entryId}`, { method: 'DELETE' })).plan;

// ── Forgot password ─────────────────────────────────────────────────────────
// The server answers the same way whether or not the email has an account (so it can't be used to look people up).
export const requestPasswordReset = (email, lang) => api('/auth/forgot-password', { method: 'POST', body: { email, lang }, auth: false });

export const resetPassword = (token, password, lang) => api('/auth/reset-password', { method: 'POST', body: { token, password, lang }, auth: false });

// ── Settings ────────────────────────────────────────────────────────────────
// name and/or email. Changing the email needs the current password. Resolves to the updated user.
export const updateProfile = async ({ name, email, currentPassword, lang }) =>
  (await api('/auth/profile', { method: 'PATCH', body: { name, email, currentPassword, lang } })).user;

// The server signs every OTHER device out and hands this one a fresh login, which we keep.
export async function changePassword(currentPassword, newPassword, lang) {
  const { token } = await api('/auth/change-password', { method: 'POST', body: { currentPassword, newPassword, lang } });
  setToken(token);
}

// Permanently wipes the user's account and farm data from the database.
export async function deleteAccount(password) {
  const res = await api('/auth/me', { method: 'DELETE', body: { password } });
  clearToken();
  return res;
}
