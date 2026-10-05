// Zinapoyali lazer idish (stend) konstruktori: qulf-tishli (finger joint) qismlar + yig'ilgan ko'rinish.
// Koordinatalar: x = chuqurlik (oldindan orqaga), y = balandlik, z = kenglik. Qismlar y-yuqoriga tizimida quriladi.
const $ = id => document.getElementById(id);
const PRESETS = {
  chaq:  { name: "Chaq-chuq stendi", T: 3, C: 4, W: 320, D: 75, H: 70, R: 45, back: 'rect', backEx: 25, ar: 60, t: 3, engText: 'Tokzor' },
  mazali:{ name: "Mazali (arkali)", T: 2, C: 5, W: 340, D: 85, H: 80, R: 70, back: 'arch', backEx: 30, ar: 70, t: 4, engText: 'Mazali Mo' },
  zargar:{ name: "Zargarlik zinapoyasi", T: 4, C: 6, W: 360, D: 55, H: 45, R: 35, back: 'perf', backEx: 20, ar: 110, t: 3, engText: 'Jewelry' },
  quti:  { name: "Oddiy idish", T: 1, C: 3, W: 200, D: 100, H: 80, R: 40, back: 'rect', backEx: 2, ar: 60, t: 3, engText: 'Quti' },
};
const ids = ['T', 'C', 'W', 'D', 'H', 'R', 'backEx', 'ar', 'tabw', 'kf', 'Sw'];
const val = id => parseFloat($(id).value);
let tab = 'asm', presetKey = 'mazali';

// ---------- geometriya yordamchilari ----------
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
function tabsAlong(len, tabw) {
  const n = Math.max(1, Math.floor(len / (2 * tabw))), p = len / n, a = [];
  for (let j = 0; j < n; j++) a.push([(j + .25) * p, (j + .75) * p]);
  return a;
}
// corners soat miliga teskari (CCW) bo'lishi shart; tabs[i] = i-qirraga chiqadigan tishlar
function withTabs(corners, tabs, t, kf) {
  const out = [], n = corners.length;
  for (let i = 0; i < n; i++) {
    const a = corners[i], b = corners[(i + 1) % n];
    out.push(a);
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    if (!tabs[i] || !L) continue;
    const ux = dx / L, uy = dy / L, nx = uy, ny = -ux;
    for (const [s0, s1] of tabs[i]) {
      const A = [a[0] + ux * (s0 - kf / 2), a[1] + uy * (s0 - kf / 2)], B = [a[0] + ux * (s1 + kf / 2), a[1] + uy * (s1 + kf / 2)];
      out.push(A, [A[0] + nx * t, A[1] + ny * t], [B[0] + nx * t, B[1] + ny * t], B);
    }
  }
  return out;
}
function pip(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function distToPoly(p, poly) {
  let m = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    m = Math.min(m, Math.hypot(a[0] + t * dx - p[0], a[1] + t * dy - p[1]));
  }
  return m;
}
const circle = (cx, cy, r, n = 14) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos(i * 2 * Math.PI / n), cy + r * Math.sin(i * 2 * Math.PI / n)]);

