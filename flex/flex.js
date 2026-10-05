// Istalgan tekis 2D shaklni egiluvchan qiluvchi (living hinge) naqsh generatori.
// Hamma narsa polyline sifatida saqlanadi: SVG va DXF bir xil geometriyadan chiqadi.
const $ = id => document.getElementById(id);
const PATTERNS = {
  straight: { name: "To'g'ri kesiklar", tip: "Eng oddiy va kuchli naqsh. Kesiklar egilish o'qiga parallel, qatorlar shaxmat tartibida." },
  wave:     { name: "To'lqinsimon", tip: "Silliq to'lqinli kesiklar: egiluvchanlik yuqori, ko'rinishi chiroyli.", wave: true },
  zigzag:   { name: 'Zigzag', tip: "Sinuvchi chiziqlar. Amplituda kattalashsa cho'ziluvchanlik ham oshadi.", wave: true },
  lens:     { name: "Baliq ko'zi (lens)", tip: "Ochiq lens shakllari: yorug'lik o'tadi, lampa va bezak uchun mos.", closed: true },
  slot:     { name: 'Yumaloq uchli pazlar', tip: "Uchlari yumaloq pazlar: kuchlanish uchlarda to'planmaydi, yog'och kam yoriladi.", closed: true },
  diamond:  { name: "Romb to'ri", tip: "Romb teshiklar: cho'ziladigan to'rsimon sirt.", closed: true },
};
const SHAPES = { rect: "To'rtburchak", round: 'Yumaloq burchakli', ellipse: 'Doira / ellips', custom: "O'z shaklim (SVG)" };
let pattern = 'lens', shape = 'rect', custom = null; // custom: {pts, w, h} (xom birlikda)

const sliders = ['w', 'h', 'r', 'm', 'ang', 'L', 'g', 's', 'a', 'wl'];
const val = id => parseFloat($(id).value);
const unit = id => id === 'ang' ? '°' : ' mm';

function buildButtons() {
  for (const [id, list, set] of [['patterns', PATTERNS, k => pattern = k], ['shapes', SHAPES, k => shape = k]]) {
    for (const [k, v] of Object.entries(list)) {
      const b = document.createElement('button');
      b.textContent = v.name || v; b.dataset.k = k; b.dataset.g = id;
      b.onclick = () => { set(k); render(); };
      $(id).appendChild(b);
    }
  }
}

// ---------- kontur ----------
function arc(pts, cx, cy, r, a0, a1, n = 12) {
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
}
function outline(w, h, r) {
  const P = [];
  if (shape === 'rect') return [[0, 0], [w, 0], [w, h], [0, h]];
  if (shape === 'round') {
    r = Math.min(r, w / 2, h / 2);
    if (r < 0.1) return [[0, 0], [w, 0], [w, h], [0, h]];
    arc(P, w - r, r, r, -Math.PI / 2, 0); arc(P, w - r, h - r, r, 0, Math.PI / 2);
    arc(P, r, h - r, r, Math.PI / 2, Math.PI); arc(P, r, r, r, Math.PI, 1.5 * Math.PI);
    return P;
  }
  if (shape === 'ellipse') {
    for (let i = 0; i < 180; i++) { const a = i * Math.PI / 90; P.push([w / 2 + w / 2 * Math.cos(a), h / 2 + h / 2 * Math.sin(a)]); }
    return P;
  }
  const k = w / custom.w;
  return custom.pts.map(q => [q[0] * k, q[1] * k]);
}
function pip(p, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
  }
  return c;
}
function dist2(p, poly) {
  let m = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    const ex = a[0] + t * dx - p[0], ey = a[1] + t * dy - p[1];
    m = Math.min(m, ex * ex + ey * ey);
  }
  return m;
}

