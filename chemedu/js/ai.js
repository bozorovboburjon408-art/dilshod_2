/* ChemEdu — AI ilmiy yordamchi: lokal kimyoviy hisoblash va bilimlar motori (tarmoqsiz ishlaydi) */
(function () {
  const CE = (window.CE = window.CE || {});
  const f = (x, s) => CE.fmt(x, s || 4);
  const NUM = '(\\d+(?:[.,]\\d+)?(?:\\s?[eE][-+]?\\d+)?)';
  const toN = (s) => parseFloat(String(s).replace(',', '.'));
  const vol = (txt) => { const m = new RegExp(NUM + '\\s*(ml|mL|ML|millilitr|l|L|litr)\\b').exec(txt); if (!m) return null; const v = toN(m[1]); return /^m/i.test(m[2]) ? { L: v / 1000, v, u: 'mL' } : { L: v, v, u: 'L' }; };
  const molar = (txt) => { const m = new RegExp(NUM + '\\s*(M|mol\\/l|mol\\/L|molyar|molli)(?![a-zA-Z])').exec(txt); return m ? toN(m[1]) : null; };
  const massOf = (txt) => { const m = new RegExp(NUM + '\\s*(mg|kg|g|gramm|gr)\\b').exec(txt); if (!m) return null; const v = toN(m[1]); const u = m[2]; return { g: u === 'mg' ? v / 1000 : u === 'kg' ? v * 1000 : v, v, u }; };
  const SKIP = new Set(['M', 'L', 'I', 'A', 'K', 'C', 'S', 'N', 'O', 'H', 'P', 'B', 'U', 'V', 'W', 'F', 'Y']);
  function findFormula(txt, allowSingle) {
    const re = /([A-Z][a-z]?\d*|\([A-Za-z0-9]+\)\d*|\[[A-Za-z0-9()]+\]\d*)+(?:·\d*(?:[A-Z][a-z]?\d*|\([A-Za-z0-9]+\)\d*)+)?/g; let m;
    while ((m = re.exec(txt))) {
      const t = m[0]; if (t.length === 1 && !allowSingle && SKIP.has(t)) continue;
      if (/^(pH|pK|Ka|Kb|Kw)/.test(t) || /^[A-Z][a-z]{2,}/.test(t) && !/\d/.test(t) && !/^(Na|Cl)/.test(t)) { if (t.length > 2 && !/[A-Z].*[A-Z]/.test(t)) continue; }
      try { CE.parseFormula(t); return t; } catch (e) { /* keyingisi */ }
    }
    return null;
  }
  const sub = (t) => t.replace(/(?<=[A-Za-z)\]])\d+/g, (d) => d.split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''));
  const ACIDS = { HCl: 'S', HBr: 'S', HI: 'S', HNO3: 'S', HClO4: 'S', CH3COOH: 1.8e-5, HCOOH: 1.8e-4, HF: 6.8e-4, HCN: 6.2e-10, H2CO3: 4.3e-7, H3PO4: 7.5e-3, HNO2: 4.5e-4, H2SO4: 'S2' };
  const BASES = { NaOH: 1, KOH: 1, LiOH: 1, 'Ba(OH)2': 2, 'Ca(OH)2': 2, NH3: 1.8e-5, CH3NH2: 4.4e-4 };

  function solvePH(txt, c) {
    const key = (o) => Object.keys(o).find((k) => new RegExp('(^|[^A-Za-z0-9])' + k.replace(/[()]/g, '\\$&') + '($|[^A-Za-z0-9])').test(txt));
    const a = key(ACIDS), b = key(BASES);
    if (a) {
      const ka = ACIDS[a]; let ph, steps;
      if (ka === 'S' || ka === 'S2') { const cH = ka === 'S2' ? 2 * c : c; ph = CE.phStrong(cH, 'acid'); steps = [`${sub(a)} — kuchli kislota${ka === 'S2' ? " (ikkala proton to'liq ajraladi deb olindi)" : ''}`, `[H⁺] = ${ka === 'S2' ? '2·' : ''}C = ${f(cH)} mol/L`, `pH = −lg[H⁺] = −lg(${f(cH)}) = ${f(ph, 3)}`]; }
      else { const r = CE.phWeak(c, ka, 'acid'); ph = r.ph; steps = [`${sub(a)} — kuchsiz kislota, Ka = ${f(ka)}`, `Ka = x² / (C − x) → x = [H⁺] = ${f(Math.pow(10, -ph))} mol/L`, `pH = −lg x = ${f(ph, 3)}`, `Dissotsiatsiya darajasi α = ${f(r.alpha * 100, 3)} %`]; }
      return { title: `${sub(a)} eritmasining pH i`, steps, answer: `pH ≈ ${f(ph, 3)}  (C = ${f(c)} M, 25 °C)`, note: ph < 7 ? 'Eritma kislotali muhitga ega.' : '' };
    }
    if (b) {
      const k = BASES[b]; let ph, steps;
      if (k >= 1) { const oh = c * k; const pOH = -Math.log10(oh); ph = 14 - pOH; steps = [`${sub(b)} — kuchli asos`, `[OH⁻] = ${k > 1 ? k + '·' : ''}C = ${f(oh)} mol/L`, `pOH = −lg[OH⁻] = ${f(pOH, 3)}`, `pH = 14 − pOH = ${f(ph, 3)}`]; }
      else { const r = CE.phWeak(c, k, 'base'); ph = r.ph; steps = [`${sub(b)} — kuchsiz asos, Kb = ${f(k)}`, `[OH⁻] = √(Kb·C) ≈ ${f(Math.pow(10, -r.poh))} mol/L`, `pOH = ${f(r.poh, 3)}`, `pH = 14 − pOH = ${f(ph, 3)}`]; }
      return { title: `${sub(b)} eritmasining pH i`, steps, answer: `pH ≈ ${f(ph, 3)}  (C = ${f(c)} M, 25 °C)`, note: 'Eritma ishqoriy.' };
    }
    return null;
  }

  function respondCalc(q) {
    const t = q.replace(/\s+/g, ' ').trim(); const low = t.toLowerCase();
    // 1. tenglama balanslash
    if (/(->|→|=>|⟶)/.test(t)) {
      const eq = t.replace(/^[^A-Z(\[]*(?=[A-Z(\[])/, '').replace(/[.?!]\s*$/, '');
      try {
        const b = CE.balance(eq.replace(/\s*(?:balansla|tenglang|tenglashtir)\w*/i, ''));
        return { title: 'Reaksiya tenglamasini balanslash', steps: ['Har bir element uchun atomlar soni chiziqli tenglamalar tizimiga keltirildi.', 'Tizim kasr arifmetikasi bilan yechildi, eng kichik butun koeffitsientlar tanlandi.', `Atomlar balansi: ${b.table.map((r) => `${r.el}: ${r.left} = ${r.right}`).join(' · ')}`], answerHtml: b.html, answer: b.text, note: `Reaksiya turi: ${b.type}.` };
      } catch (e) { return { title: 'Tenglamani balanslab bo\'lmadi', steps: [], answer: e.message, note: "Formulalarni to'g'ri yozing, masalan: Fe + O2 -> Fe2O3" }; }
    }
    // 2. pH
    if (/\bph\b/i.test(t) || /pH/.test(t)) {
      const rev = /ph\s*(=|ga teng|bo'lgan|bolgan)?\s*(\d+(?:[.,]\d+)?)/i.exec(t);
      if (rev && /\[?h\+?\]?|konsentratsiya|vodorod/i.test(low) && !/hisobla.*ph/i.test(low)) { const p = toN(rev[2]); return { title: `pH = ${p} bo'lgan eritma`, steps: ['[H⁺] = 10^(−pH)', `[H⁺] = 10^(−${p}) = ${f(Math.pow(10, -p))} mol/L`, `[OH⁻] = 10^(−(14−pH)) = ${f(Math.pow(10, -(14 - p)))} mol/L`], answer: `[H⁺] = ${f(Math.pow(10, -p))} mol/L,  pOH = ${f(14 - p, 3)}`, note: p < 7 ? 'Kislotali muhit.' : p > 7 ? 'Ishqoriy muhit.' : 'Neytral muhit.' }; }
      const c = molar(t) ?? (new RegExp(NUM).exec(t) ? toN(new RegExp(NUM).exec(t)[1]) : null);
      if (c) { const r = solvePH(t, c); if (r) return r; }
    }
    // 3. suyultirish
    if (/suyult|dilut/.test(low)) {
      const Ms = [...t.matchAll(new RegExp(NUM + '\\s*M(?![a-zA-Z])', 'g'))].map((m) => toN(m[1])); const V = vol(t);
      if (Ms.length >= 2 && V) {
        const [C1, C2] = Ms[0] >= Ms[1] ? [Ms[0], Ms[1]] : [Ms[1], Ms[0]]; const V1 = (C2 * V.L) / C1;
        return { title: 'Eritmani suyultirish', steps: ['Formulasi: C₁·V₁ = C₂·V₂', `V₁ = C₂·V₂ / C₁ = ${f(C2)} × ${f(V.v)} ${V.u} / ${f(C1)}`, `V₁ = ${f(V1 * (V.u === 'mL' ? 1000 : 1))} ${V.u}`], answer: `${f(V1 * (V.u === 'mL' ? 1000 : 1), 4)} ${V.u} konsentrlangan eritma olib, ${V.v} ${V.u} gacha suv bilan suyultiring.`, note: "Kislotalarni suyultirishda doimo kislotani suvga sekin qo'shing." };
      }
    }
    // 4. eritma tayyorlash
    if (/tayyorla|kerak|necha gramm|qancha|massa/.test(low) && molar(t) && vol(t)) {
      const fm = findFormula(t.replace(/\b\d+(?:[.,]\d+)?\s*(ml|mL|M)\b/g, ''));
      if (fm) {
        const C = molar(t), V = vol(t), MM = CE.molarMass(fm), n = C * V.L, m = n * MM;
        return { title: `${C} M ${sub(fm)} eritmasi (${V.v} ${V.u})`, steps: ['Formulasi: n = C · V', `n = ${f(C)} mol/L × ${f(V.L)} L = ${f(n)} mol`, `M(${sub(fm)}) = ${f(MM, 5)} g/mol`, `m = n · M = ${f(n)} × ${f(MM, 5)} = ${f(m, 4)} g`], answer: `${f(m, 3)} g ${sub(fm)} kerak.`, note: `${sub(fm)} ni oz miqdordagi suvda eritib, ${V.v} ${V.u} li o'lchov kolbasida belgigacha suyultiring. Aniq tortish va xavfsizlik qoidalariga rioya qiling.`, detail: `Eritma tayyorlash tartibi: (1) hisoblangan massani analitik tarozida torting; (2) ${V.v} ${V.u} hajmli o'lchov kolbasiga voronka orqali o'tkazing; (3) distillangan suvning 1/2 hajmida to'liq eriting; (4) belgigacha suv qo'shib aralashtiring; (5) idishga yorliq yopishtiring (modda, konsentratsiya, sana, ism).`, slides: true };
      }
    }
    if (/(\d+(?:[.,]\d+)?)\s*(%|foiz)/.test(low) && /tayyorla|kerak|massa|necha gramm|qancha/.test(low) && massOf(t)) {
      const p = toN(/(\d+(?:[.,]\d+)?)\s*(%|foiz)/.exec(low)[1]), ms = massOf(t), fm = findFormula(t);
      const m = (p / 100) * ms.g; return { title: `${p} % li eritma (${ms.v} ${ms.u})`, steps: ['ω = m(modda) / m(eritma) · 100 %', `m(modda) = ${f(p)} % × ${f(ms.g)} g / 100 = ${f(m)} g`, `m(suv) = ${f(ms.g)} − ${f(m)} = ${f(ms.g - m)} g`], answer: `${f(m, 3)} g ${fm ? sub(fm) : 'modda'} va ${f(ms.g - m, 4)} g suv.`, note: '' };
    }
    // 5. molyar massa / mol <-> gramm
    const molM = /molyar massa|molekulyar massa|mr\b|massasi|massa|M\(|necha mol|necha gramm|mol soni/.test(low);
    const fm = molM ? findFormula(t, true) : null;
    if (fm && !molar(t)) {
      const comp = CE.composition(fm), MM = CE.molarMass(fm); const ms = massOf(t); const mol = new RegExp(NUM + '\\s*mol\\b').exec(low);
      if (mol && /necha gramm|massasi|massa/.test(low)) { const n = toN(mol[1]); return { title: `${n} mol ${sub(fm)} massasi`, steps: [`M(${sub(fm)}) = ${f(MM, 5)} g/mol`, 'm = n · M', `m = ${f(n)} × ${f(MM, 5)} = ${f(n * MM)} g`], answer: `${f(n * MM, 4)} g`, note: '' }; }
      if (ms && /necha mol|mol soni|modda miqdori/.test(low)) { return { title: `${ms.v} ${ms.u} ${sub(fm)} necha mol?`, steps: [`M(${sub(fm)}) = ${f(MM, 5)} g/mol`, 'n = m / M', `n = ${f(ms.g)} g / ${f(MM, 5)} g/mol = ${f(ms.g / MM)} mol`, `Zarralar soni N = n·Nₐ = ${f((ms.g / MM) * 6.02214e23)}`], answer: `${f(ms.g / MM, 4)} mol`, note: '' }; }
      return { title: `${sub(fm)} ning molyar massasi`, steps: comp.map((c) => `${c.sym}: ${c.n} × ${f(CE.BYSYM[c.sym].mass, 5)} = ${f(c.mass, 5)} g/mol  (${f(c.pct, 3)} %)`), answer: `M(${sub(fm)}) = ${f(MM, 5)} g/mol`, note: "Atom massalari IUPAC bo'yicha olingan." };
    }
    // 6. gaz hajmi
    if (/gaz|n\.?\s?sh|normal sharoit/.test(low) && /mol/.test(low) && /hajm|litr/.test(low)) {
      const mol = new RegExp(NUM + '\\s*mol\\b').exec(low); if (mol) { const n = toN(mol[1]); return { title: `${n} mol gaz hajmi (n.sh.)`, steps: ['Normal sharoitda 1 mol ideal gaz = 22,414 L', `V = n·Vm = ${f(n)} × 22,414 = ${f(n * 22.414)} L`], answer: `${f(n * 22.414, 4)} L`, note: "Standart sharoit (0 °C, 1 atm). 25 °C da Vm = 24,47 L/mol." }; }
    }
    // 7. element
    const el = CE.ELEMENTS.find((e) => new RegExp('(^|[^A-Za-z])' + e.name.replace(/'/g, "['ʻ’]") + '(\\w{0,4})?($|[^A-Za-z])', 'i').test(t)) || (/element/.test(low) ? CE.ELEMENTS.find((e) => new RegExp('\\b' + e.sym + '\\b').test(t)) : null);
    if (el) return { title: `${el.name} (${el.sym})`, steps: [`Atom raqami Z = ${el.z}`, `Atom massasi: ${f(el.mass, 5)}`, `Davr ${el.period}, kategoriya: ${CE.CATS[el.cat]}`, `Elektron konfiguratsiya: ${CE.electronConfig(el.z)}`, el.en ? `Elektromanfiylik (Pauling): ${el.en}` : 'Elektromanfiylik: ma\'lumot yo\'q'], answer: `${el.name} — ${el.sym}, Z = ${el.z}, Ar = ${f(el.mass, 5)}`, note: '', link: '#/chem-info' };
    return null;
  }

  function kbMatch(q) {
    const n = CE.norm(q); const scored = CE.KB.map((e) => ({ e, s: e.k.reduce((a, k) => a + (n.includes(CE.norm(k)) ? CE.norm(k).length : 0), 0) + (n.includes(CE.norm(e.t).slice(0, 8)) ? 3 : 0) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    return scored.slice(0, 2).map((x) => x.e);
  }
  const topicFrom = (q, words) => q.replace(new RegExp('(' + words.join('|') + ')', 'ig'), '').replace(/[?!.:]/g, '').trim();

  function modeEducation(q) {
    const topic = topicFrom(q, ['dars', 'rejasi', 'tuz', 'tayyorla', 'mavzusida', 'mavzu', 'uchun']) || q;
    const found = CE.FIELDS.flatMap((fl) => fl.topics.map((tp) => ({ fl, tp }))).find(({ tp }) => CE.norm(tp.t).includes(CE.norm(topic).slice(0, 7)) || CE.norm(topic).includes(CE.norm(tp.t).slice(0, 7)));
    const T = found ? found.tp.t : topic;
    return { title: `Dars rejasi: ${T}`, steps: ['0–5 daq: Motivatsiya — hayotiy misol yoki qiziqarli tajriba', `5–15 daq: Yangi mavzu — ${found ? found.tp.key[0] : 'asosiy tushunchalar'}`, `15–30 daq: Misollar va masalalar${found && found.tp.ex ? ` (masalan: ${found.tp.ex})` : ''}`, '30–40 daq: Guruh ishi yoki mini-tajriba', '40–45 daq: Xulosa, 3 savollik tezkor test, uy vazifasi'], answer: `«${T}» mavzusi uchun 45 daqiqalik dars rejasi tayyor.`, note: 'To\'liq slaydlar uchun «Slayd qilish» tugmasini bosing.', slides: true, topic: T };
  }
  function modeArticle(q) {
    const t = topicFrom(q, ['maqola', 'yozish', 'uchun', 'mavzusida', 'sarlavha', 'annotatsiya', 'tuzilma']) || q;
    return { title: `Maqola tuzilmasi: ${t}`, steps: [`Sarlavha varianti: «${t}: eksperimental tadqiqot va tahlil»`, 'Annotatsiya (150–250 so\'z): dolzarblik → maqsad → usul → asosiy natija (raqam bilan) → xulosa', 'Kirish: umumiy kontekst → o\'rganilmagan jihat → tadqiqot savoli', "Usullar: reaktivlar, uskunalar, parametrlar, statistik ishlov — takrorlash mumkin bo'lishi shart", 'Natijalar: jadval va rasmlar, har biri matnda izohlanadi', 'Muhokama: nima uchun shunday natija? Boshqa ishlar bilan solishtirish, cheklovlar', 'Xulosa: 3–4 tezis, kelajak yo\'nalishlari'], answer: 'IMRaD tuzilmasi taklif qilindi.', note: `Kalit so'zlar: ${t.split(/\s+/).slice(0, 3).join(', ')}, optimallashtirish, tavsiflash.` };
  }
  function modeThesis(q) {
    const t = topicFrom(q, ['dissertatsiya', 'reja', 'uchun', 'mavzusida', 'metodologiya']) || q;
    return { title: `Dissertatsiya yo'l xaritasi: ${t}`, steps: ['Kirish: dolzarblik, maqsad, vazifalar, ilmiy yangilik, amaliy ahamiyat', "I bob: adabiyotlar tahlili — kamida 40–60 manba, oxirgi 5 yildan 50 % dan ortiq", "II bob: usullar va materiallar — tajriba dizayni, kalibrlash, xatoliklar manbai", "III bob: natijalar va muhokama — gipotezalar bilan solishtirish", "IV bob: texnologik/amaliy qism va iqtisodiy samaradorlik", 'Xulosa va tavsiyalar; nashrlar ro\'yxati (kamida 3 maqola)'], answer: 'Bo\'limlar bo\'yicha reja tuzildi.', note: "Har bir bob oxirida qisqa xulosa yozing va ilmiy rahbar bilan oylik nazorat nuqtalarini belgilang." };
  }

  function ask(q, mode) {
    q = String(q || '').trim(); if (!q) return null;
    let r = respondCalc(q);
    if (!r) {
      const kb = kbMatch(q);
      if (kb.length) r = { title: kb[0].t, steps: [kb[0].a, ...(kb[1] ? ['Bog\'liq: ' + kb[1].t + ' — ' + kb[1].a] : [])], answer: kb[0].a, note: '' };
    }
    if (!r || (r && mode === 'Ta\'lim' && !r.steps.length)) {
      if (mode === "Ta'lim" && !r) r = modeEducation(q);
      else if (mode === 'Maqola' && !r) r = modeArticle(q);
      else if (mode === 'Dissertatsiya' && !r) r = modeThesis(q);
    } else if (mode === 'Maqola' && /maqola|annotatsiya|sarlavha/i.test(q)) r = modeArticle(q);
    else if (mode === 'Dissertatsiya' && /dissertatsiya|reja|metodolog/i.test(q)) r = modeThesis(q);
    else if (mode === "Ta'lim" && /dars|reja|slayd/i.test(q) && !/pH|->|→/.test(q)) r = modeEducation(q);
    if (!r) r = { title: 'Savolni aniqlashtiring', steps: ["Men quyidagilarni hisoblay olaman:", "• «0.1 M NaOH eritmasidan 500 ml tayyorlash uchun qancha NaOH kerak?»", "• «H2SO4 ning molyar massasi»", "• «0.01 M CH3COOH ning pH i»", "• «Fe + O2 -> Fe2O3 balanslang»", "• «2 M HCl dan 0.5 M li 250 ml tayyorlash uchun suyultirish»", "• «Titrlash nima?», «Le Shatelye prinsipi», «fosforit», «flotatsiya» kabi tushunchalar"], answer: '', note: 'Formulalarni lotin harflarida yozing (masalan, NaOH, CuSO4·5H2O).' };
    return r;
  }
  const toHtml = (r) => {
    const E = CE.esc;
    return `<div class="ans"><h4>${E(r.title)}</h4>${r.steps.length ? `<div class="ans-l">Yechim:</div><ul>${r.steps.map((s) => `<li>${/^[•]/.test(s) ? E(s.slice(1).trim()) : E(s)}</li>`).join('')}</ul>` : ''}${r.answer ? `<div class="ans-r"><b>Javob:</b> ${r.answerHtml || E(r.answer)}</div>` : ''}${r.note ? `<div class="ans-n"><b>Eslatma:</b> ${E(r.note)}</div>` : ''}</div>`;
  };
  const toText = (r) => `${r.title}\n\n${r.steps.map((s) => '• ' + s.replace(/^•\s*/, '')).join('\n')}\n\nJavob: ${r.answer}${r.note ? '\nEslatma: ' + r.note : ''}`;
  const toSlides = (r) => [{ t: r.title, b: [], kind: 'title' }, { t: 'Masala va yechim', b: r.steps.slice(0, 8) }, { t: 'Javob', b: [r.answer, r.note].filter(Boolean), kind: 'answer' }];

  CE.ai = { ask, toHtml, toText, toSlides };
})();
