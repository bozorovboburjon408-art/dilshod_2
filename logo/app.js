/* Aurum — premium logotip studiyasi. Hammasi brauzerda ishlaydi (SVG generatsiya). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ───────── ma'lumotlar ───────── */
const FONTS = {
  'Playfair Display': { w: [400, 500, 600, 700, 800], def: 600, tag: 'Klassik serif' },
  'Cormorant Garamond': { w: [400, 500, 600, 700], def: 600, tag: 'Nafis serif' },
  'Cinzel': { w: [400, 500, 600, 700, 800], def: 600, upper: true, tag: 'Rim kapitelli' },
  'Bodoni Moda': { w: [400, 500, 600, 700, 800], def: 600, tag: 'Moda didone' },
  'Marcellus': { w: [400], def: 400, upper: true, tag: 'Hashamatli' },
  'Italiana': { w: [400], def: 400, upper: true, tag: 'Ingichka serif' },
  'Montserrat': { w: [300, 400, 500, 600, 700, 800], def: 600, tag: 'Zamonaviy sans' },
  'Syne': { w: [400, 500, 600, 700, 800], def: 700, tag: 'Dadil dizayn' },
  'Outfit': { w: [300, 400, 500, 600, 700], def: 500, tag: 'Geometrik' },
  'Space Grotesk': { w: [300, 400, 500, 600, 700], def: 600, tag: 'Texnologik' },
  'Josefin Sans': { w: [300, 400, 500, 600, 700], def: 600, upper: true, tag: 'Vintage geometrik' },
  'Unbounded': { w: [300, 400, 500, 600, 700], def: 500, tag: 'Keng, kuchli' },
};
const TAG_FONT = { family: 'Montserrat', weight: 500 };

const PALETTES = [
  { id: 'aurum', name: 'Aurum oltin', a: '#f6dc8f', m: '#d4a843', b: '#9a6b1c', dark: '#0b0b0d', light: '#f7f3ea', tDark: '#f4ead0', tLight: '#17130a', tone: 'dark' },
  { id: 'platinum', name: 'Platina', a: '#ffffff', m: '#c9cfd8', b: '#7b8494', dark: '#0c0e12', light: '#f1f3f6', tDark: '#f2f4f7', tLight: '#12151b', tone: 'dark' },
  { id: 'royal', name: 'Qirollik', a: '#f0d588', m: '#c99b3d', b: '#7a5614', dark: '#0a1530', light: '#f5f1e6', tDark: '#f3e7c2', tLight: '#0a1530', tone: 'dark' },
  { id: 'emerald', name: 'Zumrad', a: '#8ff3c9', m: '#1fbf8c', b: '#0b6b52', dark: '#04120e', light: '#edf7f2', tDark: '#e6fbf2', tLight: '#05281e', tone: 'dark' },
  { id: 'rose', name: 'Pushti oltin', a: '#ffd9c9', m: '#e49a8a', b: '#a85c5c', dark: '#1a0d10', light: '#fbf1ee', tDark: '#fbe7e0', tLight: '#2a1216', tone: 'dark' },
  { id: 'violet', name: 'Binafsha', a: '#d5b8ff', m: '#9061f9', b: '#4c2ea8', dark: '#0d0a1c', light: '#f4f0fd', tDark: '#efe6ff', tLight: '#150d33', tone: 'dark' },
  { id: 'sunset', name: 'Quyosh botishi', a: '#ffc27d', m: '#ff6a4d', b: '#c2255c', dark: '#150a0c', light: '#fff3ec', tDark: '#ffe9dc', tLight: '#2a0e12', tone: 'dark' },
  { id: 'ocean', name: 'Okean', a: '#8be6ff', m: '#2a9df4', b: '#1c4fd1', dark: '#050d1e', light: '#edf4fc', tDark: '#e3f3ff', tLight: '#07163a', tone: 'dark' },
  { id: 'crimson', name: 'Yoqut', a: '#ff9d94', m: '#d6264a', b: '#7a0f2b', dark: '#120508', light: '#fcf0f1', tDark: '#ffe5e8', tLight: '#2a0710', tone: 'dark' },
  { id: 'mono', name: 'Monoxrom', a: '#ffffff', m: '#bdbdbd', b: '#6e6e6e', dark: '#0a0a0a', light: '#fafafa', tDark: '#ffffff', tLight: '#0a0a0a', tone: 'dark' },
];
const PAL = Object.fromEntries(PALETTES.map(p => [p.id, p]));