// ---------- qismlarni qurish ----------
function params() {
  const t = parseFloat($('t').value);
  return { T: val('T'), C: val('C'), W: val('W'), D: val('D'), H: val('H'), R: val('R'), back: $('back').value,
    backEx: val('backEx'), ar: val('ar'), t, tabw: val('tabw'), kf: val('kf'), Sw: val('Sw'),
    pad: Math.max(6, 2 * t), lift: 6, engOn: $('engOn').checked, engText: $('engText').value.trim() };
}
function build(p) {
  const { T, C, W, D, H, R, t, kf, tabw, pad, lift } = p;
  const L = D - t; // pol va to'siq uzunligi
  const xf = i => pad + i * D, xb = pad + T * D, xEnd = xb + t + pad;
  const bf = i => lift + i * R, top = i => bf(i) + H;
  const hb = top(T - 1), ex = Math.max(2, p.backEx), arch = p.back !== 'rect';
  const parts = [];
  const add = (name, outline, holes = [], engrave = []) => parts.push({ name, outline, holes, engrave });

  // yon devor (zinapoya profili) + qulf uyalari
  const sp = [[0, 0], [xEnd, 0], [xEnd, hb]];
  for (let i = T - 1; i >= 0; i--) { sp.push([i === 0 ? 0 : xf(i), top(i)]); if (i > 0) sp.push([xf(i), top(i - 1)]); }
  const sh = [];
  for (let i = 0; i < T; i++) {
    for (const [s0, s1] of tabsAlong(top(i), tabw)) sh.push(rect(xf(i) + kf / 2, s0 + kf / 2, xf(i) + t - kf / 2, s1 - kf / 2));
    for (const [s0, s1] of tabsAlong(L, tabw)) sh.push(rect(xf(i) + t + s0 + kf / 2, bf(i) + kf / 2, xf(i) + t + s1 - kf / 2, bf(i) + t - kf / 2));
  }
  for (const [s0, s1] of tabsAlong(hb, tabw)) sh.push(rect(xb + kf / 2, s0 + kf / 2, xb + t - kf / 2, s1 - kf / 2));
  add('Yon devor', sp, sh); add('Yon devor', sp, sh);

  // old (pog'ona) devorlari
  for (let i = 0; i < T; i++) {
    const h = top(i), tb = tabsAlong(h, tabw);
    const eng = i === 0 && p.engOn && p.engText ? [{ text: p.engText, x: W / 2, y: bf(0) + H * 0.38, size: Math.min(H * 0.4, W / (p.engText.length * 0.62)) }] : [];
    add(`Old devor ${i + 1}`, withTabs([[0, 0], [W, 0], [W, h], [0, h]], { 1: tb, 3: tb }, t, kf), [], eng);
  }
  // pollar (bo'lim to'siqlari uchun uyalar bilan)
  for (let i = 0; i < T; i++) {
    const tb = tabsAlong(L, tabw), holes = [];
    for (let k = 1; k < C; k++) { const z = k * W / C; for (const [s0, s1] of tb) holes.push(rect(s0 + kf / 2, z - t / 2 + kf / 2, s1 - kf / 2, z + t / 2 - kf / 2)); }
    add(`Pol ${i + 1}`, withTabs([[0, 0], [L, 0], [L, W], [0, W]], { 0: tb, 2: tb }, t, kf), holes);
  }
  // bo'lim to'siqlari
  const Hd = H - t, Hf = Hd * 0.5, tbL = tabsAlong(L, tabw);
  const dc = [[0, 0], [L, 0]];
  for (let i = 0; i <= 12; i++) { const u = L * (1 - i / 12); dc.push([u, Hf + (Hd - Hf) * Math.sin(Math.PI / 2 * (u / L))]); }
  for (let i = 0; i < T; i++) for (let k = 1; k < C; k++) add(`To'siq ${i + 1}`, withTabs(dc, { 0: tbL }, t, kf));
  // orqa devor
  const bc = [[0, 0], [W, 0], [W, hb], [W, hb + ex]];
  if (arch) for (let i = 1; i < 24; i++) { const a = i * Math.PI / 24; bc.push([W / 2 + W / 2 * Math.cos(a), hb + ex + p.ar * Math.sin(a)]); }
  bc.push([0, hb + ex], [0, hb]);
  const tbb = tabsAlong(hb, tabw), bh = [];
  if (p.back === 'perf') {
    const pitch = 8, r = 2.2, row = pitch * 0.866;
    for (let r0 = 0, y = hb + 8; y < hb + ex + p.ar; y += row, r0++) for (let x = 6 + (r0 % 2) * pitch / 2; x < W - 4; x += pitch) {
      const q = [x, y];
      if (pip(q, bc) && distToPoly(q, bc) >= 5 + r) bh.push(circle(x, y, r));
    }
  }
  add('Orqa devor', withTabs(bc, { 1: tbb, [bc.length - 1]: tbb }, t, kf), bh);
  return { parts, dims: { w: W + 2 * t, d: xEnd, h: hb + ex + (arch ? p.ar : 0) }, geo: { xf, xb, xEnd, bf, top, hb, bc, L, Hd, dc } };
}

