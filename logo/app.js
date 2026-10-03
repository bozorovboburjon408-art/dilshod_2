/* Aurum — premium logotip studiyasi. Hammasi brauzerda ishlaydi (SVG generatsiya). */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

/* ───────── shriftlar ───────── */
const W5 = [400, 500, 600, 700], W6 = [300, 400, 500, 600, 700, 800], W5L = [300, 400, 500, 600, 700];
const FONTS = {
  'Playfair Display': { w: [400, 500, 600, 700, 800], def: 600, cat: 'serif', tag: 'Klassik serif' },
  'Cormorant Garamond': { w: W5, def: 600, cat: 'serif', tag: 'Nafis serif' },
  'Bodoni Moda': { w: [400, 500, 600, 700, 800], def: 600, cat: 'serif', tag: 'Moda didone' },
  'Fraunces': { w: W6, def: 600, cat: 'serif', tag: 'Yumshoq serif' },
  'DM Serif Display': { w: [400], def: 400, cat: 'serif', tag: 'Kontrastli' },
  'Prata': { w: [400], def: 400, cat: 'serif', tag: 'Hashamatli' },
  'Yeseva One': { w: [400], def: 400, cat: 'serif', tag: 'Ayol brendlari' },
  'Gloock': { w: [400], def: 400, cat: 'serif', tag: 'Qalin serif' },
  'Lora': { w: W5, def: 600, cat: 'serif', tag: 'Kitobiy' },
  'Old Standard TT': { w: [400, 700], def: 700, cat: 'serif', tag: 'Eski gazeta' },
  'Bellefair': { w: [400], def: 400, cat: 'serif', tag: 'Nafis' },
  'Forum': { w: [400], def: 400, cat: 'serif', tag: 'Rim' },
  'Philosopher': { w: [400, 700], def: 700, cat: 'serif', tag: 'Falsafiy' },
  'Abril Fatface': { w: [400], def: 400, cat: 'serif', tag: 'Plakat' },
  'Cinzel': { w: [400, 500, 600, 700, 800], def: 600, upper: true, cat: 'serif', tag: 'Rim kapitelli' },
  'Cinzel Decorative': { w: [400, 700, 900], def: 700, upper: true, cat: 'serif', tag: 'Bezakli kapitel' },
  'Cormorant SC': { w: W5, def: 600, upper: true, cat: 'serif', tag: 'Kichik kapitel' },
  'Marcellus': { w: [400], def: 400, upper: true, cat: 'serif', tag: 'Klassik' },
  'Italiana': { w: [400], def: 400, upper: true, cat: 'serif', tag: 'Ingichka' },
  'Montserrat': { w: W6, def: 600, cat: 'sans', tag: 'Zamonaviy sans' },
  'Outfit': { w: W5L, def: 500, cat: 'sans', tag: 'Geometrik' },
  'Poppins': { w: W6, def: 600, cat: 'sans', tag: 'Dumaloq geometrik' },
  'Raleway': { w: W6, def: 600, cat: 'sans', tag: 'Elegant' },
  'Manrope': { w: W6, def: 700, cat: 'sans', tag: 'Zamonaviy' },
  'Sora': { w: W6, def: 600, cat: 'sans', tag: 'Texno' },
  'Lexend': { w: W6, def: 500, cat: 'sans', tag: 'Ochiq' },
  'Urbanist': { w: W6, def: 700, cat: 'sans', tag: 'Shahar' },
  'Rubik': { w: W6, def: 600, cat: 'sans', tag: 'Yumshoq burchak' },
  'Josefin Sans': { w: W5L, def: 600, upper: true, cat: 'sans', tag: 'Vintage' },
  'Quicksand': { w: W5L, def: 600, cat: 'sans', tag: 'Do‘stona' },
  'Comfortaa': { w: W5L, def: 600, cat: 'sans', tag: 'Dumaloq' },
  'Space Grotesk': { w: W5L, def: 600, cat: 'sans', tag: 'Texnologik' },
  'Syne': { w: [400, 500, 600, 700, 800], def: 700, cat: 'sans', tag: 'Dadil dizayn' },
  'Unbounded': { w: W5L, def: 500, cat: 'sans', tag: 'Keng, kuchli' },
  'Tenor Sans': { w: [400], def: 400, cat: 'sans', tag: 'Tinch' },
  'Bebas Neue': { w: [400], def: 400, upper: true, cat: 'display', tag: 'Tor sarlavha' },
  'Anton': { w: [400], def: 400, upper: true, cat: 'display', tag: 'Kuchli' },
  'Oswald': { w: W5L, def: 600, upper: true, cat: 'display', tag: 'Siqiq' },
  'Archivo Black': { w: [400], def: 400, cat: 'display', tag: 'Og‘ir' },
  'Righteous': { w: [400], def: 400, cat: 'display', tag: 'Retro' },
  'Audiowide': { w: [400], def: 400, cat: 'display', tag: 'Futuristik' },
  'Orbitron': { w: [400, 500, 600, 700, 800], def: 700, cat: 'display', tag: 'Kosmik' },
  'Michroma': { w: [400], def: 400, cat: 'display', tag: 'Keng texno' },
  'Lobster': { w: [400], def: 400, cat: 'display', tag: 'Qo‘lyozma plakat' },
  'Great Vibes': { w: [400], def: 400, cat: 'script', tag: 'Nafis yozuv' },
  'Parisienne': { w: [400], def: 400, cat: 'script', tag: 'Parij' },
  'Allura': { w: [400], def: 400, cat: 'script', tag: 'Kalligrafiya' },
  'Satisfy': { w: [400], def: 400, cat: 'script', tag: 'Erkin yozuv' },
  'Dancing Script': { w: W5, def: 600, cat: 'script', tag: 'Jonli yozuv' },
  'Pacifico': { w: [400], def: 400, cat: 'script', tag: 'Okean' },
};
const CATS = [['all', 'Hammasi'], ['serif', 'Serif'], ['sans', 'Sans'], ['display', 'Sarlavha'], ['script', 'Yozma']];
const TAG_FONT = { family: 'Montserrat', weight: 500 };

