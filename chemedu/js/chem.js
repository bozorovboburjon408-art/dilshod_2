/* ChemEdu — kimyoviy hisoblash yadrosi: elementlar, formula tahlili, tenglama balanslash, kalkulyatorlar */
(function () {
  const CE = (window.CE = window.CE || {});

  const RAW = `H Vodorod 1.008;He Geliy 4.0026;Li Litiy 6.94;Be Berilliy 9.0122;B Bor 10.81;C Uglerod 12.011;N Azot 14.007;O Kislorod 15.999;F Ftor 18.998;Ne Neon 20.180;
Na Natriy 22.990;Mg Magniy 24.305;Al Alyuminiy 26.982;Si Kremniy 28.085;P Fosfor 30.974;S Oltingugurt 32.06;Cl Xlor 35.45;Ar Argon 39.948;K Kaliy 39.098;Ca Kalsiy 40.078;
Sc Skandiy 44.956;Ti Titan 47.867;V Vanadiy 50.942;Cr Xrom 51.996;Mn Marganets 54.938;Fe Temir 55.845;Co Kobalt 58.933;Ni Nikel 58.693;Cu Mis 63.546;Zn Rux 65.38;
Ga Galliy 69.723;Ge Germaniy 72.630;As Margimush 74.922;Se Selen 78.971;Br Brom 79.904;Kr Kripton 83.798;Rb Rubidiy 85.468;Sr Stronsiy 87.62;Y Itriy 88.906;Zr Sirkoniy 91.224;
Nb Niobiy 92.906;Mo Molibden 95.95;Tc Texnetsiy 98;Ru Ruteniy 101.07;Rh Rodiy 102.91;Pd Palladiy 106.42;Ag Kumush 107.87;Cd Kadmiy 112.41;In Indiy 114.82;Sn Qalay 118.71;
Sb Surma 121.76;Te Tellur 127.60;I Yod 126.90;Xe Ksenon 131.29;Cs Seziy 132.91;Ba Bariy 137.33;La Lantan 138.91;Ce Seriy 140.12;Pr Prazeodim 140.91;Nd Neodim 144.24;
Pm Prometiy 145;Sm Samariy 150.36;Eu Yevropiy 151.96;Gd Gadoliniy 157.25;Tb Terbiy 158.93;Dy Disprozyiy 162.50;Ho Golmiy 164.93;Er Erbiy 167.26;Tm Tuliy 168.93;Yb Itterbiy 173.05;
Lu Lutetsiy 174.97;Hf Gafniy 178.49;Ta Tantal 180.95;W Volfram 183.84;Re Reniy 186.21;Os Osmiy 190.23;Ir Iridiy 192.22;Pt Platina 195.08;Au Oltin 196.97;Hg Simob 200.59;
Tl Talliy 204.38;Pb Qo'rg'oshin 207.2;Bi Vismut 208.98;Po Poloniy 209;At Astat 210;Rn Radon 222;Fr Fransiy 223;Ra Radiy 226;Ac Aktiniy 227;Th Toriy 232.04;
Pa Protaktiniy 231.04;U Uran 238.03;Np Neptuniy 237;Pu Plutoniy 244;Am Americiy 243;Cm Kuriy 247;Bk Berkliy 247;Cf Kaliforniy 251;Es Eynshteyniy 252;Fm Fermiy 257;
Md Mendeleviy 258;No Nobeliy 259;Lr Lourensiy 266;Rf Rezerfordiy 267;Db Dubniy 268;Sg Siborgiy 269;Bh Boriy 270;Hs Xassiy 277;Mt Meytneriy 278;Ds Darmshtadtiy 281;
Rg Rentgeniy 282;Cn Kopernitsiy 285;Nh Nixoniy 286;Fl Flerovyiy 289;Mc Moskoviy 290;Lv Livermoriy 293;Ts Tennessin 294;Og Oganesson 294`;

  const EN = { H: 2.2, Li: .98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: .93, Mg: 1.31, Al: 1.61, Si: 1.9, P: 2.19, S: 2.58, Cl: 3.16, K: .82, Ca: 1, Sc: 1.36, Ti: 1.54, V: 1.63, Cr: 1.66, Mn: 1.55, Fe: 1.83, Co: 1.88, Ni: 1.91, Cu: 1.9, Zn: 1.65, Ga: 1.81, Ge: 2.01, As: 2.18, Se: 2.55, Br: 2.96, Kr: 3, Rb: .82, Sr: .95, Y: 1.22, Zr: 1.33, Nb: 1.6, Mo: 2.16, Ru: 2.2, Rh: 2.28, Pd: 2.2, Ag: 1.93, Cd: 1.69, In: 1.78, Sn: 1.96, Sb: 2.05, Te: 2.1, I: 2.66, Xe: 2.6, Cs: .79, Ba: .89, Au: 2.54, Hg: 2, Pb: 2.33, Bi: 2.02 };

  const CATS = {
    alkali: "Ishqoriy metall", alkaline: "Ishqoriy-yer metall", transition: "O'tish metali", post: "O'tishdan keyingi metall",
    metalloid: "Yarim metall", nonmetal: "Metallmas", halogen: "Galogen", noble: "Inert gaz", lan: "Lantanoid", act: "Aktinoid"
  };
  const catOf = (z) => {
    if ([3, 11, 19, 37, 55, 87].includes(z)) return 'alkali';
    if ([4, 12, 20, 38, 56, 88].includes(z)) return 'alkaline';
    if ([9, 17, 35, 53, 85, 117].includes(z)) return 'halogen';
    if ([2, 10, 18, 36, 54, 86, 118].includes(z)) return 'noble';
    if (z >= 57 && z <= 71) return 'lan';
    if (z >= 89 && z <= 103) return 'act';
    if ([5, 14, 32, 33, 51, 52].includes(z)) return 'metalloid';
    if ([1, 6, 7, 8, 15, 16, 34].includes(z)) return 'nonmetal';
    if ([13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116].includes(z)) return 'post';
    return 'transition';
  };
  const pos = (z) => {
    if (z === 1) return [1, 1]; if (z === 2) return [1, 18];
    if (z <= 4) return [2, z - 2]; if (z <= 10) return [2, z + 6];
    if (z <= 12) return [3, z - 10]; if (z <= 18) return [3, z - 2];
    if (z <= 36) return [4, z - 18]; if (z <= 54) return [5, z - 36];
    if (z <= 56) return [6, z - 54];
    if (z <= 71) return [8, z - 54];
    if (z <= 86) return [6, z - 68];
    if (z <= 88) return [7, z - 86];
    if (z <= 103) return [9, z - 86];
    return [7, z - 100];
  };
  const ELEMENTS = RAW.replace(/\n/g, '').split(';').map((s, i) => {
    const [sym, name, mass] = s.trim().split(' ');
    const z = i + 1, [row, col] = pos(z);
    return { z, sym, name, mass: parseFloat(mass), cat: catOf(z), row, col, en: EN[sym] || null, period: z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : z <= 36 ? 4 : z <= 54 ? 5 : z <= 86 ? 6 : 7 };
  });
  const BYSYM = Object.fromEntries(ELEMENTS.map((e) => [e.sym, e]));

  // Elektron konfiguratsiya (Madelung + ma'lum istisnolar)
  const EXC = { 24: '[Ar] 3d5 4s1', 29: '[Ar] 3d10 4s1', 41: '[Kr] 4d4 5s1', 42: '[Kr] 4d5 5s1', 44: '[Kr] 4d7 5s1', 45: '[Kr] 4d8 5s1', 46: '[Kr] 4d10', 47: '[Kr] 4d10 5s1', 57: '[Xe] 5d1 6s2', 58: '[Xe] 4f1 5d1 6s2', 64: '[Xe] 4f7 5d1 6s2', 78: '[Xe] 4f14 5d9 6s1', 79: '[Xe] 4f14 5d10 6s1', 89: '[Rn] 6d1 7s2', 90: '[Rn] 6d2 7s2', 91: '[Rn] 5f2 6d1 7s2', 92: '[Rn] 5f3 6d1 7s2', 93: '[Rn] 5f4 6d1 7s2', 96: '[Rn] 5f7 6d1 7s2' };
  function electronConfig(z) {
    if (EXC[z]) return EXC[z];
    const order = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p', '5s', '4d', '5p', '6s', '4f', '5d', '6p', '7s', '5f', '6d', '7p'];
    const cap = { s: 2, p: 6, d: 10, f: 14 };
    let left = z; const parts = [];
    for (const o of order) { if (left <= 0) break; const n = Math.min(cap[o[1]], left); parts.push(o + n); left -= n; }
    const cores = [[86, '[Rn]'], [54, '[Xe]'], [36, '[Kr]'], [18, '[Ar]'], [10, '[Ne]'], [2, '[He]']];
    for (const [cz, label] of cores) {
      if (z > cz) {
        let acc = 0, k = 0;
        for (; k < order.length && acc < cz; k++) acc += cap[order[k][1]];
        if (acc === cz) return label + ' ' + sortShells(parts.slice(k)).join(' ');
      }
    }
    return sortShells(parts).join(' ');
  }
  function sortShells(parts) {
    const lo = { s: 0, p: 1, d: 2, f: 3 };
    return parts.slice().sort((a, b) => (+a[0] - +b[0]) || (lo[a[1]] - lo[b[1]]));
  }

  // ---------- Formula tahlili ----------
  function parseGroup(s) {
    const stack = [{}]; let i = 0;
    const num = () => { let j = i; while (j < s.length && /\d/.test(s[j])) j++; const n = j > i ? parseInt(s.slice(i, j), 10) : 1; i = j; return n; };
    const add = (t, k, n) => { t[k] = (t[k] || 0) + n; };
    while (i < s.length) {
      const c = s[i];
      if (c === '(' || c === '[') { stack.push({}); i++; }
      else if (c === ')' || c === ']') {
        if (stack.length < 2) throw new Error("Qavslar muvozanatsiz: " + s);
        i++; const n = num(); const g = stack.pop(); const top = stack[stack.length - 1];
        for (const k in g) add(top, k, g[k] * n);
      } else if (/[A-Z]/.test(c)) {
        let sym = c;
        if (/[a-z]/.test(s[i + 1] || '') && BYSYM[c + s[i + 1]]) sym = c + s[i + 1];
        if (!BYSYM[sym]) throw new Error("Noma'lum element: " + sym);
        i += sym.length; add(stack[stack.length - 1], sym, num());
      } else throw new Error(`Formulada noto'g'ri belgi: "${c}"`);
    }
    if (stack.length !== 1) throw new Error("Qavslar muvozanatsiz: " + s);
    return stack[0];
  }
  function parseFormula(f) {
    f = String(f).trim().replace(/\s+/g, '').replace(/[*•.∙]/g, '·').replace(/[⁺⁻^+\-]\d*[+-]?$/, '');
    if (!f) throw new Error("Formula bo'sh");
    // pastki indekslarni oddiy raqamga aylantirish
    f = f.replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 8320));
    const total = {};
    for (const part of f.split('·')) {
      const m = /^(\d+)?(.+)$/.exec(part); if (!m) throw new Error("Formula noto'g'ri");
      const mult = m[1] ? parseInt(m[1], 10) : 1;
      const g = parseGroup(m[2]);
      for (const k in g) total[k] = (total[k] || 0) + g[k] * mult;
    }
    return total;
  }
  const molarMass = (f) => { const c = typeof f === 'string' ? parseFormula(f) : f; let m = 0; for (const k in c) m += BYSYM[k].mass * c[k]; return m; };
  function hill(comp) {
    const keys = Object.keys(comp); const sub = (k) => k + (comp[k] > 1 ? comp[k] : '');
    if (comp.C) { const rest = keys.filter((k) => k !== 'C' && k !== 'H').sort(); return [sub('C'), comp.H ? sub('H') : null, ...rest.map(sub)].filter(Boolean).join(''); }
    return keys.sort().map(sub).join('');
  }
  const prettyFormula = (f) => String(f).replace(/(\d+)/g, (m, d, off, str) => (off > 0 && /[A-Za-z)\]]/.test(str[off - 1]) ? `<sub>${m}</sub>` : m)).replace(/·/g, '·');
  function composition(f) {
    const c = parseFormula(f), M = molarMass(c);
    return Object.keys(c).map((k) => ({ sym: k, n: c[k], mass: BYSYM[k].mass * c[k], pct: (BYSYM[k].mass * c[k]) / M * 100 })).sort((a, b) => b.pct - a.pct);
  }

  // ---------- Kasr arifmetikasi va balanslash ----------
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
  const fadd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
  const fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
  const fdiv = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  const fneg = (a) => [-a[0], a[1]];

  function splitEquation(eq) {
    const m = String(eq).split(/\s*(?:-+>|=+>|→|⟶|⇒|<=>|⇌|=)\s*/);
    if (m.length !== 2 || !m[0].trim() || !m[1].trim()) throw new Error("Tenglama «reaktivlar → mahsulotlar» ko'rinishida bo'lishi kerak");
    const side = (s) => s.split(/\s+\+\s+|\s*\+\s*(?=[A-Z(\d])/).map((x) => x.trim().replace(/^\d+\s*(?=[A-Z(\[])/, '')).filter(Boolean);
    return [side(m[0]), side(m[1])];
  }
  function balance(eq) {
    const [L, R] = splitEquation(eq);
    const species = [...L, ...R]; const comps = species.map(parseFormula);
    const els = [...new Set(comps.flatMap((c) => Object.keys(c)))];
    const rc = new Set(L.flatMap((s) => Object.keys(parseFormula(s)))), pc = new Set(R.flatMap((s) => Object.keys(parseFormula(s))));
    for (const e of els) if (!rc.has(e) || !pc.has(e)) throw new Error(`«${e}» elementi tenglamaning ikkala tomonida ham bo'lishi kerak`);
    const n = species.length;
    let M = els.map((e) => comps.map((c, j) => fr((c[e] || 0) * (j < L.length ? 1 : -1))));
    // Gauss-Jordan
    const piv = []; let r = 0;
    for (let c = 0; c < n && r < M.length; c++) {
      let p = -1; for (let i = r; i < M.length; i++) if (M[i][c][0] !== 0) { p = i; break; }
      if (p < 0) continue;
      [M[r], M[p]] = [M[p], M[r]];
      const pv = M[r][c]; M[r] = M[r].map((x) => fdiv(x, pv));
      for (let i = 0; i < M.length; i++) if (i !== r && M[i][c][0] !== 0) { const f = M[i][c]; M[i] = M[i].map((x, k) => fadd(x, fneg(fmul(f, M[r][k])))); }
      piv.push(c); r++;
    }
    const free = [...Array(n).keys()].filter((c) => !piv.includes(c));
    if (!free.length) throw new Error("Bu tenglamani balanslab bo'lmaydi (faqat nol yechim)");
    const solve = (fv) => {
      const x = Array(n).fill(null).map(() => [0, 1]);
      free.forEach((c, i) => { x[c] = fr(fv[i]); });
      piv.forEach((c, i) => { let s = [0, 1]; free.forEach((fc) => { s = fadd(s, fmul(M[i][fc], x[fc])); }); x[c] = fneg(s); });
      return x;
    };
    const finish = (x) => {
      let l = 1; x.forEach((f) => { l = (l * f[1]) / gcd(l, f[1]); });
      let ints = x.map((f) => (f[0] * l) / f[1]); const g = ints.reduce((a, b) => gcd(a, b), 0) || 1;
      return ints.map((v) => v / g);
    };
    let best = null;
    const tryFv = (fv) => { const s = solve(fv); const ints = finish(s); if (ints.every((v) => v > 0)) { const sum = ints.reduce((a, b) => a + b, 0); if (!best || sum < best.sum) best = { ints, sum }; } };
    if (free.length === 1) tryFv([1]);
    else {
      const lim = free.length === 2 ? 8 : 4; const rec = (i, cur) => { if (i === free.length) return tryFv(cur); for (let v = 1; v <= lim; v++) rec(i + 1, [...cur, v]); }; rec(0, []);
    }
    if (!best) throw new Error("Musbat butun koeffitsientlar topilmadi — tenglama noto'g'ri bo'lishi mumkin");
    const co = best.ints;
    const fmtSide = (arr, off) => arr.map((s, i) => (co[off + i] > 1 ? co[off + i] : '') + s).join(' + ');
    const text = `${fmtSide(L, 0)} → ${fmtSide(R, L.length)}`;
    const html = (arr, off) => arr.map((s, i) => (co[off + i] > 1 ? co[off + i] : '') + prettyFormula(s)).join(' + ');
    const htmlText = `${html(L, 0)} → ${html(R, L.length)}`;
    const table = els.map((e) => ({
      el: e,
      left: L.reduce((a, s, i) => a + (comps[i][e] || 0) * co[i], 0),
      right: R.reduce((a, s, i) => a + (comps[L.length + i][e] || 0) * co[L.length + i], 0)
    }));
    return { reactants: L, products: R, coefficients: co, text, html: htmlText, table, type: classify(L, R), multiple: free.length > 1 };
  }
  function classify(L, R) {
    const isElem = (s) => { try { return Object.keys(parseFormula(s)).length === 1 && !/^[A-Z][a-z]?\d*$/.test('') && Object.keys(parseFormula(s))[0] === s.replace(/\d+$/, ''); } catch { return false; } };
    const has = (arr, f) => arr.some((s) => f(s));
    const acid = (s) => /^H(?!\d*O$|\d*O\d*$)/.test(s) && !/^H2O2?$/.test(s) && s !== 'H2' && /^H\d*[A-Z(]/.test(s) && !/OH$/.test(s);
    const base = (s) => /OH\)?\d*$/.test(s) || s === 'NH3';
    const carbonate = (s) => /CO3/.test(s);
    if (L.includes('O2') && has(R, (s) => s === 'CO2' || s === 'H2O' || s === 'SO2') && has(L, (s) => /C/.test(s) && s !== 'CO2' || /^H2$|^S/.test(s))) return "Yonish (oksidlanish)";
    if (L.includes('O2') && R.length === 1) return "Birikish (oksidlanish)";
    if (has(L, acid) && has(L, carbonate)) return "Kislota + karbonat (almashinish)";
    if (has(L, acid) && has(L, base) && R.includes('H2O')) return "Neytrallanish (almashinish)";
    if (R.length === 1 && L.length >= 2) return "Birikish (sintez)";
    if (L.length === 1 && R.length >= 2) return "Parchalanish (degradatsiya)";
    if (L.length === 2 && R.length === 2) {
      const e1 = isElem(L[0]), e2 = isElem(L[1]);
      if (e1 !== e2) return "Almashinish (o'rin olish)";
      if (!e1 && !e2) return "Ion almashinish (almashinish)";
    }
    return "Kimyoviy reaksiya";
  }

  // ---------- Kalkulyatorlar ----------
  const R_GAS = 0.082057; // L·atm/(mol·K)
  const WATER_MM = 18.015;
  function phStrong(c, kind) { // c: mol/L
    const kw = 1e-14; let h;
    if (kind === 'acid') h = (c + Math.sqrt(c * c + 4 * kw)) / 2; else { const oh = (c + Math.sqrt(c * c + 4 * kw)) / 2; h = kw / oh; }
    return -Math.log10(h);
  }
  function phWeak(c, k, kind) {
    const x = (-k + Math.sqrt(k * k + 4 * k * c)) / 2; const kw = 1e-14;
    if (kind === 'acid') return { ph: -Math.log10(x + 0 || 1e-14), alpha: x / c };
    return { ph: 14 + Math.log10(x), alpha: x / c, poh: -Math.log10(x) };
  }
  // Titrlash egri chizig'i: analit (kuchli/kuchsiz, kislota/asos) titrant (kuchli) bilan
  function titrationCurve({ analyteKind, strong, c, v, ct, k, points = 80 }) {
    const kw = 1e-14, veq = (c * v) / ct, vmax = veq * 2, data = [];
    const solve = (f) => { let lo = -14, hi = 1; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (f(Math.pow(10, mid)) > 0) hi = mid; else lo = mid; } return -((lo + hi) / 2); };
    for (let i = 0; i <= points; i++) {
      const vt = (vmax * i) / points, vt_tot = v + vt, ca = (c * v) / vt_tot, cb = (ct * vt) / vt_tot; let ph;
      if (analyteKind === 'acid') {
        // analit HA, titrant NaOH: [H]+[Na]=[OH]+[A]
        ph = solve((h) => { const A = strong ? ca : (ca * k) / (k + h); return h + cb - kw / h - A; });
      } else {
        // analit B (OH-), titrant HCl: [H]+[BH]=[OH]+[Cl]
        ph = solve((h) => { const BH = strong ? ca : (ca * h) / (k + h); return h + BH - kw / h - cb; });
      }
      data.push([vt, ph]);
    }
    let phEq;
    if (strong) phEq = 7; else phEq = analyteKind === 'acid' ? 14 - (0.5 * (-Math.log10(kw / k) + -Math.log10((c * v) / (v + veq)))) : 0.5 * (-Math.log10(k) + -Math.log10((c * v) / (v + veq)));
    if (!strong && analyteKind === 'acid') { const kb = kw / k, cs = (c * v) / (v + veq); phEq = 14 + Math.log10(Math.sqrt(kb * cs)); }
    if (!strong && analyteKind === 'base') { const ka = kw / k, cs = (c * v) / (v + veq); phEq = -Math.log10(Math.sqrt(ka * cs)); }
    return { data, veq, phEq };
  }
  function concConvert(type, value, MM, rho) {
    let ms, msol;
    if (type === 'M') { ms = value * MM; msol = rho * 1000; }
    else if (type === 'w') { ms = value; msol = 100; }
    else if (type === 'm') { ms = value * MM; msol = 1000 + ms; }
    else if (type === 'ppm') { ms = value; msol = 1e6; }
    else { ms = value * MM; msol = ms + (1 - value) * WATER_MM; }
    const n = ms / MM, VL = msol / rho / 1000, msolv = msol - ms;
    return { M: n / VL, w: (ms / msol) * 100, m: n / (msolv / 1000), ppm: (ms / msol) * 1e6, x: n / (n + msolv / WATER_MM) };
  }
  const HF = { 'H2O': -285.8, 'H2O(g)': -241.8, 'CO2': -393.5, 'CO': -110.5, 'CH4': -74.8, 'C2H6': -84.7, 'C2H4': 52.4, 'C2H2': 227.4, 'C3H8': -103.8, 'C4H10': -125.7, 'C6H6': 49.0, 'C2H5OH': -277.7, 'CH3OH': -238.7, 'C6H12O6': -1273.3, 'NH3': -46.1, 'NO': 90.3, 'NO2': 33.2, 'N2O': 82.1, 'SO2': -296.8, 'SO3': -395.7, 'H2S': -20.6, 'HCl': -92.3, 'HF': -273.3, 'HBr': -36.3, 'CaO': -635.1, 'CaCO3': -1207.6, 'Ca(OH)2': -986.1, 'Fe2O3': -824.2, 'Fe3O4': -1118.4, 'Al2O3': -1675.7, 'MgO': -601.6, 'NaCl': -411.2, 'NaOH': -425.6, 'H2SO4': -814.0, 'HNO3': -174.1, 'CuO': -157.3, 'ZnO': -350.5, 'SiO2': -910.9, 'P4O10': -2984.0, 'H2O2': -187.8, 'NH4Cl': -314.4, 'KCl': -436.7, 'MgCO3': -1095.8, 'Na2CO3': -1130.7, 'NaHCO3': -950.8, 'PbO': -217.3, 'CuSO4': -771.4, 'H2': 0, 'O2': 0, 'N2': 0, 'Cl2': 0, 'C': 0, 'Fe': 0, 'Al': 0, 'Cu': 0, 'Zn': 0, 'Mg': 0, 'Na': 0, 'S': 0, 'Ca': 0, 'P4': 0, 'Pb': 0, 'Br2': 30.9, 'I2': 62.4 };
  function reactionEnthalpy(eq) {
    const b = balance(eq); const miss = []; let dh = 0;
    const get = (s) => { if (HF[s] === undefined) { miss.push(s); return 0; } return HF[s]; };
    b.reactants.forEach((s, i) => { dh -= b.coefficients[i] * get(s); });
    b.products.forEach((s, i) => { dh += b.coefficients[b.reactants.length + i] * get(s); });
    return { dh, miss, balanced: b };
  }

  Object.assign(CE, { ELEMENTS, BYSYM, CATS, electronConfig, parseFormula, molarMass, hill, prettyFormula, composition, balance, splitEquation, R_GAS, WATER_MM, phStrong, phWeak, titrationCurve, concConvert, reactionEnthalpy, HF });
})();
