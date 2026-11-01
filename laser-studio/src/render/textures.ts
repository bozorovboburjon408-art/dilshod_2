// Procedural texture / decal library (no external assets, works offline).
export interface LibTexture { id: string; kind: 'tile' | 'decal'; mm: number; aspect?: number; draw: (c: CanvasRenderingContext2D, w: number, h: number) => void }

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const S = 512;

function speckle(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, light = 255, dark = 0, alpha = 0.08, size = 2) {
  for (let i = 0; i < n; i++) {
    const v = r() < 0.5 ? dark : light;
    c.fillStyle = `rgba(${v},${v},${v},${alpha * (0.4 + r())})`;
    c.fillRect(r() * w, r() * h, size * (0.5 + r()), size * (0.5 + r()));
  }
}
function blotches(c: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, rgb: string, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = 30 + r() * 90;
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { c.save(); c.translate(dx, dy); c.fillRect(x - rad, y - rad, rad * 2, rad * 2); c.restore(); }
  }
}

const tiles: LibTexture[] = [
  { id: 'concrete', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(1); c.fillStyle = '#9b9b97'; c.fillRect(0, 0, w, h);
    blotches(c, w, h, r, 40, '70,70,68', 0.18); blotches(c, w, h, r, 30, '200,200,196', 0.16);
    speckle(c, w, h, r, 9000, 255, 0, 0.18, 2);
    c.strokeStyle = 'rgba(60,60,60,0.35)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  } },
  { id: 'brick', kind: 'tile', mm: 40, draw(c, w, h) {
    const r = rng(2); c.fillStyle = '#cfc6b8'; c.fillRect(0, 0, w, h);
    const rows = 8, cols = 4, bh = h / rows, bw = w / cols;
    for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
      const x = i * bw + (j % 2 ? bw / 2 : 0), y = j * bh;
      const k = 0.75 + r() * 0.3;
      c.fillStyle = `rgb(${Math.round(168 * k)},${Math.round(80 * k)},${Math.round(60 * k)})`;
      c.fillRect(x + 3, y + 3, bw - 6, bh - 6);
    }
    speckle(c, w, h, r, 5000, 255, 0, 0.12, 2);
  } },
  { id: 'metal', kind: 'tile', mm: 50, draw(c, w, h) {
    const r = rng(3); const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#9ea4a9'); g.addColorStop(0.5, '#c6cbcf'); g.addColorStop(1, '#9ea4a9');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { const y = r() * h, v = r() < 0.5 ? 255 : 40; c.fillStyle = `rgba(${v},${v},${v},${0.05 + r() * 0.08})`; c.fillRect(0, y, w, 1 + r()); }
  } },
  { id: 'steel_plate', kind: 'tile', mm: 50, draw(c, w, h) {
    const r = rng(4); c.fillStyle = '#7d868d'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#4b5258'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
    c.fillStyle = '#5a6168';
    for (const [x, y] of [[20, 20], [w - 20, 20], [20, h / 2 - 20], [w - 20, h / 2 - 20], [20, h / 2 + 20], [w - 20, h / 2 + 20], [20, h - 20], [w - 20, h - 20]]) { c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); }
    speckle(c, w, h, r, 4000, 255, 0, 0.1, 2);
  } },
  { id: 'roof_tiles', kind: 'tile', mm: 30, draw(c, w, h) {
    const r = rng(5); c.fillStyle = '#6e2a1d'; c.fillRect(0, 0, w, h);
    const rows = 8, cols = 6, th = h / rows, tw = w / cols;
    for (let j = rows; j >= 0; j--) for (let i = -1; i <= cols; i++) {
      const x = i * tw + (j % 2 ? tw / 2 : 0), y = j * th, k = 0.85 + r() * 0.3;
      c.fillStyle = `rgb(${Math.round(176 * k)},${Math.round(76 * k)},${Math.round(52 * k)})`;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + tw, y); c.lineTo(x + tw, y + th * 0.7); c.arc(x + tw / 2, y + th * 0.7, tw / 2, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(60,20,10,0.55)'; c.lineWidth = 2; c.stroke();
    }
  } },
  { id: 'roof_metal', kind: 'tile', mm: 40, draw(c, w, h) {
    const r = rng(6); const n = 8, sw = w / n;
    for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(i * sw, 0, (i + 1) * sw, 0);
      g.addColorStop(0, '#5f6b76'); g.addColorStop(0.15, '#8795a1'); g.addColorStop(1, '#5a6570');
      c.fillStyle = g; c.fillRect(i * sw, 0, sw, h);
      c.fillStyle = 'rgba(20,25,30,0.55)'; c.fillRect(i * sw, 0, 3, h);
    }
    speckle(c, w, h, r, 3000, 255, 0, 0.07, 2);
  } },
  { id: 'corrugated', kind: 'tile', mm: 50, draw(c, w, h) {
    const n = 16, sw = w / n;
    for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(i * sw, 0, (i + 1) * sw, 0);
      g.addColorStop(0, '#9aa2a8'); g.addColorStop(0.5, '#dfe3e6'); g.addColorStop(1, '#9aa2a8');
      c.fillStyle = g; c.fillRect(i * sw, 0, sw, h);
    }
  } },
  { id: 'asphalt', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(7); c.fillStyle = '#3c3d40'; c.fillRect(0, 0, w, h);
    blotches(c, w, h, r, 25, '90,90,92', 0.2); speckle(c, w, h, r, 16000, 200, 0, 0.35, 2);
  } },
  { id: 'soil', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(8); c.fillStyle = '#6b4a2f'; c.fillRect(0, 0, w, h);
    blotches(c, w, h, r, 50, '60,38,20', 0.35); blotches(c, w, h, r, 40, '140,100,65', 0.25); speckle(c, w, h, r, 9000, 220, 0, 0.3, 3);
  } },
  { id: 'grass', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(9); c.fillStyle = '#4e8a37'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6000; i++) { const x = r() * w, y = r() * h, g = 90 + r() * 90; c.strokeStyle = `rgba(${40 + r() * 40},${g},${30 + r() * 30},0.6)`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 6, y - 6 - r() * 8); c.stroke(); }
  } },
  { id: 'wood', kind: 'tile', mm: 80, draw(c, w, h) {
    const r = rng(10); const n = 6, ph = h / n;
    for (let j = 0; j < n; j++) {
      const k = 0.85 + r() * 0.3; c.fillStyle = `rgb(${Math.round(176 * k)},${Math.round(128 * k)},${Math.round(80 * k)})`; c.fillRect(0, j * ph, w, ph);
      for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(90,55,25,${0.1 + r() * 0.2})`; c.lineWidth = 1; c.beginPath(); const y = j * ph + r() * ph; c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 8, w * 0.7, y + (r() - 0.5) * 8, w, y); c.stroke(); }
      c.fillStyle = 'rgba(40,25,10,0.6)'; c.fillRect(0, j * ph, w, 3);
    }
  } },
  { id: 'facade', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(11); c.fillStyle = '#e7ddc9'; c.fillRect(0, 0, w, h); speckle(c, w, h, r, 5000, 255, 60, 0.1, 2);
    const cols = 3, rows = 3, ww = w / cols, wh = h / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = i * ww + ww * 0.2, y = j * wh + wh * 0.2, a = ww * 0.6, b = wh * 0.6;
      c.fillStyle = '#5b4a38'; c.fillRect(x - 5, y - 5, a + 10, b + 10);
      const g = c.createLinearGradient(x, y, x + a, y + b); g.addColorStop(0, '#9fc7e6'); g.addColorStop(1, '#4b7ba3');
      c.fillStyle = g; c.fillRect(x, y, a, b);
      c.fillStyle = '#5b4a38'; c.fillRect(x + a / 2 - 2, y, 4, b); c.fillRect(x, y + b / 2 - 2, a, 4);
    }
  } },
  { id: 'glass', kind: 'tile', mm: 36, draw(c, w, h) {
    const n = 4, pw = w / n, ph = h / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(i * pw, j * ph, (i + 1) * pw, (j + 1) * ph);
      g.addColorStop(0, '#bcd9ee'); g.addColorStop(0.5, '#6d9cc2'); g.addColorStop(1, '#3f6f96');
      c.fillStyle = g; c.fillRect(i * pw, j * ph, pw, ph);
      c.strokeStyle = '#2e3d4a'; c.lineWidth = 5; c.strokeRect(i * pw, j * ph, pw, ph);
    }
  } },
  { id: 'solar', kind: 'tile', mm: 50, draw(c, w, h) {
    c.fillStyle = '#16264a'; c.fillRect(0, 0, w, h);
    const n = 6, cw = w / n, ch = h / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const g = c.createLinearGradient(i * cw, j * ch, (i + 1) * cw, (j + 1) * ch); g.addColorStop(0, '#2c4c8c'); g.addColorStop(1, '#162a58');
      c.fillStyle = g; c.fillRect(i * cw + 4, j * ch + 4, cw - 8, ch - 8);
      c.strokeStyle = 'rgba(190,200,230,0.5)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(i * cw + 4 + (k * (cw - 8)) / 4, j * ch + 4); c.lineTo(i * cw + 4 + (k * (cw - 8)) / 4, (j + 1) * ch - 4); c.stroke(); }
    }
  } },
  { id: 'plaster', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(12); c.fillStyle = '#ece8df'; c.fillRect(0, 0, w, h); blotches(c, w, h, r, 20, '160,150,130', 0.1); speckle(c, w, h, r, 6000, 255, 80, 0.1, 2);
  } },
  { id: 'sand', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(13); c.fillStyle = '#d8c28d'; c.fillRect(0, 0, w, h); blotches(c, w, h, r, 30, '180,150,90', 0.2); speckle(c, w, h, r, 12000, 255, 90, 0.25, 2);
  } },
  { id: 'gravel', kind: 'tile', mm: 60, draw(c, w, h) {
    const r = rng(14); c.fillStyle = '#7d7d7a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const v = 90 + r() * 120; c.fillStyle = `rgb(${v},${v},${v - 6})`; c.beginPath(); c.ellipse(r() * w, r() * h, 6 + r() * 9, 5 + r() * 7, r() * 3, 0, 7); c.fill(); }
  } },
  { id: 'water', kind: 'tile', mm: 70, draw(c, w, h) {
    const r = rng(15); const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3f87c7'); g.addColorStop(1, '#2a5f96'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.strokeStyle = `rgba(255,255,255,${0.08 + r() * 0.15})`; c.lineWidth = 2; const x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 15, y - 6, x + 30, y); c.stroke(); }
  } },
];

const decals: LibTexture[] = [
  { id: 'window', kind: 'decal', mm: 16, aspect: 1.15, draw(c, w, h) {
    c.fillStyle = '#4a3b2c'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#b9dcf3'); g.addColorStop(1, '#4a7fab');
    const m = w * 0.08; c.fillStyle = g; c.fillRect(m, m, w - 2 * m, h - 2 * m);
    c.fillStyle = '#4a3b2c'; c.fillRect(w / 2 - m / 2, m, m, h - 2 * m); c.fillRect(m, h / 2 - m / 2, w - 2 * m, m);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(m, m); c.lineTo(w * 0.45, m); c.lineTo(m, h * 0.45); c.fill();
    c.fillStyle = '#8c7a66'; c.fillRect(-w * 0.04, h - m * 0.6, w * 1.08, m * 0.6);
  } },
  { id: 'door', kind: 'decal', mm: 14, aspect: 1.85, draw(c, w, h) {
    c.fillStyle = '#3a2a1d'; c.fillRect(0, 0, w, h);
    const m = w * 0.08; c.fillStyle = '#7a4d2b'; c.fillRect(m, m, w - 2 * m, h - m);
    c.strokeStyle = '#4d2f19'; c.lineWidth = 4;
    c.strokeRect(w * 0.2, h * 0.08, w * 0.6, h * 0.32); c.strokeRect(w * 0.2, h * 0.5, w * 0.6, h * 0.4);
    c.fillStyle = '#e0b84d'; c.beginPath(); c.arc(w * 0.78, h * 0.55, w * 0.045, 0, 7); c.fill();
  } },
  { id: 'logo', kind: 'decal', mm: 20, aspect: 1, draw(c, w, h) {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff8a00'); g.addColorStop(1, '#e52e71');
    c.fillStyle = g; c.beginPath(); c.arc(w / 2, h / 2, w * 0.48, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(w * 0.28, h * 0.72); c.lineTo(w * 0.5, h * 0.26); c.lineTo(w * 0.72, h * 0.72); c.lineTo(w * 0.6, h * 0.72); c.lineTo(w * 0.5, h * 0.5); c.lineTo(w * 0.4, h * 0.72); c.closePath(); c.fill();
  } },
  { id: 'sign', kind: 'decal', mm: 30, aspect: 0.4, draw(c, w, h) {
    c.fillStyle = '#0b4f8a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#fff'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = '#fff'; c.font = `bold ${h * 0.5}px Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LASER', w / 2, h / 2);
  } },
  { id: 'hazard', kind: 'decal', mm: 30, aspect: 0.25, draw(c, w, h) {
    c.fillStyle = '#f2c500'; c.fillRect(0, 0, w, h); c.fillStyle = '#111';
    for (let x = -h; x < w + h; x += h * 0.9) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + h * 0.45, h); c.lineTo(x + h * 1.45, 0); c.lineTo(x + h, 0); c.fill(); }
  } },
];

export const LIBRARY: LibTexture[] = [...tiles, ...decals];
const cache = new Map<string, HTMLCanvasElement>();

export function getLibCanvas(id: string): HTMLCanvasElement | null {
  const hit = cache.get(id);
  if (hit) return hit;
  const lib = LIBRARY.find((l) => l.id === id);
  if (!lib) return null;
  const c = document.createElement('canvas');
  const w = S, h = lib.kind === 'decal' ? Math.round(S * (lib.aspect ?? 1)) : S;
  c.width = w; c.height = h;
  lib.draw(c.getContext('2d')!, w, h);
  cache.set(id, c);
  return c;
}

const thumbs = new Map<string, string>();
export function libThumb(id: string): string {
  const hit = thumbs.get(id);
  if (hit) return hit;
  const src = getLibCanvas(id);
  if (!src) return '';
  const t = document.createElement('canvas'); t.width = 72; t.height = 72;
  const g = t.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, 72, 72);
  const sc = Math.min(72 / src.width, 72 / src.height);
  g.drawImage(src, (72 - src.width * sc) / 2, (72 - src.height * sc) / 2, src.width * sc, src.height * sc);
  const url = t.toDataURL('image/png');
  thumbs.set(id, url);
  return url;
}