const fontUrl = (family, weights) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}${weights ? ':wght@' + weights.join(';') : ''}&display=swap`;
const familyLinks = new Map();
function loadFamily(name) {
  if (familyLinks.has(name)) return familyLinks.get(name);
  const c = FONTS[name];
  const p = new Promise(res => {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.href = fontUrl(name, c && c.w.length > 1 ? c.w : null);
    l.onload = l.onerror = () => res();
    document.head.appendChild(l);
  });
  familyLinks.set(name, p);
  return p;
}
const ensureFont = async (family, weight, text = 'Aa') => {
  if (FONTS[family]) await loadFamily(family);
  try { await document.fonts.load(`${weight} 48px "${family}"`, text); } catch (e) { /* ignore */ }
};

/* ───────── palitralar ───────── */
const PALETTES = [
  { id: 'aurum', name: 'Aurum oltin', a: '#f6dc8f', m: '#d4a843', b: '#9a6b1c', dark: '#0b0b0d', light: '#f7f3ea', tDark: '#f4ead0', tLight: '#17130a' },
  { id: 'platinum', name: 'Platina', a: '#ffffff', m: '#c9cfd8', b: '#7b8494', dark: '#0c0e12', light: '#f1f3f6', tDark: '#f2f4f7', tLight: '#12151b' },
  { id: 'royal', name: 'Qirollik', a: '#f0d588', m: '#c99b3d', b: '#7a5614', dark: '#0a1530', light: '#f5f1e6', tDark: '#f3e7c2', tLight: '#0a1530' },
  { id: 'emerald', name: 'Zumrad', a: '#8ff3c9', m: '#1fbf8c', b: '#0b6b52', dark: '#04120e', light: '#edf7f2', tDark: '#e6fbf2', tLight: '#05281e' },
  { id: 'rose', name: 'Pushti oltin', a: '#ffd9c9', m: '#e49a8a', b: '#a85c5c', dark: '#1a0d10', light: '#fbf1ee', tDark: '#fbe7e0', tLight: '#2a1216' },
  { id: 'violet', name: 'Binafsha', a: '#d5b8ff', m: '#9061f9', b: '#4c2ea8', dark: '#0d0a1c', light: '#f4f0fd', tDark: '#efe6ff', tLight: '#150d33' },
  { id: 'sunset', name: 'Quyosh botishi', a: '#ffc27d', m: '#ff6a4d', b: '#c2255c', dark: '#150a0c', light: '#fff3ec', tDark: '#ffe9dc', tLight: '#2a0e12' },
  { id: 'ocean', name: 'Okean', a: '#8be6ff', m: '#2a9df4', b: '#1c4fd1', dark: '#050d1e', light: '#edf4fc', tDark: '#e3f3ff', tLight: '#07163a' },
  { id: 'crimson', name: 'Yoqut', a: '#ff9d94', m: '#d6264a', b: '#7a0f2b', dark: '#120508', light: '#fcf0f1', tDark: '#ffe5e8', tLight: '#2a0710' },
  { id: 'mono', name: 'Monoxrom', a: '#ffffff', m: '#bdbdbd', b: '#6e6e6e', dark: '#0a0a0a', light: '#fafafa', tDark: '#ffffff', tLight: '#0a0a0a' },
  { id: 'copper', name: 'Mis', a: '#ffcfa3', m: '#d9814f', b: '#8a3f1e', dark: '#140c08', light: '#fbf2ea', tDark: '#fbe4d2', tLight: '#2a140a' },
  { id: 'forest', name: 'O‘rmon', a: '#c8e6a0', m: '#6fa44a', b: '#2f5d2a', dark: '#0a140a', light: '#f1f6ea', tDark: '#e8f3d8', tLight: '#12240f' },
  { id: 'ice', name: 'Muz', a: '#e6fbff', m: '#7fd3e6', b: '#3a86a8', dark: '#07141a', light: '#eef8fb', tDark: '#e6f8fc', tLight: '#0a2330' },
  { id: 'wine', name: 'Sharob', a: '#e9a6c4', m: '#b23a6e', b: '#5c1138', dark: '#13060d', light: '#fbeff5', tDark: '#f9e1ec', tLight: '#2a0a1a' },
  { id: 'neon', name: 'Neon', a: '#b6ff6a', m: '#16e0a6', b: '#0a8f9c', dark: '#060b0d', light: '#eefaf6', tDark: '#e6fff4', tLight: '#04211c' },
];
const PAL = Object.fromEntries(PALETTES.map(p => [p.id, p]));

/* ───────── ikonlar (100×100 maydon; P — bo'yoq, K — kesim rangi) ───────── */
const fx = n => +n.toFixed(2);
const pt = (r, a, cx = 50, cy = 50) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
const pts = arr => arr.map(p => p.map(fx).join(',')).join(' ');
const rot = (i, n, extra = 0) => `rotate(${fx(i * 360 / n + extra)} 50 50)`;

const BASE = {
  mountain: (P, K) => `<path d="M5 82 40 22l17 29 9-13 29 44Z" fill="${P}"/><path d="M40 22l17 29-8 7-9-10-9 10-8-7Z" fill="${K}" opacity=".4"/>`,
  leaf: P => `<path fill-rule="evenodd" d="M50 8C82 30 88 64 50 92 12 64 18 30 50 8ZM47.5 34h5v50h-5Z" fill="${P}"/>`,
  flame: P => `<path fill-rule="evenodd" d="M50 5C58 26 82 38 82 63c0 18-14 32-32 32S18 81 18 63c0-14 10-22 17-33 3 10 7 15 12 15 0-14-3-27 3-40ZM50 60c8 10 12 16 8 24-3 5-13 5-16 0-4-8 2-14 8-24Z" fill="${P}"/>`,
  crown: P => `<path d="M10 74 16 28l20 24 14-32 14 32 20-24 6 46Z" fill="${P}"/><rect x="10" y="82" width="80" height="9" rx="2" fill="${P}"/>`,
  gem: P => `<path d="M26 14h48l20 22H6Z" fill="${P}"/><path d="M8 43h84L50 92Z" fill="${P}" opacity=".62"/>`,
  wave: P => [28, 50, 72].map(y => `<path d="M8 ${y} C24 ${y - 18} 36 ${y - 18} 50 ${y} S76 ${y + 18} 92 ${y}" fill="none" stroke="${P}" stroke-width="8" stroke-linecap="round"/>`).join(''),
  spark: P => `<path d="M50 4C54 34 66 46 96 50 66 54 54 66 50 96 46 66 34 54 4 50 34 46 46 34 50 4Z" fill="${P}"/>`,
  orbit: P => [0, 60, 120].map(a => `<ellipse cx="50" cy="50" rx="44" ry="17" transform="rotate(${a} 50 50)" fill="none" stroke="${P}" stroke-width="4"/>`).join('') + `<circle cx="50" cy="50" r="9" fill="${P}"/>`,
  cube: P => `<path d="M50 6 88 27 50 48 12 27Z" fill="${P}"/><path d="M12 34 46 53v39L12 73Z" fill="${P}" opacity=".68"/><path d="M88 34 54 53v39l34-19Z" fill="${P}" opacity=".42"/>`,
  bolt: P => `<path d="M60 4 20 56h26l-8 40 42-56H55Z" fill="${P}"/>`,
  loop: P => `<path d="M50 50C62 28 92 28 92 50S62 72 50 50 8 28 8 50s30 22 42 0Z" fill="none" stroke="${P}" stroke-width="9" stroke-linejoin="round"/>`,
  sun: P => `<circle cx="50" cy="50" r="18" fill="${P}"/>` + Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; const [x1, y1] = pt(31, a), [x2, y2] = pt(45, a); return `<line x1="${fx(x1)}" y1="${fx(y1)}" x2="${fx(x2)}" y2="${fx(y2)}" stroke="${P}" stroke-width="6" stroke-linecap="round"/>`; }).join(''),
  lotus: P => `<path d="M50 10C68 34 68 64 50 86 32 64 32 34 50 10Z" fill="${P}"/><path d="M47 88C22 84 8 66 6 42 30 46 44 62 47 88Z" fill="${P}" opacity=".7"/><path d="M53 88c25-4 39-22 41-46-24 4-38 20-41 46Z" fill="${P}" opacity=".7"/>`,
  bars: P => `<rect x="12" y="58" width="20" height="30" rx="4" fill="${P}" opacity=".6"/><rect x="40" y="38" width="20" height="50" rx="4" fill="${P}" opacity=".8"/><rect x="68" y="12" width="20" height="76" rx="4" fill="${P}"/>`,
  rings: P => `<circle cx="36" cy="50" r="27" fill="none" stroke="${P}" stroke-width="7"/><circle cx="64" cy="50" r="27" fill="none" stroke="${P}" stroke-width="7" opacity=".75"/>`,
  hexa: P => `<path d="M50 7 87 28.500v43L50 93 13 71.500v-43Z" fill="none" stroke="${P}" stroke-width="7" stroke-linejoin="round"/><path d="M50 30 69 41v22L50 74 31 63V41Z" fill="${P}"/>`,
  chevron: P => `<path d="M14 56 50 20l36 36M14 82 50 46l36 36" fill="none" stroke="${P}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`,
  delta: P => `<path d="M50 6 92 92H71L50 46 29 92H8Z" fill="${P}"/>`,
  drop: P => `<path fill-rule="evenodd" d="M50 5C70 33 82 49 82 64c0 18-14 31-32 31S18 82 18 64C18 49 30 33 50 5ZM33 62c-1 10 5 18 14 20-8-3-13-10-14-20Z" fill="${P}"/>`,
  heart: P => `<path d="M50 90C12 62 6 38 20 23c10-10 25-6 30 7 5-13 20-17 30-7 14 15 8 39-30 67Z" fill="${P}"/>`,
  pin: P => `<path fill-rule="evenodd" d="M50 95C26 66 20 54 20 40a30 30 0 0 1 60 0c0 14-6 26-30 55ZM50 54a14 14 0 1 0 0-28 14 14 0 0 0 0 28Z" fill="${P}"/>`,
  house: P => `<path fill-rule="evenodd" d="M50 8 6 48h13v40h62V48h13ZM42 62h16v26H42Z" fill="${P}"/>`,
  eye: P => `<path fill-rule="evenodd" d="M4 50C20 22 80 22 96 50 80 78 20 78 4 50ZM50 66a16 16 0 1 0 0-32 16 16 0 0 0 0 32Z" fill="${P}"/><circle cx="50" cy="50" r="7" fill="${P}"/>`,
  cup: P => `<path d="M14 34h56v28c0 15-12 27-28 27S14 77 14 62Z" fill="${P}"/><path d="M70 42h9a11 11 0 0 1 0 22h-8" fill="none" stroke="${P}" stroke-width="7" stroke-linecap="round"/><path d="M30 8c-5 6 5 10 0 18M46 8c-5 6 5 10 0 18" fill="none" stroke="${P}" stroke-width="5" stroke-linecap="round"/>`,
  crescent: P => `<path d="M64 8A42 42 0 1 0 92 64 34 34 0 1 1 64 8Z" fill="${P}"/><path d="M76 18l2.500 7 7 2.500-7 2.500L76 37l-2.500-7-7-2.500 7-2.500Z" fill="${P}"/>`,
  arcs: P => Array.from({ length: 4 }, (_, i) => { const a1 = (i * 90 + 8) * Math.PI / 180, a2 = (i * 90 + 82) * Math.PI / 180; const [x1, y1] = pt(36, a1), [x2, y2] = pt(36, a2); return `<path d="M${fx(x1)} ${fx(y1)}A36 36 0 0 1 ${fx(x2)} ${fx(y2)}" fill="none" stroke="${P}" stroke-width="11" stroke-linecap="round" opacity="${fx(1 - i * .2)}"/>`; }).join('') + `<circle cx="50" cy="50" r="10" fill="${P}"/>`,
  trio: P => [0, 1, 2].map(i => { const [x, y] = pt(17, -Math.PI / 2 + i * 2 * Math.PI / 3); return `<circle cx="${fx(x)}" cy="${fx(y)}" r="28" fill="${P}" opacity=".6"/>`; }).join(''),
  spiral: P => { const p = []; for (let t = 0; t <= 5.2 * Math.PI; t += .12) p.push(pt(3 + t * 2.6, t)); return `<polyline points="${pts(p)}" fill="none" stroke="${P}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`; },
};

