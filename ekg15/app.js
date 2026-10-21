'use strict';

/* ---------- Narxlar (so'm) — kerak bo'lsa o'zgartiring ---------- */
const PRICES = {
  kit:   { raw: 280000, lacquer: 330000, paint: 390000 },
  built: { raw: 520000, lacquer: 590000, paint: 680000 },
  svg:   { raw: 60000,  lacquer: 60000,  paint: 60000 }
};
const fmt = n => n.toLocaleString('ru-RU').replace(/ /g, ' ') + " so'm";

/* ---------- SVG shakl yordamchilari (birlik: mm, 300×200 varaq) ---------- */
const f = n => +n.toFixed(2);
const rect = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
const circle = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const poly = pts => `<polygon points="${pts.map(p => p.map(f).join(',')).join(' ')}"/>`;

function gear(cx, cy, ro, ri, teeth, hole) {
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2, s = Math.PI * 2 / teeth;
    [[0, ri], [.15, ro], [.5, ro], [.65, ri]].forEach(([k, r]) =>
      pts.push([cx + r * Math.cos(a + k * s), cy + r * Math.sin(a + k * s)]));
  }
  return poly(pts) + (hole ? circle(cx, cy, hole) : '');
}
function wheel(cx, cy, r, spokes = 6) {          // g'ildirak (kanat bloki)
  let s = circle(cx, cy, r) + circle(cx, cy, r * .2);
  for (let i = 0; i < spokes; i++) {
    const a = (i + .5) / spokes * Math.PI * 2, w = Math.PI / spokes * .55;
    const p = (rr, da) => [cx + rr * Math.cos(a + da), cy + rr * Math.sin(a + da)];
    s += poly([p(r * .3, -w * .6), p(r * .85, -w), p(r * .85, w), p(r * .3, w * .6)]);
  }
  return s;
}
function slots(x, y, w, h, n = 3) {                // pazlar (ulanish uchun teshiklar)
  let s = '';
  for (let i = 1; i <= n; i++) s += rect(f(x + w * i / (n + 1) - 3), f(y + 3), 6, 3);
  for (let i = 1; i <= n; i++) s += rect(f(x + w * i / (n + 1) - 3), f(y + h - 6), 6, 3);
  return s;
}
function windows(x, y, w, h, n, ww = 10, wh = 12) {
  let s = '', gap = (w - n * ww) / (n + 1);
  for (let i = 0; i < n; i++) s += rect(f(x + gap + i * (ww + gap)), f(y + (h - wh) / 2), ww, wh, 1);
  return s;
}
function panel(x, y, w, h, nWin = 0) { return rect(x, y, w, h, 1.5) + slots(x, y, w, h, Math.max(2, Math.round(w / 25))) + (nWin ? windows(x, y, w, h, nWin) : ''); }
function truss(x, y, w, h1, h2) {                  // strela fermasi (trapetsiya + uchburchak teshiklar)
  let s = poly([[x, y], [x + w, y + (h1 - h2) / 2], [x + w, y + (h1 + h2) / 2], [x, y + h1]]);
  const n = 9, seg = w / n;
  for (let i = 0; i < n; i++) {
    const x0 = x + i * seg, x1 = x0 + seg, hh = k => h1 - (h1 - h2) * k / w;
    const top = t => y + (h1 - hh(t)) / 2 + 3, bot = t => y + (h1 + hh(t)) / 2 - 3;
    const t0 = x0 - x, t1 = x1 - x, up = i % 2 === 0;
    s += up
      ? poly([[x0 + 2, bot(t0)], [x1 - 2, bot(t1)], [(x0 + x1) / 2, top((t0 + t1) / 2)]])
      : poly([[x0 + 2, top(t0)], [x1 - 2, top(t1)], [(x0 + x1) / 2, bot((t0 + t1) / 2)]]);
  }
  return s + circle(x + 6, y + h1 / 2, 2.2) + circle(x + w - 6, y + (h1) / 2, 2.2);
}
function links(x, y, cols, rows) {                 // gusenitsa zvenolari
  let s = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const X = x + c * 12, Y = y + r * 9;
    s += rect(X, Y, 10.5, 7, 1.5) + circle(X + 5.25, Y + 3.5, 1.2);
  }
  return s;
}

