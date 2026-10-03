import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const USER = process.env.ADMIN_USER || 'admin';
const PASS = process.env.ADMIN_PASSWORD || 'admin123';
const SECRET = process.env.AUTH_SECRET || randomBytes(32).toString('hex');
if (!process.env.ADMIN_PASSWORD) console.warn('[auth] ADMIN_PASSWORD not set - using the default dev password "admin123". Set it in production!');

const sign = (p) => createHmac('sha256', SECRET).update(p).digest('base64url');
const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

export function login(user, pass) {
  if (!eq(String(user), USER) || !eq(String(pass), PASS)) return null;
  const payload = Buffer.from(JSON.stringify({ u: user, exp: Date.now() + 12 * 3600e3 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function requireAdmin(req, res, next) {
  const [payload, sig] = (req.headers.authorization || '').replace(/^Bearer /, '').split('.');
  try {
    if (payload && sig && eq(sig, sign(payload)) && JSON.parse(Buffer.from(payload, 'base64url')).exp > Date.now()) return next();
  } catch { /* fallthrough */ }
  res.status(401).json({ error: 'Unauthorized' });
}