const FAM = {
  petals: (n, dot) => P => Array.from({ length: n }, (_, i) => `<ellipse cx="50" cy="27" rx="${fx(Math.min(15, 78 / n))}" ry="22" transform="${rot(i, n)}" fill="${P}" opacity=".88"/>`).join('') + (dot ? `<circle cx="50" cy="50" r="7" fill="${P}"/>` : ''),
  star: (n, ratio) => P => `<polygon points="${pts(Array.from({ length: n * 2 }, (_, i) => pt(i % 2 ? 46 * ratio : 46, -Math.PI / 2 + i * Math.PI / n)))}" fill="${P}" stroke="${P}" stroke-width="2" stroke-linejoin="round"/>`,
  nest: n => P => [44, 30, 16].map((R, k) => `<polygon points="${pts(Array.from({ length: n }, (_, i) => pt(R, -Math.PI / 2 + i * 2 * Math.PI / n + k * Math.PI / n / 2)))}" fill="none" stroke="${P}" stroke-width="4" stroke-linejoin="round" opacity="${fx(1 - k * .22)}"/>`).join(''),
  rhodo: k => P => { const p = []; for (let t = 0; t <= 2 * Math.PI + .02; t += .03) p.push(pt(44 * Math.cos(k * t), t)); return `<polyline points="${pts(p)}" fill="none" stroke="${P}" stroke-width="3.5" stroke-linejoin="round"/>`; },
  dots: n => P => { let s = ''; const step = 84 / (n - 1); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = 8 + i * step, y = 8 + j * step, d = Math.hypot(x - 50, y - 50); if (d <= 47) s += `<circle cx="${fx(x)}" cy="${fx(y)}" r="${fx(Math.max(1.6, step * .42 * (1 - d / 120)))}" fill="${P}"/>`; } return s; },
  rays: n => P => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, [x1, y1] = pt(16, a), [x2, y2] = pt(i % 2 ? 36 : 46, a); return `<line x1="${fx(x1)}" y1="${fx(y1)}" x2="${fx(x2)}" y2="${fx(y2)}" stroke="${P}" stroke-width="${n > 10 ? 3 : 5}" stroke-linecap="round"/>`; }).join('') + `<circle cx="50" cy="50" r="7" fill="${P}"/>`,
  sq: n => P => Array.from({ length: n }, (_, i) => `<rect x="17" y="17" width="66" height="66" fill="none" stroke="${P}" stroke-width="3.5" transform="${rot(i, 4 * n)}" opacity="${fx(1 - i * .15)}"/>`).join(''),
  wedge: n => P => Array.from({ length: n }, (_, i) => { const a1 = i * 2 * Math.PI / n - Math.PI / 2 + .04, a2 = (i + 1) * 2 * Math.PI / n - Math.PI / 2 - .04; const [x1, y1] = pt(46, a1), [x2, y2] = pt(46, a2); return `<path d="M50 50L${fx(x1)} ${fx(y1)}A46 46 0 0 1 ${fx(x2)} ${fx(y2)}Z" fill="${P}" opacity="${fx(.35 + .65 * i / (n - 1))}"/>`; }).join(''),
  rbars: n => P => Array.from({ length: n }, (_, i) => { const a = i * 2 * Math.PI / n, L = 10 + 22 * Math.abs(Math.sin(i * 1.7)) + (i % 3) * 3; const [x1, y1] = pt(16, a), [x2, y2] = pt(16 + L, a); return `<line x1="${fx(x1)}" y1="${fx(y1)}" x2="${fx(x2)}" y2="${fx(y2)}" stroke="${P}" stroke-width="${n > 16 ? 2.6 : 4.2}" stroke-linecap="round"/>`; }).join(''),
  leafring: n => P => Array.from({ length: n }, (_, i) => `<path d="M50 6C62 18 62 34 50 44 38 34 38 18 50 6Z" transform="${rot(i, n)}" fill="${P}" opacity=".9"/>`).join('') + `<circle cx="50" cy="50" r="5" fill="${P}"/>`,
};
const GLYPH_LIST = [['mono', null], ['monoOne', null], ['monoStack', null], ...Object.entries(BASE)];
[[5, 0], [6, 1], [8, 0], [8, 1], [12, 0], [3, 1]].forEach(([n, d]) => GLYPH_LIST.push([`petals${n}${d ? 'd' : ''}`, FAM.petals(n, d)]));
[[4, .32], [5, .45], [6, .5], [8, .55], [12, .72]].forEach(([n, r]) => GLYPH_LIST.push([`star${n}`, FAM.star(n, r)]));
[3, 4, 5, 6, 8].forEach(n => GLYPH_LIST.push([`nest${n}`, FAM.nest(n)]));
[2, 3, 4, 5].forEach(k => GLYPH_LIST.push([`rhodo${k}`, FAM.rhodo(k)]));
[5, 7, 9].forEach(n => GLYPH_LIST.push([`dots${n}`, FAM.dots(n)]));
[8, 16].forEach(n => GLYPH_LIST.push([`rays${n}`, FAM.rays(n)]));
[3, 4, 5].forEach(n => GLYPH_LIST.push([`sq${n}`, FAM.sq(n)]));
[5, 6, 8].forEach(n => GLYPH_LIST.push([`wedge${n}`, FAM.wedge(n)]));
[12, 24].forEach(n => GLYPH_LIST.push([`rbars${n}`, FAM.rbars(n)]));
[6, 8, 10].forEach(n => GLYPH_LIST.push([`leafring${n}`, FAM.leafring(n)]));
const GLYPHS = Object.fromEntries(GLYPH_LIST);
const GLYPH_IDS = GLYPH_LIST.map(g => g[0]);
const isMono = id => id === 'mono' || id === 'monoOne' || id === 'monoStack';