const sunRays = (P) => Array.from({ length: 12 }, (_, i) => {
  const a = i * Math.PI / 6, c = Math.cos(a), s = Math.sin(a);
  return `<line x1="${50 + c * 31}" y1="${50 + s * 31}" x2="${50 + c * 45}" y2="${50 + s * 45}" stroke="${P}" stroke-width="6" stroke-linecap="round"/>`;
}).join('');

/* Ikonlar 100×100 maydonda. P — asosiy bo'yoq, K — "kesim" (fon) rangi. */
const GLYPHS = {
  mono: null,
  mountain: (P, K) => `<path d="M5 82 40 22l17 29 9-13 29 44Z" fill="${P}"/><path d="M40 22l17 29-8 7-9-10-9 10-8-7Z" fill="${K}" opacity=".4"/>`,
  leaf: (P) => `<path fill-rule="evenodd" d="M50 8C82 30 88 64 50 92 12 64 18 30 50 8ZM47.5 34h5v50h-5Z" fill="${P}"/>`,
  flame: (P) => `<path fill-rule="evenodd" d="M50 5C58 26 82 38 82 63c0 18-14 32-32 32S18 81 18 63c0-14 10-22 17-33 3 10 7 15 12 15 0-14-3-27 3-40ZM50 60c8 10 12 16 8 24-3 5-13 5-16 0-4-8 2-14 8-24Z" fill="${P}"/>`,
  crown: (P) => `<path d="M10 74 16 28l20 24 14-32 14 32 20-24 6 46Z" fill="${P}"/><rect x="10" y="82" width="80" height="9" rx="2" fill="${P}"/>`,
  gem: (P) => `<path d="M26 14h48l20 22H6Z" fill="${P}"/><path d="M8 43h84L50 92Z" fill="${P}" opacity=".62"/>`,
  wave: (P) => [28, 50, 72].map(y => `<path d="M8 ${y} C24 ${y - 18} 36 ${y - 18} 50 ${y} S76 ${y + 18} 92 ${y}" fill="none" stroke="${P}" stroke-width="8" stroke-linecap="round"/>`).join(''),
  spark: (P) => `<path d="M50 4C54 34 66 46 96 50 66 54 54 66 50 96 46 66 34 54 4 50 34 46 46 34 50 4Z" fill="${P}"/>`,
  orbit: (P) => [0, 60, 120].map(a => `<ellipse cx="50" cy="50" rx="44" ry="17" transform="rotate(${a} 50 50)" fill="none" stroke="${P}" stroke-width="4"/>`).join('') + `<circle cx="50" cy="50" r="9" fill="${P}"/>`,
  cube: (P) => `<path d="M50 6 88 27 50 48 12 27Z" fill="${P}"/><path d="M12 34 46 53v39L12 73Z" fill="${P}" opacity=".68"/><path d="M88 34 54 53v39l34-19Z" fill="${P}" opacity=".42"/>`,
  bolt: (P) => `<path d="M60 4 20 56h26l-8 40 42-56H55Z" fill="${P}"/>`,
  loop: (P) => `<path d="M50 50C62 28 92 28 92 50S62 72 50 50 8 28 8 50s30 22 42 0Z" fill="none" stroke="${P}" stroke-width="9" stroke-linejoin="round"/>`,
  sun: (P) => `<circle cx="50" cy="50" r="18" fill="${P}"/>${sunRays(P)}`,
  lotus: (P) => `<path d="M50 10C68 34 68 64 50 86 32 64 32 34 50 10Z" fill="${P}"/><path d="M47 88C22 84 8 66 6 42 30 46 44 62 47 88Z" fill="${P}" opacity=".7"/><path d="M53 88c25-4 39-22 41-46-24 4-38 20-41 46Z" fill="${P}" opacity=".7"/>`,
  bars: (P) => `<rect x="12" y="58" width="20" height="30" rx="4" fill="${P}" opacity=".6"/><rect x="40" y="38" width="20" height="50" rx="4" fill="${P}" opacity=".8"/><rect x="68" y="12" width="20" height="76" rx="4" fill="${P}"/>`,
  rings: (P) => `<circle cx="36" cy="50" r="27" fill="none" stroke="${P}" stroke-width="7"/><circle cx="64" cy="50" r="27" fill="none" stroke="${P}" stroke-width="7" opacity=".75"/>`,
  hexa: (P) => `<path d="M50 7 87 28.500v43L50 93 13 71.500v-43Z" fill="none" stroke="${P}" stroke-width="7" stroke-linejoin="round"/><path d="M50 30 69 41v22L50 74 31 63V41Z" fill="${P}"/>`,
  chevron: (P) => `<path d="M14 56 50 20l36 36M14 82 50 46l36 36" fill="none" stroke="${P}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  delta: (P) => `<path d="M50 6 92 92H71L50 46 29 92H8Z" fill="${P}"/>`,
  drop: (P) => `<path fill-rule="evenodd" d="M50 5C70 33 82 49 82 64c0 18-14 31-32 31S18 82 18 64C18 49 30 33 50 5ZM33 62c-1 10 5 18 14 20-8-3-13-10-14-20Z" fill="${P}"/>`,
};
const GLYPH_IDS = Object.keys(GLYPHS);

const FRAMES = {
  none: null,
  circle: (P, f) => f ? `<circle cx="50" cy="50" r="47" fill="${P}"/>` : `<circle cx="50" cy="50" r="46" fill="none" stroke="${P}" stroke-width="3"/>`,
  ring2: (P, f) => f ? `<circle cx="50" cy="50" r="47" fill="${P}"/>` : `<circle cx="50" cy="50" r="47" fill="none" stroke="${P}" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="none" stroke="${P}" stroke-width="5"/>`,
  shield: (P, f) => `<path d="M50 4 90 18v32c0 24-18 40-40 47C28 90 10 74 10 50V18Z" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5" stroke-linejoin="round"`}/>`,
  hex: (P, f) => `<path d="M50 3 91 26.500v47L50 97 9 73.500v-47Z" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5" stroke-linejoin="round"`}/>`,
  square: (P, f) => `<rect x="5" y="5" width="90" height="90" rx="22" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5"`}/>`,
  diamond: (P, f) => `<path d="M50 2 98 50 50 98 2 50Z" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5" stroke-linejoin="round"`}/>`,
  arch: (P, f) => `<path d="M12 96V46C12 22 30 5 50 5s38 17 38 41v50Z" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5" stroke-linejoin="round"`}/>`,
};
const FRAME_IDS = Object.keys(FRAMES);
const LAYOUTS = [['horizontal', 'Yonma-yon'], ['stacked', 'Ustma-ust'], ['word', 'Faqat matn'], ['icon', 'Faqat ikon']];
const BGS = [['dark', "Qorong'i"], ['light', "Yorug'"], ['transparent', 'Shaffof']];