/* ---------- 5 ta varaq ---------- */
const SHEETS = [
  { name: '1. Korpus va kabina', file: 'ekg15-1-korpus-kabina',
    desc: "Mashina korpusining devorlari, pol, tom, kabina va oynali panellar.",
    parts: 22,
    svg: () => panel(4, 4, 135, 52, 4) + panel(143, 4, 135, 52, 4) + panel(4, 60, 135, 40) + panel(143, 60, 135, 40) +
      panel(4, 104, 90, 40, 2) + panel(98, 104, 90, 40, 2) + panel(192, 104, 40, 40, 2) + panel(236, 104, 40, 40, 2) +
      panel(4, 148, 135, 46) + panel(143, 148, 60, 46, 1) + panel(207, 148, 40, 46) + panel(251, 148, 40, 46) },
  { name: '2. Aylanma qism va g\'ildiraklar', file: 'ekg15-2-aylanma-gildirak',
    desc: "Aylanma platforma diski, tishli halqalar, kanat g'ildiraklari va blok.",
    parts: 14,
    svg: () => circle(52, 52, 48) + circle(52, 52, 14) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => circle(52 + 31 * Math.cos(i * Math.PI / 4), 52 + 31 * Math.sin(i * Math.PI / 4), 3)).join('') +
      circle(155, 52, 48) + circle(155, 52, 38) + wheel(240, 40, 34, 8) + wheel(30, 150, 26, 6) + wheel(86, 150, 26, 6) +
      gear(150, 148, 28, 23, 22, 6) + gear(212, 160, 20, 16, 16, 5) + gear(262, 160, 16, 12, 14, 4) + wheel(256, 108, 14, 5) },
  { name: '3. Strela va tayanchlar', file: 'ekg15-3-strela-tayanch',
    desc: "Ikki yon fermali strela, A-shaklidagi tayanch va yo'naltiruvchilar.",
    parts: 10,
    svg: () => truss(5, 5, 290, 40, 22) + truss(5, 55, 290, 40, 22) + truss(5, 105, 290, 34, 20) + truss(5, 148, 290, 34, 20) + rect(5, 186, 120, 9, 1) + rect(130, 186, 80, 9, 1) + rect(215, 186, 80, 9, 1) },
  { name: '4. Kovsh va mexanizmlar', file: 'ekg15-4-kovsh-mexanizm',
    desc: "Kovsh yon plastinalari, orqa va tubi, tishlar, rukoyat va richaglar.",
    parts: 26,
    svg: () => poly([[6, 10], [70, 10], [86, 60], [70, 98], [6, 98], [6, 10]]) + poly([[96, 10], [160, 10], [176, 60], [160, 98], [96, 98], [96, 10]]) + circle(25, 30, 3) + circle(115, 30, 3) +
      panel(186, 8, 100, 46) + panel(186, 60, 100, 38, 0) + [0, 1, 2, 3, 4, 5].map(i => poly([[8 + i * 22, 140], [26 + i * 22, 140], [17 + i * 22, 112]])).join('') +
      rect(6, 150, 130, 14, 3) + rect(6, 170, 130, 14, 3) + rect(142, 106, 20, 80, 3) + rect(168, 106, 20, 80, 3) + gear(238, 140, 26, 21, 18, 5) + circle(238, 188, 5) + circle(262, 188, 5) },
  { name: "5. Gusenitsa va qo'shimcha detallar", file: 'ekg15-5-gusenitsa',
    desc: "Gusenitsa zvenolari, tayanch g'ildiraklari, yetaklovchi tishli g'ildirak, zina, panjara.",
    parts: 70,
    svg: () => rect(5, 5, 290, 16, 3) + rect(5, 25, 290, 16, 3) + links(8, 48, 24, 4) + [0, 1, 2, 3, 4, 5, 6, 7].map(i => circle(14 + i * 17, 100, 7) + circle(14 + i * 17, 100, 2)).join('') +
      gear(170, 118, 20, 16, 14, 4) + gear(214, 118, 20, 16, 14, 4) + links(8, 118, 12, 2) + links(8, 140, 12, 2) +
      [0, 1, 2, 3, 4, 5].map(i => rect(10 + i * 22, 165, 18, 28, 2) + rect(15 + i * 22, 170, 8, 18, 1)).join('') + rect(150, 148, 140, 10, 1) + rect(150, 164, 140, 10, 1) + rect(150, 180, 140, 10, 1) }
];

