/* ChemEdu — dars/slayd generatori va taqdimot rejimi */
(function () {
  const CE = (window.CE = window.CE || {});
  const { esc, icon, mk } = CE;

  function makeLesson({ fieldId, topic, level = "O'rta", minutes = 45 }) {
    const field = CE.FIELDS.find((x) => x.id === fieldId) || CE.FIELDS[0];
    const tp = field.topics.find((x) => x.t === topic);
    const T = tp ? tp.t : topic;
    const key = tp ? tp.key : ['Mavzuning asosiy ta\'rifi va tarixiy ahamiyati', 'Asosiy qonuniyatlar va formulalar', 'Amaliy qo\'llanilish sohalari', 'Tajribada kuzatiladigan hodisalar'];
    const quiz = CE.TESTS.filter((q) => q.f === field.id).sort(() => 0.5 - Math.random()).slice(0, 2);
    const lvlNote = level === "Boshlang'ich" ? 'Har bir tushunchani kundalik hayotdan misol bilan bog\'lang.' : level === "Ilg'or" ? 'Matematik asoslash va tadqiqot misollarini qo\'shing.' : 'Nazariya va masalalar muvozanatini saqlang.';
    const S = [];
    S.push({ kind: 'title', t: T, b: [`${field.name} · ${level} daraja`, `Davomiyligi: ${minutes} daqiqa`] });
    S.push({ t: "O'quv maqsadlari", b: [`Eslab qoladi: «${T}» bo'yicha asosiy tushunchalarni`, 'Tushuntiradi: hodisalarning sabablarini va qonuniyatlarini', `Qo'llaydi: ${tp && tp.formula ? tp.formula + ' bilan' : 'formulalar bilan'} masalalar yechishda`, level === "Ilg'or" ? 'Tahlil qiladi: tajriba ma\'lumotlarini baholaydi' : 'Baholaydi: natijalarning mantiqiyligini'] });
    S.push({ t: 'Motivatsiya', b: [`Savol: «${T}» kundalik hayotda yoki sanoatda qayerda uchraydi?`, tp && tp.ex ? `Misol: ${tp.ex}` : 'Qisqa demonstratsiya yoki video lavha', 'Guruhda 2 daqiqa muhokama qiling'] });
    for (let i = 0; i < key.length; i += 2) S.push({ t: i === 0 ? 'Asosiy tushunchalar' : `Asosiy tushunchalar (${i / 2 + 1})`, b: key.slice(i, i + 2) });
    if (tp && tp.formula) S.push({ kind: 'formula', t: 'Asosiy formula', b: [tp.formula], x: tp.ex });
    if (tp && tp.ex) S.push({ t: 'Yechilgan misol', b: [tp.ex, 'Bosqichma-bosqich yechimni doskada ko\'rsating', 'Birliklarni tekshirishni unutmang'] });
    if (minutes >= 60) S.push({ t: 'Kengaytirilgan masalalar', b: ['1-masala: standart (hisoblash)', '2-masala: tahlil (grafik/jadval)', level === "Ilg'or" ? '3-masala: tadqiqot ma\'lumotlari asosida' : '3-masala: hayotiy vaziyat'] });
    if (minutes >= 90) S.push({ t: 'Laboratoriya demonstratsiyasi', b: ['Xavfsizlik qoidalari', 'Reaktivlar va asboblar', 'Natijalarni jadvalga yozish'] });
    S.push({ t: 'Guruh faoliyati', b: ["3–4 kishilik guruhlar", `Vazifa: «${T}» bo'yicha mini-loyiha yoki masala`, '8–10 daqiqa, so\'ng 1 daqiqalik taqdimot'] });
    quiz.forEach((q, i) => S.push({ kind: 'quiz', t: `Tezkor test ${i + 1}`, b: [q.q, ...q.o.map((o, k) => `${'ABCD'[k]}) ${o}`)], x: `Javob: ${'ABCD'[q.a]} — ${q.e}` }));
    S.push({ t: 'Xulosa', b: key.slice(0, 3).map((k) => k), x: lvlNote });
    S.push({ t: 'Uy vazifasi', b: ['Konspektni to\'ldiring', 'Darslikdan 5 ta masala yeching', `«${T}» bo'yicha bitta qisqa savol tuzing`] });
    S.push({ t: 'Foydalanilgan manbalar', b: ['Asosiy darslik (o\'quv dasturi bo\'yicha)', 'IUPAC Gold Book — goldbook.iupac.org', 'PubChem — pubchem.ncbi.nlm.nih.gov'] });
    return { title: T, fieldId: field.id, level, minutes, slides: S };
  }

  function slideHtml(s, i, n) {
    const bul = s.b.filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join('');
    if (s.kind === 'title') return `<div class="sl sl-title"><div class="sl-badge">ChemEdu</div><h1>${esc(s.t)}</h1>${s.b.map((b) => `<p>${esc(b)}</p>`).join('')}</div>`;
    if (s.kind === 'formula') return `<div class="sl"><h2>${esc(s.t)}</h2><div class="sl-formula">${esc(s.b[0])}</div>${s.x ? `<p class="sl-note">${esc(s.x)}</p>` : ''}</div>`;
    if (s.kind === 'answer') return `<div class="sl"><h2>${esc(s.t)}</h2><div class="sl-formula">${esc(s.b[0] || '')}</div>${s.b[1] ? `<p class="sl-note">${esc(s.b[1])}</p>` : ''}</div>`;
    if (s.kind === 'quiz') return `<div class="sl"><h2>${esc(s.t)}</h2><p class="sl-q">${esc(s.b[0])}</p><ul class="sl-opts">${s.b.slice(1).map((b) => `<li>${esc(b)}</li>`).join('')}</ul><p class="sl-note">${esc(s.x)}</p></div>`;
    return `<div class="sl"><h2>${esc(s.t)}</h2><ul>${bul}</ul>${s.x ? `<p class="sl-note">${esc(s.x)}</p>` : ''}</div>`;
  }

  function present(slides, title) {
    let i = 0; const n = slides.length;
    const el = mk(`<div class="deck" role="dialog" aria-modal="true" aria-label="Taqdimot"><div class="deck-top"><span>${esc(title)}</span><div><button class="icon-btn" data-a="dl" title="HTML yuklab olish">${icon('download')}</button><button class="icon-btn" data-a="pr" title="PDF / chop etish">${icon('print')}</button><button class="icon-btn" data-a="fs" title="To'liq ekran">${icon('expand')}</button><button class="icon-btn" data-a="x" title="Yopish (Esc)">${icon('x')}</button></div></div><div class="deck-stage"><button class="deck-nav l" data-a="p" aria-label="Oldingi">${icon('left')}</button><div class="deck-slide"></div><button class="deck-nav r" data-a="n" aria-label="Keyingi">${icon('right')}</button></div><div class="deck-bar"><i></i></div><div class="deck-count"></div></div>`);
    const stage = CE.$('.deck-slide', el);
    const show = () => { stage.innerHTML = slideHtml(slides[i], i, n); CE.$('.deck-bar i', el).style.width = ((i + 1) / n) * 100 + '%'; CE.$('.deck-count', el).textContent = `${i + 1} / ${n}`; };
    const go = (d) => { i = Math.min(n - 1, Math.max(0, i + d)); show(); };
    const close = () => { document.removeEventListener('keydown', key); if (document.fullscreenElement) document.exitFullscreen(); el.remove(); };
    const key = (e) => { if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(-1); else if (e.key === 'Escape') close(); else if (e.key === 'f' || e.key === 'F') el.requestFullscreen && el.requestFullscreen(); else if (e.key === 'Home') { i = 0; show(); } else if (e.key === 'End') { i = n - 1; show(); } };
    el.addEventListener('click', (e) => { const a = e.target.closest('[data-a]'); if (!a) return; const k = a.dataset.a; if (k === 'n') go(1); else if (k === 'p') go(-1); else if (k === 'x') close(); else if (k === 'fs') (document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen && el.requestFullscreen()); else if (k === 'dl') CE.download(`${title.replace(/[^\wЀ-ӿ]+/g, '_')}.html`, deckHtml(slides, title), 'text/html'); else if (k === 'pr') printDeck(slides, title); });
    let tx = null; stage.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true }); stage.addEventListener('touchend', (e) => { if (tx === null) return; const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 40) go(d < 0 ? 1 : -1); tx = null; });
    document.addEventListener('keydown', key); document.body.appendChild(el); show(); CE.$('[data-a=n]', el).focus();
  }
  const DECK_CSS = `*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0b1530;color:#fff}.sl{width:100vw;height:100vh;padding:7vw 8vw;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(135deg,#0b1530,#16306b);page-break-after:always;position:relative}.sl h1{font-size:5vw;margin:0 0 2vw}.sl h2{font-size:3.2vw;margin:0 0 2.5vw;color:#8fb3ff}.sl li{font-size:2.1vw;margin:1.1vw 0;line-height:1.35}.sl p{font-size:2vw;color:#c9d6f5}.sl-formula{font-size:3.4vw;font-weight:700;background:#ffffff14;border-radius:16px;padding:3vw;text-align:center;margin:1vw 0}.sl-note{color:#8fb3ff!important;font-size:1.6vw!important}.sl-badge{position:absolute;top:3vw;left:8vw;font-weight:700;letter-spacing:.1em;color:#6ea1ff}.sl-opts{list-style:none;padding:0}@media print{.sl{height:100vh}}`;
  function deckHtml(slides, title) { return `<!doctype html><html lang="uz"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${DECK_CSS}</style></head><body>${slides.map((s, i) => slideHtml(s, i, slides.length)).join('')}</body></html>`; }
  function printDeck(slides, title) {
    const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0'; document.body.appendChild(fr);
    fr.srcdoc = deckHtml(slides, title); fr.onload = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { CE.toast('Chop etish ochilmadi', 'err'); } setTimeout(() => fr.remove(), 4000); };
  }
  CE.makeLesson = makeLesson; CE.deckHtml = deckHtml; CE.present = present; CE.printHtml = (html, title) => { const fr = document.createElement('iframe'); fr.style.cssText = 'position:fixed;width:0;height:0;border:0'; document.body.appendChild(fr); fr.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Inter,system-ui,sans-serif;padding:32px;color:#111;line-height:1.55}h4{font-size:20px}sub{font-size:.75em}.ans-r{background:#eef4ff;padding:10px 14px;border-radius:8px;margin:12px 0}</style></head><body>${html}<p style="color:#888;font-size:12px;margin-top:30px">ChemEdu Research — ${new Date().toLocaleDateString()}</p></body></html>`; fr.onload = () => { fr.contentWindow.focus(); fr.contentWindow.print(); setTimeout(() => fr.remove(), 4000); }; };
})();
