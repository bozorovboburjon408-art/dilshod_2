/* ChemEdu — UI yordamchilari: ikonkalar, modal, toast, diagramma, formatlash */
(function () {
  const CE = (window.CE = window.CE || {});
  const P = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    book: '<path d="M4 4h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/><path d="M7.5 15h9"/>',
    atom: '<circle cx="12" cy="12" r="1.6"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    calc: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14.5a5 5 0 0 1 4.5 5.5"/>',
    clip: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 12h6M9 16h4"/>',
    quiz: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 15l1.5 1.5L12 14M14 9h3M14 16h3"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    templates: '<rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="5" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/>',
    slides: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/><path d="M7 12l3-3 2 2 4-4"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    down: '<path d="M6 9l6 6 6-6"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    play: '<path d="M7 4l13 8-13 8z"/>', send: '<path d="M21 3L3 11l7 3 3 7z"/><path d="M10 14l11-11"/>', rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M8 11h6M11 8v6"/>', expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>', crown: '<path d="M3 18l-1-11 6 5 4-8 4 8 6-5-1 11z"/>',
    warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>', drop: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12z"/>',
    thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>', cube: '<path d="M12 2l9 5v10l-9 5-9-5V7z"/><path d="M12 12l9-5M12 12v10M12 12L3 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    scale: '<path d="M12 3v18M5 21h14M5 7h14"/><path d="M5 7l-3 7a3.5 3.5 0 0 0 6 0zM19 7l-3 7a3.5 3.5 0 0 0 6 0z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9a3 3 0 0 0-5 1.5c0 3 5 2 5 5a3 3 0 0 1-5 1.5M12 6.5v1.5M12 16v1.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>', gauge: '<path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 14l4-5"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>', star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    pill: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9 9l6 6" transform="rotate(0)"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>', filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    pin: '<path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>', refresh: '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>', print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>', hex: '<path d="M12 2l8.5 5v10L12 22l-8.5-5V7z"/>', mol: '<circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="6" r="2.6"/><circle cx="18" cy="18" r="2.6"/><path d="M8.3 10.8l7.4-3.6M8.3 13.2l7.4 3.6"/>',
    sigma: '<path d="M18 5H7l6 7-6 7h11"/>', rule: '<path d="M3 8h18v8H3zM7 8v4M11 8v3M15 8v4M19 8v3"/>', mix: '<path d="M8 3h8M9 3v7l-4 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-4-9V3"/><path d="M7 16c2 1 3-1 5 0s3 1 5 0"/>'
  };
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.hex}</svg>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mk = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // sonlarni o'qish va formatlash
  const num = (v) => { if (v === undefined || v === null) return NaN; const s = String(v).trim().replace(/\s/g, '').replace(',', '.').replace(/[×x]10\^?/i, 'e').replace(/·10\^?/, 'e'); if (s === '') return NaN; return Number(s); };
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  function fmt(x, sig = 4) {
    if (!isFinite(x)) return '—'; if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 1e-3 || a >= 1e7) { const [m, e] = x.toExponential(Math.max(sig - 1, 1)).split('e'); return `${(+m).toString().replace(/\.?0+$/, (z) => z.includes('.') ? '' : z)}×10${String(+e).replace(/./g, (c) => SUP[c] || c)}`; }
    return String(+x.toPrecision(sig));
  }
  const fmtFixed = (x, d = 2) => (isFinite(x) ? x.toFixed(d) : '—');

  // toast
  function toast(msg, kind = 'ok') {
    let w = $('#toasts'); if (!w) { w = mk('<div id="toasts" aria-live="polite"></div>'); document.body.appendChild(w); }
    const t = mk(`<div class="toast ${kind}">${icon(kind === 'err' ? 'warn' : 'check')}<span>${esc(msg)}</span></div>`); w.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 3200);
  }
  // modal
  function modal({ title, body, wide, actions = [], onClose, cls = '' }) {
    const el = mk(`<div class="modal-bg" role="dialog" aria-modal="true"><div class="modal ${wide ? 'wide' : ''} ${cls}"><header><h3>${esc(title)}</h3><button class="icon-btn" data-x aria-label="Yopish">${icon('x')}</button></header><div class="m-body"></div><footer></footer></div></div>`);
    const b = $('.m-body', el); if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
    const f = $('footer', el); if (!actions.length) f.remove();
    const close = () => { el.remove(); document.removeEventListener('keydown', key); onClose && onClose(); };
    const key = (e) => { if (e.key === 'Escape') close(); };
    actions.forEach((a) => { const btn = mk(`<button class="btn ${a.cls || ''}">${a.icon ? icon(a.icon) : ''}${esc(a.label)}</button>`); btn.onclick = () => { const r = a.fn && a.fn(el); if (r !== false && !a.keep) close(); }; f.appendChild(btn); });
    $('[data-x]', el).onclick = close; el.addEventListener('mousedown', (e) => { if (e.target === el) close(); }); document.addEventListener('keydown', key);
    document.body.appendChild(el); const first = $('input,select,textarea,button.btn', el); first && first.focus(); return { el, close };
  }
  const confirmBox = (msg, ok) => modal({ title: 'Tasdiqlang', body: `<p>${esc(msg)}</p>`, actions: [{ label: 'Bekor qilish', cls: 'ghost' }, { label: "O'chirish", cls: 'danger', fn: ok }] });
  // formadan qiymat olish uchun modal
  function formModal({ title, fields, values = {}, submit = 'Saqlash', onSubmit }) {
    const body = mk(`<form class="form-grid">${fields.map((f) => `<label class="${f.full ? 'full' : ''}"><span>${esc(f.label)}</span>${f.type === 'select' ? `<select name="${f.k}">${f.options.map((o) => `<option ${String(values[f.k]) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>` : f.type === 'textarea' ? `<textarea name="${f.k}" rows="4" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''}>${esc(values[f.k] || '')}</textarea>` : `<input name="${f.k}" type="${f.type || 'text'}" value="${esc(values[f.k] ?? '')}" ${f.req ? 'required' : ''} ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.max !== undefined ? `max="${f.max}"` : ''} ${f.step ? `step="${f.step}"` : ''}>`}</label>`).join('')}</form>`);
    const m = modal({ title, body, actions: [{ label: 'Bekor qilish', cls: 'ghost' }, { label: submit, cls: 'primary', keep: true, fn: () => { const form = $('form', body); if (!form.reportValidity()) return false; const d = Object.fromEntries(new FormData(form)); onSubmit(d); m.close(); return false; } }] });
    $('form', body).addEventListener('submit', (e) => { e.preventDefault(); $('footer .primary', m.el).click(); });
    return m;
  }

  // chiziqli diagramma / sochilma
  function chart({ series, w = 520, h = 300, xl = '', yl = '', xmin, xmax, ymin, ymax, marks = [], dots = false, ariaLabel = 'Grafik' }) {
    const all = series.flatMap((s) => s.d); if (!all.length) return '';
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const nice = (lo, hi) => { const span = hi - lo || 1; const st = Math.pow(10, Math.floor(Math.log10(span / 5))); const f = [1, 2, 5, 10].find((m) => span / (st * m) <= 6) * st; return [Math.floor(lo / f) * f, Math.ceil(hi / f) * f, f]; };
    const [x0, x1, xf] = nice(xmin ?? Math.min(...xs), xmax ?? Math.max(...xs)); const [y0, y1, yf] = nice(ymin ?? Math.min(...ys), ymax ?? Math.max(...ys));
    const L = 48, R = 14, T = 12, B = 40; const X = (v) => L + ((v - x0) / (x1 - x0 || 1)) * (w - L - R), Y = (v) => h - B - ((v - y0) / (y1 - y0 || 1)) * (h - T - B);
    let g = '';
    for (let v = y0; v <= y1 + 1e-9; v += yf) g += `<line class="gl" x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tk" x="${L - 6}" y="${Y(v) + 4}" text-anchor="end">${+v.toPrecision(4)}</text>`;
    for (let v = x0; v <= x1 + 1e-9; v += xf) g += `<line class="gl v" x1="${X(v)}" x2="${X(v)}" y1="${T}" y2="${h - B}"/><text class="tk" x="${X(v)}" y="${h - B + 16}" text-anchor="middle">${+v.toPrecision(4)}</text>`;
    g += `<line class="ax" x1="${L}" x2="${w - R}" y1="${h - B}" y2="${h - B}"/><line class="ax" x1="${L}" x2="${L}" y1="${T}" y2="${h - B}"/>`;
    series.forEach((s, i) => {
      const c = s.c || `var(--c${i + 1})`;
      if (s.line !== false) g += `<polyline fill="none" stroke="${c}" stroke-width="2.4" stroke-linejoin="round" ${s.dash ? 'stroke-dasharray="6 4"' : ''} points="${s.d.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')}"/>`;
      if (dots || s.dots) g += s.d.map((p) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="4" fill="${c}" stroke="var(--card)" stroke-width="1.5"/>`).join('');
    });
    marks.forEach((m) => { g += `<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="5" fill="var(--c3)" stroke="var(--card)" stroke-width="2"/><text class="tk b" x="${Math.min(X(m.x) + 8, w - 60)}" y="${Y(m.y) - 8}">${esc(m.label)}</text>`; });
    g += `<text class="al" x="${(L + w - R) / 2}" y="${h - 6}" text-anchor="middle">${esc(xl)}</text><text class="al" transform="translate(13 ${(T + h - B) / 2}) rotate(-90)" text-anchor="middle">${esc(yl)}</text>`;
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(ariaLabel)}">${g}</svg>`;
  }

  function download(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('Nusxalandi'); } catch (e) { const ta = mk('<textarea style="position:fixed;opacity:0"></textarea>'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Nusxalandi'); } };
  const debounce = (f, ms = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };
  const norm = (s) => String(s).toLowerCase().replace(/[ʻʼ'’`‘]/g, '').normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const tabs = (el, onChange) => { const btns = $$('[data-tab]', el); btns.forEach((b) => b.addEventListener('click', () => { btns.forEach((x) => x.classList.toggle('on', x === b)); btns.forEach((x) => x.setAttribute('aria-selected', x === b)); onChange(b.dataset.tab); })); };

  // faqat joriy sahifa uchun hodisa tinglovchilari
  const viewH = [];
  CE.bus.onView = (e, f) => { viewH.push([e, f]); CE.bus.on(e, f); };
  CE.bus.clearView = () => { viewH.forEach(([e, f]) => { const a = CE.bus.m[e]; const i = a.indexOf(f); if (i >= 0) a.splice(i, 1); }); viewH.length = 0; };

  Object.assign(CE, { icon, esc, mk, $, $$, num, fmt, fmtFixed, toast, modal, confirmBox, formModal, chart, download, copy, debounce, norm, tabs, ICONS: P });
})();
