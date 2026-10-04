/* ChemEdu — sahifalar (1): bosh sahifa, darslar, laboratoriya, tadqiqot, dissertatsiya, maqolalar */
(function () {
  const CE = (window.CE = window.CE || {});
  const { esc, icon, mk, $, $$, db, uid, fmt, toast, modal } = CE;
  const V = (CE.views = CE.views || {});
  const fieldOf = (id) => CE.FIELDS.find((f) => f.id === id);
  const pageHead = (title, sub, actions = '') => `<header class="page-h"><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div><div class="page-a">${actions}</div></header>`;
  const empty = (ico, msg, btn = '') => `<div class="empty">${icon(ico)}<p>${esc(msg)}</p>${btn}</div>`;
  const stat = (ico, v, l, c = 'blue') => `<div class="stat ${c}"><span>${icon(ico)}</span><div><b>${v}</b><small>${esc(l)}</small></div></div>`;
  const section = (cls = '') => mk(`<section class="card panel ${cls}"></section>`);
  Object.assign(CE, { pageHead, empty, stat, section });
  const days = (s) => Math.round((new Date(s + 'T00:00:00') - new Date(CE.iso(new Date()) + 'T00:00:00')) / 864e5);
  const dueBadge = (s) => { const d = days(s); return `<span class="badge ${d < 0 ? 'red' : d <= 7 ? 'amber' : 'green'}">${d < 0 ? `${-d} kun o'tgan` : d === 0 ? 'bugun' : `${d} kun qoldi`}</span>`; };
  CE.dueBadge = dueBadge; CE.days = days;

  // ---------- Bosh sahifa ----------
  function heroCanvas(cv) {
    const ctx = cv.getContext('2d'); let w = 0, h = 0, N = [], dead = false;
    const cols = ['#5b8cff', '#ff6b6b', '#4ee0c1', '#ffd166', '#c084fc'];
    const size = () => { const r = cv.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); w = r.width; h = r.height; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); N = Array.from({ length: Math.round(Math.max(18, w / 22)) }, (_, i) => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 2 + Math.random() * 4.5, c: cols[i % cols.length] })); };
    new ResizeObserver(size).observe(cv); size();
    const loop = () => { if (dead || !cv.isConnected) return; ctx.clearRect(0, 0, w, h);
      N.forEach((a) => { a.x += a.vx; a.y += a.vy; if (a.x < 0 || a.x > w) a.vx *= -1; if (a.y < 0 || a.y > h) a.vy *= -1; });
      for (let i = 0; i < N.length; i++) for (let j = i + 1; j < N.length; j++) { const d = Math.hypot(N[i].x - N[j].x, N[i].y - N[j].y); if (d < 110) { ctx.strokeStyle = `rgba(150,180,255,${(1 - d / 110) * 0.45})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(N[i].x, N[i].y); ctx.lineTo(N[j].x, N[j].y); ctx.stroke(); } }
      N.forEach((a) => { const g = ctx.createRadialGradient(a.x - a.r / 3, a.y - a.r / 3, 0, a.x, a.y, a.r * 1.6); g.addColorStop(0, '#fff'); g.addColorStop(.4, a.c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, a.y, a.r * 1.6, 0, 7); ctx.fill(); });
      requestAnimationFrame(loop); };
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) loop(); else { N.forEach((a) => { ctx.fillStyle = a.c; ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 7); ctx.fill(); }); }
    return () => { dead = true; };
  }
  V.home = (root) => {
    const p = db.s.profile;
    root.innerHTML = `<div class="dash"><div class="dash-main">
      <section class="hero"><canvas class="hero-cv" aria-hidden="true"></canvas><div class="hero-in"><span class="hero-tag">${icon('atom')}ChemEdu Research</span><h1>${esc(p.name)}</h1><h2>Kimyo ta'limi va ilmiy tadqiqot uchun barcha imkoniyatlar bir joyda</h2><p>Dars tayyorlash, laboratoriya, ilmiy tadqiqot, maqolalar, dissertatsiya, hisoblashlar va AI yordamchi — zamonaviy o'qituvchilar, tadqiqotchilar va doktorantlar uchun.</p><div class="hero-btns"><a href="#/lessons/gen" class="hb">${icon('slides')}Dars yaratish</a><a href="#/articles" class="hb">${icon('doc')}Maqola qidirish</a><a href="#/tools" class="hb">${icon('calc')}Hisoblashlar</a><a href="#/lab" class="hb">${icon('flask')}Laboratoriya</a><a href="#/ai" class="hb ai">${icon('sparkles')}AI yordamchi</a></div></div></section>
      <section class="quick">${[['slides', "Ma'ruza konstruktori", 'Slaydlar, testlar, dars rejalar', '#/lessons/gen', 'teal'], ['mol', 'Molekula 3D', "Interaktiv 2D/3D tuzilma", '#/chem-info/molecule', 'blue'], ['scale', 'Reaksiya tenglamasi', 'Balanslash va tahlil', '#/chem-info/reaction', 'cyan'], ['calc', 'Kimyoviy hisoblashlar', 'Molyar massa, pH, stexiometriya', '#/tools', 'purple'], ['warn', 'SDS/Xavfsizlik', "Moddalar bo'yicha ma'lumot", '#/chem-info/sds', 'red'], ['doc', 'Ilmiy maqolalar', 'PubChem, Scholar, Scopus', '#/articles', 'violet']].map(([i, t, s, h, c]) => `<a class="q ${c}" href="${h}"><span>${icon(i)}</span><div><b>${t}</b><small>${s}</small></div></a>`).join('')}</section>
      <div class="grid g3 a"></div><div class="grid g3 b"></div><section class="card panel tools-p"></section></div>
      <aside class="dash-rail"><section class="card profile-c"></section><section class="card panel cal-p"></section><section class="card panel act-p"></section><section class="card panel res-p"></section></aside></div>`;
    const A = $('.g3.a', root), B = $('.g3.b', root);
    const mount = (parent, cls, fn, ...a) => { const s = section(cls); parent.appendChild(s); fn(s, ...a); return s; };
    mount(A, 'lesson-p', CE.W.lesson); mount(A, 'mol-w', CE.W.molecule); mount(A, 'react-p', CE.W.reaction);
    mount(B, 'lit-p', CE.W.literature); mount(B, 'diss-p', CE.W.dissertation); mount(B, 'ai-p', CE.W.ai);
    CE.W.toolsStrip($('.tools-p', root)); CE.W.profile($('.profile-c', root)); CE.W.calendar($('.cal-p', root)); CE.W.activity($('.act-p', root)); CE.W.resources($('.res-p', root));
    const stop = heroCanvas($('.hero-cv', root)); return stop;
  };

  // ---------- Darslar ----------
  V.lessons = (root, sub) => {
    root.innerHTML = pageHead("Dars va ma'ruzalar", "Mavzu tanlang — slaydlar, testlar va dars rejasi avtomatik tuziladi") + `<div class="split"><div class="left"></div><div class="right"></div></div><section class="card panel catalog"></section>`;
    const gen = section('lesson-p'); $('.left', root).appendChild(gen); CE.W.lesson(gen, { tab: sub === 'gen' ? 'gen' : 'tpl' });
    const saved = section(); $('.right', root).appendChild(saved);
    const drawSaved = () => { saved.innerHTML = `<div class="panel-h"><span class="ph-ic">${icon('bookmark')}</span><h3>Saqlangan darslar</h3></div>` + (db.s.lessons.length ? `<ul class="rows">${db.s.lessons.map((l) => `<li><span class="t-ic ${fieldOf(l.field).color}">${icon(CE.FIELD_ICO[l.field])}</span><div class="grow"><b>${esc(l.title)}</b><small>${esc(fieldOf(l.field).name)} · ${l.slides} slayd · ${CE.fmtDate(l.date)}</small></div><button class="icon-btn" data-o="${l.id}" aria-label="Ochish" title="Taqdimot">${icon('play')}</button><button class="icon-btn" data-x="${l.id}" aria-label="O'chirish">${icon('trash')}</button></li>`).join('')}</ul>` : empty('slides', "Hali dars saqlanmagan. Slayd generatorida dars yarating va «Saqlash» ni bosing."));
      $$('[data-o]', saved).forEach((b) => b.onclick = () => { const l = db.s.lessons.find((x) => x.id === b.dataset.o); const deck = l.deck || CE.makeLesson({ fieldId: l.field, topic: l.title, level: l.level || "O'rta", minutes: l.minutes || 45 }).slides; CE.present(deck, l.title); });
      $$('[data-x]', saved).forEach((b) => b.onclick = () => CE.confirmBox("Darsni o'chirasizmi?", () => { db.s.lessons = db.s.lessons.filter((x) => x.id !== b.dataset.x); db.save(); CE.bus.emit('lessons'); })); };
    CE.bus.onView('lessons', drawSaved); drawSaved();
    const cat = $('.catalog', root);
    cat.innerHTML = `<div class="panel-h"><span class="ph-ic">${icon('book')}</span><h3>Mavzular katalogi</h3></div><div class="accs">${CE.FIELDS.map((f) => `<details ${sub === f.id ? 'open' : ''}><summary><span class="t-ic ${f.color}">${icon(CE.FIELD_ICO[f.id])}</span><b>${esc(f.name)}</b><small>${f.topics.length} ta mavzu</small></summary><ul class="topic-cat">${f.topics.map((t, i) => `<li><div><b>${esc(t.t)}</b><ul>${t.key.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>${t.formula ? `<code>${esc(t.formula)}</code>` : ''}</div><button class="btn ghost sm" data-f="${f.id}" data-i="${i}">${icon('sparkles')}Slayd</button></li>`).join('')}</ul></details>`).join('')}</div>`;
    $$('[data-f]', cat).forEach((b) => b.onclick = () => { const t = fieldOf(b.dataset.f).topics[+b.dataset.i]; const L = CE.makeLesson({ fieldId: b.dataset.f, topic: t.t, level: "O'rta", minutes: 45 }); CE.present(L.slides, L.title); });
  };

  // ---------- Laboratoriya ----------
  V.lab = (root, sub) => {
    const tab = ['exp', 'journal', 'analysis', 'safety'].includes(sub) ? sub : 'exp';
    root.innerHTML = pageHead('Tajriba va laboratoriya', 'Tajribalar kutubxonasi, laboratoriya jurnali va natijalarni tahlil qilish') + `<nav class="tabs big">${[['exp', 'Tajribalar'], ['journal', 'Laboratoriya jurnali'], ['analysis', 'Natijalar tahlili'], ['safety', 'Xavfsizlik']].map(([k, l]) => `<a href="#/lab/${k}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</nav><div class="tab-body"></div>`;
    const body = $('.tab-body', root);
    if (tab === 'exp') {
      let f = 'all', q = '';
      body.innerHTML = `<div class="toolbar"><input type="search" placeholder="Tajriba qidirish…" aria-label="Qidirish"><div class="chips pick"><button class="chip on" data-f="all">Barchasi</button>${CE.FIELDS.map((x) => `<button class="chip" data-f="${x.id}">${esc(x.name)}</button>`).join('')}</div></div><div class="cards"></div>`;
      const draw = () => { const L = CE.EXPERIMENTS.filter((e) => (f === 'all' || e.f === f) && CE.norm(e.n + e.mat.join(' ')).includes(CE.norm(q))); $('.cards', body).innerHTML = L.map((e) => `<button class="card ecard" data-i="${CE.EXPERIMENTS.indexOf(e)}"><span class="t-ic ${fieldOf(e.f).color}">${icon('flask')}</span><b>${esc(e.n)}</b><small>${esc(fieldOf(e.f).name)}</small><div class="chips"><span class="chip">${e.d >= 1440 ? Math.round(e.d / 1440) + ' kun' : e.d + ' daq'}</span><span class="chip">${esc(e.lvl)}</span><span class="chip">${e.mat.length} ta material</span></div></button>`).join('') || empty('flask', 'Hech narsa topilmadi'); $$('.ecard', body).forEach((b) => b.onclick = () => CE.W.experimentModal(CE.EXPERIMENTS[+b.dataset.i])); };
      $('input', body).oninput = (e) => { q = e.target.value; draw(); }; $$('[data-f]', body).forEach((b) => b.onclick = () => { f = b.dataset.f; $$('[data-f]', body).forEach((x) => x.classList.toggle('on', x === b)); draw(); }); draw();
    } else if (tab === 'journal') {
      body.innerHTML = `<div class="toolbar"><input type="search" placeholder="Jurnaldan qidirish…" aria-label="Qidirish"><button class="btn primary" data-add>${icon('plus')}Yangi yozuv</button><button class="btn ghost" data-exp>${icon('download')}CSV</button></div><div class="tbl-w"><table class="tbl"><thead><tr><th>Sana</th><th>Sarlavha</th><th>Tajriba</th><th>Natija</th><th></th></tr></thead><tbody></tbody></table></div>`;
      let q = '';
      const form = (e) => CE.formModal({ title: e ? 'Yozuvni tahrirlash' : 'Yangi jurnal yozuvi', values: e || { date: CE.iso(new Date()), exp: CE.EXPERIMENTS[0].n }, fields: [{ k: 'title', label: 'Sarlavha', req: 1, full: 1 }, { k: 'date', label: 'Sana', type: 'date', req: 1 }, { k: 'exp', label: 'Tajriba', type: 'select', options: CE.EXPERIMENTS.map((x) => x.n) }, { k: 'notes', label: 'Kuzatishlar va o\'lchovlar', type: 'textarea', full: 1 }, { k: 'result', label: 'Natija', full: 1, ph: 'masalan: C(HCl) = 0,1002 M' }], onSubmit: (d) => { if (e) Object.assign(e, d); else { db.s.journal.unshift({ id: uid(), ...d }); db.log('flask', 'green', "Laboratoriya ishi qo'shildi"); } db.save(); CE.bus.emit('journal'); draw(); toast('Saqlandi'); } });
      const draw = () => { const L = db.s.journal.filter((e) => CE.norm(e.title + e.notes + e.result + e.exp).includes(CE.norm(q))); $('tbody', body).innerHTML = L.map((e) => `<tr><td>${CE.fmtDate(e.date)}</td><td><b>${esc(e.title)}</b><small class="block">${esc(e.notes).slice(0, 110)}</small></td><td>${esc(e.exp)}</td><td>${esc(e.result) || '—'}</td><td class="act"><button class="icon-btn" data-e="${e.id}" aria-label="Tahrirlash">${icon('edit')}</button><button class="icon-btn" data-x="${e.id}" aria-label="O'chirish">${icon('trash')}</button></td></tr>`).join('') || `<tr><td colspan="5">${empty('flask', "Yozuvlar yo'q")}</td></tr>`;
        $$('[data-e]', body).forEach((b) => b.onclick = () => form(db.s.journal.find((x) => x.id === b.dataset.e))); $$('[data-x]', body).forEach((b) => b.onclick = () => CE.confirmBox("Yozuvni o'chirasizmi?", () => { db.s.journal = db.s.journal.filter((x) => x.id !== b.dataset.x); db.save(); CE.bus.emit('journal'); draw(); })); };
      $('input', body).oninput = (e) => { q = e.target.value; draw(); }; $('[data-add]', body).onclick = () => form(); $('[data-exp]', body).onclick = () => CE.download('laboratoriya_jurnali.csv', '﻿Sana;Sarlavha;Tajriba;Kuzatishlar;Natija\n' + db.s.journal.map((e) => [e.date, e.title, e.exp, e.notes, e.result].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n'), 'text/csv'); draw();
    } else if (tab === 'analysis') {
      body.innerHTML = `<div class="grid g2"><section class="card panel"></section><section class="card panel"></section></div>`; const [a, b] = $$('.panel', body);
      CE.renderTool(CE.TOOLS.find((t) => t.id === 'calib'), a); CE.renderTool(CE.TOOLS.find((t) => t.id === 'stat'), b);
    } else {
      body.innerHTML = `<div class="notice">${icon('shield')}<div><b>Laboratoriyada umumiy xavfsizlik qoidalari</b><ul><li>Doimo xalat, ko'zoynak va qo'lqop kiying.</li><li>Kislotani suvga quying, aksincha emas.</li><li>Uchuvchan va zaharli moddalar bilan faqat mo'rili shkafda ishlang.</li><li>Idishlardagi yorliqlarni o'qimasdan modda ishlatmang.</li><li>Chiqindilarni turiga qarab alohida idishlarga yig'ing.</li><li>Ish joyida ovqatlanmang, yolg'iz ishlamang.</li></ul></div></div><p class="hint">Moddalar bo'yicha batafsil ma'lumot: <a href="#/chem-info/sds">SDS / Xavfsizlik</a> bo'limi.</p>`;
    }
  };

  // ---------- Ilmiy tadqiqot ----------
  V.research = (root) => {
    const R = (db.s.research = db.s.research || { title: '', question: '', h0: '', h1: '', iv: '', dv: '', methods: '', expected: '', checks: [] });
    const CHK = ['Tadqiqot savoli aniq va o\'lchanadigan', 'Adabiyotlar sharhi o\'tkazilgan (so\'nggi 5 yil)', 'Gipoteza (H₀/H₁) shakllantirilgan', 'O\'zgaruvchilar (mustaqil, bog\'liq, nazorat) aniqlangan', 'Tajriba takrorlanishi (replikatlar) rejalashtirilgan', 'Nazorat (blank, standart) namunalari bor', 'Tanlama hajmi hisoblangan', 'Statistik usullar oldindan tanlangan', 'Xavfsizlik va chiqindilar rejasi tuzilgan', 'Ma\'lumotlarni saqlash (zaxira) rejasi bor'];
    root.innerHTML = pageHead('Ilmiy tadqiqot', 'Tadqiqot pasporti, dizayn nazorat ro\'yxati va tanlama hajmini hisoblash') + `<div class="split wide"><section class="card panel"><div class="panel-h"><span class="ph-ic">${icon('atom')}</span><h3>Tadqiqot pasporti</h3><small class="autosave">avtomatik saqlanadi</small></div><form class="form-grid">${[['title', 'Tadqiqot mavzusi', 'full'], ['question', 'Tadqiqot savoli', 'full'], ['h0', 'Nol gipoteza (H₀)', ''], ['h1', 'Alternativ gipoteza (H₁)', ''], ['iv', 'Mustaqil o\'zgaruvchilar', ''], ['dv', 'Bog\'liq o\'zgaruvchilar', ''], ['methods', 'Usullar', 'full'], ['expected', 'Kutilayotgan natija va ahamiyati', 'full']].map(([k, l, c]) => `<label class="${c}"><span>${l}</span><textarea name="${k}" rows="${c ? 2 : 2}">${esc(R[k])}</textarea></label>`).join('')}</form></section><div class="col"><section class="card panel"><div class="panel-h"><span class="ph-ic">${icon('check')}</span><h3>Tadqiqot dizayni nazorat ro'yxati</h3></div><div class="chk-list chk"></div><div class="pbar"><i></i></div></section><section class="card panel ss"></section></div></div>`;
    const form = $('form', root); const save = CE.debounce(() => { db.save(); }, 300); form.addEventListener('input', (e) => { R[e.target.name] = e.target.value; save(); });
    const cl = $('.chk', root), bar = $('.pbar i', root); const drawC = () => { cl.innerHTML = CHK.map((c, i) => `<label class="chk"><input type="checkbox" data-i="${i}" ${R.checks[i] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join(''); const n = CHK.filter((_, i) => R.checks[i]).length; bar.style.width = (n / CHK.length) * 100 + '%'; $$('input', cl).forEach((c) => c.onchange = () => { R.checks[+c.dataset.i] = c.checked; db.save(); drawC(); }); }; drawC();
    const ss = $('.ss', root); ss.innerHTML = `<div class="panel-h"><span class="ph-ic">${icon('sigma')}</span><h3>Tanlama hajmini hisoblash</h3></div><form class="tool-form"><label><span>Standart og'ish σ</span><div class="inp"><input name="s" value="0.5" inputmode="decimal"></div></label><label><span>Ruxsat etilgan xato E</span><div class="inp"><input name="e" value="0.2" inputmode="decimal"></div></label><label class="full"><span>Ishonchlilik</span><div class="inp"><select name="p"><option>90</option><option selected>95</option><option>99</option></select></div></label></form><div class="tool-out"></div>`;
    const upd = () => { const f = $('form', ss), s = CE.num(f.s.value), e = CE.num(f.e.value), z = { 90: 1.645, 95: 1.96, 99: 2.576 }[f.p.value]; $('.tool-out', ss).innerHTML = s > 0 && e > 0 ? `<div class="res"><h5>n = (z·σ / E)²</h5><div class="r"><span>Kerakli tanlama hajmi</span><b>${Math.ceil((z * s / e) ** 2)} <small>parallel</small></b></div></div>` : '<div class="res err">σ va E musbat bo\'lsin</div>'; }; $('form', ss).addEventListener('input', upd); upd();
  };

  // ---------- Dissertatsiya ----------
  V.thesis = (root) => {
    const T = db.s.thesis;
    const draw = () => {
      const s = CE.thesisStats();
      root.innerHTML = pageHead('Dissertatsiya', 'Bosqichlar, vazifalar va boblar bo\'yicha jarayon', `<button class="btn ghost" data-tpl>${icon('templates')}Reja shabloni</button>`) + `<div class="grid g3 th"><section class="card panel span2"><label class="title-edit"><span>Dissertatsiya mavzusi</span><textarea rows="2" data-title>${esc(T.title)}</textarea></label><div class="th-prog"><b>Umumiy jarayon</b><span>${s.pct}%</span></div><div class="pbar"><i style="width:${s.pct}%"></i></div><div class="stages">${s.stages.map(([n, d], i) => `<button class="stg ${d ? 'done' : s.stages.findIndex((x) => !x[1]) === i ? 'cur' : ''}" ${i === 0 ? 'data-m' : ''}><span>${d ? icon('check') : ''}</span><small>${n}</small></button>`).join('')}</div></section><section class="card panel">${stat('check', `${s.done}/${s.total}`, 'bajarilgan vazifalar', 'green')}${stat('doc', T.chapters.reduce((a, c) => a + c.w, 0).toLocaleString('uz'), "yozilgan so'zlar", 'blue')}</section></div><div class="grid g2"><section class="card panel"><div class="panel-h"><span class="ph-ic">${icon('list')}</span><h3>Vazifalar</h3><button class="icon-btn" data-addg aria-label="Guruh qo'shish">${icon('plus')}</button></div><ul class="task-list">${s.groups.map((g) => `<li><button data-g="${g.id}"><span class="tk ${g.done === g.total && g.total ? 'ok' : g.done ? 'part' : ''}">${g.done === g.total && g.total ? icon('check') : ''}</span><span>${esc(g.name)}</span><b>${g.done}/${g.total}</b></button></li>`).join('')}</ul></section><section class="card panel"><div class="panel-h"><span class="ph-ic">${icon('book')}</span><h3>Boblar va hajm</h3><button class="icon-btn" data-addc aria-label="Bob qo'shish">${icon('plus')}</button></div><div class="chs">${T.chapters.map((c, i) => `<div class="ch"><div class="ch-t"><b>${esc(c.n)}</b><button class="icon-btn sm" data-dc="${i}" aria-label="O'chirish">${icon('x')}</button></div><div class="pbar"><i style="width:${Math.min(100, (c.w / (c.goal || 1)) * 100)}%"></i></div><div class="ch-in"><input type="number" min="0" value="${c.w}" data-w="${i}" aria-label="Yozilgan so'zlar"><span>/</span><input type="number" min="1" value="${c.goal}" data-gl="${i}" aria-label="Maqsad"><small>so'z</small></div></div>`).join('')}</div></section></div>`;
      $('[data-title]', root).onchange = (e) => { T.title = e.target.value; db.save(); }; $('[data-tpl]', root).onclick = () => { location.hash = '#/templates/thesis'; };
      $('[data-m]', root).onclick = () => { T.mavzu = !T.mavzu; db.save(); draw(); };
      $$('[data-g]', root).forEach((b) => b.onclick = () => CE.editGroup(b.dataset.g));
      $('[data-addg]', root).onclick = () => CE.formModal({ title: 'Yangi vazifalar guruhi', fields: [{ k: 'n', label: 'Nomi', req: 1, full: 1 }], onSubmit: (d) => { T.groups.push({ id: uid(), name: d.n, items: [] }); db.save(); draw(); } });
      $('[data-addc]', root).onclick = () => CE.formModal({ title: 'Yangi bob', fields: [{ k: 'n', label: 'Nomi', req: 1, full: 1 }, { k: 'goal', label: "Maqsad (so'z)", type: 'number', min: 1 }], values: { goal: 8000 }, onSubmit: (d) => { T.chapters.push({ n: d.n, w: 0, goal: +d.goal || 5000 }); db.save(); draw(); } });
      $$('[data-w]', root).forEach((i) => i.onchange = () => { T.chapters[+i.dataset.w].w = Math.max(0, +i.value || 0); db.save(); draw(); }); $$('[data-gl]', root).forEach((i) => i.onchange = () => { T.chapters[+i.dataset.gl].goal = Math.max(1, +i.value || 1); db.save(); draw(); });
      $$('[data-dc]', root).forEach((b) => b.onclick = () => CE.confirmBox("Bobni o'chirasizmi?", () => { T.chapters.splice(+b.dataset.dc, 1); db.save(); draw(); }));
    };
    CE.bus.onView('thesis', draw); draw();
  };

  // ---------- Maqolalar va adabiyotlar ----------
  const cite = {
    apa: (a) => `${a.authors || 'Muallif noma\'lum'} (${a.year || 'b.y.'}). ${a.title}. ${a.journal ? a.journal + '.' : ''}${a.doi ? ' https://doi.org/' + a.doi : ''}`,
    acs: (a) => `${a.authors || 'Muallif noma\'lum'}. ${a.title}. ${a.journal || ''} ${a.year || ''}.${a.doi ? ' DOI: ' + a.doi : ''}`,
    gost: (a) => `${a.authors || 'Muallif noma\'lum'}. ${a.title} // ${a.journal || ''}. – ${a.year || ''}.${a.doi ? ' – DOI: ' + a.doi : ''}`,
    bib: (a) => `@article{${(a.authors.split(/[ ,]/)[0] || 'ref').toLowerCase()}${a.year || ''},\n  title = {${a.title}},\n  author = {${a.authors.replace(/, /g, ' and ')}},\n  journal = {${a.journal || ''}},\n  year = {${a.year || ''}}${a.doi ? `,\n  doi = {${a.doi}}` : ''}\n}`
  };
  CE.cite = cite;
  V.articles = (root, sub, q0) => {
    const params = new URLSearchParams(q0 || ''); let tab = params.get('q') || sub === 'search' ? 'search' : sub === 'cite' ? 'cite' : 'lib'; let results = [], qv = params.get('q') || '';
    root.innerHTML = pageHead('Maqolalar va adabiyotlar', "Ilmiy maqolalarni qidirish, saqlash va iqtibos (havola) shakllantirish") + `<nav class="tabs big"><button data-tab="search" class="${tab === 'search' ? 'on' : ''}">Qidirish</button><button data-tab="lib" class="${tab === 'lib' ? 'on' : ''}">Mening kutubxonam</button><button data-tab="cite" class="${tab === 'cite' ? 'on' : ''}">Havolalar ro'yxati</button></nav><div class="tab-body"></div>`;
    const body = $('.tab-body', root);
    const drawSearch = () => {
      body.innerHTML = `<section class="card panel"><form class="inline-form big"><input name="q" value="${esc(qv)}" placeholder="Mavzu, kalit so'z, muallif yoki DOI… (masalan: phosphate flotation)" aria-label="Qidirish"><button class="btn primary" type="submit">${icon('search')}Qidirish</button></form><div class="ext">${[['Google Scholar', 'scholar'], ['PubChem', 'pubchem'], ['Scopus', 'scopus'], ['Web of Science', 'wos'], ['RSC', 'rsc'], ['ACS', 'acs']].map(([n, k]) => `<a class="chip" target="_blank" rel="noopener" data-k="${k}" href="${CE.LINKS[k](qv || 'chemistry')}">${n} ${icon('ext')}</a>`).join('')}</div><form class="inline-form"><input name="doi" placeholder="DOI bo'yicha qo'shish: 10.1016/..." aria-label="DOI"><button class="btn ghost" type="submit">${icon('plus')}Qo'shish</button></form><ul class="art-list big"></ul></section>`;
      const list = $('.art-list', body), [f1, f2] = $$('form', body);
      const showR = () => { list.innerHTML = results.map((a, i) => W_row(a, i)).join('') || (qv ? '' : `<li class="empty-s">Qidiruv so'zini kiriting. Natijalar Crossref bazasidan (150+ mln yozuv) olinadi.</li>`); $$('[data-save]', list).forEach((b) => b.onclick = () => CE.W.saveArticle(results[+b.closest('li').dataset.i])); };
      const W_row = (a, i) => CE.W.articleRow(a, false).replace('<li class="art">', `<li class="art" data-i="${i}">`);
      const run = async () => { qv = f1.q.value.trim(); if (!qv) return; $$('[data-k]', body).forEach((a) => { a.href = CE.LINKS[a.dataset.k](qv); }); list.innerHTML = '<li class="loading">Qidirilmoqda…</li>'; try { results = await CE.crossref(qv, 15); if (!results.length) list.innerHTML = '<li class="empty-s">Hech narsa topilmadi</li>'; else showR(); } catch (e) { list.innerHTML = `<li class="empty-s">${icon('warn')} Onlayn qidiruv hozir mavjud emas (${esc(e.message)}). Yuqoridagi tashqi bazalardan foydalaning.</li>`; } };
      f1.addEventListener('submit', (e) => { e.preventDefault(); run(); });
      f2.addEventListener('submit', async (e) => { e.preventDefault(); const doi = f2.doi.value.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//, ''); if (!doi) return; try { const r = await fetch('https://api.crossref.org/works/' + encodeURIComponent(doi)); if (!r.ok) throw new Error(); const j = (await r.json()).message; CE.W.saveArticle({ title: (j.title || [doi])[0], authors: (j.author || []).map((a) => `${a.family || ''} ${(a.given || '')[0] || ''}.`).join(', '), journal: (j['container-title'] || [''])[0], year: j.issued && j.issued['date-parts'][0][0], doi }); f2.doi.value = ''; } catch (err) { toast("DOI topilmadi yoki tarmoq yo'q", 'err'); } });
      if (qv) run(); else showR();
    };
    const drawLib = () => {
      let tagF = '', q = '';
      body.innerHTML = `<div class="toolbar"><input type="search" placeholder="Kutubxonadan qidirish…" aria-label="Qidirish"><button class="btn primary" data-add>${icon('plus')}Qo'lda qo'shish</button></div><div class="tbl-w"><table class="tbl"><thead><tr><th>Maqola</th><th>Jurnal</th><th>Yil</th><th>Teglar</th><th></th></tr></thead><tbody></tbody></table></div>`;
      const form = (a) => CE.formModal({ title: a ? 'Maqolani tahrirlash' : "Maqola qo'shish", values: a ? { ...a, tags: a.tags.join(', ') } : { year: new Date().getFullYear() }, fields: [{ k: 'title', label: 'Sarlavha', req: 1, full: 1 }, { k: 'authors', label: 'Mualliflar', full: 1, ph: 'Familiya I., Familiya I.' }, { k: 'journal', label: 'Jurnal' }, { k: 'year', label: 'Yil', type: 'number' }, { k: 'doi', label: 'DOI' }, { k: 'tags', label: 'Teglar (vergul bilan)' }, { k: 'notes', label: 'Izohlar', type: 'textarea', full: 1 }], onSubmit: (d) => { d.tags = d.tags.split(',').map((x) => x.trim()).filter(Boolean); d.year = d.year ? +d.year : ''; if (a) Object.assign(a, d); else db.s.articles.unshift({ id: uid(), ...d }); db.save(); CE.bus.emit('articles'); draw(); toast('Saqlandi'); } });
      const draw = () => { const L = db.s.articles.filter((a) => CE.norm(a.title + a.authors + a.journal + a.tags.join(' ') + a.notes).includes(CE.norm(q))); $('tbody', body).innerHTML = L.map((a) => `<tr><td><b>${esc(a.title)}</b><small class="block">${esc(a.authors)}</small>${a.notes ? `<small class="block note">${esc(a.notes)}</small>` : ''}</td><td>${esc(a.journal)}</td><td>${a.year || ''}</td><td>${a.tags.map((t) => `<span class="chip">${esc(t)}</span>`).join(' ')}</td><td class="act"><a class="icon-btn" target="_blank" rel="noopener" href="${esc(a.doi ? 'https://doi.org/' + a.doi : CE.LINKS.scholar(a.title))}" aria-label="Ochish">${icon('ext')}</a><button class="icon-btn" data-c="${a.id}" aria-label="Iqtibos" title="Iqtibos">${icon('link')}</button><button class="icon-btn" data-e="${a.id}" aria-label="Tahrirlash">${icon('edit')}</button><button class="icon-btn" data-x="${a.id}" aria-label="O'chirish">${icon('trash')}</button></td></tr>`).join('') || `<tr><td colspan="5">${empty('doc', "Kutubxona bo'sh. «Qidirish» bo'limida maqola toping va saqlang.")}</td></tr>`;
        $$('[data-e]', body).forEach((b) => b.onclick = () => form(db.s.articles.find((x) => x.id === b.dataset.e))); $$('[data-x]', body).forEach((b) => b.onclick = () => CE.confirmBox("Maqolani o'chirasizmi?", () => { db.s.articles = db.s.articles.filter((x) => x.id !== b.dataset.x); db.save(); CE.bus.emit('articles'); draw(); }));
        $$('[data-c]', body).forEach((b) => b.onclick = () => { const a = db.s.articles.find((x) => x.id === b.dataset.c); modal({ title: 'Iqtibos shakllari', wide: true, body: `<div class="cites">${[['APA', 'apa'], ['ACS', 'acs'], ['GOST', 'gost'], ['BibTeX', 'bib']].map(([n, k]) => `<div class="cite"><b>${n}</b><pre>${esc(cite[k](a))}</pre><button class="btn ghost sm" data-k="${k}">${icon('copy')}Nusxalash</button></div>`).join('')}</div>` }).el.addEventListener('click', (e) => { const k = e.target.closest('[data-k]'); if (k) CE.copy(cite[k.dataset.k](a)); }); }); };
      $('input', body).oninput = (e) => { q = e.target.value; draw(); }; $('[data-add]', body).onclick = () => form(); draw();
    };
    const drawCite = () => {
      body.innerHTML = `<section class="card panel"><div class="toolbar"><div class="chips pick">${[['apa', 'APA'], ['acs', 'ACS'], ['gost', 'GOST'], ['bib', 'BibTeX']].map(([k, l], i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-s="${k}">${l}</button>`).join('')}</div><button class="btn ghost" data-copy>${icon('copy')}Hammasini nusxalash</button><button class="btn ghost" data-dl>${icon('download')}Yuklab olish</button></div><ol class="cite-list"></ol></section>`; let st = 'apa';
      const draw = () => { const L = db.s.articles.slice().sort((a, b) => a.authors.localeCompare(b.authors)); $('.cite-list', body).innerHTML = L.map((a) => `<li><pre>${esc(cite[st](a))}</pre></li>`).join('') || '<li class="empty-s">Kutubxona bo\'sh</li>'; };
      $$('[data-s]', body).forEach((b) => b.onclick = () => { st = b.dataset.s; $$('[data-s]', body).forEach((x) => x.classList.toggle('on', x === b)); draw(); });
      const all = () => db.s.articles.slice().sort((a, b) => a.authors.localeCompare(b.authors)).map((a, i) => (st === 'bib' ? '' : `${i + 1}. `) + cite[st](a)).join('\n\n');
      $('[data-copy]', body).onclick = () => CE.copy(all()); $('[data-dl]', body).onclick = () => CE.download(`adabiyotlar_${st}.txt`, all()); draw();
    };
    const draw = () => { ({ search: drawSearch, lib: drawLib, cite: drawCite })[tab](); };
    CE.tabs(root, (t) => { tab = t; draw(); }); draw();
  };
})();