const frameShape = (d, P, f, sw = 3.5) => `<path d="${d}" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="${sw}" stroke-linejoin="round"`}/>`;
const FRAMES = {
  none: null,
  circle: (P, f) => f ? `<circle cx="50" cy="50" r="47" fill="${P}"/>` : `<circle cx="50" cy="50" r="46" fill="none" stroke="${P}" stroke-width="3"/>`,
  ring2: (P, f) => f ? `<circle cx="50" cy="50" r="47" fill="${P}"/>` : `<circle cx="50" cy="50" r="47" fill="none" stroke="${P}" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="none" stroke="${P}" stroke-width="5"/>`,
  shield: (P, f) => frameShape('M50 4 90 18v32c0 24-18 40-40 47C28 90 10 74 10 50V18Z', P, f),
  hex: (P, f) => frameShape('M50 3 91 26.500v47L50 97 9 73.500v-47Z', P, f),
  square: (P, f) => `<rect x="5" y="5" width="90" height="90" rx="22" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5"`}/>`,
  diamond: (P, f) => frameShape('M50 2 98 50 50 98 2 50Z', P, f),
  arch: (P, f) => frameShape('M12 96V46C12 22 30 5 50 5s38 17 38 41v50Z', P, f),
  oct: (P, f) => frameShape('M33 4h34l29 29v34L67 96H33L4 67V33Z', P, f),
  tri: (P, f) => frameShape('M50 5 96 90H4Z', P, f),
  pill: (P, f) => `<rect x="22" y="3" width="56" height="94" rx="28" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5"`}/>`,
  squircle: (P, f) => `<rect x="4" y="4" width="92" height="92" rx="34" ${f ? `fill="${P}"` : `fill="none" stroke="${P}" stroke-width="3.5"`}/>`,
  corners: (P, f) => f ? `<rect x="5" y="5" width="90" height="90" fill="${P}"/>` : [[5, 5, 1, 1], [95, 5, -1, 1], [5, 95, 1, -1], [95, 95, -1, -1]].map(([x, y, sx, sy]) => `<path d="M${x} ${y + 26 * sy}V${y}H${x + 26 * sx}" fill="none" stroke="${P}" stroke-width="4"/>`).join(''),
};
const FRAME_IDS = Object.keys(FRAMES);
const LAYOUTS = [['horizontal', 'Yonma-yon'], ['stacked', 'Ustma-ust'], ['badge', 'Emblema'], ['word', 'Faqat matn'], ['icon', 'Faqat ikon']];
const BGS = [['dark', 'Qorong‘i'], ['light', 'Yorug‘'], ['transparent', 'Shaffof']];

/* ───────── yordamchilar ───────── */
const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex2 = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (h1, h2, t) => '#' + hex2(h1).map((v, i) => Math.round(v + (hex2(h2)[i] - v) * t).toString(16).padStart(2, '0')).join('');
const lum = h => { const [r, g, b] = hex2(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
const slug = s => (s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')) || 'logo';
const pick = a => a[Math.floor(Math.random() * a.length)];
const chance = p => Math.random() < p;
const mctx = document.createElement('canvas').getContext('2d');

function measure(text, family, weight, size, ls) {
  mctx.font = `${weight} ${size}px "${family}"`;
  const m = mctx.measureText(text);
  return { w: m.width + ls * Math.max([...text].length - 1, 0), a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
}
const initialsOf = (name, one) => {
  const w = name.trim().split(/\s+/).filter(Boolean);
  const s = (w.length > 1 && !one) ? w[0][0] + w[1][0] : (w[0] || 'A')[0];
  return s.toUpperCase();
};

/* ───────── holat ───────── */
const DEFAULT = {
  name: 'Aurelia', tagline: 'Atelier & Jewelry', glyph: 'lotus', frame: 'none', filled: false,
  pal: 'aurum', font: 'Playfair Display', weight: 600, layout: 'horizontal', bg: 'dark',
  iconScale: 100, textScale: 100, spacing: 6, rotate: 0, upper: false, gradient: true,
  shadow: false, shine: false, textGrad: false, outline: false, c1: null, c2: null, cT: null, cBg: null,
};
let state = { ...DEFAULT };
try { Object.assign(state, JSON.parse(localStorage.getItem('aurum.state') || '{}')); } catch (e) { /* ignore */ }
const sanitize = () => {
  if (!FONTS[state.font]) state.font = DEFAULT.font;
  if (!FONTS[state.font].w.includes(state.weight)) state.weight = FONTS[state.font].def;
  if (!PAL[state.pal]) state.pal = DEFAULT.pal;
  if (!(state.glyph in GLYPHS)) state.glyph = DEFAULT.glyph;
  if (!(state.frame in FRAMES)) state.frame = 'none';
  if (!LAYOUTS.some(l => l[0] === state.layout)) state.layout = 'horizontal';
};
sanitize();

function effPal(st) {
  const p = { ...(PAL[st.pal] || PALETTES[0]) };
  if (st.c1) { p.m = st.c1; p.a = mix(st.c1, '#ffffff', .45); p.b = st.c2 || mix(st.c1, '#000000', .45); }
  else if (st.c2) p.b = st.c2;
  if (st.cT) p.tDark = p.tLight = st.cT;
  if (st.cBg) p.dark = p.light = st.cBg;
  return p;
}

/* ───────── logotip yasash ───────── */
function glyphMarkup(st, id, P, K) {
  if (isMono(id)) {
    const t = id === 'monoOne' ? initialsOf(st.name, true) : initialsOf(st.name);
    const common = `font-family="'${st.font}', serif" font-weight="${st.weight}" text-anchor="middle" fill="${P}"`;
    if (id === 'monoStack' && t.length > 1) {
      const m = measure(t[0], st.font, st.weight, 46, 0);
      return `<text x="50" y="${fx(46)}" font-size="46" ${common}>${esc(t[0])}</text><text x="50" y="${fx(46 + m.a + 6)}" font-size="46" ${common}>${esc(t[1])}</text>`;
    }
    const size = t.length > 1 ? 54 : 78;
    const m = measure(t, st.font, st.weight, size, 0);
    return `<text x="50" y="${fx(50 + (m.a - m.d) / 2)}" font-size="${size}" ${common}>${esc(t)}</text>`;
  }
  return GLYPHS[id](P, K);
}

function iconInner(st, uid, o) {
  const pal = o.pal, dark = o.dark, force = o.force;
  const cut = force ? (force === '#ffffff' ? '#000000' : '#ffffff') : (dark ? pal.dark : pal.light);
  const grad = force || (st.gradient ? `url(#g${uid})` : (dark ? pal.m : mix(pal.m, '#000000', .3)));
  const filled = st.frame !== 'none' && st.filled;
  const P = filled ? cut : grad, K = filled ? grad : cut;
  let glyph = glyphMarkup(st, st.glyph, P, K);
  if (st.shine && !force) glyph += `<g opacity=".9">${glyphMarkup(st, st.glyph, `url(#sh${uid})`, 'none')}</g>`;
  if (st.rotate) glyph = `<g transform="rotate(${st.rotate} 50 50)">${glyph}</g>`;
  if (st.frame === 'none') return glyph;
  const s = isMono(st.glyph) ? .78 : .54;
  return FRAMES[st.frame](grad, filled) + `<g transform="translate(50 50) scale(${s}) translate(-50 -50)">${glyph}</g>`;
}

function defsFor(st, uid, pal, dark, F) {
  const stops = dark ? [pal.a, pal.m, pal.b] : [mix(pal.m, '#000000', .1), mix(pal.b, '#000000', .3)];
  const stopTags = stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join('');
  let d = `<linearGradient id="g${uid}" gradientUnits="userSpaceOnUse" x1="8" y1="6" x2="92" y2="96">${stopTags}</linearGradient>`;
  d += `<linearGradient id="gt${uid}" x1="0" y1="0" x2="1" y2="0">${stopTags}</linearGradient>`;
  d += `<linearGradient id="sh${uid}" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="70" y2="80"><stop offset="0" stop-color="#fff" stop-opacity=".62"/><stop offset=".45" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`;
  if (st.shadow) d += `<filter id="sd${uid}" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="${fx(F * .07)}" stdDeviation="${fx(F * .09)}" flood-color="#000" flood-opacity=".5"/></filter>`;
  return d;
}

function build(st, uid = 'x', o = {}) {
  const pal = effPal(st), force = st.force || null;
  let dark;
  if (st.cBg && st.bg !== 'transparent') dark = lum(st.cBg) < .5;
  else dark = st.bg === 'dark' || (st.bg === 'transparent' && (st.tone || 'dark') === 'dark');
  const bgColor = st.bg === 'transparent' ? null : (dark ? pal.dark : pal.light);
  const txt = force || (dark ? pal.tDark : pal.tLight);
  let name = st.name.trim() || 'Brend';
  if (st.upper) name = name.toUpperCase();
  const F = 60 * st.textScale / 100, ls = st.spacing / 100 * F;
  const nameAttr = st.outline
    ? `fill="none" stroke="${force || (st.textGrad ? pal.m : txt)}" stroke-width="${fx(Math.max(1, F * .03))}" stroke-linejoin="round"`
    : `fill="${force || (st.textGrad ? `url(#gt${uid})` : txt)}"`;
  const tagFill = force || (dark ? mix(txt, pal.m, .35) : mix(txt, pal.m, .2));
  const tagText = (st.tagline || '').trim().toUpperCase();
  const iconCtx = { pal, dark, force };
  const wrap = (inner, VW, VH) => {
    if (st.shadow) inner = `<g filter="url(#sd${uid})">${inner}</g>`;
    const body = (bgColor && !o.noBg ? `<rect width="${fx(VW)}" height="${fx(VH)}" fill="${bgColor}"/>` : '') + inner;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fx(VW)} ${fx(VH)}" width="${Math.round(VW)}" height="${Math.round(VH)}" role="img" aria-label="${esc(name)}"><defs>${defsFor(st, uid, pal, dark, F)}${o.fontCss ? `<style>${o.fontCss}</style>` : ''}</defs>${body}</svg>`;
    return { svg, w: VW, h: VH, dark, bgColor };
  };

  if (st.layout === 'badge') {
    const pad = o.pad != null ? o.pad : 26, grad = force || `url(#g${uid})`, I = 112 * st.iconScale / 100, band = 119;
    let g = `<circle cx="150" cy="150" r="146" fill="none" stroke="${grad}" stroke-width="3.5"/><circle cx="150" cy="150" r="140" fill="none" stroke="${grad}" stroke-width="1"/><circle cx="150" cy="150" r="98" fill="none" stroke="${grad}" stroke-width="1.5"/>`;
    const topSize = (() => { const base = 40, m = measure(name, st.font, st.weight, base, base * st.spacing / 100); return Math.max(13, Math.min(base * st.textScale / 100 * .9, base * Math.PI * band * .74 / m.w)); })();
    const rt = band - measure('H', st.font, st.weight, topSize, 0).a / 2;
    g += `<path id="pt${uid}" d="M${fx(150 - rt)} 150A${fx(rt)} ${fx(rt)} 0 0 1 ${fx(150 + rt)} 150" fill="none"/>`;
    g += `<text font-family="'${st.font}', serif" font-weight="${st.weight}" font-size="${fx(topSize)}" letter-spacing="${fx(topSize * st.spacing / 100)}" ${nameAttr}><textPath href="#pt${uid}" startOffset="50%" text-anchor="middle">${esc(name)}</textPath></text>`;
    if (tagText) {
      const tb = 15, base = measure(tagText, TAG_FONT.family, TAG_FONT.weight, tb, tb * .3);
      const ts = Math.max(8, Math.min(15, tb * Math.PI * band * .62 / base.w));
      const rb = band + measure('H', TAG_FONT.family, TAG_FONT.weight, ts, 0).a / 2;
      g += `<path id="pb${uid}" d="M${fx(150 - rb)} 150A${fx(rb)} ${fx(rb)} 0 0 0 ${fx(150 + rb)} 150" fill="none"/>`;
      g += `<text font-family="'${TAG_FONT.family}', sans-serif" font-weight="${TAG_FONT.weight}" font-size="${fx(ts)}" letter-spacing="${fx(ts * .3)}" fill="${tagFill}"><textPath href="#pb${uid}" startOffset="50%" text-anchor="middle">${esc(tagText)}</textPath></text>`;
    }
    const star = cx => `<path transform="translate(${cx} 150) scale(.13) translate(-50 -50)" d="M50 4C54 34 66 46 96 50 66 54 54 66 50 96 46 66 34 54 4 50 34 46 46 34 50 4Z" fill="${grad}"/>`;
    g += star(150 - band) + star(150 + band);
    g += `<g transform="translate(${fx(150 - I / 2)} ${fx(150 - I / 2)}) scale(${fx(I / 100)})">${iconInner(st, uid, iconCtx)}</g>`;
    const V = 300 + pad * 2;
    return wrap(`<g transform="translate(${pad} ${pad})">${g}</g>`, V, V);
  }

  const nm = measure(name, st.font, st.weight, F, ls);
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
  const gapT = F * .34, nameD = Math.max(nm.d, 0);
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
  let inner = '';
  if (showIcon) inner += `<g transform="translate(${fx(pad + iconX)} ${fx(pad + iconY)}) scale(${(I / 100).toFixed(4)})">${iconInner(st, uid, iconCtx)}</g>`;
  if (showText) {
    const nx = pad + textX + (center ? (blockW - nm.w) / 2 : 0);
    const ny = pad + textY + nm.a;
    inner += `<text x="${fx(nx)}" y="${fx(ny)}" font-family="'${st.font}', serif" font-weight="${st.weight}" font-size="${fx(F)}" letter-spacing="${fx(ls)}" ${nameAttr}>${esc(name)}</text>`;
    if (tm) {
      const tx = pad + textX + (center ? (blockW - tm.w) / 2 : 0);
      const ty = ny + nameD + gapT + tm.a;
      inner += `<text x="${fx(tx)}" y="${fx(ty)}" font-family="'${TAG_FONT.family}', sans-serif" font-weight="${TAG_FONT.weight}" font-size="${fx(TF)}" letter-spacing="${fx(tls)}" fill="${tagFill}" opacity=".9">${esc(tagText)}</text>`;
    }
  }
  return wrap(inner, W + pad * 2, H + pad * 2);
}

/* kichik prevyular (tanlagichlar uchun) */
function iconThumb(st, uid, override) {
  const s = { ...st, ...override, shadow: false, shine: false, rotate: 0, force: null, gradient: true };
  const pal = effPal(s);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs>${defsFor(s, uid, pal, true, 40)}</defs>${iconInner(s, uid, { pal, dark: true })}</svg>`;
}
function layoutThumb(id) {
  const g = '#d4a843', t = '#9a968a';
  const m = {
    horizontal: `<circle cx="22" cy="28" r="11" fill="${g}"/><rect x="40" y="19" width="42" height="8" rx="2" fill="${t}"/><rect x="40" y="31" width="28" height="4" rx="2" fill="${g}" opacity=".6"/>`,
    stacked: `<circle cx="50" cy="15" r="9" fill="${g}"/><rect x="26" y="30" width="48" height="8" rx="2" fill="${t}"/><rect x="34" y="42" width="32" height="3" rx="1.5" fill="${g}" opacity=".6"/>`,
    badge: `<circle cx="50" cy="28" r="24" fill="none" stroke="${g}" stroke-width="2"/><circle cx="50" cy="28" r="14" fill="none" stroke="${g}" stroke-width="1" opacity=".7"/><circle cx="50" cy="28" r="6" fill="${g}"/>`,
    word: `<rect x="18" y="20" width="64" height="10" rx="2" fill="${t}"/><rect x="30" y="35" width="40" height="3" rx="1.5" fill="${g}" opacity=".6"/>`,
    icon: `<path d="M50 6 66 28 50 50 34 28Z" fill="${g}"/><path d="M34 30 48 52 34 50Z" fill="${g}" opacity=".5"/>`,
  }[id];
  return `<svg viewBox="0 0 100 56" aria-hidden="true">${m}</svg>`;
}

/* ───────── eksport: shriftlarni SVG ichiga joylash ───────── */
const fontCache = new Map();
const blobToDataUrl = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function fontCssFor(family, weight) {
  const key = family + weight;
  if (fontCache.has(key)) return fontCache.get(key);
  const p = (async () => {
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=swap`)).text();
    const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)]
      .filter(m => ['latin', 'latin-ext', 'cyrillic'].includes(m[1])).map(m => m[2]);
    const out = [];
    for (const b of blocks) {
      const u = /url\(([^)]+)\)/.exec(b);
      if (u) out.push(b.replace(u[0], `url(${await blobToDataUrl(await (await fetch(u[1])).blob())})`));
    }
    return out.join('\n');
  })().catch(() => '');
  fontCache.set(key, p);
  return p;
}
async function fontCssForState(st) {
  const list = [fontCssFor(st.font, st.weight)];
  if ((st.tagline || '').trim() && st.layout !== 'icon') list.push(fontCssFor(TAG_FONT.family, TAG_FONT.weight));
  return (await Promise.all(list)).join('\n');
}
async function exportSvg(st) { return build(st, 'e', { fontCss: await fontCssForState(st) }); }