/* ───────── yordamchilar ───────── */
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (h1, h2, t) => '#' + hex2(h1).map((v, i) => Math.round(v + (hex2(h2)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const slug = s => (s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')) || 'logo';
const pick = a => a[Math.floor(Math.random() * a.length)];
const mctx = document.createElement('canvas').getContext('2d');

function measure(text, family, weight, size, ls) {
  mctx.font = `${weight} ${size}px "${family}"`;
  const m = mctx.measureText(text);
  return { w: m.width + ls * Math.max([...text].length - 1, 0), a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
}
const initials = name => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  const s = w.length > 1 ? w[0][0] + w[1][0] : (w[0] || 'A')[0];
  return s.toUpperCase();
};

/* ───────── holat ───────── */
const DEFAULT = {
  name: 'Aurelia', tagline: 'Atelier & Jewelry', glyph: 'lotus', frame: 'none', filled: false,
  pal: 'aurum', font: 'Playfair Display', weight: 600, layout: 'horizontal', bg: 'dark',
  iconScale: 100, textScale: 100, spacing: 6, upper: false, gradient: true,
};
let state = { ...DEFAULT };
try { Object.assign(state, JSON.parse(localStorage.getItem('aurum.state') || '{}')); } catch (e) { /* ignore */ }
if (!FONTS[state.font]) state.font = DEFAULT.font;
if (!PAL[state.pal]) state.pal = DEFAULT.pal;
if (!(state.glyph in GLYPHS)) state.glyph = DEFAULT.glyph;
if (!(state.frame in FRAMES)) state.frame = 'none';

/* ───────── shriftlar ───────── */
(() => {
  const fam = Object.entries(FONTS).map(([n, c]) => `family=${n.replace(/ /g, '+')}:wght@${c.w.join(';')}`).join('&');
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
  document.head.appendChild(l);
})();
const ensureFont = (family, weight, text = 'Aa') => document.fonts.load(`${weight} 48px "${family}"`, text).catch(() => {});
const ensureFonts = (st) => Promise.all([
  ensureFont(st.font, st.weight, st.name + initials(st.name)),
  ensureFont(TAG_FONT.family, TAG_FONT.weight, st.tagline || 'A'),
]);

/* ───────── logotip yasash ───────── */
function iconInner(st, uid, o) {
  const pal = PAL[st.pal] || PALETTES[0];
  const dark = o.dark;
  const cut = dark ? pal.dark : pal.light;
  const grad = st.gradient ? `url(#g${uid})` : (dark ? pal.m : mix(pal.m, '#000000', .3));
  const filled = st.frame !== 'none' && st.filled;
  const P = filled ? cut : grad;               // ikon rangi
  const K = filled ? grad : cut;               // kesim rangi
  let glyph;
  if (st.glyph === 'mono') {
    const t = initials(st.name), size = t.length > 1 ? 54 : 76;
    const m = measure(t, st.font, st.weight, size, 0);
    glyph = `<text x="50" y="${(50 + (m.a - m.d) / 2).toFixed(1)}" text-anchor="middle" font-family="'${st.font}', serif" font-weight="${st.weight}" font-size="${size}" fill="${P}">${esc(t)}</text>`;
  } else glyph = GLYPHS[st.glyph](P, K);
  if (st.frame === 'none') return glyph;
  const s = st.glyph === 'mono' ? .78 : .54;
  return FRAMES[st.frame](grad, filled) + `<g transform="translate(50 50) scale(${s}) translate(-50 -50)">${glyph}</g>`;
}

function gradDefs(st, uid, dark) {
  const pal = PAL[st.pal] || PALETTES[0];
  const stops = dark ? [pal.a, pal.m, pal.b] : [mix(pal.m, '#000000', .1), mix(pal.b, '#000000', .3)];
  return `<linearGradient id="g${uid}" gradientUnits="userSpaceOnUse" x1="8" y1="6" x2="92" y2="96">${stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

function build(st, uid = 'x', o = {}) {
  const pal = PAL[st.pal] || PALETTES[0];
  const dark = st.bg === 'dark' || (st.bg === 'transparent' && (st.tone || pal.tone) === 'dark');
  const bgColor = st.bg === 'transparent' ? null : (dark ? pal.dark : pal.light);
  const txt = dark ? pal.tDark : pal.tLight;
  let name = st.name.trim() || 'Brend';
  if (st.upper) name = name.toUpperCase();
  const F = 60 * st.textScale / 100, ls = st.spacing / 100 * F;
  const nm = measure(name, st.font, st.weight, F, ls);
  const tagText = (st.tagline || '').trim().toUpperCase();
  const hasTag = !!tagText && st.layout !== 'icon';
  const showText = st.layout !== 'icon', showIcon = st.layout !== 'word';
  const I = 110 * st.iconScale / 100;

  let tm = null, TF = 0, tls = 0;
  if (hasTag) {
    TF = Math.max(F * .26, 9);
    const base = measure(tagText, TAG_FONT.family, TAG_FONT.weight, TF, 0);
    const n = Math.max([...tagText].length - 1, 1);
    tls = Math.min(Math.max((nm.w - base.w) / n, TF * .14), TF * .9);
    if (nm.w < base.w) tls = TF * .14;
    tm = measure(tagText, TAG_FONT.family, TAG_FONT.weight, TF, tls);
  }
  const gapT = F * .34;
  const nameD = Math.max(nm.d, 0);
  const blockW = Math.max(nm.w, tm ? tm.w : 0);
  const blockH = nm.a + nameD + (tm ? gapT + tm.a : 0);
  const center = st.layout !== 'horizontal';

  let W, H, iconX = 0, iconY = 0, textX = 0, textY = 0;
  if (st.layout === 'icon') { W = H = I; }
  else if (st.layout === 'word') { W = blockW; H = blockH; }
  else if (st.layout === 'stacked') {
    const gap = I * .2; W = Math.max(I, blockW); H = I + gap + blockH;
    iconX = (W - I) / 2; textY = I + gap;
  } else {
    const gap = I * .26; W = I + gap + blockW; H = Math.max(I, blockH);
    iconY = (H - I) / 2; textX = I + gap; textY = (H - blockH) / 2;
  }
  const pad = o.pad != null ? o.pad : Math.max(F * .9, 34);
  const VW = W + pad * 2, VH = H + pad * 2;

  let body = '';
  if (bgColor && !o.noBg) body += `<rect width="${VW.toFixed(1)}" height="${VH.toFixed(1)}" fill="${bgColor}"/>`;
  if (showIcon) body += `<g transform="translate(${(pad + iconX).toFixed(2)} ${(pad + iconY).toFixed(2)}) scale(${(I / 100).toFixed(4)})">${iconInner(st, uid, { dark })}</g>`;
  if (showText) {
    const nx = pad + textX + (center ? (blockW - nm.w) / 2 : 0);
    const ny = pad + textY + nm.a;
    body += `<text x="${nx.toFixed(2)}" y="${ny.toFixed(2)}" font-family="'${st.font}', serif" font-weight="${st.weight}" font-size="${F.toFixed(2)}" letter-spacing="${ls.toFixed(2)}" fill="${txt}">${esc(name)}</text>`;
    if (tm) {
      const tx = pad + textX + (center ? (blockW - tm.w) / 2 : 0);
      const ty = ny + nameD + gapT + tm.a;
      body += `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" font-family="'${TAG_FONT.family}', sans-serif" font-weight="${TAG_FONT.weight}" font-size="${TF.toFixed(2)}" letter-spacing="${tls.toFixed(2)}" fill="${dark ? mix(txt, pal.m, .35) : mix(txt, pal.m, .2)}" opacity=".88">${esc(tagText)}</text>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW.toFixed(1)} ${VH.toFixed(1)}" width="${VW.toFixed(0)}" height="${VH.toFixed(0)}" role="img" aria-label="${esc(name)}"><defs>${gradDefs(st, uid, dark)}${o.fontCss ? `<style>${o.fontCss}</style>` : ''}</defs>${body}</svg>`;
  return { svg, w: VW, h: VH, dark, bgColor };
}

/* kichik ikon prevyusi (tanlagichlar uchun) */
function iconThumb(st, uid, override) {
  const s = { ...st, ...override };
  const pal = PAL[s.pal] || PALETTES[0];
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>${gradDefs(s, uid, true)}</defs>${iconInner({ ...s, gradient: true }, uid, { dark: true })}</svg>`.replace(/\$\{pal\}/g, pal.id);
}

/* ───────── shrift ichiga joylash (eksport uchun) ───────── */
const fontCache = new Map();
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function fontCssFor(family, weight) {
  const key = family + weight;
  if (fontCache.has(key)) return fontCache.get(key);
  const p = (async () => {
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=swap`;
    const css = await (await fetch(url)).text();
    const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
      .filter(m => ['latin', 'latin-ext', 'cyrillic'].includes(m[1])).map(m => m[2]);
    const out = [];
    for (const b of blocks) {
      const u = /url\(([^)]+)\)/.exec(b);
      if (!u) continue;
      const data = await blobToDataUrl(await (await fetch(u[1])).blob());
      out.push(b.replace(u[0], `url(${data})`));
    }
    return out.join('\n');
  })().catch(() => '');
  fontCache.set(key, p);
  return p;
}
async function exportSvg(st) {
  const css = (await Promise.all([fontCssFor(st.font, st.weight), st.tagline.trim() && st.layout !== 'icon' ? fontCssFor(TAG_FONT.family, TAG_FONT.weight) : ''])).join('\n');
  return build(st, 'e', { fontCss: css });
}

/* ───────── UI ───────── */
const preview = $('#preview'), stage = $('#stage');
const toastEl = $('#toast');
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2200); }

function buildPickers() {
  const gg = $('#glyphGrid'), fg = $('#frameGrid'), pg = $('#palGrid'), fo = $('#fontGrid'), lg = $('#layoutGrid'), bg = $('#bgGrid');
  GLYPH_IDS.forEach(id => { const b = el('button', 'opt'); b.type = 'button'; b.dataset.v = id; b.title = id; gg.appendChild(b); });
  FRAME_IDS.forEach(id => { const b = el('button', 'opt'); b.type = 'button'; b.dataset.v = id; fg.appendChild(b); });
  PALETTES.forEach(p => {
    const b = el('button', 'sw-p'); b.type = 'button'; b.dataset.v = p.id; b.title = p.name;
    b.style.background = `linear-gradient(135deg,${p.a},${p.m} 55%,${p.b})`; pg.appendChild(b);
  });
  Object.entries(FONTS).forEach(([n, c]) => {
    const b = el('button', 'fopt'); b.type = 'button'; b.dataset.v = n; b.style.fontFamily = `'${n}',serif`;
    b.style.fontWeight = c.def; b.innerHTML = `Aurelia<small>${c.tag}</small>`; fo.appendChild(b);
  });
  LAYOUTS.forEach(([v, t]) => { const b = el('button', 'chip', t); b.type = 'button'; b.dataset.v = v; lg.appendChild(b); });
  BGS.forEach(([v, t]) => { const b = el('button', 'chip', t); b.type = 'button'; b.dataset.v = v; bg.appendChild(b); });
  // qalinlik
  const wf = el('div', 'field'); wf.innerHTML = '<label>Qalinlik</label><div class="chips" id="weightGrid"></div>';
  fo.closest('.field').after(wf);

  gg.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) update({ glyph: b.dataset.v }); });
  fg.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) update({ frame: b.dataset.v }); });
  pg.addEventListener('click', e => { const b = e.target.closest('.sw-p'); if (b) update({ pal: b.dataset.v }); });
  fo.addEventListener('click', e => { const b = e.target.closest('.fopt'); if (b) update({ font: b.dataset.v, weight: FONTS[b.dataset.v].def }); });
  lg.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) update({ layout: b.dataset.v }); });
  bg.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) update({ bg: b.dataset.v }); });
  $('#weightGrid').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) update({ weight: +b.dataset.v }); });
}

function syncControls() {
  const mark = (root, v) => root.querySelectorAll('[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  mark($('#glyphGrid'), state.glyph); mark($('#frameGrid'), state.frame); mark($('#palGrid'), state.pal);
  mark($('#fontGrid'), state.font); mark($('#layoutGrid'), state.layout); mark($('#bgGrid'), state.bg);
  const wg = $('#weightGrid');
  wg.innerHTML = FONTS[state.font].w.map(w => `<button type="button" class="chip" data-v="${w}">${w}</button>`).join('');
  mark(wg, state.weight);
  // thumbnails
  $('#glyphGrid').querySelectorAll('.opt').forEach(b => { b.innerHTML = iconThumb(state, 'tg' + b.dataset.v, { glyph: b.dataset.v, frame: 'none' }); });
  $('#frameGrid').querySelectorAll('.opt').forEach(b => {
    b.innerHTML = b.dataset.v === 'none'
      ? `<svg viewBox="0 0 100 100"><path d="M20 20 80 80M80 20 20 80" stroke="#6c6a63" stroke-width="5" stroke-linecap="round"/></svg>`
      : iconThumb(state, 'tf' + b.dataset.v, { frame: b.dataset.v, glyph: 'spark', filled: state.filled });
  });
  $('#name').value !== state.name && ($('#name').value = state.name);
  $('#tagline').value !== state.tagline && ($('#tagline').value = state.tagline);
  $('#filled').checked = state.filled; $('#upper').checked = state.upper; $('#gradient').checked = state.gradient;
  [['iconScale', '%'], ['textScale', '%'], ['spacing', '']].forEach(([k, u]) => {
    const r = $('#' + k); r.value = state[k]; r.nextElementSibling.textContent = state[k] + u;
  });
  $('#filled').disabled = state.frame === 'none';
}

let rid = 0, saveT;
async function render() {
  const my = ++rid;
  await ensureFonts(state);
  if (my !== rid) return;
  const r = build(state, 'main', { noBg: true });
  preview.innerHTML = r.svg;
  stage.dataset.bg = state.bg;
  stage.style.background = r.bgColor || '';
  syncControls();
  renderMocks();
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem('aurum.state', JSON.stringify(state)); } catch (e) { /* ignore */ } }, 300);
}
function update(patch) { Object.assign(state, patch); render(); }

/* ───────── mockuplar ───────── */
function setMock(sel, patch, bgCss, extra = {}) {
  const host = $(sel); if (!host) return;
  const st = { ...state, bg: 'transparent', ...patch };
  const r = build(st, 'm' + sel.replace(/\W/g, ''), { pad: 0, ...extra });
  host.innerHTML = r.svg;
  host.style.background = bgCss;
}
function renderMocks() {
  const pal = PAL[state.pal]; const dk = pal.dark, lt = pal.light;
  setMock('#mkCardFront', { tone: 'dark', layout: state.layout === 'icon' ? 'icon' : 'horizontal', tagline: '' }, dk);
  setMock('#mkCardBack', { tone: 'light', layout: 'icon' }, lt);
  setMock('#mkSign', { tone: 'dark', layout: 'stacked' }, dk);
  $('#mkSign').style.setProperty('--glow', pal.m + '66');
  setMock('#mkApp1', { tone: 'dark', layout: 'icon', filled: false }, `radial-gradient(circle at 30% 20%,${mix(dk, pal.m, .25)},${dk})`);
  setMock('#mkApp2', { tone: 'dark', layout: 'icon' }, `linear-gradient(135deg,${pal.a},${pal.m} 55%,${pal.b})`, {});
  setMock('#mkApp3', { tone: 'light', layout: 'icon' }, lt);
  // 2-ilova ikonasi: gradient fon ustida ikon qora rangda
  const a2 = $('#mkApp2'); a2.innerHTML = build({ ...state, bg: 'transparent', tone: 'dark', layout: 'icon', gradient: false, pal: state.pal }, 'm2b', { pad: 0 }).svg
    .replace(new RegExp(mix(pal.m, '#000000', 0) + '(?=")', 'g'), dk);
  setMock('#mkBanner', { tone: 'dark', layout: 'horizontal' }, `radial-gradient(120% 140% at 80% 0%,${mix(dk, pal.m, .3)},${dk} 60%)`);
}

/* ───────── g'oyalar ───────── */
let concepts = [];
function randomConcept() {
  const p = pick(PALETTES), f = pick(Object.keys(FONTS)), cfg = FONTS[f];
  const frame = pick(['none', 'none', 'circle', 'ring2', 'shield', 'hex', 'square', 'diamond', 'arch']);
  const up = !!cfg.upper || Math.random() < .3;
  return {
    glyph: pick(GLYPH_IDS), frame, filled: frame !== 'none' && Math.random() < .5, pal: p.id, font: f, weight: cfg.def,
    layout: Math.random() < .6 ? 'horizontal' : 'stacked', bg: Math.random() < .78 ? 'dark' : 'light', upper: up,
    spacing: up ? 8 + Math.floor(Math.random() * 12) : Math.floor(Math.random() * 5), iconScale: 100, textScale: 100, gradient: true,
  };
}
function newConcepts() {
  const seen = new Set(); concepts = [];
  while (concepts.length < 12) { const c = randomConcept(); if (!seen.has(c.glyph)) { seen.add(c.glyph); concepts.push(c); } }
  renderConcepts();
}
async function renderConcepts() {
  const grid = $('#conceptGrid');
  const sts = concepts.map(c => ({ ...c, name: state.name, tagline: state.tagline }));
  await Promise.all(sts.map(s => ensureFonts(s)));
  grid.innerHTML = '';
  sts.forEach((s, i) => {
    const r = build(s, 'c' + i, { pad: 22 });
    const b = el('button', 'cc', r.svg); b.type = 'button'; b.style.background = r.bgColor; b.style.animationDelay = i * 40 + 'ms';
    b.title = 'Tahrirlash uchun bosing';
    b.addEventListener('click', () => { Object.assign(state, concepts[i]); render(); $('#studio').scrollIntoView({ behavior: 'smooth' }); });
    grid.appendChild(b);
  });
}

/* ───────── hero ───────── */
async function renderHero() {
  const samples = [
    { name: 'Aurelia', tagline: 'Jewelry', glyph: 'lotus', frame: 'none', pal: 'aurum', font: 'Playfair Display', weight: 600, layout: 'stacked', bg: 'dark' },
    { name: 'NOVA', tagline: 'Technologies', glyph: 'orbit', frame: 'circle', pal: 'ocean', font: 'Syne', weight: 700, layout: 'stacked', bg: 'dark', upper: true, spacing: 14 },
    { name: 'Kasra', tagline: 'Café & Bakery', glyph: 'leaf', frame: 'arch', pal: 'emerald', font: 'Cormorant Garamond', weight: 600, layout: 'stacked', bg: 'light' },
    { name: 'Maison Rouge', tagline: 'Paris', glyph: 'crown', frame: 'shield', filled: true, pal: 'crimson', font: 'Cinzel', weight: 600, layout: 'stacked', bg: 'dark', upper: true, spacing: 8 },
  ].map(s => ({ ...DEFAULT, gradient: true, spacing: 4, ...s }));
  await Promise.all(samples.map(ensureFonts));
  const host = $('#heroShow'); host.innerHTML = '';
  samples.forEach((s, i) => { const r = build(s, 'h' + i, { pad: 18 }); const d = el('div', 'hs', r.svg); d.style.background = r.bgColor; host.appendChild(d); });
}

/* ───────── saqlash ───────── */
const loadSaved = () => { try { return JSON.parse(localStorage.getItem('aurum.saved') || '[]'); } catch (e) { return []; } };
const storeSaved = a => { try { localStorage.setItem('aurum.saved', JSON.stringify(a)); } catch (e) { toast('Saqlab bo‘lmadi (xotira cheklangan)'); } };
async function renderSaved() {
  const grid = $('#savedGrid'), list = loadSaved();
  if (!list.length) { grid.innerHTML = '<div class="empty">Hali saqlangan logotip yo‘q. Yoqqan variantni “♡ Saqlash” tugmasi bilan shu yerga qo‘shing.</div>'; return; }
  await Promise.all(list.map(ensureFonts));
  grid.innerHTML = '';
  list.forEach((s, i) => {
    const r = build(s, 's' + i, { pad: 22 });
    const d = el('div', 'sv', r.svg); d.style.background = r.bgColor || '#17171c';
    const x = el('button', 'x', '×'); x.type = 'button'; x.title = "O'chirish";
    x.addEventListener('click', e => { e.stopPropagation(); const a = loadSaved(); a.splice(i, 1); storeSaved(a); renderSaved(); });
    d.addEventListener('click', () => { Object.assign(state, s); render(); $('#studio').scrollIntoView({ behavior: 'smooth' }); });
    d.appendChild(x); grid.appendChild(d);
  });
}

/* ───────── eksport ───────── */
function download(blob, filename) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function busy(btn, fn) {
  const t = btn.textContent; btn.disabled = true; btn.textContent = 'Tayyorlanmoqda…';
  try { await fn(); } catch (e) { console.error(e); toast('Xatolik yuz berdi: ' + (e.message || e)); } finally { btn.disabled = false; btn.textContent = t; }
}
function bindActions() {
  $('#dlSvg').addEventListener('click', e => busy(e.currentTarget, async () => {
    await ensureFonts(state); const r = await exportSvg(state);
    download(new Blob([r.svg], { type: 'image/svg+xml' }), slug(state.name) + '-logo.svg'); toast('SVG yuklab olindi');
  }));
  $('#dlPng').addEventListener('click', e => busy(e.currentTarget, async () => {
    await ensureFonts(state); const r = await exportSvg(state);
    const url = URL.createObjectURL(new Blob([r.svg], { type: 'image/svg+xml' }));
    const img = new Image(); img.src = url; await img.decode();
    const target = state.layout === 'icon' ? 1200 : 2400, k = target / r.w;
    const cv = document.createElement('canvas'); cv.width = Math.round(r.w * k); cv.height = Math.round(r.h * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
    const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
    download(blob, slug(state.name) + '-logo.png'); toast('PNG yuklab olindi' + (state.bg === 'transparent' ? ' (shaffof fon)' : ''));
  }));
  $('#copySvg').addEventListener('click', e => busy(e.currentTarget, async () => {
    const r = await exportSvg(state); await navigator.clipboard.writeText(r.svg); toast('SVG kodi nusxalandi');
  }));
  $('#saveBtn').addEventListener('click', () => {
    const a = loadSaved(); a.unshift({ ...state }); storeSaved(a.slice(0, 24)); renderSaved(); toast('Kolleksiyaga saqlandi');
  });
  $('#shuffleBtn').addEventListener('click', () => { Object.assign(state, randomConcept()); render(); });
  $('#moreConcepts').addEventListener('click', newConcepts);
}

function bindInputs() {
  let t;
  const txt = (id, key) => $(id).addEventListener('input', e => {
    state[key] = e.target.value; render(); clearTimeout(t); t = setTimeout(() => { renderConcepts(); }, 450);
  });
  txt('#name', 'name'); txt('#tagline', 'tagline');
  ['iconScale', 'textScale', 'spacing'].forEach(k => $('#' + k).addEventListener('input', e => update({ [k]: +e.target.value })));
  $('#filled').addEventListener('change', e => update({ filled: e.target.checked }));
  $('#upper').addEventListener('change', e => update({ upper: e.target.checked }));
  $('#gradient').addEventListener('change', e => update({ gradient: e.target.checked }));
  $('#heroForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#heroName').value.trim();
    if (v) { state.name = v; state.tagline = state.tagline || ''; Object.assign(state, randomConcept()); newConcepts(); render(); }
    $('#studio').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ───────── boshlash ───────── */
buildPickers(); bindActions(); bindInputs();
const nums = [GLYPH_IDS.length, FRAME_IDS.length - 1, PALETTES.length, Object.keys(FONTS).length];
document.querySelectorAll('.facts b').forEach((b, i) => { b.textContent = nums[i]; });
render();
newConcepts();
renderHero();
renderSaved();
document.fonts.ready.then(() => { render(); renderConcepts(); renderHero(); });
})();
