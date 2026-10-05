// Egiluvchan (living hinge) naqshlar generatori. Hamma shakl nuqtalar ketma-ketligi (polyline) sifatida
// saqlanadi, shuning uchun SVG va DXF bir xil geometriyadan chiqadi.
const $ = id => document.getElementById(id);
const PATTERNS = {
  straight: { name: 'To\'g\'ri kesiklar', tip: 'Eng oddiy va kuchli naqsh. Kesiklar egilish o\'qiga parallel, qatorlar shaxmat tartibida.' },
  wave:     { name: 'To\'lqinsimon', tip: 'Silliq to\'lqinli kesiklar: egiluvchanlik yuqori, ko\'rinishi chiroyli.', wave: true },
  zigzag:   { name: 'Zigzag', tip: 'Sinuvchi chiziqlar. Amplituda kattalashsa cho\'ziluvchanlik ham oshadi.', wave: true },
  lens:     { name: 'Baliq ko\'zi (lens)', tip: 'Rasmdagi kabi ochiq lens shakllari: yorug\'lik o\'tadi, lampa uchun juda mos.', width: true },
  slot:     { name: 'Yumaloq uchli pazlar', tip: 'Uchlari yumaloq pazlar: kuchlanish uchlarda to\'planmaydi, yog\'och kam yoriladi.', width: true },
  diamond:  { name: 'Romb to\'ri', tip: 'Romb shaklidagi teshiklar: cho\'ziladigan to\'rsimon sirt.', width: true },
};
let pattern = 'lens';

const sliders = ['w','h','m','L','g','s','a','wl'];
const val = id => parseFloat($(id).value);
const units = { w:' mm',h:' mm',m:' mm',L:' mm',g:' mm',s:' mm',a:' mm',wl:' mm' };

function buildButtons() {
  $('patterns').innerHTML = '';
  for (const [k, p] of Object.entries(PATTERNS)) {
    const b = document.createElement('button');
    b.textContent = p.name; b.dataset.k = k;
    b.onclick = () => { pattern = k; render(); };
    $('patterns').appendChild(b);
  }
}

// --- geometriya ---
function cutsForColumn(c, x, p, O) {
  const out = [];
  const period = O.L + O.g;
  const shift = O.mirror ? 0 : (c % 2) * period / 2;
  const y0 = O.m, y1 = O.h - O.m;
  for (let ys = y0 - period + shift; ys < y1; ys += period) {
    const ye = ys + O.L;
    const wave = p.wave;
    if (wave || !p.width) { // chiziqli kesiklar (kesib olinadi)
      const a = Math.max(ys, y0), b = Math.min(ye, y1);
      if (b - a < Math.min(2, O.L / 2)) continue;
      const pts = [], n = Math.max(2, Math.ceil((b - a) / 0.5));
      for (let i = 0; i <= n; i++) {
        const y = a + (b - a) * i / n;
        let dx = 0;
        if (pattern === 'wave') dx = O.a * Math.sin(2 * Math.PI * y / O.wl);
        if (pattern === 'zigzag') { const t = ((y / O.wl) % 1 + 1) % 1; dx = O.a * (t < .5 ? 4 * t - 1 : 3 - 4 * t); }
        pts.push([x + dx, y]);
      }
      out.push({ pts, closed: false });
    } else { // yopiq shakllar: to'liq sig'sagina qoldiriladi
      if (ys < y0 || ye > y1) continue;
      const hw = O.a / 2, n = 24, pts = [];
      const half = t => {
        if (pattern === 'lens') return hw * Math.sin(Math.PI * t);
        if (pattern === 'slot') { const r = Math.min(hw, O.L / 2), d = Math.min(t, 1 - t) * O.L; return d >= r ? hw : Math.sqrt(Math.max(0, hw * hw - Math.pow(hw * (r - d) / r, 2))) ; }
        if (pattern === 'diamond') return hw * (1 - Math.abs(2 * t - 1));
        return hw;
      };
      for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x + half(t), ys + t * O.L]); }
      for (let i = n; i >= 0; i--) { const t = i / n; pts.push([x - half(t), ys + t * O.L]); }
      out.push({ pts, closed: true });
    }
  }
  return out;
}