/* ───────── UI ───────── */
const preview = $('#preview'), stage = $('#stage'), toastEl = $('#toast');
let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2400); }

let fontCat = 'all';
const fontObserver = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadFamily(e.target.dataset.v); fontObserver.unobserve(e.target); } }), { rootMargin: '120px' }) : null;

function buildPickers() {
  const gg = $('#glyphGrid'), fg = $('#frameGrid'), pg = $('#palGrid'), lg = $('#layoutGrid'), bg = $('#bgGrid'), cats = $('#fontCats');
  GLYPH_IDS.forEach(id => { const b = el('button', 'opt'); b.type = 'button'; b.dataset.v = id; gg.appendChild(b); });
  FRAME_IDS.forEach(id => { const b = el('button', 'opt'); b.type = 'button'; b.dataset.v = id; fg.appendChild(b); });
  PALETTES.forEach(p => {
    const b = el('button', 'sw-p'); b.type = 'button'; b.dataset.v = p.id; b.title = p.name;
    b.style.background = `linear-gradient(135deg,${p.a},${p.m} 55%,${p.b})`; pg.appendChild(b);
  });
  LAYOUTS.forEach(([v, t]) => { const b = el('button', 'lay', layoutThumb(v) + t); b.type = 'button'; b.dataset.v = v; lg.appendChild(b); });
  BGS.forEach(([v, t]) => { const b = el('button', 'chip', t); b.type = 'button'; b.dataset.v = v; bg.appendChild(b); });
  CATS.forEach(([v, t]) => { const b = el('button', 'chip', t); b.type = 'button'; b.dataset.v = v; cats.appendChild(b); });
  buildFontList();

  gg.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) update({ glyph: b.dataset.v }); });
  fg.addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) update({ frame: b.dataset.v }); });
  pg.addEventListener('click', e => { const b = e.target.closest('.sw-p'); if (b) update({ pal: b.dataset.v, c1: null, c2: null, cT: null, cBg: null }); });
  lg.addEventListener('click', e => { const b = e.target.closest('.lay'); if (b) update({ layout: b.dataset.v }); });
  bg.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) update({ bg: b.dataset.v }); });
  cats.addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) { fontCat = b.dataset.v; buildFontList(); syncControls(); } });
  $('#fontGrid').addEventListener('click', e => { const b = e.target.closest('.fopt'); if (b) update({ font: b.dataset.v, weight: FONTS[b.dataset.v].def }); });
  $('#weightGrid').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) update({ weight: +b.dataset.v }); });
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.pane').forEach(p => { p.hidden = p.dataset.pane !== b.dataset.tab; });
  });
}
function buildFontList() {
  const fo = $('#fontGrid'); fo.innerHTML = '';
  Object.entries(FONTS).filter(([, c]) => fontCat === 'all' || c.cat === fontCat).forEach(([n, c]) => {
    const b = el('button', 'fopt'); b.type = 'button'; b.dataset.v = n; b.style.fontFamily = `'${n}',serif`;
    b.style.fontWeight = c.def; b.innerHTML = `<span class="fw">${esc(state.name.trim().slice(0, 12) || 'Aurelia')}</span><small>${n} · ${c.tag}</small>`;
    fo.appendChild(b);
    if (fontObserver) fontObserver.observe(b); else loadFamily(n);
  });
}

