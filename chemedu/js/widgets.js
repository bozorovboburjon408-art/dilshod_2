/* ChemEdu — qayta ishlatiladigan vidjetlar (bosh sahifa va alohida sahifalarda) */
(function () {
  const CE = (window.CE = window.CE || {});
  const { esc, icon, mk, $, $$, db, uid, fmt, toast, modal } = CE;
  const W = (CE.W = {});
  const FIELD_ICO = { inorg: 'flask', org: 'mol', anal: 'drop', phys: 'atom', bio: 'pill', mat: 'cube' };
  const fieldOf = (id) => CE.FIELDS.find((f) => f.id === id);
  const nav = (h) => { location.hash = h; };
  CE.nav = nav; CE.FIELD_ICO = FIELD_ICO;
  const head = (ico, title, extra = '') => `<div class="panel-h"><span class="ph-ic">${icon(ico)}</span><h3>${esc(title)}</h3>${extra}</div>`;
  const tabBar = (items, on) => `<div class="tabs" role="tablist">${items.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" class="${k === on ? 'on' : ''}" aria-selected="${k === on}">${esc(l)}</button>`).join('')}</div>`;

  // ---------- Test (viktorina) ----------
  CE.quiz = {
    start(fieldId, count = 10) {
      const pool = (fieldId === 'all' ? CE.TESTS : CE.TESTS.filter((q) => q.f === fieldId)).slice();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const qs = pool.slice(0, count).map((q) => { const idx = q.o.map((_, i) => i).sort(() => Math.random() - 0.5); return { ...q, o: idx.map((i) => q.o[i]), a: idx.indexOf(q.a) }; });
      if (!qs.length) return toast('Bu bo\'lim uchun savol topilmadi', 'err');
      let i = 0, score = 0, wrong = []; const t0 = Date.now();
      const body = mk('<div class="quiz"></div>'); const m = modal({ title: fieldId === 'all' ? 'Aralash test' : `Test: ${fieldOf(fieldId).name}`, body, wide: true });
      const show = () => {
        if (i >= qs.length) return end(); const q = qs[i];
        body.innerHTML = `<div class="q-top"><span>Savol ${i + 1} / ${qs.length}</span><div class="q-bar"><i style="width:${(i / qs.length) * 100}%"></i></div><span>${score} ball</span></div><h4 class="q-t">${esc(q.q)}</h4><div class="q-o">${q.o.map((o, k) => `<button type="button" class="q-opt" data-k="${k}"><b>${'ABCD'[k]}</b>${esc(o)}</button>`).join('')}</div><div class="q-fb" hidden></div>`;
        $$('.q-opt', body).forEach((b) => b.addEventListener('click', () => {
          const k = +b.dataset.k; $$('.q-opt', body).forEach((x) => { x.disabled = true; if (+x.dataset.k === q.a) x.classList.add('ok'); }); if (k === q.a) score++; else { b.classList.add('bad'); wrong.push(q); }
          const fb = $('.q-fb', body); fb.hidden = false; fb.innerHTML = `<p><b>${k === q.a ? "To'g'ri!" : "Noto'g'ri."}</b> ${esc(q.e)}</p><button class="btn primary" type="button">${i + 1 < qs.length ? 'Keyingi' : 'Natijani ko\'rish'}${icon('arrow')}</button>`; $('button', fb).onclick = () => { i++; show(); }; $('button', fb).focus();
        }));
      };
      const end = () => {
        const pct = Math.round((score / qs.length) * 100); const g = pct >= 86 ? 5 : pct >= 71 ? 4 : pct >= 56 ? 3 : 2; const sec = Math.round((Date.now() - t0) / 1000);
        db.s.tests.unshift({ id: uid(), date: CE.iso(new Date()), field: fieldId, score, total: qs.length, pct, sec }); db.s.tests.length = Math.min(db.s.tests.length, 50); db.log('quiz', 'purple', `Test topshirildi: ${score}/${qs.length}`); CE.bus.emit('tests');
        body.innerHTML = `<div class="q-end"><div class="ring" style="--p:${pct}"><b>${pct}%</b></div><h4>${score} / ${qs.length} to'g'ri javob</h4><p>Baho: <b>${g}</b> · Vaqt: ${Math.floor(sec / 60)} daq ${sec % 60} s</p>${wrong.length ? `<div class="q-wrong"><h5>Xatolar tahlili</h5>${wrong.map((q) => `<div><b>${esc(q.q)}</b><br><small>To'g'ri javob: ${esc(q.o[q.a])} — ${esc(q.e)}</small></div>`).join('')}</div>` : '<p class="ok-t">Ajoyib! Barcha javoblar to\'g\'ri.</p>'}<div class="row-btn"><button class="btn primary" data-again>Qayta topshirish</button><button class="btn ghost" data-close>Yopish</button></div></div>`;
        $('[data-again]', body).onclick = () => { m.close(); CE.quiz.start(fieldId, count); }; $('[data-close]', body).onclick = () => m.close();
      };
      show();
    }
  };

  // ---------- Dars va ma'ruza yaratish ----------
  W.experimentModal = (e) => modal({ title: e.n, wide: true, body: `<div class="exp"><div class="chips"><span class="chip">${esc(fieldOf(e.f).name)}</span><span class="chip">${e.d >= 1440 ? Math.round(e.d / 1440) + ' kun' : e.d + ' daq'}</span><span class="chip">${esc(e.lvl)}</span></div><h5>Materiallar</h5><ul>${e.mat.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h5>Ish tartibi</h5><ol>${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><div class="safe"><h5>${icon('warn')}Xavfsizlik</h5><ul>${e.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div></div>`, actions: [{ label: 'Jurnalga qo\'shish', icon: 'plus', cls: 'ghost', fn: () => { db.s.journal.unshift({ id: uid(), date: CE.iso(new Date()), title: `${e.n} — boshlandi`, exp: e.n, notes: '', result: '' }); db.log('flask', 'green', "Laboratoriya ishi qo'shildi"); toast('Laboratoriya jurnaliga qo\'shildi'); CE.bus.emit('journal'); } }, { label: 'Chop etish', icon: 'print', fn: () => { CE.printHtml(`<h2>${esc(e.n)}</h2><h4>Materiallar</h4><ul>${e.mat.map((x) => `<li>${esc(x)}</li>`).join('')}</ul><h4>Ish tartibi</h4><ol>${e.steps.map((x) => `<li>${esc(x)}</li>`).join('')}</ol><h4>Xavfsizlik</h4><ul>${e.safety.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`, e.n); return false; } }, { label: 'Yopish', cls: 'primary' }] });

  W.lesson = (root, opts = {}) => {
    const st = { tab: opts.tab || 'tpl', field: 'inorg', topic: '', custom: '', level: "O'rta", minutes: 45, lesson: null };
    root.innerHTML = head('slides', 'Dars va ma\'ruza yarating') + tabBar([['tpl', 'Shablonlar'], ['topics', 'Mavzular'], ['gen', 'Slayd generator'], ['quiz', 'Testlar'], ['lab', 'Laboratoriya ishlari']], st.tab) + '<div class="pbody"></div>';
    const body = $('.pbody', root);
    const draw = () => {
      if (st.tab === 'tpl') {
        body.innerHTML = `<div class="tile-grid">${CE.FIELDS.map((f) => `<button class="tile ${f.color}" data-f="${f.id}"><span class="t-ic">${icon(FIELD_ICO[f.id])}</span><span class="t-tx"><b>${esc(f.name)}</b><small>${f.topics.length} ta mavzu</small></span>${icon('arrow')}</button>`).join('')}</div>`;
        $$('[data-f]', body).forEach((b) => b.onclick = () => { st.field = b.dataset.f; st.tab = 'topics'; sync(); });
      } else if (st.tab === 'topics') {
        const f = fieldOf(st.field);
        body.innerHTML = `<div class="chips pick">${CE.FIELDS.map((x) => `<button class="chip ${x.id === st.field ? 'on' : ''}" data-f="${x.id}">${esc(x.name)}</button>`).join('')}</div><ul class="topic-list">${f.topics.map((t, i) => `<li><button data-i="${i}"><span class="n">${i + 1}</span><span><b>${esc(t.t)}</b><small>${esc(t.formula || '')}</small></span>${icon('arrow')}</button></li>`).join('')}</ul>`;
        $$('[data-f]', body).forEach((b) => b.onclick = () => { st.field = b.dataset.f; draw(); });
        $$('[data-i]', body).forEach((b) => b.onclick = () => { st.topic = f.topics[+b.dataset.i].t; st.tab = 'gen'; st.lesson = null; sync(); });
      } else if (st.tab === 'gen') {
        const f = fieldOf(st.field); if (!st.topic || !f.topics.some((t) => t.t === st.topic)) st.topic = f.topics[0].t;
        body.innerHTML = `<form class="gen-form"><label><span>Fan bo'limi</span><select name="field">${CE.FIELDS.map((x) => `<option value="${x.id}" ${x.id === st.field ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><label><span>Mavzu</span><select name="topic">${f.topics.map((t) => `<option ${t.t === st.topic ? 'selected' : ''}>${esc(t.t)}</option>`).join('')}<option value="__c" ${st.topic === '__c' ? 'selected' : ''}>Boshqa mavzu…</option></select></label>${st.topic === '__c' ? `<label class="full"><span>O'z mavzuingiz</span><input name="custom" value="${esc(st.custom)}" placeholder="Masalan: Fosforitlarni flotatsiya bilan boyitish" required></label>` : ''}<label><span>Daraja</span><select name="level">${["Boshlang'ich", "O'rta", "Ilg'or"].map((x) => `<option ${x === st.level ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label><span>Davomiyligi</span><select name="minutes">${[30, 45, 60, 90].map((x) => `<option ${x === st.minutes ? 'selected' : ''} value="${x}">${x} daqiqa</option>`).join('')}</select></label><button class="btn primary full" type="submit">${icon('sparkles')}Slaydlarni yaratish</button></form><div class="gen-out"></div>`;
        const form = $('form', body);
        form.field.onchange = () => { st.field = form.field.value; st.topic = ''; st.lesson = null; draw(); };
        form.topic.onchange = () => { st.topic = form.topic.value; st.lesson = null; draw(); };
        form.level.onchange = () => { st.level = form.level.value; }; form.minutes.onchange = () => { st.minutes = +form.minutes.value; };
        form.addEventListener('submit', (e) => { e.preventDefault(); const topic = st.topic === '__c' ? form.custom.value.trim() : st.topic; if (st.topic === '__c') st.custom = topic; st.lesson = CE.makeLesson({ fieldId: st.field, topic, level: st.level, minutes: st.minutes }); out(); });
        out();
      } else if (st.tab === 'quiz') {
        body.innerHTML = `<div class="tile-grid">${CE.FIELDS.map((f) => `<button class="tile ${f.color}" data-f="${f.id}"><span class="t-ic">${icon('quiz')}</span><span class="t-tx"><b>${esc(f.name)}</b><small>${CE.TESTS.filter((q) => q.f === f.id).length} ta savol</small></span>${icon('play')}</button>`).join('')}</div><button class="btn ghost wide-btn" data-all>${icon('bolt')}Aralash test (10 ta savol)</button>`;
        $$('[data-f]', body).forEach((b) => b.onclick = () => CE.quiz.start(b.dataset.f, 8)); $('[data-all]', body).onclick = () => CE.quiz.start('all', 10);
      } else {
        body.innerHTML = `<ul class="exp-list">${CE.EXPERIMENTS.slice(0, 5).map((e, i) => `<li><button data-i="${i}"><span class="t-ic ${fieldOf(e.f).color}">${icon('flask')}</span><span><b>${esc(e.n)}</b><small>${esc(fieldOf(e.f).name)} · ${e.d >= 1440 ? Math.round(e.d / 1440) + ' kun' : e.d + ' daq'} · ${esc(e.lvl)}</small></span>${icon('arrow')}</button></li>`).join('')}</ul><a class="more" href="#/lab">Barcha laboratoriya ishlari ${icon('arrow')}</a>`;
        $$('[data-i]', body).forEach((b) => b.onclick = () => W.experimentModal(CE.EXPERIMENTS[+b.dataset.i]));
      }
    };
    const out = () => {
      const o = $('.gen-out', body); if (!st.lesson) { o.innerHTML = ''; return; } const L = st.lesson;
      o.innerHTML = `<div class="gen-res"><div class="gr-h"><b>${esc(L.title)}</b><span>${L.slides.length} ta slayd · ${L.minutes} daq</span></div><ol class="gr-l">${L.slides.map((s) => `<li>${esc(s.t)}</li>`).join('')}</ol><div class="row-btn"><button class="btn primary" data-p>${icon('play')}Taqdimotni ochish</button><button class="btn ghost" data-d>${icon('download')}Yuklab olish</button><button class="btn ghost" data-s>${icon('bookmark')}Saqlash</button></div></div>`;
      $('[data-p]', o).onclick = () => CE.present(L.slides, L.title);
      $('[data-d]', o).onclick = () => CE.download(`${L.title.replace(/[^\w\u0400-\u04FF]+/g, '_')}.html`, CE.deckHtml(L.slides, L.title), 'text/html');
      $('[data-s]', o).onclick = () => { db.s.lessons.unshift({ id: uid(), title: L.title, field: L.fieldId, date: CE.iso(new Date()), slides: L.slides.length, level: L.level, minutes: L.minutes, deck: L.slides }); db.log('slides', 'amber', 'Dars slaydi yaratildi'); toast('Dars saqlandi'); CE.bus.emit('lessons'); };
    };
    const sync = () => { $$('[data-tab]', root).forEach((b) => { b.classList.toggle('on', b.dataset.tab === st.tab); b.setAttribute('aria-selected', b.dataset.tab === st.tab); }); draw(); };
    CE.tabs(root, (t) => { st.tab = t; draw(); }); draw();
    root._set = (o) => { Object.assign(st, o); sync(); };
  };

  // ---------- Molekula ----------
  W.molecule = (root, opts = {}) => {
    let cur = null, m3 = null, tab = opts.tab || '2d', showH = false, hManual = false; const full = !!opts.full;
    root.innerHTML = head('mol', 'Molekula tuzilishi va 3D ko\'rish') + `<form class="inline-form"><input name="q" value="${esc(opts.q || 'C6H6')}" list="mol-names" aria-label="Molekula nomi, formulasi yoki SMILES" placeholder="Nom, formula yoki SMILES (masalan: aspirin, C6H6, CCO)" autocomplete="off"><button class="btn primary" type="submit">Ko'rsatish</button></form><datalist id="mol-names">${CE.MOLDB.map((d) => `<option value="${esc(d.name)}">${esc(d.formula)}</option>`).join('')}</datalist>` + tabBar([['2d', '2D tuzilma'], ['3d', '3D model'], ['info', 'Tavsif'], ['smiles', 'SMILES']], tab) + `<div class="mol-stage"></div><div class="mol-foot"><button class="btn ghost sm" data-r>${icon('rotate')}Aylantirish</button><button class="btn ghost sm" data-z>${icon('zoom')}Zoom</button><button class="btn ghost sm" data-f>${icon('expand')}To'liq ekran</button><button class="icon-btn" data-h title="2D da barcha vodorodlarni ko'rsatish" aria-pressed="false">${icon('gear')}</button></div>`;
    const stage = $('.mol-stage', root), form = $('form', root);
    const killer = () => { if (m3) { m3.destroy(); m3 = null; } };
    const render = () => {
      killer(); if (!cur) return; const d = CE.describeMol(cur.m, cur.name);
      if (tab === '2d' || tab === '3d') {
        stage.className = `mol-stage ${tab === '2d' ? 'both' : 'one'}`;
        stage.innerHTML = `${tab === '2d' ? `<div class="m2">${CE.svg2D(cur.m, { showH })}</div>` : ''}<div class="m3"><canvas aria-label="Molekulaning 3D modeli — sichqoncha bilan aylantiring"></canvas></div><div class="m-cap">${esc(d.name)} · ${CE.prettyFormula(d.formula)}</div>`;
        m3 = new CE.Mol3D($('canvas', stage), cur.m);
      } else if (tab === 'info') {
        stage.className = 'mol-stage info';
        stage.innerHTML = `<div class="info-g"><h4>${esc(d.name)} <small>${CE.prettyFormula(d.formula)}</small></h4><div class="kv"><span>Molyar massa</span><b>${fmt(d.mass, 6)} g/mol</b><span>Atomlar soni</span><b>${d.atoms} (og'ir: ${d.heavy})</b><span>Bog'lar</span><b>${d.single} oddiy · ${d.dbl} qo'sh · ${d.triple} uch</b><span>Halqalar</span><b>${d.rings}</b><span>Manba</span><b>${esc(cur.source)}</b></div><h5>Elementlar tarkibi</h5>${d.pct.map((p) => `<div class="bar-r"><span>${p.sym} × ${p.n}</span><i style="--w:${p.pct}%"></i><em>${fmt(p.pct, 4)} %</em></div>`).join('')}</div>`;
      } else {
        stage.className = 'mol-stage info';
        stage.innerHTML = `<div class="info-g"><h5>SMILES</h5><code class="code">${esc(d.smiles)}</code><button class="btn ghost sm" data-c>${icon('copy')}Nusxalash</button><h5>Hill formulasi</h5><code class="code">${esc(d.formula)}</code><p class="hint">SMILES — molekulani matn ko'rinishida yozish usuli. O'zingizning SMILES ni kiritish uchun: <code>smiles:CC(=O)O</code></p></div>`; $('[data-c]', stage).onclick = () => CE.copy(d.smiles);
      }
    };
    const load = async (q) => {
      stage.className = 'mol-stage'; stage.innerHTML = '<div class="loading">Yuklanmoqda…</div>';
      try { cur = await CE.lookupMolecule(q); if (!hManual) showH = CE.explicitH(cur.m).heavy <= 10; render(); db.log('mol', 'blue', `Molekula ko'rildi: ${cur.name}`); } catch (e) { cur = null; killer(); stage.className = 'mol-stage'; stage.innerHTML = `<div class="empty">${icon('warn')}<p>${esc(e.message)}</p></div>`; }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); load(form.q.value); });
    CE.tabs(root, (t) => { tab = t; render(); });
    $('[data-r]', root).onclick = (e) => { if (m3) { const on = m3.toggleAuto(); e.currentTarget.classList.toggle('on', on); } };
    $('[data-z]', root).onclick = () => { if (m3) { m3.zoom > 2.2 ? (m3.zoom = 1) : m3.zoomBy(1.3); } };
    $('[data-f]', root).onclick = () => { (document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen && root.requestFullscreen()); };
    $('[data-h]', root).onclick = (e) => { showH = !showH; hManual = true; e.currentTarget.setAttribute('aria-pressed', showH); e.currentTarget.classList.toggle('on', showH); toast(showH ? '2D: barcha vodorodlar ko\'rsatiladi' : '2D: qisqartirilgan ko\'rinish'); render(); };
    load(form.q.value);
    root._load = (q, t) => { form.q.value = q; if (t) { tab = t; $$('[data-tab]', root).forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); } load(q); };
  };

  // ---------- Reaksiya tenglamasi ----------
  W.reaction = (root) => {
    const EX = ['HCl + CaCO3', 'Fe + O2 -> Fe2O3', 'C3H8 + O2 -> CO2 + H2O', 'KMnO4 + HCl -> KCl + MnCl2 + Cl2 + H2O', 'Al + H2SO4 -> Al2(SO4)3 + H2'];
    root.innerHTML = head('scale', 'Reaksiya tenglamasi') + `<form class="inline-form"><input name="q" value="2HCl + CaCO3" aria-label="Reaksiya tenglamasi" placeholder="Reaktivlar -> mahsulotlar" autocomplete="off"><button class="btn primary" type="submit">Balanslash</button></form><div class="chips ex">${EX.slice(1).map((e) => `<button class="chip" type="button" data-e="${esc(e)}">${CE.prettyFormula(e.split('->')[0])}</button>`).join('')}</div><div class="r-out"></div>`;
    const out = $('.r-out', root), form = $('form', root); let lastLogged = '';
    const guess = (q) => { if (/->|→|=>|=|⟶/.test(q)) return q; const L = q.replace(/\d+\s*(?=[A-Z])/g, ''); const key = L.replace(/\s/g, ''); const known = { 'HCl+CaCO3': 'HCl + CaCO3 -> CaCl2 + CO2 + H2O', 'HCl+NaOH': 'HCl + NaOH -> NaCl + H2O', 'Fe+O2': 'Fe + O2 -> Fe2O3', 'H2+O2': 'H2 + O2 -> H2O', 'CH4+O2': 'CH4 + O2 -> CO2 + H2O', 'Zn+HCl': 'Zn + HCl -> ZnCl2 + H2', 'Na+H2O': 'Na + H2O -> NaOH + H2', 'H2SO4+NaOH': 'H2SO4 + NaOH -> Na2SO4 + H2O', 'Mg+O2': 'Mg + O2 -> MgO', 'Al+O2': 'Al + O2 -> Al2O3' }; return known[key] || q; };
    const run = () => {
      let q = form.q.value.trim(); if (!q) return; const g = guess(q);
      try {
        const b = CE.balance(g); const co = b.coefficients; const nR = b.reactants.length; const species = [...b.reactants, ...b.products];
        out.innerHTML = `<div class="r-res"><div class="r-lab">Natija:</div><div class="r-eq">${b.html}</div>${g !== q ? '<p class="hint">Mahsulotlar taxmin qilindi. Kerak bo\'lsa, to\'liq tenglamani kiriting.</p>' : ''}<div class="r-lab sm">Atomlar balansi:</div><table class="tbl compact"><thead><tr><th>Element</th><th>Chap tomoni</th><th>O'ng tomoni</th></tr></thead><tbody>${b.table.map((r) => `<tr><td>${r.el}</td><td>${r.left}</td><td>${r.right}</td></tr>`).join('')}</tbody></table><div class="r-type"><b>Reaksiya turi:</b> ${esc(b.type)}</div><button class="more-btn" type="button" data-more>${icon('down')}Qo'shimcha ma'lumot</button><div class="r-more" hidden><table class="tbl compact"><thead><tr><th>Modda</th><th>Koeff.</th><th>M, g/mol</th><th>Massa, g</th></tr></thead><tbody>${species.map((s, i) => `<tr><td>${CE.prettyFormula(s)}</td><td>${co[i]}</td><td>${fmt(CE.molarMass(s), 5)}</td><td>${fmt(co[i] * CE.molarMass(s), 5)}</td></tr>`).join('')}</tbody></table><p class="hint">Massa saqlanish qonuni: Σm(reaktivlar) = ${fmt(species.slice(0, nR).reduce((a, s, i) => a + co[i] * CE.molarMass(s), 0), 6)} g = Σm(mahsulotlar) = ${fmt(species.slice(nR).reduce((a, s, i) => a + co[nR + i] * CE.molarMass(s), 0), 6)} g</p>${(() => { try { const h = CE.reactionEnthalpy(g); return h.miss.length ? '' : `<p class="hint">ΔH° ≈ <b>${fmt(h.dh, 5)} kJ</b> (${h.dh < 0 ? 'ekzotermik' : 'endotermik'})</p>`; } catch (e) { return ''; } })()}</div><div class="row-btn"><button class="btn ghost sm" type="button" data-copy>${icon('copy')}Nusxalash</button></div></div>`;
        $('[data-more]', out).onclick = (e) => { const m = $('.r-more', out); m.hidden = !m.hidden; e.currentTarget.classList.toggle('open', !m.hidden); };
        $('[data-copy]', out).onclick = () => CE.copy(b.text);
        if (lastLogged !== b.text) { lastLogged = b.text; db.log('scale', 'purple', 'Reaksiya balanslandi'); }
      } catch (e) { out.innerHTML = `<div class="res err">${icon('warn')}<span>${esc(e.message)}</span></div>`; }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
    $$('[data-e]', root).forEach((b) => b.onclick = () => { form.q.value = b.dataset.e; run(); });
    run();
  };

  // ---------- Adabiyot ----------
  CE.crossref = async (q, rows = 8) => {
    const r = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=${rows}&select=title,author,DOI,container-title,issued,type,URL`);
    if (!r.ok) throw new Error('Qidiruv xizmati javob bermadi');
    const j = await r.json();
    return j.message.items.filter((i) => i.title && i.title[0]).map((i) => ({ title: i.title[0].replace(/<[^>]+>/g, ''), authors: (i.author || []).slice(0, 4).map((a) => `${a.family || ''} ${(a.given || '')[0] ? a.given[0] + '.' : ''}`.trim()).join(', ') + ((i.author || []).length > 4 ? ' va boshq.' : ''), journal: (i['container-title'] || [''])[0], year: (i.issued && i.issued['date-parts'] && i.issued['date-parts'][0][0]) || '', doi: i.DOI || '' }));
  };
  const doiUrl = (a) => (a.doi ? `https://doi.org/${a.doi}` : CE.LINKS.scholar(a.title));
  W.articleRow = (a, saved) => `<li class="art"><span class="a-ic">${icon('doc')}</span><div class="a-t"><b>${esc(a.title)}</b><small>${esc(a.journal || '—')}${a.year ? ', ' + a.year : ''}${a.authors ? ' · ' + esc(a.authors) : ''}</small></div><div class="a-b"><a class="pill red" target="_blank" rel="noopener" href="${esc(CE.LINKS.scholar(a.title + ' filetype:pdf'))}" title="Google Scholar orqali PDF qidirish">PDF</a><a class="pill blue" target="_blank" rel="noopener" href="${esc(doiUrl(a))}" title="${a.doi ? 'DOI: ' + esc(a.doi) : 'Google Scholar'}">DOI</a>${saved === false ? `<button class="pill green" data-save title="Saqlash">${icon('plus')}</button>` : ''}</div></li>`;
  W.saveArticle = (a) => { if (db.s.articles.some((x) => x.title === a.title)) return toast('Bu maqola allaqachon saqlangan'); db.s.articles.unshift({ id: uid(), title: a.title, authors: a.authors || '', journal: a.journal || '', year: a.year || '', doi: a.doi || '', tags: [], notes: '' }); db.log('doc', 'red', 'Maqola saqlandi'); toast('Maqola saqlandi'); CE.bus.emit('articles'); };

  W.literature = (root) => {
    let src = 'Google Scholar'; const SRC = ['Google Scholar', 'PubChem', 'Scopus', 'Web of Science', 'RSC', 'ACS'];
    root.innerHTML = head('doc', 'Ilmiy adabiyotlar va maqolalar') + `<div class="tabs sm" role="tablist">${SRC.map((s, i) => `<button type="button" data-tab="${s}" class="${i === 0 ? 'on' : ''}">${s}</button>`).join('')}</div><form class="inline-form"><input name="q" placeholder="Mavzu, muallif yoki DOI…" aria-label="Maqola qidirish"><button class="btn primary" type="submit">Qidirish</button></form><ul class="art-list"></ul><div class="lit-foot"></div>`;
    const list = $('.art-list', root), foot = $('.lit-foot', root), form = $('form', root);
    const key = { 'Google Scholar': 'scholar', PubChem: 'pubchem', Scopus: 'scopus', 'Web of Science': 'wos', RSC: 'rsc', ACS: 'acs' };
    const showSaved = () => { list.innerHTML = db.s.articles.slice(0, 3).map((a) => W.articleRow(a, true)).join('') || '<li class="empty-s">Hozircha saqlangan maqola yo\'q</li>'; foot.innerHTML = `<a class="more" href="#/articles">6+ mln ilmiy maqolalar bazasidan qidirish ${icon('arrow')}</a>`; };
    const search = async () => {
      const q = form.q.value.trim(); if (!q) return showSaved();
      list.innerHTML = '<li class="loading">Qidirilmoqda…</li>'; foot.innerHTML = '';
      const ext = `<a class="more" target="_blank" rel="noopener" href="${esc(CE.LINKS[key[src]](q))}">${src} da ochish ${icon('ext')}</a>`;
      try { const r = await CE.crossref(q, 5); list.innerHTML = r.map((a, i) => W.articleRow(a, false).replace('<li class="art">', `<li class="art" data-i="${i}">`)).join('') || '<li class="empty-s">Hech narsa topilmadi</li>'; $$('[data-save]', list).forEach((b) => b.onclick = () => W.saveArticle(r[+b.closest('li').dataset.i])); foot.innerHTML = ext + `<a class="more" href="#/articles?q=${encodeURIComponent(q)}">Barcha natijalar ${icon('arrow')}</a>`; }
      catch (e) { const f = db.s.articles.filter((a) => CE.norm(a.title + a.authors + a.journal + a.tags.join(' ')).includes(CE.norm(q))); list.innerHTML = (f.length ? f.map((a) => W.articleRow(a, true)).join('') : '<li class="empty-s">Onlayn qidiruv hozir mavjud emas. Saqlangan maqolalar orasida topilmadi.</li>'); foot.innerHTML = ext; }
    };
    form.addEventListener('submit', (e) => { e.preventDefault(); search(); });
    CE.tabs(root, (t) => { src = t; if (form.q.value.trim()) search(); });
    showSaved(); CE.bus.onView('articles', () => { if (!form.q.value.trim()) showSaved(); });
  };

  // ---------- Dissertatsiya ----------
  CE.thesisStats = () => {
    const T = db.s.thesis; const g = T.groups.map((x) => ({ id: x.id, name: x.name, done: x.items.filter((i) => i.done).length, total: x.items.length }));
    const done = g.reduce((a, x) => a + x.done, 0), total = g.reduce((a, x) => a + x.total, 0); const full = (i) => g[i] && g[i].total > 0 && g[i].done === g[i].total;
    const stages = [['Mavzu', T.mavzu], ['Adabiyot', full(0)], ['Eksperiment', full(1)], ['Natijalar', full(2)], ['Himoya', full(3) && full(4)]];
    return { groups: g, done, total, pct: total ? Math.round((done / total) * 100) : 0, stages };
  };
  CE.editGroup = (gid) => {
    const T = db.s.thesis, g = T.groups.find((x) => x.id === gid); const body = mk('<div class="chk-list"></div>');
    const draw = () => { body.innerHTML = g.items.map((it, i) => `<label class="chk"><input type="checkbox" data-i="${i}" ${it.done ? 'checked' : ''}><span>${esc(it.t)}</span><button type="button" class="icon-btn sm" data-d="${i}" aria-label="O'chirish">${icon('x')}</button></label>`).join('') + `<form class="inline-form add"><input name="t" placeholder="Yangi vazifa qo'shish…"><button class="btn ghost" type="submit">${icon('plus')}</button></form>`;
      $$('[data-i]', body).forEach((c) => c.onchange = () => { g.items[+c.dataset.i].done = c.checked; db.save(); CE.bus.emit('thesis'); }); $$('[data-d]', body).forEach((b) => b.onclick = (e) => { e.preventDefault(); g.items.splice(+b.dataset.d, 1); db.save(); CE.bus.emit('thesis'); draw(); });
      $('form', body).onsubmit = (e) => { e.preventDefault(); const v = e.target.t.value.trim(); if (!v) return; g.items.push({ t: v, done: false }); db.save(); CE.bus.emit('thesis'); draw(); $('form input', body).focus(); }; };
    draw(); modal({ title: g.name, body, actions: [{ label: 'Tayyor', cls: 'primary' }] });
  };
  W.dissertation = (root) => {
    let tab = 'res';
    root.innerHTML = head('cap', 'Dissertatsiya va tadqiqot boshqaruvi') + tabBar([['res', 'Mening tadqiqotim'], ['exp', 'Eksperimentlar'], ['out', 'Natijalar'], ['calc', 'Hisoblar']], tab) + '<div class="pbody"></div>';
    const body = $('.pbody', root);
    const draw = () => {
      if (tab === 'res') {
        const s = CE.thesisStats();
        body.innerHTML = `<div class="th-prog"><b>Dissertatsiya jarayoni</b><span>${s.pct}%</span></div><div class="pbar"><i style="width:${s.pct}%"></i></div><div class="stages">${s.stages.map(([n, d], i) => `<div class="stg ${d ? 'done' : s.stages.findIndex((x) => !x[1]) === i ? 'cur' : ''}"><span>${d ? icon('check') : ''}</span><small>${n}</small></div>`).join('')}</div><h5>Joriy vazifalar</h5><ul class="task-list">${s.groups.map((g) => `<li><button data-g="${g.id}"><span class="tk ${g.done === g.total && g.total ? 'ok' : g.done ? 'part' : ''}">${g.done === g.total && g.total ? icon('check') : ''}</span><span>${esc(g.name)}</span><b>${g.done}/${g.total}</b></button></li>`).join('')}</ul>`;
        $$('[data-g]', body).forEach((b) => b.onclick = () => CE.editGroup(b.dataset.g));
      } else if (tab === 'exp') {
        const j = db.s.journal.slice(0, 4); body.innerHTML = `<ul class="mini-list">${j.map((e) => `<li><b>${esc(e.title)}</b><small>${CE.fmtDate(e.date)} · ${esc(e.exp)}</small></li>`).join('') || '<li class="empty-s">Jurnal bo\'sh</li>'}</ul><a class="more" href="#/lab/journal">Laboratoriya jurnali ${icon('arrow')}</a>`;
      } else if (tab === 'out') {
        const j = db.s.journal.filter((e) => e.result).slice(0, 5); body.innerHTML = `<ul class="mini-list">${j.map((e) => `<li><b>${esc(e.result)}</b><small>${esc(e.title)}</small></li>`).join('') || '<li class="empty-s">Natijalar hali kiritilmagan</li>'}</ul><a class="more" href="#/thesis">Dissertatsiya sahifasi ${icon('arrow')}</a>`;
      } else {
        body.innerHTML = `<div class="chips pick">${CE.TOOLS.slice(0, 8).map((t) => `<a class="chip" href="#/tools/${t.id}">${esc(t.name)}</a>`).join('')}</div><a class="more" href="#/tools">Barcha hisoblash vositalari ${icon('arrow')}</a>`;
      }
    };
    CE.tabs(root, (t) => { tab = t; draw(); }); CE.bus.onView('thesis', () => { if (tab === 'res') draw(); }); CE.bus.onView('journal', () => { if (tab !== 'res') draw(); }); draw();
  };

  // ---------- AI yordamchi ----------
  W.ai = (root, opts = {}) => {
    const full = !!opts.full; let mode = 'Kimyo'; const MODES = ['Kimyo', "Ta'lim", 'Maqola', 'Dissertatsiya'];
    const SUG = { Kimyo: ['0.1 M NaOH eritmasidan 500 ml tayyorlash uchun qancha NaOH kerak?', 'H2SO4 ning molyar massasi', '0.01 M CH3COOH ning pH i', 'C3H8 + O2 -> CO2 + H2O', '2 M HCl dan 0.5 M li 250 ml tayyorlash', 'Le Shatelye prinsipi nima?'], "Ta'lim": ['Kislota-asosli titrlash dars rejasi', 'Atom tuzilishi va davriy qonun uchun dars', 'Oksidlanish-qaytarilish reaksiyalari dars rejasi'], Maqola: ['Fosforitlarni flotatsiya bilan boyitish maqola tuzilmasi', 'Katalizatorlar sharhi maqolasi uchun reja'], Dissertatsiya: ['Nodir yer elementlari ajratish dissertatsiya rejasi', 'Gidrometallurgiya metodologiyasi'] };
    root.innerHTML = head('sparkles', 'AI ilmiy yordamchi') + tabBar(MODES.map((m) => [m, m]), mode) + `<div class="chat ${full ? 'full' : ''}"></div><div class="sug"></div><form class="chat-in"><input name="q" placeholder="Savolingizni yozing…" aria-label="Savol" autocomplete="off"><button class="send" type="submit" aria-label="Yuborish">${icon('send')}</button></form>${full ? `<p class="hint ai-note">Lokal hisoblash va bilimlar motori: kimyoviy hisoblashlar tarmoqsiz, aniq formulalar bilan bajariladi. Javoblarni muhim ishlarda mustaqil tekshiring.</p>` : ''}`;
    const chat = $('.chat', root), sug = $('.sug', root), form = $('form', root);
    const log = () => (db.s.chat[mode] = db.s.chat[mode] || []);
    const card = (e) => {
      const r = e.r; const el = mk(`<div class="msg"><div class="m-q">${esc(e.q)}</div><div class="m-a"><span class="m-ai">${icon('sparkles')}</span><div class="m-body">${CE.ai.toHtml(r)}<div class="detail" hidden></div><div class="m-act"><button class="chip" data-a="d">Batafsil tushuntirish</button><button class="chip" data-a="s">Slayd qilish</button><button class="chip" data-a="p">PDF</button><button class="chip" data-a="c">${icon('copy')}</button></div></div></div></div>`);
      el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
        if (a === 'd') { const d = $('.detail', el); if (d.hidden && !d.innerHTML) { const kb = CE.KB.filter((k) => k.k.some((w) => CE.norm(e.q).includes(CE.norm(w)))).slice(0, 2); d.innerHTML = `<p>${esc(r.detail || 'Hisoblash yuqoridagi bosqichlar bo\'yicha bajarildi. Har bir bosqichda birliklar mosligini tekshiring va natijaning kattalik tartibini baholang.')}</p>${kb.map((k) => `<p><b>${esc(k.t)}:</b> ${esc(k.a)}</p>`).join('')}`; } d.hidden = !d.hidden; }
        else if (a === 's') CE.present(CE.ai.toSlides(r), r.title); else if (a === 'p') CE.printHtml(CE.ai.toHtml(r), r.title); else if (a === 'c') CE.copy(CE.ai.toText(r)); });
      return el;
    };
    const draw = () => {
      chat.innerHTML = ''; let L = log();
      if (!L.length && mode === 'Kimyo') L = [{ q: SUG.Kimyo[0], r: CE.ai.ask(SUG.Kimyo[0], mode), demo: 1 }];
      if (!L.length) chat.innerHTML = `<div class="chat-empty">${icon('sparkles')}<p>${mode} bo'yicha savol bering yoki quyidagi namunalardan birini tanlang.</p></div>`;
      (full ? L.slice().reverse() : L.slice(0, 1)).forEach((e) => chat.appendChild(card(e)));
      sug.innerHTML = SUG[mode].slice(0, full ? 6 : 3).map((s) => `<button type="button" class="chip" data-s="${esc(s)}">${esc(s.length > 46 ? s.slice(0, 44) + '…' : s)}</button>`).join('') + (full && log().length ? `<button type="button" class="chip warn" data-clear>Tarixni tozalash</button>` : '');
      $$('[data-s]', sug).forEach((b) => b.onclick = () => { form.q.value = b.dataset.s; ask(); }); const c = $('[data-clear]', sug); if (c) c.onclick = () => { db.s.chat[mode] = []; db.save(); draw(); };
      if (full) chat.scrollTop = 0;
    };
    const ask = () => { const q = form.q.value.trim(); if (!q) return; const r = CE.ai.ask(q, mode); log().unshift({ q, r, t: Date.now() }); log().length = Math.min(log().length, 25); db.save(); form.q.value = ''; db.log('sparkles', 'blue', `AI yordamchi: ${r.title.slice(0, 40)}`); draw(); };
    form.addEventListener('submit', (e) => { e.preventDefault(); ask(); });
    CE.tabs(root, (t) => { mode = t; draw(); });
    draw(); root._ask = (q, m) => { if (m) { mode = m; $$('[data-tab]', root).forEach((b) => b.classList.toggle('on', b.dataset.tab === m)); } form.q.value = q; ask(); };
  };

  // ---------- Taqvim ----------
  CE.eventForm = (date, done) => CE.formModal({ title: 'Yangi tadbir', fields: [{ k: 'title', label: 'Nomi', req: 1, full: 1 }, { k: 'date', label: 'Sana', type: 'date', req: 1 }, { k: 'time', label: 'Vaqt', type: 'time', req: 1 }, { k: 'color', label: 'Rang', type: 'select', options: ['blue', 'amber', 'green', 'red'] }], values: { date, time: '10:00', color: 'blue' }, onSubmit: (d) => { db.s.events.push({ id: uid(), ...d }); db.save(); CE.bus.emit('events'); done && done(d.date); } });
  const WD = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  W.calendar = (root, opts = {}) => {
    const now = new Date(); let y = now.getFullYear(), mo = now.getMonth(), sel = CE.iso(now); const big = !!opts.big;
    root.innerHTML = head('calendar', 'Mening taqvimim', `<button class="icon-btn" data-add aria-label="Tadbir qo'shish">${icon('plus')}</button>`) + `<div class="cal-nav"><button class="icon-btn" data-p aria-label="Oldingi oy">${icon('left')}</button><b></b><button class="icon-btn" data-n aria-label="Keyingi oy">${icon('right')}</button></div><div class="cal-g"></div><ul class="ev-list"></ul>${big ? '' : `<a class="more" href="#/calendar">Barcha tadbirlar ${icon('arrow')}</a>`}`;
    const g = $('.cal-g', root), ev = $('.ev-list', root), title = $('.cal-nav b', root);
    const draw = () => {
      title.textContent = `${CE.MONTHS[mo]} ${y}`; const first = (new Date(y, mo, 1).getDay() + 6) % 7, days = new Date(y, mo + 1, 0).getDate(), prevDays = new Date(y, mo, 0).getDate(); const today = CE.iso(new Date());
      let h = WD.map((d) => `<span class="wd">${d}</span>`).join('');
      for (let i = 0; i < 42; i++) { let d, m2 = mo, y2 = y, out = false; if (i < first) { d = prevDays - first + i + 1; m2 = mo - 1; out = true; } else if (i - first >= days) { d = i - first - days + 1; m2 = mo + 1; out = true; } else d = i - first + 1; const dt = new Date(y2, m2, d); const s = CE.iso(dt); const has = db.s.events.some((e) => e.date === s);
        h += `<button type="button" class="day ${out ? 'out' : ''} ${s === today ? 'today' : ''} ${s === sel ? 'sel' : ''} ${has ? 'has' : ''}" data-d="${s}" aria-label="${CE.fmtDate(s)}">${d}</button>`; if (i >= first + days - 1 && (i + 1) % 7 === 0) break; }
      g.innerHTML = h; $$('[data-d]', g).forEach((b) => b.onclick = () => { sel = b.dataset.d; const d = new Date(sel); if (d.getMonth() !== mo) { mo = d.getMonth(); y = d.getFullYear(); } draw(); });
      const list = db.s.events.filter((e) => e.date === sel).sort((a, b) => a.time.localeCompare(b.time));
      ev.innerHTML = (list.length ? list : []).map((e) => `<li class="${e.color}"><time>${esc(e.time)}</time><span>${esc(e.title)}</span>${big ? `<button class="icon-btn sm" data-del="${e.id}" aria-label="O'chirish">${icon('trash')}</button>` : ''}</li>`).join('') || `<li class="empty-s">${CE.fmtDate(sel)} — tadbirlar yo'q</li>`;
      $$('[data-del]', ev).forEach((b) => b.onclick = () => { db.s.events = db.s.events.filter((e) => e.id !== b.dataset.del); db.save(); CE.bus.emit('events'); });
    };
    $('[data-p]', root).onclick = () => { mo--; if (mo < 0) { mo = 11; y--; } draw(); }; $('[data-n]', root).onclick = () => { mo++; if (mo > 11) { mo = 0; y++; } draw(); };
    $('[data-add]', root).onclick = () => CE.eventForm(sel, (d) => { sel = d; const dd = new Date(d); mo = dd.getMonth(); y = dd.getFullYear(); toast('Tadbir qo\'shildi'); });
    CE.bus.onView('events', draw); draw();
  };

  // ---------- Faoliyat, resurslar, profil ----------
  W.activity = (root) => { const draw = () => { root.innerHTML = head('refresh', "So'nggi faoliyat", '<a class="link-s" href="#/home" data-all>Barchasi</a>') + `<ul class="act-list">${db.s.activity.slice(0, 5).map((a) => `<li><span class="a-i ${a.c}">${icon(a.ico)}</span><div><b>${esc(a.text)}</b><small>${CE.ago(a.t)}</small></div></li>`).join('')}</ul>`; $('[data-all]', root).onclick = (e) => { e.preventDefault(); modal({ title: 'Barcha faoliyat', body: `<ul class="act-list">${db.s.activity.map((a) => `<li><span class="a-i ${a.c}">${icon(a.ico)}</span><div><b>${esc(a.text)}</b><small>${CE.ago(a.t)}</small></div></li>`).join('')}</ul>` }); }; }; CE.bus.onView('activity', draw); draw(); };
  W.resources = (root) => { const R = [['Kimyo darsliklari', 'https://openstax.org/subjects/science', 'book'], ['Ilmiy maqolalar bazasi', 'https://openalex.org/', 'doc'], ['Laboratoriya protokollari', 'https://www.jove.com/', 'flask'], ['Konferensiyalar', '#/conferences', 'slides'], ['Shablonlar', '#/templates', 'templates'], ['Grantlar', '#/projects', 'coin']]; root.innerHTML = head('star', 'Foydali resurslar') + `<ul class="res-list">${R.map(([n, u, i]) => `<li><a href="${u}" ${u[0] === '#' ? '' : 'target="_blank" rel="noopener"'}>${icon(i)}<span>${n}</span></a></li>`).join('')}</ul>`; };
  W.profile = (root) => { const draw = () => { const p = db.s.profile; const ini = p.name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); root.innerHTML = `<div class="prof"><div class="avatar xl">${esc(ini)}</div><div><b>${esc(p.name)}</b><span>${esc(p.role)}</span><small>${esc(p.org)}</small></div></div><div class="prof-stats"><a href="#/lessons"><b>${db.s.lessons.length}</b><span>Darslar</span></a><a href="#/projects"><b>${db.s.projects.length}</b><span>Loyihalar</span></a><a href="#/articles"><b>${db.s.articles.length}</b><span>Maqolalar</span></a></div>`; }; CE.bus.onView('lessons', draw); CE.bus.onView('articles', draw); CE.bus.onView('projects', draw); CE.bus.onView('profile', draw); draw(); };
  W.toolsStrip = (root) => { root.innerHTML = head('flask', 'Kimyo vositalari') + `<div class="tools-strip">${CE.TOOLS.slice(0, 12).map((t) => `<a href="#/tools/${t.id}" class="ts"><span>${icon(t.ico)}</span><b>${esc(t.name.replace(' kalkulyator', '').replace(' (PV=nRT)', ''))}</b></a>`).join('')}</div>`; };
})();