function sheetSVG(i, inner = true) {
  const s = SHEETS[i];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300mm" height="200mm" viewBox="0 0 300 200">
<rect width="300" height="200" fill="none" stroke="#0a0" stroke-width=".3"/>
<g fill="none" stroke="#e00000" stroke-width=".25" stroke-linejoin="round">${s.svg()}</g>
<text x="150" y="199" font-size="3" text-anchor="middle" fill="#555">EKG-15 · ${s.name} · 300×200 mm · 3 mm fanera</text>
</svg>`;
}

function download(name, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'image/svg+xml' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/* ---------- Tablar ---------- */
let cur = 0;
const $ = id => document.getElementById(id);
function showSheet(i) {
  cur = i;
  $('sheet').innerHTML = sheetSVG(i).replace('width="300mm" height="200mm"', '');
  $('sheetTitle').textContent = SHEETS[i].name;
  $('sheetDesc').textContent = SHEETS[i].desc;
  $('sheetMeta').textContent = `Varaq: 300 × 200 mm · taxminan ${SHEETS[i].parts} ta detal`;
  [...$('tabs').children].forEach((b, k) => b.setAttribute('aria-selected', k === i));
}
SHEETS.forEach((s, i) => {
  const b = document.createElement('button');
  b.textContent = s.name; b.setAttribute('role', 'tab');
  b.onclick = () => showSheet(i);
  $('tabs').appendChild(b);
});
$('dlOne').onclick = () => download(SHEETS[cur].file + '.svg', sheetSVG(cur));
$('dlAll').onclick = () => SHEETS.forEach((s, i) => setTimeout(() => download(s.file + '.svg', sheetSVG(i)), i * 300));
showSheet(0);

/* ---------- Asosiy detallar ---------- */
const ico = body => `<svg viewBox="0 0 100 60" fill="none" stroke="#c8621a" stroke-width="1.6">${body}</svg>`;
const PARTS = [
  ['Kabina', "Oynali boshqaruv kabinasi", ico(rect(30, 8, 40, 44, 2) + rect(36, 16, 11, 12, 1) + rect(53, 16, 11, 12, 1) + rect(36, 34, 28, 10, 1))],
  ['Aylanma platforma', "Diskli aylanma tayanch", ico(circle(50, 30, 28) + circle(50, 30, 6) + circle(50, 30, 20))],
  ['Strela', "Fermali ko'tarish strelasi", ico('<g transform="translate(5 14) scale(.32 .55)">' + truss(0, 0, 280, 40, 22) + '</g>')],
  ['Kovsh', "Tishli yer kovlash kovshi", ico(poly([[25, 10], [75, 10], [80, 40], [20, 40]]) + [0, 1, 2, 3, 4].map(i => poly([[22 + i * 12, 40], [30 + i * 12, 40], [26 + i * 12, 52]])).join(''))],
  ["G'ildirak va bloklar", "Kanat g'ildiraklari", ico('<g transform="translate(18 2) scale(.9)">' + wheel(32, 30, 26, 6) + '</g>')],
  ['Gusenitsa (zanjir)', "Zvenolardan yig'iladigan zanjir", ico(rect(8, 18, 84, 24, 12) + links(12, 22, 7, 1))],
  ["Orqa qarshi og'irlik", "Muvozanat bloki", ico(rect(18, 12, 64, 36, 2) + rect(24, 18, 52, 6) + rect(24, 30, 52, 6))],
  ['Zina va maydonchalar', "Panjara, zina, ko'prikchalar", ico(rect(34, 6, 14, 48, 1) + [0, 1, 2, 3, 4].map(i => `<line x1="34" x2="48" y1="${14 + i * 9}" y2="${14 + i * 9}"/>`).join('') + rect(56, 22, 34, 22, 1))]
];
$('parts').innerHTML = PARTS.map(([t, d, i]) => `<div class="part">${i}<h3>${t}</h3><p>${d}</p></div>`).join('');

/* ---------- Yig'ish ---------- */
const STEPS = [
  ['Asos va gusenitsani yig\'ish', "Zvenolarni ulab zanjir hosil qiling, tayanch g'ildiraklarini o'rnating, aylanma diskni asosga qo'ying."],
  ['Korpus va kabinani o\'rnatish', "Devor va pol panellarini pazlarga kiriting, kabinani yuqoriga mahkamlang."],
  ['Strelani o\'rnatish', "Ikki fermani tayanchga ulang, yuqori uchiga kanat blokini qo'ying."],
  ['Arqon va bloklarni o\'rnatish', "Kanatni (ip) bloklar orqali o'tkazing, uchlarini mahkamlang."],
  ['Kovshni yig\'ish', "Yon plastinalar, orqa va tubini yig'ing, tishlarni joyiga kiriting."],
  ['Tayyor maket', "Kovshni kanatga osing, detallarni lak yoki bo'yoq bilan qoplang."]
];
$('steps').innerHTML = STEPS.map(([t, d]) => `<li><h3>${t}</h3><p>${d}</p></li>`).join('');

/* ---------- Buyurtma ---------- */
function calc() {
  const q = Math.max(1, Math.min(100, parseInt($('qty').value) || 1));
  const unit = PRICES[$('variant').value][$('finish').value];
  const d = q >= 10 ? 20 : q >= 3 ? 10 : 0;
  $('unit').textContent = fmt(unit);
  $('sumQty').textContent = q;
  $('disc').textContent = d + '%';
  $('total').textContent = fmt(Math.round(unit * q * (100 - d) / 100));
  return { q, unit, d, total: Math.round(unit * q * (100 - d) / 100) };
}
['variant', 'finish', 'qty'].forEach(id => $(id).addEventListener('input', calc));
calc();

const ORDERS_KEY = 'ekg15_orders';
const load = () => { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; } };
const showSaved = () => { const n = load().length; $('saved').textContent = n ? `Shu brauzerdan yuborilgan buyurtmalar: ${n}` : ''; };
showSaved();

$('orderForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = $('name'), phone = $('phone'), msg = $('formMsg');
  const okName = name.value.trim().length >= 2, okPhone = /^[+\d][\d\s()-]{8,}$/.test(phone.value.trim());
  name.classList.toggle('bad', !okName); phone.classList.toggle('bad', !okPhone);
  if (!okName || !okPhone) { msg.textContent = "Ism va telefon raqamini to'g'ri kiriting."; return; }
  const c = calc();
  const v = $('variant').selectedOptions[0].text, fn = $('finish').selectedOptions[0].text;
  const text = `EKG-15 maket buyurtmasi\nVariant: ${v}\nQoplama: ${fn}\nSoni: ${c.q}\nJami: ${fmt(c.total)}\nIsm: ${name.value.trim()}\nTel: ${phone.value.trim()}\nIzoh: ${$('note').value.trim() || '—'}`;
  try {
    const all = load(); all.push({ t: Date.now(), text }); localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  } catch { /* saqlash imkonsiz bo'lsa ham davom etamiz */ }
  showSaved();
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
  msg.innerHTML = `Buyurtma qabul qilindi. Matn nusxalandi — tasdiqlash uchun <a href="https://t.me/lasermaket" target="_blank" rel="noopener">Telegramga</a> yuboring.`;
  e.target.reset(); calc();
});