const mark = (root, v) => $$('[data-v]', root).forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
function syncControls() {
  mark($('#glyphGrid'), state.glyph); mark($('#frameGrid'), state.frame);
  mark($('#palGrid'), (state.c1 || state.c2 || state.cT || state.cBg) ? '' : state.pal);
  mark($('#fontGrid'), state.font); mark($('#layoutGrid'), state.layout); mark($('#bgGrid'), state.bg); mark($('#fontCats'), fontCat);
  const wg = $('#weightGrid'), ws = FONTS[state.font].w;
  wg.innerHTML = ws.length > 1 ? ws.map(w => `<button type="button" class="chip" data-v="${w}">${w}</button>`).join('') : '<span class="note">Bu shriftning bitta qalinligi bor</span>';
  mark(wg, state.weight);
  $$('#glyphGrid .opt').forEach(b => { b.innerHTML = iconThumb(state, 'tg' + b.dataset.v, { glyph: b.dataset.v, frame: 'none' }); });
  $$('#frameGrid .opt').forEach(b => {
    b.innerHTML = b.dataset.v === 'none'
      ? '<svg viewBox="0 0 100 100"><path d="M20 20 80 80M80 20 20 80" stroke="#6c6a63" stroke-width="5" stroke-linecap="round"/></svg>'
      : iconThumb(state, 'tf' + b.dataset.v, { frame: b.dataset.v, glyph: 'spark' });
  });
  $$('#fontGrid .fw').forEach(s => { s.textContent = state.name.trim().slice(0, 12) || 'Aurelia'; });
  const p = effPal(state);
  if ($('#name').value !== state.name) $('#name').value = state.name;
  if ($('#tagline').value !== state.tagline) $('#tagline').value = state.tagline;
  $('#c1').value = p.m; $('#c2').value = p.b; $('#cT').value = p.tDark; $('#cBg').value = p.dark;
  ['filled', 'upper', 'gradient', 'shadow', 'shine', 'textGrad', 'outline'].forEach(k => { $('#' + k).checked = !!state[k]; });
  [['iconScale', '%'], ['textScale', '%'], ['spacing', ''], ['rotate', '°']].forEach(([k, u]) => {
    const r = $('#' + k); r.value = state[k]; r.nextElementSibling.textContent = state[k] + u;
  });
  $('#filled').disabled = state.frame === 'none';
  $('#undoBtn').disabled = hist.idx <= 0; $('#redoBtn').disabled = hist.idx >= hist.list.length - 1;
}

/* tarix (undo / redo) */
const hist = { list: [JSON.stringify(state)], idx: 0, t: 0 };
function commit() {
  clearTimeout(hist.t);
  hist.t = setTimeout(() => {
    const s = JSON.stringify(state);
    if (s === hist.list[hist.idx]) return;
    hist.list = hist.list.slice(0, hist.idx + 1); hist.list.push(s); hist.idx++;
    if (hist.list.length > 100) { hist.list.shift(); hist.idx--; }
    syncControls();
  }, 350);
}
function jump(d) {
  const i = hist.idx + d; if (i < 0 || i >= hist.list.length) return;
  clearTimeout(hist.t); hist.idx = i;
  state = { ...DEFAULT, ...JSON.parse(hist.list[i]) }; sanitize(); render(true);
}

let rid = 0, saveT;
async function render(noCommit) {
  const my = ++rid;
  await Promise.all([ensureFont(state.font, state.weight, state.name + 'Aa'), ensureFont(TAG_FONT.family, TAG_FONT.weight, state.tagline || 'A')]);
  if (my !== rid) return;
  const r = build(state, 'main', { noBg: true });
  preview.innerHTML = r.svg;
  stage.dataset.bg = state.bg;
  stage.style.background = r.bgColor || '';
  syncControls();
  renderMocks();
  if (!noCommit) commit();
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem('aurum.state', JSON.stringify(state)); } catch (e) { /* ignore */ } }, 300);
}
function update(patch) { Object.assign(state, patch); sanitize(); render(); }

/* ───────── mockuplar ───────── */
function setMock(sel, patch, bgCss) {
  const host = $(sel); if (!host) return;
  host.innerHTML = build({ ...state, bg: 'transparent', ...patch }, 'm' + sel.replace(/\W/g, ''), { pad: 0 }).svg;
  host.style.background = bgCss;
}
function renderMocks() {
  const pal = effPal(state), dk = pal.dark, lt = pal.light;
  const word = state.layout === 'badge' ? 'badge' : (state.layout === 'icon' ? 'icon' : 'horizontal');
  setMock('#mkCardFront', { tone: 'dark', layout: word, tagline: '', shadow: false }, dk);
  setMock('#mkCardBack', { tone: 'light', layout: 'icon', shadow: false }, lt);
  setMock('#mkSign', { tone: 'dark', layout: state.layout === 'badge' ? 'badge' : 'stacked' }, dk);
  $('#mkSign').style.setProperty('--glow', pal.m + '66');
  setMock('#mkApp1', { tone: 'dark', layout: 'icon', shadow: false }, `radial-gradient(circle at 30% 20%,${mix(dk, pal.m, .25)},${dk})`);
  setMock('#mkApp2', { tone: 'dark', layout: 'icon', shadow: false, force: dk, shine: false }, `linear-gradient(135deg,${pal.a},${pal.m} 55%,${pal.b})`);
  setMock('#mkApp3', { tone: 'light', layout: 'icon', shadow: false }, lt);
  setMock('#mkBanner', { tone: 'dark', layout: word }, `radial-gradient(120% 140% at 80% 0%,${mix(dk, pal.m, .3)},${dk} 60%)`);
}