// ---------- varaqqa joylash ----------
function bboxOf(pts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const q of pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
function layout(parts, Sw, gap = 3) {
  const items = parts.map(pt => ({ pt, bb: bboxOf(pt.outline) })).sort((a, b) => b.bb.h - a.bb.h);
  let x = gap, y = gap, rowH = 0, maxX = 0;
  for (const it of items) {
    if (x + it.bb.w + gap > Sw && x > gap) { x = gap; y += rowH + gap; rowH = 0; }
    it.ox = x; it.oy = y; x += it.bb.w + gap; rowH = Math.max(rowH, it.bb.h); maxX = Math.max(maxX, x);
  }
  return { items, W: Math.max(Sw, maxX), H: y + rowH + gap };
}
const f = n => +n.toFixed(2);
const place = (it, q) => [q[0] - it.bb.x0 + it.ox, it.bb.y1 - q[1] + it.oy];
const poly = (pts, close = true) => 'M' + pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + (close ? 'Z' : '');

function flatSVG(L, preview) {
  const stroke = preview ? '#3a2a1c' : '#ff0000', sw = preview ? 0.35 : 0.1;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${f(L.W)}mm" height="${f(L.H)}mm" viewBox="0 0 ${f(L.W)} ${f(L.H)}">`;
  if (preview) s += `<rect width="${f(L.W)}" height="${f(L.H)}" fill="none" stroke="#a8998a" stroke-dasharray="4 3" stroke-width="0.5"/>`;
  for (const it of L.items) {
    const o = it.pt.outline.map(q => place(it, q));
    s += `<g stroke="${stroke}" stroke-width="${sw}" fill="none" stroke-linejoin="round"><path d="${poly(o)}" ${preview ? 'fill="#e3bd8a"' : ''}/>`;
    for (const h of it.pt.holes) s += `<path d="${poly(h.map(q => place(it, q)))}" ${preview ? 'fill="#fdf8f0"' : ''}/>`;
    s += '</g>';
    for (const e of it.pt.engrave) {
      const [x, y] = place(it, [e.x, e.y]);
      s += `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="${f(e.size)}" font-weight="700" fill="${preview ? '#6b4a2a' : '#0000ff'}">${e.text.replace(/[<&>]/g, '')}</text>`;
    }
    if (preview) s += `<text x="${f(it.ox + 2)}" y="${f(it.oy + it.bb.h + 0)}" font-size="5" fill="#7a6a58" dy="-1">${it.pt.name}</text>`;
  }
  return s + '</svg>';
}
function toDXF(L) {
  let d = '0\nSECTION\n2\nENTITIES\n';
  const pl = pts => { d += `0\nLWPOLYLINE\n8\nCUT\n90\n${pts.length}\n70\n1\n`; for (const q of pts) d += `10\n${f(q[0])}\n20\n${f(L.H - q[1])}\n`; };
  for (const it of L.items) { pl(it.pt.outline.map(q => place(it, q))); for (const h of it.pt.holes) pl(h.map(q => place(it, q))); }
  return d + '0\nENDSEC\n0\nEOF\n';
}

// ---------- yig'ilgan (izometrik) ko'rinish ----------
function asmSVG(p, B) {
  const { T, C, W, D, H, t } = p, g = B.geo, items = [];
  const proj = ([x, y, z]) => [(z - x) * 0.866, -(x + z) * 0.5 - y];
  // plate: pts2d profil, map(u,v,w)->3D, w0..w1 qalinlik, near = ko'rinadigan yuza
  const plate = (pts, map, w0, w1, near, shade = 1) => {
    const far = near === w0 ? w1 : w0;
    let s = '';
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      s += `<path d="${poly([a, b].flatMap(q => [proj(map(q[0], q[1], near))]).concat([b, a].map(q => proj(map(q[0], q[1], far)))))}" fill="var(--side)" stroke="var(--edge)" stroke-width="0.3"/>`;
    }
    s += `<path d="${poly(pts.map(q => proj(map(q[0], q[1], near))))}" fill="${shade === 1 ? 'var(--wood)' : 'var(--wood2)'}" stroke="var(--edge)" stroke-width="0.5" stroke-linejoin="round"/>`;
    items.push(s);
  };
  const sideBody = (() => { // tishsiz profil (uyalar kerak emas)
    const hb = g.hb, sp = [[0, 0], [g.xEnd, 0], [g.xEnd, hb]];
    for (let i = T - 1; i >= 0; i--) { sp.push([i === 0 ? 0 : g.xf(i), g.top(i)]); if (i > 0) sp.push([g.xf(i), g.top(i - 1)]); }
    return sp;
  })();
  plate(sideBody, (u, v, w) => [u, v, w], W, W + t, W); // o'ng yon (uzoq)
  plate(g.bc, (u, v, w) => [w, v, u], g.xb, g.xb + t, g.xb);
  for (let i = T - 1; i >= 0; i--) {
    const x0 = g.xf(i) + t, b0 = g.bf(i);
    plate(rect(0, 0, g.L, W), (u, v, w) => [x0 + u, w, v], b0, b0 + t, b0 + t, 2);
    for (let k = C - 1; k >= 1; k--) {
      const z = k * W / C;
      plate(g.dc, (u, v, w) => [x0 + u, b0 + t + v, w], z - t / 2, z + t / 2, z - t / 2);
    }
    plate(rect(0, 0, W, g.top(i)), (u, v, w) => [w, v, u], g.xf(i), g.xf(i) + t, g.xf(i));
  }
  plate(sideBody, (u, v, w) => [u, v, w], -t, 0, -t);
  // viewBox
  const xs = [], ys = [];
  for (const [x, y, z] of [[0, 0, -t], [g.xEnd, 0, -t], [0, 0, W + t], [g.xEnd, 0, W + t], [0, g.hb, -t], [g.xb, B.dims.h, 0], [g.xb, B.dims.h, W]]) { const q = proj([x, y, z]); xs.push(q[0]); ys.push(q[1]); }
  const x0 = Math.min(...xs) - 10, y0 = Math.min(...ys) - 10, x1 = Math.max(...xs) + 10, y1 = Math.max(...ys) + 10;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f(x0)} ${f(y0)} ${f(x1 - x0)} ${f(y1 - y0)}" style="--wood:#e8c896;--wood2:#f0d6ac;--side:#c79a62;--edge:#4a3220">${items.join('')}</svg>`;
}