function generate() {
  const O = { w: val('w'), h: val('h'), m: val('m'), L: val('L'), g: val('g'), s: val('s'), a: val('a'), wl: val('wl'), mirror: $('mirror').checked };
  const p = PATTERNS[pattern], shapes = [];
  const margin = Math.max(O.m, 0) + (p.wave ? O.a : p.width ? O.a / 2 : 0);
  let c = 0;
  for (let x = margin + O.s / 2; x <= O.w - margin; x += O.s, c++) shapes.push(...cutsForColumn(c, x, p, O));
  if ($('holes').checked) {
    const r = 1.5, inset = Math.max(O.m / 2, 2.5);
    for (const x of [inset, O.w - inset]) for (const y of [O.h * .25, O.h * .75]) {
      const pts = []; for (let i = 0; i < 20; i++) pts.push([x + r * Math.cos(i * Math.PI / 10), y + r * Math.sin(i * Math.PI / 10)]);
      shapes.push({ pts, closed: true, hole: true });
    }
  }
  const frame = $('frame').checked ? { pts: [[0,0],[O.w,0],[O.w,O.h],[0,O.h]], closed: true, frame: true } : null;
  return { O, shapes, frame };
}

const f = n => +n.toFixed(3);
const pathD = s => 'M' + s.pts.map(q => f(q[0]) + ' ' + f(q[1])).join('L') + (s.closed ? 'Z' : '');

function toSVG(G, preview) {
  const { O, shapes, frame } = G;
  const all = (frame ? [frame] : []).concat(shapes);
  const sw = preview ? 0.35 : 0.1;
  const bg = preview ? `<rect width="${O.w}" height="${O.h}" fill="#e3bd8a"/>` : '';
  const stroke = preview ? '#3a2a1c' : '#ff0000';
  const fill = preview ? '#fdf8f0' : 'none';
  const paths = all.map(s => `<path d="${pathD(s)}" ${s.frame ? 'fill="none"' : `fill="${fill}"`}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${O.w}mm" height="${O.h}mm" viewBox="0 0 ${O.w} ${O.h}">${bg}<g stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${paths}</g></svg>`;
}

function toDXF(G) {
  const { O, shapes, frame } = G;
  const all = (frame ? [frame] : []).concat(shapes);
  let d = '0\nSECTION\n2\nENTITIES\n';
  for (const s of all) {
    d += `0\nLWPOLYLINE\n8\nCUT\n90\n${s.pts.length}\n70\n${s.closed ? 1 : 0}\n`;
    for (const q of s.pts) d += `10\n${f(q[0])}\n20\n${f(O.h - q[1])}\n`;
  }
  return d + '0\nENDSEC\n0\nEOF\n';
}

function render() {
  for (const id of sliders) $('o-' + id).textContent = $(id).value + units[id];
  const p = PATTERNS[pattern];
  document.querySelectorAll('#patterns button').forEach(b => b.classList.toggle('on', b.dataset.k === pattern));
  $('row-a').style.display = pattern === 'straight' ? 'none' : '';
  $('row-wl').style.display = p.wave ? '' : 'none';
  const G = generate();
  $('stage').innerHTML = toSVG(G, true);
  let len = 0;
  for (const s of G.shapes) { for (let i = 1; i < s.pts.length; i++) len += Math.hypot(s.pts[i][0] - s.pts[i-1][0], s.pts[i][1] - s.pts[i-1][1]); }
  const O = G.O;
  $('stats').innerHTML = `<span>Kesiklar: <b>${G.shapes.length}</b></span><span>Umumiy kesim: <b>${(len / 1000).toFixed(2)} m</b></span>` +
    `<span>Halqa diametri: <b>≈ ${(O.w / Math.PI).toFixed(1)} mm</b></span><span>Bilak aylanasi: <b>${O.w} mm</b></span>`;
  $('tip').textContent = p.tip + ' Maslahat: yupqa (2–4 mm) fanera yoki MDF ishlating; ko\'prik qancha kichik bo\'lsa, shuncha egiluvchan, lekin mo\'rt.';
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

buildButtons();
for (const id of [...sliders, 'frame', 'holes', 'mirror']) $(id).addEventListener('input', render);
$('dl-svg').onclick = () => download(`flex-${pattern}.svg`, toSVG(generate(), false), 'image/svg+xml');
$('dl-dxf').onclick = () => download(`flex-${pattern}.dxf`, toDXF(generate()), 'application/dxf');
render();