/* ───────── g'oyalar ───────── */
let concepts = [];
function randomConcept() {
  const p = pick(PALETTES), f = pick(Object.keys(FONTS).filter(k => FONTS[k].cat !== 'script' || chance(.3))), cfg = FONTS[f];
  const frame = pick(['none', 'none', 'none', 'circle', 'ring2', 'shield', 'hex', 'square', 'diamond', 'arch', 'oct', 'pill', 'squircle', 'corners', 'tri']);
  const up = !!cfg.upper || (cfg.cat !== 'script' && chance(.3));
  const layout = chance(.14) ? 'badge' : (chance(.6) ? 'horizontal' : 'stacked');
  return {
    glyph: pick(GLYPH_IDS.filter(g => !isMono(g) || chance(.25))), frame, filled: frame !== 'none' && chance(.5), pal: p.id, font: f, weight: cfg.def,
    layout, bg: chance(.78) ? 'dark' : 'light', upper: up || layout === 'badge',
    spacing: up ? 8 + Math.floor(Math.random() * 12) : Math.floor(Math.random() * 5), iconScale: 100, textScale: 100, rotate: chance(.12) ? pick([-45, 45, 90]) : 0,
    gradient: true, shadow: chance(.2), shine: chance(.25), textGrad: chance(.15), outline: false, c1: null, c2: null, cT: null, cBg: null,
  };
}
function mutate(base) {
  const r = randomConcept(), keys = ['glyph', 'frame', 'filled', 'pal', 'font', 'layout', 'upper', 'spacing', 'shadow', 'shine', 'textGrad', 'rotate'];
  const out = { ...base, c1: null, c2: null, cT: null, cBg: null };
  const n = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < n; i++) { const k = pick(keys); out[k] = r[k]; if (k === 'font') out.weight = r.weight; if (k === 'pal') out.bg = r.bg; }
  return out;
}
function newConcepts(count = 12, base = null) {
  concepts = [];
  const seen = new Set();
  while (concepts.length < count) {
    const c = base ? mutate(base) : randomConcept(), key = base ? JSON.stringify(c) : c.glyph;
    if (!seen.has(key)) { seen.add(key); concepts.push(c); }
  }
  renderConcepts(false);
}
async function renderConcepts(append) {
  const grid = $('#conceptGrid');
  const start = append ? grid.children.length : 0;
  const sts = concepts.slice(start).map(c => ({ ...DEFAULT, ...c, name: state.name, tagline: state.tagline }));
  await Promise.all(sts.map(s => ensureFont(s.font, s.weight, s.name + 'Aa')));
  await ensureFont(TAG_FONT.family, TAG_FONT.weight, state.tagline || 'A');
  if (!append) grid.innerHTML = '';
  sts.forEach((s, k) => {
    const i = start + k;
    const r = build(s, 'c' + i, { pad: 22 });
    const b = el('div', 'cc', r.svg); b.setAttribute('role', 'button'); b.tabIndex = 0; b.style.background = r.bgColor; b.style.animationDelay = (k % 12) * 40 + 'ms';
    b.title = 'Tahrirlash uchun bosing';
    const sim = el('button', 'sim', '≈ O‘xshash'); sim.type = 'button';
    sim.addEventListener('click', e => { e.stopPropagation(); newConcepts(12, concepts[i]); });
    b.appendChild(sim);
    const open = () => { state = { ...DEFAULT, ...concepts[i], name: state.name, tagline: state.tagline }; sanitize(); render(); $('#studio').scrollIntoView({ behavior: 'smooth' }); };
    b.addEventListener('click', open);
    b.addEventListener('keydown', e => { if (e.key === 'Enter') open(); });
    grid.appendChild(b);
  });
}

/* ───────── hero ───────── */
async function renderHero() {
  const samples = [
    { name: 'Aurelia', tagline: 'Jewelry', glyph: 'lotus', pal: 'aurum', font: 'Playfair Display', layout: 'stacked', bg: 'dark', shine: true },
    { name: 'NOVA', tagline: 'Technologies', glyph: 'orbit', frame: 'circle', pal: 'ocean', font: 'Syne', weight: 700, layout: 'stacked', bg: 'dark', upper: true, spacing: 14 },
    { name: 'Kasra', tagline: 'Café & Bakery', glyph: 'leafring8', pal: 'forest', font: 'Cormorant Garamond', layout: 'stacked', bg: 'light' },
    { name: 'Maison Rouge', tagline: 'Paris since 1962', glyph: 'crown', pal: 'crimson', font: 'Cinzel', layout: 'badge', bg: 'dark', upper: true, spacing: 8 },
  ].map(s => ({ ...DEFAULT, spacing: 4, ...s })).map(s => ({ ...s, weight: s.weight === DEFAULT.weight && !FONTS[s.font].w.includes(s.weight) ? FONTS[s.font].def : s.weight }));
  await Promise.all(samples.map(s => ensureFont(s.font, s.weight, s.name)));
  await ensureFont(TAG_FONT.family, TAG_FONT.weight, 'Aa');
  const host = $('#heroShow'); host.innerHTML = '';
  samples.forEach((s, i) => { const r = build(s, 'h' + i, { pad: 18 }); const d = el('div', 'hs', r.svg); d.style.background = r.bgColor; host.appendChild(d); });
}

/* ───────── saqlash ───────── */
const loadSaved = () => { try { return JSON.parse(localStorage.getItem('aurum.saved') || '[]'); } catch (e) { return []; } };
const storeSaved = a => { try { localStorage.setItem('aurum.saved', JSON.stringify(a)); } catch (e) { toast('Saqlab bo‘lmadi (xotira cheklangan)'); } };
async function renderSaved() {
  const grid = $('#savedGrid'), list = loadSaved().map(r => ({ ...DEFAULT, ...r })).filter(s => FONTS[s.font] && s.glyph in GLYPHS);
  if (!list.length) { grid.innerHTML = '<div class="empty">Hali saqlangan logotip yo‘q. Yoqqan variantni “♡ Saqlash” tugmasi bilan shu yerga qo‘shing.</div>'; return; }
  await Promise.all(list.map(s => ensureFont(s.font, s.weight, s.name + 'Aa')));
  grid.innerHTML = '';
  list.forEach((s, i) => {
    const r = build(s, 's' + i, { pad: 22 });
    const d = el('div', 'sv', r.svg); d.style.background = r.bgColor || '#17171c';
    const x = el('button', 'x', '×'); x.type = 'button'; x.title = 'O‘chirish';
    x.addEventListener('click', e => { e.stopPropagation(); const a = loadSaved(); a.splice(i, 1); storeSaved(a); renderSaved(); });
    d.addEventListener('click', () => { state = { ...s }; sanitize(); render(); $('#studio').scrollIntoView({ behavior: 'smooth' }); });
    d.appendChild(x); grid.appendChild(d);
  });
}