// ---------- interfeys ----------
function render() {
  const p = params();
  for (const id of ids) { const o = $('o-' + id); if (o) o.textContent = $(id).value + (id === 'T' || id === 'C' ? '' : ' mm'); }
  $('row-ar').style.display = p.back === 'rect' ? 'none' : '';
  document.querySelectorAll('#presets button').forEach(b => b.classList.toggle('on', b.dataset.k === presetKey));
  $('tab-asm').classList.toggle('on', tab === 'asm'); $('tab-flat').classList.toggle('on', tab === 'flat');
  const B = build(p), L = layout(B.parts, p.Sw);
  $('stage').innerHTML = tab === 'asm' ? asmSVG(p, B) : flatSVG(L, true);
  let cut = 0;
  const per = pts => { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += Math.hypot(b[0] - a[0], b[1] - a[1]); } return s; };
  for (const pt of B.parts) { cut += per(pt.outline); for (const h of pt.holes) cut += per(h); }
  $('stats').innerHTML = `<span>Tashqi o'lcham: <b>${f(B.dims.w)} × ${f(B.dims.d)} × ${f(B.dims.h)} mm</b></span>` +
    `<span>Qismlar: <b>${B.parts.length}</b></span><span>Umumiy kesim: <b>${(cut / 1000).toFixed(1)} m</b></span>` +
    `<span>Varaq: <b>${f(L.W)} × ${f(L.H)} mm</b> (${p.t} mm)</span>`;
  $('tip').textContent = `Tishlar yon devordagi uyalarga kirib, yelimsiz yig'iladi. Avval bitta qismni kesib, uya va tishning zichligini sinang, so'ng kesim kengligini (kerf) moslang. Yozuv ko'k rang bilan o'yiladi (faqat SVG da).`;
  render.last = { B, L };
}
async function download(name, text, type) {
  let dl = null;
  try { dl = window.claude && await window.claude.use('downloads'); } catch (e) {}
  if (dl) { try { await dl.save({ filename: name, data: text }); } catch (e) {} return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function applyPreset(k) {
  presetKey = k; const v = PRESETS[k];
  for (const id of ['T', 'C', 'W', 'D', 'H', 'R', 'backEx', 'ar']) $(id).value = v[id];
  $('back').value = v.back; $('t').value = String(v.t); $('engText').value = v.engText;
  render();
}
for (const [k, v] of Object.entries(PRESETS)) {
  const b = document.createElement('button'); b.textContent = v.name; b.dataset.k = k; b.onclick = () => applyPreset(k); $('presets').appendChild(b);
}
for (const id of [...ids, 'back', 't', 'engOn', 'engText']) $(id).addEventListener('input', () => { presetKey = ''; render(); });
$('tab-asm').onclick = () => { tab = 'asm'; render(); };
$('tab-flat').onclick = () => { tab = 'flat'; render(); };
$('dl-svg').onclick = () => download('idish-qismlari.svg', flatSVG(render.last.L, false), 'image/svg+xml');
$('dl-dxf').onclick = () => download(`idish-qismlari.${window.claude ? 'dxf.txt' : 'dxf'}`, toDXF(render.last.L), 'application/dxf');
applyPreset('mazali');
