// Minimal static server for the built app. Privacy by design: it has NO upload endpoint and stores nothing –
// models, textures and exports are processed entirely in the user's browser.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../dist', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.map': 'application/json', '.ico': 'image/x-icon',
};
const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:",
  "connect-src 'self' blob: data:", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'none'", "form-action 'none'",
].join('; ');
const SECURITY = {
  'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', 'Cross-Origin-Opener-Policy': 'same-origin',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD', ...SECURITY }); res.end('Method Not Allowed – this server accepts no uploads.'); return;
  }
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...SECURITY });
    res.end(JSON.stringify({ ok: true, name: 'laser-model-texture-studio', stores: 'nothing' })); return;
  }
  let file = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root)) { res.writeHead(403, SECURITY); res.end('Forbidden'); return; }
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  if (!existsSync(file)) { res.writeHead(404, SECURITY); res.end('Run "npm run build" first.'); return; }
  const type = MIME[extname(file)] ?? 'application/octet-stream';
  const immutable = file.includes(`${join(root, 'assets')}`);
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-store', ...SECURITY });
  if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
});
server.listen(port, host, () => console.log(`Laser Model Texture Studio: http://localhost:${port}`));