// ---------- naqsh ----------
function generate() {
  let w = val('w'), h = val('h');
  if (shape === 'custom') { if (!custom) return { O: { w, h: 0 }, shapes: [], frame: null, empty: true }; h = custom.h * w / custom.w; }
  const poly = outline(w, h, val('r'));
  const O = { w, h, m: val('m'), L: val('L'), g: val('g'), s: val('s'), a: val('a'), wl: val('wl'), mirror: $('mirror').checked };
  const p = PATTERNS[pattern], ang = val('ang') * Math.PI / 180, ca = Math.cos(ang), sa = Math.sin(ang);
  const cx = w / 2, cy = h / 2, R = Math.hypot(w, h) / 2;
  const m2 = O.m * O.m;
  const world = ([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca];
  const ok = q => q[0] >= O.m && q[1] >= O.m && q[0] <= w - O.m && q[1] <= h - O.m && pip(q, poly) && (O.m === 0 || dist2(q, poly) >= m2);
  const period = O.L + O.g, minLen = Math.min(2, O.L / 2), shapes = [];

  for (let c = 0, x = -R + O.s / 2; x < R; x += O.s, c++) {
    const shift = O.mirror ? 0 : (c % 2) * period / 2;
    for (let ys = -R - period + shift; ys < R; ys += period) {
      const ye = ys + O.L;
      if (!p.closed) {
        const n = Math.max(2, Math.ceil(O.L / 1)), run = [];
        const flush = () => { if (run.length > 1 && Math.hypot(run[run.length - 1][0] - run[0][0], run[run.length - 1][1] - run[0][1]) >= minLen) shapes.push({ pts: run.slice(), closed: false }); run.length = 0; };
        for (let i = 0; i <= n; i++) {
          const y = ys + O.L * i / n; let dx = 0;
          if (pattern === 'wave') dx = O.a * Math.sin(2 * Math.PI * y / O.wl);
          if (pattern === 'zigzag') { const t = ((y / O.wl) % 1 + 1) % 1; dx = O.a * (t < .5 ? 4 * t - 1 : 3 - 4 * t); }
          const q = world([x + dx, y]);
          if (ok(q)) run.push(q); else flush();
        }
        flush();
      } else {
        const hw = O.a / 2, n = 16, loc = [];
        const half = t => {
          if (pattern === 'lens') return hw * Math.sin(Math.PI * t);
          if (pattern === 'diamond') return hw * (1 - Math.abs(2 * t - 1));
          const r = Math.min(hw, O.L / 2), d = Math.min(t, 1 - t) * O.L;
          return d >= r ? hw : hw * Math.sqrt(1 - Math.pow((r - d) / r, 2));
        };
        for (let i = 0; i <= n; i++) { const t = i / n; loc.push([x + half(t), ys + t * O.L]); }
        for (let i = n; i >= 0; i--) { const t = i / n; loc.push([x - half(t), ys + t * O.L]); }
        const pts = loc.map(world);
        if (pts.every(ok)) shapes.push({ pts, closed: true });
      }
    }
  }
  const frame = $('frame').checked ? { pts: poly, closed: true, frame: true } : null;
  return { O, shapes, frame, poly };
}

const f = n => +n.toFixed(3);
const pathD = s => 'M' + s.pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + (s.closed ? 'Z' : '');

function toSVG(G, preview) {
  const { O, shapes, frame, poly } = G;
  const sw = preview ? 0.35 : 0.1;
  const stroke = preview ? '#3a2a1c' : '#ff0000';
  const wood = preview ? `<path d="${pathD({ pts: poly, closed: true })}" fill="#e3bd8a" stroke="none"/>` : '';
  const all = (frame ? [frame] : []).concat(shapes);
  const paths = all.map(s => `<path d="${pathD(s)}" fill="${s.frame || !preview ? 'none' : '#fdf8f0'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${f(O.w)}mm" height="${f(O.h)}mm" viewBox="0 0 ${f(O.w)} ${f(O.h)}">${wood}<g stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${paths}</g></svg>`;
}

function toDXF(G) {
  const all = (G.frame ? [G.frame] : []).concat(G.shapes);
  let d = '0\nSECTION\n2\nENTITIES\n';
  for (const s of all) {
    d += `0\nLWPOLYLINE\n8\nCUT\n90\n${s.pts.length}\n70\n${s.closed ? 1 : 0}\n`;
    for (const q of s.pts) d += `10\n${f(q[0])}\n20\n${f(G.O.h - q[1])}\n`;
  }
  return d + '0\nENDSEC\n0\nEOF\n';
}

// ---------- SVG fayldan o'z shakli ----------
function loadSVG(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('SVG emas');
  const host = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  host.style.cssText = 'position:absolute;left:-9999px;width:0;height:0';
  document.body.appendChild(host);
  let best = null;
  try {
    for (const el of root.querySelectorAll('path,polygon,rect,circle,ellipse')) {
      const c = document.importNode(el, true); host.appendChild(c);
      const len = c.getTotalLength(); if (!len) continue;
      const n = Math.max(60, Math.min(600, Math.round(len / 2))), pts = [];
      for (let i = 0; i < n; i++) { const q = c.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
      const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      if (!best || area > best.area) best = { pts, area };
    }
  } finally { host.remove(); }
  if (!best) throw new Error('SVG ichida shakl topilmadi');
  const x0 = Math.min(...best.pts.map(q => q[0])), y0 = Math.min(...best.pts.map(q => q[1]));
  const pts = best.pts.map(q => [q[0] - x0, q[1] - y0]);
  return { pts, w: Math.max(...pts.map(q => q[0])) || 1, h: Math.max(...pts.map(q => q[1])) || 1 };
}

function render() {
  for (const id of sliders) $('o-' + id).textContent = $(id).value + unit(id);
  const p = PATTERNS[pattern];
  document.querySelectorAll('.patterns button').forEach(b => b.classList.toggle('on', b.dataset.k === (b.dataset.g === 'shapes' ? shape : pattern)));
  $('row-a').style.display = pattern === 'straight' ? 'none' : '';
  $('row-wl').style.display = p.wave ? '' : 'none';
  $('row-r').style.display = shape === 'round' ? '' : 'none';
  $('row-h').style.display = shape === 'custom' ? 'none' : '';
  $('row-file').style.display = shape === 'custom' ? '' : 'none';
  const G = generate();
  if (G.empty) { $('stage').innerHTML = '<p style="padding:30px;color:#7a6a58">SVG fayl yuklang: eng katta kontur yog\'och shakli sifatida olinadi.</p>'; $('stats').innerHTML = ''; $('tip').textContent = ''; return; }
  $('stage').innerHTML = toSVG(G, true);
  let len = 0;
  for (const s of G.shapes) for (let i = 1; i < s.pts.length; i++) len += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
  $('stats').innerHTML = `<span>O'lcham: <b>${f(G.O.w)} × ${f(G.O.h)} mm</b></span><span>Kesiklar: <b>${G.shapes.length}</b></span><span>Umumiy kesim: <b>${(len / 1000).toFixed(2)} m</b></span>`;
  $('tip').textContent = p.tip + " Burchakni o'zgartirib egilish yo'nalishini tanlang: yog'och kesiklarga ko'ndalang egiladi. Yupqa (2–4 mm) fanera yoki MDF ishlating; ko'prik kichik bo'lsa egiluvchan, lekin mo'rt.";
}

async function download(name, text, type) {
  let dl = null;
  try { dl = window.claude && await window.claude.use('downloads'); } catch (e) {}
  if (dl) { try { await dl.save({ filename: name, data: text }); } catch (e) {} return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

buildButtons();
for (const id of [...sliders, 'frame', 'mirror']) $(id).addEventListener('input', render);
$('file').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  try { custom = loadSVG(await file.text()); } catch (err) { alert(err.message); custom = null; }
  render();
});
$('dl-svg').onclick = () => { const G = generate(); if (!G.empty) download(`flex-${pattern}.svg`, toSVG(G, false), 'image/svg+xml'); };
$('dl-dxf').onclick = () => { const G = generate(); if (!G.empty) download(`flex-${pattern}.${window.claude ? 'dxf.txt' : 'dxf'}`, toDXF(G), 'application/dxf'); };
render();