/* ───────── eksport ───────── */
async function download(blob, filename) {
  try {
    const d = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (d) { await d.save({ filename, data: blob }); return true; }
  } catch (e) { if (e && e.code === 'declined') return false; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}
async function svgToPngBlob(svg, w, h, width) {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image(); img.src = url; await img.decode();
    const k = width / w, cv = document.createElement('canvas');
    cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return await new Promise(res => cv.toBlob(res, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/* brend taxtasi */
function fitSvg(r, x, y, w, h) {
  const s = Math.min(w / r.w, h / r.h), ww = r.w * s, hh = r.h * s;
  return r.svg.replace(/ width="\d+" height="\d+"/, ` x="${fx(x + (w - ww) / 2)}" y="${fx(y + (h - hh) / 2)}" width="${fx(ww)}" height="${fx(hh)}"`);
}
async function buildSheet() {
  const st = state, pal = effPal(st), fam = `'${st.font}', serif`;
  const fontCss = await fontCssForState(st);
  const L = (t, x, y, c, s = 15) => `<text x="${x}" y="${y}" font-family="'Montserrat', Arial, sans-serif" font-size="${s}" letter-spacing="2.4" fill="${c}">${esc(t.toUpperCase())}</text>`;
  const panel = (x, y, w, h, bg, rx = 28) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${bg}"/>`;
  const logo = (patch, id, x, y, w, h) => fitSvg(build({ ...st, bg: 'transparent', shadow: false, ...patch }, id, { pad: 0 }), x, y, w, h);
  let s = '<rect width="1600" height="900" fill="#ece8df"/>';
  s += panel(40, 40, 940, 540, pal.dark) + logo({ tone: 'dark' }, 'sa', 140, 130, 740, 340) + L('Asosiy logotip', 72, 84, pal.m);
  s += panel(1000, 40, 560, 250, pal.light) + logo({ tone: 'light' }, 'sb', 1060, 80, 440, 150) + L('Yorug‘ fonda', 1032, 84, '#6c6a63');
  s += panel(1000, 310, 272, 270, '#ffffff') + logo({ tone: 'light', force: '#000000' }, 'sc', 1030, 360, 212, 170) + L('Qora', 1032, 354, '#6c6a63');
  s += panel(1288, 310, 272, 270, '#000000') + logo({ tone: 'dark', force: '#ffffff' }, 'sd', 1318, 360, 212, 170) + L('Oq', 1320, 354, '#9a968a');
  s += `<defs><linearGradient id="sgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${pal.a}"/><stop offset=".55" stop-color="${pal.m}"/><stop offset="1" stop-color="${pal.b}"/></linearGradient></defs>`;
  s += panel(40, 600, 250, 250, 'url(#sgr)', 56) + logo({ tone: 'dark', layout: 'icon', force: pal.dark, shine: false }, 'se', 80, 640, 170, 170);
  s += `<circle cx="425" cy="725" r="125" fill="${pal.dark}"/>` + logo({ tone: 'dark', layout: 'icon' }, 'sf', 360, 660, 130, 130);
  s += panel(580, 600, 400, 250, pal.light) + logo({ tone: 'light', layout: 'icon' }, 'sg1', 610, 650, 64, 64) + logo({ tone: 'light', layout: 'icon' }, 'sg2', 700, 666, 32, 32) + logo({ tone: 'light', layout: 'icon' }, 'sg3', 750, 674, 16, 16) + L('Favicon', 612, 630, '#6c6a63');
  s += `<rect x="610" y="740" width="340" height="1" fill="${pal.m}" opacity=".4"/><text x="610" y="790" font-family="${fam}" font-weight="${st.weight}" font-size="42" fill="${pal.tLight}">${esc(st.name.trim() || 'Brend')}</text>` + L(`${st.font} · ${st.weight}`, 612, 822, '#6c6a63', 13);
  s += panel(1000, 600, 560, 250, '#ffffff') + L('Rang palitrasi', 1032, 632, '#6c6a63', 12);
  [pal.a, pal.m, pal.b, pal.dark, pal.light].forEach((c, i) => { s += `<rect x="${1032 + i * 100}" y="650" width="84" height="84" rx="18" fill="${c}" stroke="#d9d4c8"/>` + L(c, 1032 + i * 100, 762, '#4a463e', 12); });
  s += `<text x="1032" y="826" font-family="${fam}" font-weight="${st.weight}" font-size="56" fill="${pal.tLight}">Aa Bb Cc</text>`;
  s += L('Aurum brend taxtasi', 40, 884, '#8a857a', 13);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900"><defs><style>${fontCss}</style></defs>${s}</svg>`, w: 1600, h: 900 };
}

async function busy(btn, fn) {
  const t = btn.textContent; btn.disabled = true; btn.textContent = 'Tayyorlanmoqda…';
  try { await fn(); } catch (e) { console.error(e); toast('Xatolik yuz berdi: ' + (e.message || e)); } finally { btn.disabled = false; btn.textContent = t; }
}
const prep = () => Promise.all([ensureFont(state.font, state.weight, state.name + 'Aa'), ensureFont(TAG_FONT.family, TAG_FONT.weight, state.tagline || 'A')]);
async function exportKind(kind) {
  await prep();
  const base = slug(state.name), tone = build(state, 'q').dark ? 'dark' : 'light';
  const pngOf = async (st, width, name) => { const r = await exportSvg(st); return download(await svgToPngBlob(r.svg, r.w, r.h, width), name); };
  const svgOf = async (st, name) => { const r = await exportSvg(st); return download(new Blob([r.svg], { type: 'image/svg+xml' }), name); };
  let ok;
  if (kind === 'svg') ok = await svgOf(state, base + '-logo.svg');
  else if (kind === 'png') ok = await pngOf(state, state.layout === 'icon' ? 1200 : 2400, base + '-logo.png');
  else if (kind === 'png512') ok = await pngOf(state, 512, base + '-logo-512.png');
  else if (kind === 'png1024') ok = await pngOf(state, 1024, base + '-logo-1024.png');
  else if (kind === 'png4096') ok = await pngOf(state, 4096, base + '-logo-4096.png');
  else if (kind === 'pngT') ok = await pngOf({ ...state, bg: 'transparent', tone }, 2400, base + '-logo-shaffof.png');
  else if (kind === 'svgBlack') ok = await svgOf({ ...state, bg: 'transparent', tone: 'light', force: '#000000' }, base + '-logo-qora.svg');
  else if (kind === 'svgWhite') ok = await svgOf({ ...state, bg: 'transparent', tone: 'dark', force: '#ffffff' }, base + '-logo-oq.svg');
  else if (kind === 'favicon') ok = await pngOf({ ...state, layout: 'icon', bg: 'transparent', tone: 'dark', shadow: false }, 256, base + '-favicon.png');
  else if (kind === 'sheet') { const r = await buildSheet(); ok = await download(await svgToPngBlob(r.svg, r.w, r.h, 2400), base + '-brend-taxtasi.png'); }
  if (ok) toast('Fayl yuklab olindi');
}
function bindActions() {
  $('#dlSvg').addEventListener('click', e => busy(e.currentTarget, () => exportKind('svg')));
  $('#dlPng').addEventListener('click', e => busy(e.currentTarget, () => exportKind('png')));
  $('#dlSheet').addEventListener('click', e => busy(e.currentTarget, () => exportKind('sheet')));
  $('#fmtGrid').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) busy(b, () => exportKind(b.dataset.x)); });
  $('#copySvg').addEventListener('click', e => busy(e.currentTarget, async () => {
    await prep(); const r = await exportSvg(state);
    await navigator.clipboard.writeText(r.svg).catch(() => { throw new Error('nusxalash taqiqlangan'); }); toast('SVG kodi nusxalandi');
  }));
  $('#saveBtn').addEventListener('click', () => { const a = loadSaved(); a.unshift({ ...state }); storeSaved(a.slice(0, 24)); renderSaved(); toast('Kolleksiyaga saqlandi'); });
  $('#shuffleBtn').addEventListener('click', () => { state = { ...DEFAULT, ...randomConcept(), name: state.name, tagline: state.tagline }; sanitize(); render(); });
  $('#mutateBtn').addEventListener('click', () => { state = { ...DEFAULT, ...mutate(state), name: state.name, tagline: state.tagline }; sanitize(); render(); });
  $('#moreConcepts').addEventListener('click', () => newConcepts());
  $('#addConcepts').addEventListener('click', () => { for (let i = 0; i < 12; i++) concepts.push(randomConcept()); renderConcepts(true); });
  $('#undoBtn').addEventListener('click', () => jump(-1));
  $('#redoBtn').addEventListener('click', () => jump(1));
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'z' || /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    e.preventDefault(); jump(e.shiftKey ? 1 : -1);
  });
}

function bindInputs() {
  let t;
  const txt = (id, key) => $(id).addEventListener('input', e => {
    state[key] = e.target.value; render(); clearTimeout(t); t = setTimeout(() => renderConcepts(false), 450);
  });
  txt('#name', 'name'); txt('#tagline', 'tagline');
  ['iconScale', 'textScale', 'spacing', 'rotate'].forEach(k => $('#' + k).addEventListener('input', e => update({ [k]: +e.target.value })));
  ['filled', 'upper', 'gradient', 'shadow', 'shine', 'textGrad', 'outline'].forEach(k => $('#' + k).addEventListener('change', e => update({ [k]: e.target.checked })));
  ['c1', 'c2', 'cT', 'cBg'].forEach(k => $('#' + k).addEventListener('input', e => {
    const patch = { [k]: e.target.value };
    if (k === 'c2' && !state.c1) patch.c1 = effPal(state).m;
    update(patch);
  }));
  $('#resetColors').addEventListener('click', () => update({ c1: null, c2: null, cT: null, cBg: null }));
  $('#heroForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#heroName').value.trim();
    if (v) { state = { ...DEFAULT, ...randomConcept(), name: v, tagline: state.tagline }; sanitize(); newConcepts(); render(); }
    $('#studio').scrollIntoView({ behavior: 'smooth' });
  });
}

/* ───────── boshlash ───────── */
buildPickers(); bindActions(); bindInputs();
[GLYPH_IDS.length, FRAME_IDS.length - 1, PALETTES.length, Object.keys(FONTS).length].forEach((n, i) => { $$('.facts b')[i].textContent = n; });
$('#glyphCnt').textContent = `(${GLYPH_IDS.length})`; $('#fontCnt').textContent = `(${Object.keys(FONTS).length})`;
render(true);
newConcepts();
renderHero();
renderSaved();
document.fonts.ready.then(() => render(true));
})();
