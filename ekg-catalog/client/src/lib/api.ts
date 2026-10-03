import type { Catalog } from './types';

export async function fetchCatalog(machine = 'EKG-10'): Promise<Catalog> {
  const r = await fetch(`/api/catalog?machine=${encodeURIComponent(machine)}`);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json();
}

const TOKEN_KEY = 'ekg-admin-token';
export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t: string | null) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

async function call(path: string, init: RequestInit = {}) {
  const r = await fetch(path, { ...init, headers: { ...(init.body instanceof FormData ? {} : { 'content-type': 'application/json' }), ...(getToken() ? { authorization: `Bearer ${getToken()}` } : {}), ...init.headers } });
  const data = await r.json().catch(() => ({}));
  if (r.status === 401) setToken(null);
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const adminApi = {
  login: async (user: string, password: string) => { const d = await call('/api/auth/login', { method: 'POST', body: JSON.stringify({ user, password }) }); setToken(d.token); },
  upsert: (table: string, row: Record<string, unknown>) => call(`/api/admin/${table}`, { method: 'PUT', body: JSON.stringify(row) }),
  remove: (table: string, id: string) => call(`/api/admin/${table}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  upload: (file: File): Promise<{ url: string; name: string; ext: string }> => { const f = new FormData(); f.append('file', file); return call('/api/admin/upload', { method: 'POST', body: f }); },
};
