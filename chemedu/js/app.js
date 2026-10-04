/* ChemEdu — ilova qobig'i: navigatsiya, marshrutlash, qidiruv, bildirishnomalar, mavzu */
(function () {
  const CE = (window.CE = window.CE || {});
  const { esc, icon, mk, $, $$, db, modal, toast } = CE;
  const NAV = [['home', 'Bosh sahifa', 'home'], ['lessons', "Dars va ma'ruzalar", 'book'], ['lab', 'Tajriba va laboratoriya', 'flask'], ['research', 'Ilmiy tadqiqot', 'atom'], ['thesis', 'Dissertatsiya', 'cap'], ['articles', 'Maqolalar va adabiyotlar', 'doc'], ['chem-info', "Kimyoviy ma'lumotlar", 'table'], ['tools', 'Hisoblashlar va vositalar', 'calc'], ['students', 'Talabalar boshqaruvi', 'users'], ['assignments', 'Topshiriqlar va baholash', 'clip'], ['tests', 'Onlayn testlar', 'quiz'], ['ai', 'AI ilmiy yordamchi', 'sparkles'], ['templates', 'Shablonlar va hujjatlar', 'templates'], ['conferences', 'Konferensiyalar', 'slides'], ['calendar', 'Rejalar va taqvim', 'calendar'], ['projects', 'Loyiha va grantlar', 'brief'], ['settings', 'Sozlamalar', 'gear']];

  // ---- mavzu ----
  const mq = matchMedia('(prefers-color-scheme: dark)');
  CE.applyTheme = () => { const t = db.s.theme; const dark = t === 'dark' || (t === 'auto' && mq.matches); document.documentElement.dataset.theme = dark ? 'dark' : 'light'; const b = $('#theme-btn'); if (b) b.innerHTML = icon(dark ? 'sun' : 'moon'); };
  mq.addEventListener && mq.addEventListener('change', CE.applyTheme);
  CE.applyTheme();

  const root = $('#app');
  root.innerHTML = `<a class="skip" href="#view">Asosiy mazmunga o'tish</a><div class="app"><aside class="side" id="side" aria-label="Asosiy menyu"><a class="brand" href="#/home" aria-label="ChemEdu Research"><span class="logo">${icon('cap')}</span><div><b>ChemEdu <i>Research</i></b><small>Kimyo ta'limi va ilmiy tadqiqot platformasi</small></div></a><nav class="nav">${NAV.map(([id, l, ic]) => `<a href="#/${id}" data-n="${id}">${icon(ic)}<span>${l}</span></a>`).join('')}</nav><button class="premium" id="premium"><span>${icon('crown')}</span><div><b>Premium</b><small>Ko'proq imkoniyatlar</small></div>${icon('right')}</button></aside><div class="main"><header class="top"><button class="icon-btn menu" id="menu" aria-label="Menyuni ochish">${icon('menu')}</button><div class="search" role="search">${icon('search')}<input id="gsearch" type="search" placeholder="Modda, reaksiya, maqola, dars mavzusi yoki savolingizni kiriting…" autocomplete="off" aria-label="Umumiy qidiruv" aria-controls="sres"><kbd>/</kbd><div id="sres" class="sres" role="listbox" hidden></div></div><div class="top-r"><div class="dd"><button class="top-b" id="lang-btn" aria-haspopup="true">${icon('globe')}<span>UZ</span></button><div class="dd-m" hidden><button class="on">O'zbekcha (UZ)</button><button disabled>Русский — tez orada</button><button disabled>English — soon</button></div></div><button class="icon-btn" id="theme-btn" aria-label="Mavzuni almashtirish"></button><div class="dd"><button class="icon-btn bell" id="bell" aria-label="Bildirishnomalar" aria-haspopup="true">${icon('bell')}<i class="badge-n" hidden></i></button><div class="dd-m notif" hidden></div></div><div class="dd"><button class="me" id="me" aria-haspopup="true"><span class="avatar"></span><span class="me-n"></span>${icon('down')}</button><div class="dd-m me-m" hidden><a href="#/settings">${icon('gear')}Sozlamalar</a><a href="#/students">${icon('users')}Talabalar</a><button data-exp>${icon('download')}Zaxira nusxa</button></div></div></div></header><main id="view" tabindex="-1"></main></div><div class="scrim" id="scrim"></div></div>`;
  CE.applyTheme();
  const view = $('#view'), side = $('#side'), scrim = $('#scrim');

  // ---- profil, bildirishnomalar ----
  const drawMe = () => { const p = db.s.profile; $('.me .avatar').textContent = p.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); $('.me-n').textContent = p.name; };
  const drawNotif = () => {
    const N = db.s.notifications, un = N.filter((n) => !n.read).length; const b = $('.badge-n'); b.hidden = !un; b.textContent = un;
    $('.notif').innerHTML = `<div class="nh"><b>Bildirishnomalar</b><button class="link" data-all>Hammasini o'qilgan</button></div>` + (N.length ? N.slice(0, 8).map((n) => `<a href="${n.href}" class="ni ${n.read ? '' : 'un'}" data-id="${n.id}"><span>${esc(n.text)}</span><small>${CE.ago(n.t)}</small></a>`).join('') : '<p class="empty-s">Bildirishnomalar yo\'q</p>');
    $$('.ni', $('.notif')).forEach((a) => a.onclick = () => { const n = db.s.notifications.find((x) => x.id === a.dataset.id); n.read = true; db.save(); drawNotif(); closeDD(); });
    $('[data-all]', $('.notif')).onclick = () => { db.s.notifications.forEach((n) => { n.read = true; }); db.save(); drawNotif(); };
  };
  CE.bus.on('notify', drawNotif); CE.bus.on('profile', drawMe);
  const closeDD = () => $$('.dd-m').forEach((m) => { m.hidden = true; });
  $$('.dd > button').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const m = b.nextElementSibling; const open = !m.hidden; closeDD(); m.hidden = open; }));
  document.addEventListener('click', (e) => { if (!e.target.closest('.dd')) closeDD(); if (!e.target.closest('.search')) $('#sres').hidden = true; });
  $('#theme-btn').onclick = () => { db.s.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; db.save(); CE.applyTheme(); };
  $('[data-exp]', $('.me-m')).onclick = () => { CE.download(`chemedu_zaxira_${CE.iso(new Date())}.json`, JSON.stringify(db.s, null, 2), 'application/json'); closeDD(); };
  $('#menu').onclick = () => { side.classList.toggle('open'); scrim.classList.toggle('on'); }; scrim.onclick = () => { side.classList.remove('open'); scrim.classList.remove('on'); };
  $('#premium').onclick = () => modal({ title: 'ChemEdu Premium', wide: true, body: `<div class="prem"><p>Hozircha platformaning <b>barcha imkoniyatlari bepul</b> va to'liq ishlaydi. Premium — kelgusida rejalashtirilgan kengaytmalar:</p><ul>${['Bulutli sinxronizatsiya va jamoaviy ishlash', "Katta tilli model (LLM) asosidagi chuqur AI tahlil", 'Molekulalarning kengaytirilgan bazasi (PubChem to\'liq integratsiyasi)', 'Talabalar uchun shaxsiy kabinet va onlayn imtihon', 'Maqolalar uchun avtomatik antiplagiat va iqtibos tekshiruvi', 'Dars slaydlarini PowerPoint (.pptx) formatida eksport qilish'].map((x) => `<li>${icon('check')}${x}</li>`).join('')}</ul></div>`, actions: [{ label: 'Yopish', cls: 'ghost' }, { label: 'Yangiliklar haqida xabardor qiling', cls: 'primary', fn: () => { db.s.premiumInterest = true; db.save(); toast("Rahmat! Qiziqishingiz saqlandi"); } }] });

  // ---- global qidiruv ----
  const idx = () => {
    const I = []; NAV.forEach(([id, l, ic]) => I.push({ t: 'Sahifa', ic, n: l, s: '', h: `#/${id}` }));
    CE.TOOLS.forEach((t) => I.push({ t: 'Vosita', ic: t.ico, n: t.name, s: t.desc, h: `#/tools/${t.id}` }));
    CE.ELEMENTS.forEach((e) => I.push({ t: 'Element', ic: 'atom', n: `${e.name} (${e.sym})`, s: `Z = ${e.z}, ${CE.fmt(e.mass, 5)}`, h: `#/chem-info/periodic?el=${e.sym}`, k: e.sym + ' ' + e.z }));
    CE.MOLDB.forEach((d) => I.push({ t: 'Molekula', ic: 'mol', n: d.name, s: d.formula, h: `#/chem-info/molecule?q=${encodeURIComponent(d.name)}`, k: d.formula + ' ' + d.syn.join(' ') }));
    CE.FIELDS.forEach((f) => f.topics.forEach((tp) => I.push({ t: 'Dars mavzusi', ic: 'book', n: tp.t, s: f.name, h: `#/lessons/${f.id}`, k: tp.key.join(' ') })));
    CE.SDS.forEach((s) => I.push({ t: 'SDS', ic: 'warn', n: s.n, s: `${s.f} · CAS ${s.cas}`, h: '#/chem-info/sds', k: s.f }));
    CE.EXPERIMENTS.forEach((e) => I.push({ t: 'Tajriba', ic: 'flask', n: e.n, s: e.lvl, h: '#/lab', k: e.mat.join(' ') }));
    CE.TEMPLATES.forEach((e) => I.push({ t: 'Shablon', ic: 'templates', n: e.n, s: '', h: `#/templates/${e.id}` }));
    CE.KB.forEach((e) => I.push({ t: 'Tushuncha', ic: 'info', n: e.t, s: e.a.slice(0, 70) + '…', h: `#/ai?q=${encodeURIComponent(e.t)}`, k: e.k.join(' ') }));
    db.s.articles.forEach((a) => I.push({ t: 'Maqola', ic: 'doc', n: a.title, s: a.journal, h: '#/articles/lib', k: a.authors + ' ' + a.tags.join(' ') }));
    db.s.students.forEach((a) => I.push({ t: 'Talaba', ic: 'user', n: a.name, s: a.group, h: '#/students' }));
    db.s.projects.forEach((a) => I.push({ t: 'Loyiha', ic: 'brief', n: a.title, s: a.type, h: '#/projects' }));
    db.s.conferences.forEach((a) => I.push({ t: 'Konferensiya', ic: 'slides', n: a.name, s: '', h: '#/conferences' }));
    return I;
  };
  const gs = $('#gsearch'), sres = $('#sres'); let items = [], act = -1;
  const doSearch = () => {
    const q = gs.value.trim(); if (!q) { sres.hidden = true; return; } const nq = CE.norm(q); const out = [];
    if (/^[A-Z(\[][A-Za-z0-9()\[\]·]*$/.test(q) && q.length > 1) { try { const M = CE.molarMass(q); out.push({ t: 'Hisob', ic: 'calc', n: `M(${q}) = ${CE.fmt(M, 6)} g/mol`, s: 'Molyar massa kalkulyatorida ochish', h: '#/tools/molar' }); } catch (e) { /* formula emas */ } }
    if (/(->|→)/.test(q)) out.push({ t: 'Hisob', ic: 'scale', n: 'Reaksiyani balanslash', s: q, h: '#/ai?q=' + encodeURIComponent(q) });
    const sc = idx().map((i) => { const n = CE.norm(i.n); const hay = n + ' ' + CE.norm(i.s + ' ' + (i.k || '')); let s = 0; if (n === nq) s = 100; else if (n.startsWith(nq)) s = 60; else if (n.includes(nq)) s = 40; else if (hay.includes(nq)) s = 15; else if (nq.split(' ').length > 1 && nq.split(' ').every((w) => hay.includes(w))) s = 20; return { i, s }; }).filter((x) => x.s).sort((a, b) => b.s - a.s).slice(0, 9).map((x) => x.i);
    items = [...out, ...sc]; if (!items.length) items = [{ t: 'AI', ic: 'sparkles', n: `AI yordamchidan so'rash: «${q}»`, s: '', h: '#/ai?q=' + encodeURIComponent(q) }]; else items.push({ t: 'AI', ic: 'sparkles', n: `AI yordamchidan so'rash: «${q}»`, s: '', h: '#/ai?q=' + encodeURIComponent(q) });
    act = 0; sres.hidden = false; sres.innerHTML = items.map((i, k) => `<a role="option" href="${i.h}" class="${k === 0 ? 'on' : ''}" data-k="${k}"><span class="si">${icon(i.ic)}</span><div><b>${esc(i.n)}</b><small>${esc(i.s || '')}</small></div><em>${i.t}</em></a>`).join('');
    $$('a', sres).forEach((a) => a.addEventListener('click', () => { sres.hidden = true; gs.value = ''; gs.blur(); }));
  };
  gs.addEventListener('input', CE.debounce(doSearch, 120)); gs.addEventListener('focus', () => gs.value && doSearch());
  gs.addEventListener('keydown', (e) => { if (sres.hidden) return; const L = $$('a', sres); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); act = (act + (e.key === 'ArrowDown' ? 1 : -1) + L.length) % L.length; L.forEach((a, i) => a.classList.toggle('on', i === act)); L[act].scrollIntoView({ block: 'nearest' }); } else if (e.key === 'Enter') { e.preventDefault(); location.hash = items[act].h; sres.hidden = true; gs.value = ''; gs.blur(); } else if (e.key === 'Escape') { sres.hidden = true; } });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !document.querySelector('.modal-bg,.deck')) { e.preventDefault(); gs.focus(); } });

  // ---- marshrutlash ----
  let cleanup = null, curKey = '';
  function route() {
    const h = location.hash.replace(/^#\/?/, ''); const [path, qs] = h.split('?'); const [page, sub] = path.split('/'); const id = CE.views[page] ? page : 'home'; const key = id + '/' + (sub || '') + '?' + (qs || '');
    if (cleanup) { try { cleanup(); } catch (e) { /* */ } cleanup = null; } CE.bus.clearView();
    $$('.modal-bg,.deck').forEach((m) => m.remove());
    view.innerHTML = ''; const wrap = mk('<div class="page"></div>'); view.appendChild(wrap);
    try { const r = CE.views[id](wrap, sub, qs); if (typeof r === 'function') cleanup = r; } catch (e) { console.error(e); wrap.innerHTML = `<div class="card panel">${CE.empty('warn', 'Sahifani yuklashda xatolik: ' + e.message)}</div>`; }
    $$('.nav a').forEach((a) => { const on = a.dataset.n === id; a.classList.toggle('on', on); on ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'); });
    const lab = NAV.find((n) => n[0] === id); document.title = `${lab ? lab[1] : 'ChemEdu'} — ChemEdu Research`;
    side.classList.remove('open'); scrim.classList.remove('on'); if (key !== curKey) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); } curKey = key;
  }
  window.addEventListener('hashchange', route);
  CE.bus.on('reset', () => { drawMe(); drawNotif(); route(); });
  drawMe(); drawNotif(); route();
})();
