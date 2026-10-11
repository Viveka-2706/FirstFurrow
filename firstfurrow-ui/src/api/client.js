// The one place that talks HTTP to the FirstFurrow API.
//  • Development: Vite proxies /api → http://localhost:5000 (vite.config.js), so BASE stays empty.
//  • One-service deployment: the API serves this app, so /api is same-origin — BASE stays empty.
//  • Frontend hosted separately: set VITE_API_URL=https://your-api.example.com at build time.
const BASE = import.meta.env.VITE_API_URL ?? '';
const TOKEN_KEY = 'ff_token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ } };
export const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ } };

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'error' } = {}) {
    super(message);
    this.status = status;
    this.code = code; // 'network' | 'unauthorized' | 'email_taken' | 'bad_credentials' | … (see server/src/errors.js)
  }
}

export async function api(path, { method = 'GET', body, auth = true, signal, announce401 = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = auth ? getToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Could not reach the server.', { code: 'network' });
  }

  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const code = json?.code ?? (res.status >= 500 ? 'server_error' : 'error');
    // an expired or invalid login: forget it, and (unless the caller is just checking quietly) tell the
    // app so it can send the farmer back to the login screen
    if (res.status === 401 && code === 'unauthorized' && auth) {
      clearToken();
      if (announce401) window.dispatchEvent(new Event('ff:unauthorized'));
    }
    throw new ApiError(json?.error ?? `Request failed (${res.status})`, { status: res.status, code });
  }
  return json;
}
