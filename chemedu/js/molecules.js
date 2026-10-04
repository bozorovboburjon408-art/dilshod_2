/* ChemEdu — molekulalar: SMILES tahlili, 2D/3D geometriya, SVG va Canvas chizish */
(function () {
  const CE = (window.CE = window.CE || {});

  const VAL = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1], H: [1] };
  const VE = { H: 1, B: 3, C: 4, N: 5, O: 6, F: 7, P: 5, S: 6, Cl: 7, Br: 7, I: 7, Na: 1, K: 1, Li: 1, Mg: 2, Ca: 2 };
  const RAD = { H: .31, B: .84, C: .76, N: .71, O: .66, F: .57, P: 1.07, S: 1.05, Cl: 1.02, Br: 1.2, I: 1.39, Na: 1.66, K: 2.03, Li: 1.28, Mg: 1.41, Ca: 1.76 };
  const COL = { H: '#e6ecf7', C: '#454c5c', N: '#3a5bff', O: '#f0342e', F: '#7bd35a', Cl: '#27c24a', Br: '#a8342f', I: '#8a2fa8', S: '#e8c619', P: '#ff8a1f', B: '#f3a98b', Na: '#ab5cf2', K: '#8f40d4', Li: '#cc80ff', Mg: '#3dd13d', Ca: '#3dff00' };
  const TXT = { H: '#6b7a99', C: '#5b6577', N: '#2f5bff', O: '#e5322d', F: '#2f9e44', Cl: '#1f9e3a', Br: '#a33', I: '#8a2fa8', S: '#b89500', P: '#e67e00', B: '#d9622b' };
  const MASS = (el) => (CE.BYSYM[el] ? CE.BYSYM[el].mass : 0);
  const rad = (el) => RAD[el] || 1.2;

  // ---------- SMILES ----------
  function parseSMILES(smi) {
    smi = String(smi).trim();
    if (!smi) throw new Error("SMILES bo'sh");
    const atoms = [], bonds = [], rings = {}, stack = [];
    let prev = -1, pend = null, i = 0;
    const addAtom = (el, arom, charge, hx, bracket) => {
      const a = { el, arom, charge: charge || 0, hx, bracket, h: 0 };
      atoms.push(a); const idx = atoms.length - 1;
      if (prev >= 0) { bonds.push({ a: prev, b: idx, order: pend || (arom && atoms[prev].arom ? 1.5 : 1) }); }
      pend = null; prev = idx; return idx;
    };
    while (i < smi.length) {
      const c = smi[i];
      if (c === '(') { stack.push(prev); i++; }
      else if (c === ')') { if (!stack.length) throw new Error("SMILES: ')' ortiqcha"); prev = stack.pop(); i++; }
      else if (c === '-') { pend = 1; i++; } else if (c === '=') { pend = 2; i++; } else if (c === '#') { pend = 3; i++; }
      else if (c === ':') { pend = 1.5; i++; } else if (c === '/' || c === '\\') { i++; }
      else if (c === '.') { prev = -1; i++; }
      else if (/\d/.test(c) || c === '%') {
        let num; if (c === '%') { num = smi.slice(i + 1, i + 3); i += 3; } else { num = c; i++; }
        if (prev < 0) throw new Error("SMILES: halqa raqami atomdan keyin kelishi kerak");
        if (rings[num] !== undefined) {
          const o = rings[num]; const order = pend || o.order || (atoms[o.idx].arom && atoms[prev].arom ? 1.5 : 1);
          bonds.push({ a: o.idx, b: prev, order }); delete rings[num];
        } else rings[num] = { idx: prev, order: pend };
        pend = null;
      } else if (c === '[') {
        const j = smi.indexOf(']', i); if (j < 0) throw new Error("SMILES: ']' yo'q");
        const m = /^(\d+)?([A-Za-z][a-z]?)(@@?)?(?:(H)(\d*))?([+-]+\d*)?(?::\d+)?$/.exec(smi.slice(i + 1, j));
        if (!m) throw new Error("SMILES: noto'g'ri qavs ichidagi atom: " + smi.slice(i, j + 1));
        let el = m[2], arom = false;
        if (/^[bcnops]$/.test(el)) { arom = true; el = el.toUpperCase(); }
        if (!CE.BYSYM[el]) throw new Error("SMILES: noma'lum element " + el);
        let ch = 0; if (m[6]) { const sgn = m[6][0] === '+' ? 1 : -1; const t = m[6].slice(1); ch = /^\d+$/.test(t) ? sgn * parseInt(t, 10) : sgn * m[6].length; }
        const hx = m[4] ? (m[5] ? parseInt(m[5], 10) : 1) : 0;
        addAtom(el, arom, ch, hx, true); i = j + 1;
      } else {
        let el = null, arom = false;
        if (/^(Cl|Br)/.test(smi.slice(i, i + 2))) { el = smi.slice(i, i + 2); i += 2; }
        else if (/[BCNOPSFI]/.test(c)) { el = c; i++; }
        else if (/[bcnops]/.test(c)) { el = c.toUpperCase(); arom = true; i++; }
        else throw new Error(`SMILES: tushunarsiz belgi «${c}»`);
        addAtom(el, arom, 0, 0, false);
      }
    }
    if (stack.length) throw new Error("SMILES: ')' yetishmayapti");
    if (Object.keys(rings).length) throw new Error("SMILES: halqa yopilmagan");
    // yashirin vodorodlar
    const sums = atoms.map(() => 0);
    bonds.forEach((b) => { sums[b.a] += b.order; sums[b.b] += b.order; });
    atoms.forEach((a, k) => {
      if (a.bracket) { a.h = a.hx; return; }
      const v = VAL[a.el] && (a.arom ? [VAL[a.el][0]] : VAL[a.el]); if (!v) { a.h = 0; return; }
      const s = Math.ceil(sums[k] - 1e-9); const t = v.find((x) => x >= s);
      a.h = t === undefined ? 0 : Math.max(0, t - Math.ceil(sums[k] - 1e-9) + (sums[k] % 1 ? 0 : 0));
      if (a.arom && sums[k] % 1) a.h = t === undefined ? 0 : Math.max(0, t - Math.ceil(sums[k]));
    });
    kekulize(atoms, bonds);
    return { atoms, bonds, smiles: smi };
  }

  function kekulize(atoms, bonds) {
    const arB = bonds.filter((b) => b.order === 1.5); if (!arB.length) return;
    const need = new Set();
    atoms.forEach((a, k) => {
      if (!a.arom) return;
      const bs = bonds.filter((b) => b.a === k || b.b === k);
      let used = a.h; bs.forEach((b) => { used += b.order === 1.5 ? 1 : b.order; });
      const val = a.el === 'N' && a.charge === 1 ? 4 : (VAL[a.el] || [4])[0];
      if (val - used + (a.charge && a.el !== 'N' ? -a.charge : 0) >= 1 && !(a.bracket && a.h && a.el === 'N')) need.add(k);
    });
    const adj = {}; arB.forEach((b, bi) => { if (need.has(b.a) && need.has(b.b)) { (adj[b.a] = adj[b.a] || []).push([b.b, bi]); (adj[b.b] = adj[b.b] || []).push([b.a, bi]); } });
    const matched = new Set(), chosen = [];
    const nodes = [...need];
    const dfs = () => {
      const u = nodes.find((n) => !matched.has(n)); if (u === undefined) return true;
      for (const [v, bi] of adj[u] || []) { if (matched.has(v)) continue; matched.add(u); matched.add(v); chosen.push(bi); if (dfs()) return true; chosen.pop(); matched.delete(u); matched.delete(v); }
      return false;
    };
    if (dfs()) arB.forEach((b, bi) => { b.order = chosen.includes(bi) ? 2 : 1; b.arom = true; });
  }

  // yashirin vodorodlarni aniq atomlarga aylantirish
  function explicitH(m) {
    const atoms = m.atoms.map((a) => ({ ...a })), bonds = m.bonds.map((b) => ({ ...b }));
    const n0 = atoms.length;
    for (let k = 0; k < n0; k++) for (let j = 0; j < atoms[k].h; j++) { atoms.push({ el: 'H', arom: false, charge: 0, h: 0, hOf: k }); bonds.push({ a: k, b: atoms.length - 1, order: 1 }); }
    return { atoms, bonds, heavy: n0, smiles: m.smiles };
  }

  // ---------- Geometriya ----------
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function stericAngle(m, k, dim, nb) {
    const a = m.atoms[k]; const deg = nb.length; let sum = 0;
    m.bonds.forEach((b) => { if (b.a === k || b.b === k) sum += b.order === 1.5 ? 1.5 : b.order; });
    const ve = VE[a.el] !== undefined ? VE[a.el] : 4;
    const lp = Math.max(0, Math.floor((ve - a.charge - Math.round(sum)) / 2));
    const sn = deg + lp;
    if (dim === 2) { if (deg <= 1) return 0; if (deg === 2) return sn >= 3 ? 120 : 180; if (deg === 3) return 120; if (deg === 4) return 90; return 72; }
    if (sn <= 2) return 180; if (sn === 3) return 120;
    if (sn === 4) return lp === 1 ? 107 : lp === 2 ? 104.5 : 109.5;
    if (sn === 5) return 105; return 90;
  }
  function embed(m, dim, subset, seed = 7) {
    const idxMap = new Map(); const ids = subset || m.atoms.map((_, i) => i);
    ids.forEach((g, l) => idxMap.set(g, l));
    const n = ids.length; if (n === 0) return [];
    if (n === 1) return [Array(dim).fill(0)];
    const bs = m.bonds.filter((b) => idxMap.has(b.a) && idxMap.has(b.b)).map((b) => ({ a: idxMap.get(b.a), b: idxMap.get(b.b), order: b.order, l: rad(m.atoms[b.a].el) + rad(m.atoms[b.b].el) - (b.order === 2 ? .1 : b.order === 3 ? .2 : b.order === 1.5 ? .08 : 0) }));
    const nb = Array.from({ length: n }, () => []); bs.forEach((b) => { nb[b.a].push(b); nb[b.b].push(b); });
    const other = (b, x) => (b.a === x ? b.b : b.a);
    const angles = []; const pair12 = new Set(); const pair13 = new Set();
    const key = (a, b) => (a < b ? a * 1000 + b : b * 1000 + a);
    bs.forEach((b) => pair12.add(key(b.a, b.b)));
    for (let c = 0; c < n; c++) {
      const g = ids[c]; const ang = stericAngle({ atoms: m.atoms, bonds: m.bonds.filter((x) => idxMap.has(x.a) && idxMap.has(x.b)) }, g, dim, nb[c]);
      for (let x = 0; x < nb[c].length; x++) for (let y = x + 1; y < nb[c].length; y++) {
        const A = other(nb[c][x], c), B = other(nb[c][y], c); const la = nb[c][x].l, lb = nb[c][y].l; const th = (ang * Math.PI) / 180;
        angles.push({ a: A, b: B, d: Math.sqrt(la * la + lb * lb - 2 * la * lb * Math.cos(th)) }); pair13.add(key(A, B));
      }
    }
    const heavyEnergy = (P) => {
      let E = 0;
      bs.forEach((b) => { const d = dist(P[b.a], P[b.b]); E += (d - b.l) ** 2; });
      angles.forEach((g) => { const d = dist(P[g.a], P[g.b]); E += 0.6 * (d - g.d) ** 2; });
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const k = key(i, j); if (pair12.has(k) || pair13.has(k)) continue; const d = dist(P[i], P[j]); const dm = (rad(m.atoms[ids[i]].el) + rad(m.atoms[ids[j]].el)) * 1.7 + 0.25; if (d < dm) E += 0.3 * (d - dm) ** 2; }
      return E;
    };
    const dist = (p, q) => { let s = 0; for (let k = 0; k < dim; k++) s += (p[k] - q[k]) ** 2; return Math.sqrt(s) + 1e-9; };
    let best = null, bestE = Infinity; const tries = dim === 2 ? 60 : 24;
    for (let t = 0; t < tries; t++) {
      const r = rng(seed + t * 7919); const R = Math.sqrt(n) * 0.9 + 1;
      let P = Array.from({ length: n }, () => Array.from({ length: dim }, () => (r() - .5) * 2 * R));
      for (let it = 0; it < 700; it++) {
        const lr = 0.12 * (1 - it / 700) + 0.01; const G = P.map(() => Array(dim).fill(0));
        const pull = (i, j, target, k) => { const d = dist(P[i], P[j]); const f = (k * (d - target)) / d; for (let q = 0; q < dim; q++) { const dd = (P[i][q] - P[j][q]) * f; G[i][q] += dd; G[j][q] -= dd; } };
        bs.forEach((b) => pull(b.a, b.b, b.l, 1));
        angles.forEach((g) => pull(g.a, g.b, g.d, 0.6));
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          const k = key(i, j); if (pair12.has(k) || pair13.has(k)) continue;
          const d = dist(P[i], P[j]); const dm = (rad(m.atoms[ids[i]].el) + rad(m.atoms[ids[j]].el)) * 1.7 + 0.25;
          if (d < dm) pull(i, j, dm, 0.3); else if (d < dm * 2) { const f = (0.02 / (d * d * d)); for (let q = 0; q < dim; q++) { const dd = (P[i][q] - P[j][q]) * -f; G[i][q] += dd; G[j][q] -= dd; } }
        }
        for (let i = 0; i < n; i++) for (let q = 0; q < dim; q++) P[i][q] -= lr * G[i][q] * 2;
      }
      const E = heavyEnergy(P); if (E < bestE) { bestE = E; best = P; }
    }
    // markazlash
    const c = Array(dim).fill(0); best.forEach((p) => p.forEach((v, q) => { c[q] += v / n; })); best.forEach((p) => p.forEach((v, q) => { p[q] = v - c[q]; }));
    return best;
  }

  // 2D: og'ir atomlar + vodorodlarni bo'sh burchaklarga joylash
  function layout2D(m) {
    const E = explicitH(m); const heavy = [...Array(E.heavy).keys()];
    const P = embed(E, 2, heavy, 11);
    const pos = P.map((p) => [p[0], p[1]]);
    const nbh = (k) => E.bonds.filter((b) => (b.a === k && b.b < E.heavy) || (b.b === k && b.a < E.heavy)).map((b) => (b.a === k ? b.b : b.a));
    const hs = (k) => E.atoms.map((a, i) => ({ a, i })).filter((x) => x.a.hOf === k).map((x) => x.i);
    heavy.forEach((k) => {
      const H = hs(k); if (!H.length) return;
      const L = rad(E.atoms[k].el) + rad('H');
      const angs = nbh(k).map((j) => Math.atan2(pos[j][1] - pos[k][1], pos[j][0] - pos[k][0])).sort((x, y) => x - y);
      let dirs = [];
      if (!angs.length) {
        const h = H.length, step = h === 2 ? (104.5 * Math.PI) / 180 : (2 * Math.PI) / h;
        dirs = H.map((_, q) => Math.PI / 2 + (q - (h - 1) / 2) * step - (h === 2 ? Math.PI / 2 : 0));
      } else {
        const gaps = angs.map((x, q) => { const y = q + 1 < angs.length ? angs[q + 1] : angs[0] + 2 * Math.PI; return { s: x, w: y - x, n: 0 }; });
        H.forEach(() => { gaps.sort((p, q) => q.w / (q.n + 1) - p.w / (p.n + 1)); gaps[0].n++; });
        gaps.forEach((g) => { for (let q = 1; q <= g.n; q++) dirs.push(g.s + (g.w * q) / (g.n + 1)); });
      }
      H.forEach((hi, q) => { pos[hi] = [pos[k][0] + L * Math.cos(dirs[q]), pos[k][1] + L * Math.sin(dirs[q])]; });
    });
    return { E, pos };
  }

  // ---------- 2D SVG ----------
  function svg2D(m, opts = {}) {
    const showH = !!opts.showH;
    const { E, pos } = layout2D(m);
    const size = opts.size || 300; const hv = E.heavy;
    const labeled = (k) => { const a = E.atoms[k]; return a.el !== 'C' || a.charge !== 0 || (E.heavy === 1) || false; };
    const visible = (k) => k < hv || (E.atoms[k].hOf !== undefined && (showH || (E.atoms[E.atoms[k].hOf].el !== 'C')) && (showH || false));
    const condensed = !showH;
    const hOnHetero = (k) => E.atoms.filter((a) => a.hOf === k).length;
    let xs = [], ys = [];
    E.atoms.forEach((a, k) => { if (k < hv || showH) { xs.push(pos[k][0]); ys.push(pos[k][1]); } });
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const w = Math.max(maxx - minx, 0.01), h = Math.max(maxy - miny, 0.01);
    const sc = Math.min((size - 70) / w, (size - 70) / h, 46); const ox = size / 2 - ((minx + maxx) / 2) * sc, oy = size / 2 - ((miny + maxy) / 2) * sc;
    const X = (k) => pos[k][0] * sc + ox, Y = (k) => pos[k][1] * sc + oy;
    const lab = {};
    E.atoms.forEach((a, k) => {
      if (k >= hv) { if (showH) lab[k] = { t: 'H', c: TXT.H }; return; }
      const nH = condensed ? hOnHetero(k) : 0;
      if (a.el === 'C' && a.charge === 0 && !(hv === 1)) return;
      let t = a.el; if (nH) t += 'H' + (nH > 1 ? nH : '');
      if (a.charge) t += (Math.abs(a.charge) > 1 ? Math.abs(a.charge) : '') + (a.charge > 0 ? '+' : '−');
      lab[k] = { t, c: TXT[a.el] || '#7a3fb5', h: nH };
    });
    const showAtom = (k) => k < hv || showH;
    let out = '';
    const trim = (k, x, y, tx, ty) => { if (!lab[k]) return [x, y]; const len = Math.hypot(tx - x, ty - y) || 1; const r = lab[k].t.length > 1 ? 13 : 9; return [x + ((tx - x) / len) * r, y + ((ty - y) / len) * r]; };
    E.bonds.forEach((b) => {
      if (!showAtom(b.a) || !showAtom(b.b)) return;
      if (!showH && (b.a >= hv || b.b >= hv)) return;
      let x1 = X(b.a), y1 = Y(b.a), x2 = X(b.b), y2 = Y(b.b);
      [x1, y1] = trim(b.a, x1, y1, x2, y2); [x2, y2] = trim(b.b, x2, y2, X(b.a), Y(b.a));
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1; const nx = -dy / len, ny = dx / len;
      const line = (ax, ay, bx, by, cls = '') => `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${by.toFixed(1)}" class="b ${cls}"/>`;
      const off = 4.5;
      if (b.order === 1 || (b.order !== 2 && b.order !== 3 && b.order !== 1.5)) out += line(x1, y1, x2, y2);
      else if (b.order === 3) out += line(x1, y1, x2, y2) + line(x1 + nx * off, y1 + ny * off, x2 + nx * off, y2 + ny * off) + line(x1 - nx * off, y1 - ny * off, x2 - nx * off, y2 - ny * off);
      else {
        const mx = (X(b.a) + X(b.b)) / 2, my = (Y(b.a) + Y(b.b)) / 2; let side = 0;
        [b.a, b.b].forEach((e) => E.bonds.forEach((o) => { if (o === b || (o.a !== e && o.b !== e)) return; const f = o.a === e ? o.b : o.a; if (f >= hv) return; side += (X(f) - mx) * nx + (Y(f) - my) * ny; }));
        if (b.order === 2 && Math.abs(side) < 1e-6) out += line(x1 + nx * off / 2, y1 + ny * off / 2, x2 + nx * off / 2, y2 + ny * off / 2) + line(x1 - nx * off / 2, y1 - ny * off / 2, x2 - nx * off / 2, y2 - ny * off / 2);
        else {
          const s = side >= 0 ? 1 : -1, sh = 0.14;
          out += line(x1, y1, x2, y2) + line(x1 + nx * s * off * 1.6 + dx * sh, y1 + ny * s * off * 1.6 + dy * sh, x2 + nx * s * off * 1.6 - dx * sh, y2 + ny * s * off * 1.6 - dy * sh, b.order === 1.5 ? 'dash' : '');
        }
      }
    });
    Object.keys(lab).forEach((k) => { out += `<text x="${X(k).toFixed(1)}" y="${(Y(k) + 5).toFixed(1)}" text-anchor="middle" class="atom" fill="${lab[k].c}">${lab[k].t.replace(/(H)(\d)/, '$1<tspan class="sub" dy="4" font-size="10">$2</tspan>')}</text>`; });
    return `<svg class="mol2d" viewBox="0 0 ${size} ${size}" role="img" aria-label="Molekulaning 2D tuzilishi">${out}</svg>`;
  }

  // ---------- 3D ----------
  class Mol3D {
    constructor(canvas, m, opts = {}) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.E = explicitH(m);
      const P = embed(this.E, 3, null, 5); this.P = orient(P);
      this.rx = -0.35; this.ry = 0.35; this.zoom = 1; this.auto = opts.auto !== false; this.dead = false; this.drag = null;
      this.maxR = Math.max(...P.map((p) => Math.hypot(...p)), 1) + 0.9;
      this._bind(); this._resize(); this._loop = this._loop.bind(this); requestAnimationFrame(this._loop);
    }
    _bind() {
      const c = this.cv; c.style.touchAction = 'none'; c.style.cursor = 'grab';
      c.addEventListener('pointerdown', (e) => { this.drag = { x: e.clientX, y: e.clientY }; c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; });
      c.addEventListener('pointermove', (e) => { if (!this.drag) return; this.ry += (e.clientX - this.drag.x) * 0.01; this.rx += (e.clientY - this.drag.y) * 0.01; this.drag = { x: e.clientX, y: e.clientY }; });
      const up = () => { this.drag = null; c.style.cursor = 'grab'; };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
      c.addEventListener('wheel', (e) => { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.1 : 0.9); }, { passive: false });
      this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(c);
    }
    zoomBy(f) { this.zoom = Math.min(3.5, Math.max(0.4, this.zoom * f)); }
    toggleAuto() { this.auto = !this.auto; return this.auto; }
    _resize() { const r = this.cv.getBoundingClientRect(); const d = Math.min(window.devicePixelRatio || 1, 2); this.w = Math.max(r.width, 10); this.h = Math.max(r.height, 10); this.cv.width = this.w * d; this.cv.height = this.h * d; this.ctx.setTransform(d, 0, 0, d, 0, 0); }
    destroy() { this.dead = true; this.ro && this.ro.disconnect(); }
    _loop() {
      if (this.dead || !this.cv.isConnected) { this.dead = true; return; }
      if (this.auto && !this.drag) this.ry += 0.008;
      if (this.w > 20) this.draw(); requestAnimationFrame(this._loop);
    }
    draw() {
      const { ctx, E, P } = this; const w = this.w, h = this.h; ctx.clearRect(0, 0, w, h);
      const sc = (Math.min(w, h) / (2 * this.maxR)) * 0.92 * this.zoom;
      const cy = Math.cos(this.ry), sy = Math.sin(this.ry), cx = Math.cos(this.rx), sx = Math.sin(this.rx);
      const R = P.map((p) => { let x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1] * cx - z * sx; z = p[1] * sx + z * cx; const f = 14 / (14 - z); return { x: w / 2 + x * sc * f, y: h / 2 + y * sc * f, z, f }; });
      const items = [];
      E.bonds.forEach((b) => items.push({ t: 'b', b, z: (R[b.a].z + R[b.b].z) / 2 }));
      E.atoms.forEach((a, k) => items.push({ t: 'a', k, z: R[k].z }));
      items.sort((p, q) => p.z - q.z);
      const dark = document.documentElement.dataset.theme === 'dark';
      for (const it of items) {
        if (it.t === 'b') {
          const A = R[it.b.a], B = R[it.b.b], ea = E.atoms[it.b.a].el, eb = E.atoms[it.b.b].el;
          const dx = B.x - A.x, dy = B.y - A.y, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
          const ord = it.b.order === 1.5 ? 1 : it.b.order; const lw = Math.max(2.5, sc * 0.11 * ((A.f + B.f) / 2)) / (ord > 1 ? 1.5 : 1);
          const offs = ord === 1 ? [0] : ord === 2 ? [-0.5, 0.5] : [-1, 0, 1];
          const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
          offs.forEach((o) => {
            const ox = nx * o * lw * 1.7, oy = ny * o * lw * 1.7;
            ctx.lineCap = 'round'; ctx.lineWidth = lw;
            ctx.strokeStyle = COL[ea] === COL.H ? '#b9c3d8' : COL[ea] || '#999'; ctx.beginPath(); ctx.moveTo(A.x + ox, A.y + oy); ctx.lineTo(mx + ox, my + oy); ctx.stroke();
            ctx.strokeStyle = COL[eb] === COL.H ? '#b9c3d8' : COL[eb] || '#999'; ctx.beginPath(); ctx.moveTo(mx + ox, my + oy); ctx.lineTo(B.x + ox, B.y + oy); ctx.stroke();
          });
        } else {
          const a = E.atoms[it.k], p = R[it.k]; const r = (0.2 + rad(a.el) * 0.28) * sc * p.f * 0.9; const base = COL[a.el] || '#d06bd0';
          const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, r * 0.1, p.x, p.y, r);
          g.addColorStop(0, '#fff'); g.addColorStop(0.25, base); g.addColorStop(1, shade(base, -0.45));
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
          if (a.el === 'H' && !dark) { ctx.strokeStyle = 'rgba(100,116,150,.35)'; ctx.lineWidth = 1; ctx.stroke(); }
        }
      }
    }
  }
  // asosiy o'qlar bo'yicha burish: eng yassi yo'nalish kuzatuvchiga qaragan bo'ladi
  function orient(P) {
    const n = P.length; if (n < 3) return P;
    const C = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    P.forEach((p) => { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) C[i][j] += (p[i] * p[j]) / n; });
    let V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    for (let it = 0; it < 30; it++) {
      let a = 0, b = 1, m = 0; for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (Math.abs(C[i][j]) > m) { m = Math.abs(C[i][j]); a = i; b = j; }
      if (m < 1e-10) break;
      const th = 0.5 * Math.atan2(2 * C[a][b], C[a][a] - C[b][b]), c = Math.cos(th), s = Math.sin(th);
      for (let k = 0; k < 3; k++) { const x = C[k][a], y = C[k][b]; C[k][a] = c * x + s * y; C[k][b] = -s * x + c * y; }
      for (let k = 0; k < 3; k++) { const x = C[a][k], y = C[b][k]; C[a][k] = c * x + s * y; C[b][k] = -s * x + c * y; }
      for (let k = 0; k < 3; k++) { const x = V[k][a], y = V[k][b]; V[k][a] = c * x + s * y; V[k][b] = -s * x + c * y; }
    }
    const ord = [0, 1, 2].sort((i, j) => C[j][j] - C[i][i]);
    return P.map((p) => ord.map((o) => p[0] * V[0][o] + p[1] * V[1][o] + p[2] * V[2][o]));
  }
  function shade(hex, f) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const t = f < 0 ? 0 : 255, p = Math.abs(f); const m = (c) => Math.round((t - c) * p + c); return `rgb(${m(r)},${m(g)},${m(b)})`; }

  // ---------- Ma'lumotlar bazasi ----------
  const DB = [
    ['Suv', 'H2O', 'O', 'water,suv,aqua'], ['Metan', 'CH4', 'C', 'methane'], ['Etan', 'C2H6', 'CC', 'ethane'], ['Propan', 'C3H8', 'CCC', 'propane'], ['Butan', 'C4H10', 'CCCC', 'butane'], ['Izobutan', 'C4H10', 'CC(C)C', 'isobutane'], ['Geksan', 'C6H14', 'CCCCCC', 'hexane'],
    ['Etilen', 'C2H4', 'C=C', 'ethylene,eten'], ['Propilen', 'C3H6', 'CC=C', 'propylene'], ['Atsetilen', 'C2H2', 'C#C', 'acetylene,etin'], ['Benzol', 'C6H6', 'c1ccccc1', 'benzene,benzen'], ['Toluol', 'C7H8', 'Cc1ccccc1', 'toluene'], ['Stirol', 'C8H8', 'C=Cc1ccccc1', 'styrene'],
    ['Naftalin', 'C10H8', 'c1ccc2ccccc2c1', 'naphthalene'], ['Siklogeksan', 'C6H12', 'C1CCCCC1', 'cyclohexane'], ['Fenol', 'C6H6O', 'Oc1ccccc1', 'phenol'], ['Anilin', 'C6H7N', 'Nc1ccccc1', 'aniline'], ['Piridin', 'C5H5N', 'c1ccncc1', 'pyridine'], ['Furan', 'C4H4O', 'c1ccoc1', 'furan'],
    ['Metanol', 'CH4O', 'CO', 'methanol'], ['Etanol', 'C2H6O', 'CCO', 'ethanol,spirt'], ['Glitserin', 'C3H8O3', 'OCC(O)CO', 'glycerol'], ['Dietil efir', 'C4H10O', 'CCOCC', 'diethyl ether'], ['Formaldegid', 'CH2O', 'C=O', 'formaldehyde'], ['Atsetaldegid', 'C2H4O', 'CC=O', 'acetaldehyde'],
    ['Atseton', 'C3H6O', 'CC(C)=O', 'acetone'], ['Chumoli kislota', 'CH2O2', 'C(=O)O', 'formic acid'], ['Sirka kislota', 'C2H4O2', 'CC(=O)O', 'acetic acid'], ['Shavel kislota', 'C2H2O4', 'OC(=O)C(O)=O', 'oxalic acid'], ['Benzoy kislota', 'C7H6O2', 'OC(=O)c1ccccc1', 'benzoic acid'],
    ['Salitsil kislota', 'C7H6O3', 'OC(=O)c1ccccc1O', 'salicylic acid'], ['Limon kislota', 'C6H8O7', 'OC(=O)CC(O)(CC(O)=O)C(O)=O', 'citric acid'], ['Etilatsetat', 'C4H8O2', 'CCOC(C)=O', 'ethyl acetate'], ['Glyukoza', 'C6H12O6', 'OCC1OC(O)C(O)C(O)C1O', 'glucose'],
    ['Aspirin', 'C9H8O4', 'CC(=O)Oc1ccccc1C(=O)O', 'acetylsalicylic acid'], ['Paratsetamol', 'C8H9NO2', 'CC(=O)Nc1ccc(O)cc1', 'paracetamol,acetaminophen'], ['Kofein', 'C8H10N4O2', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C', 'caffeine'],
    ['Glitsin', 'C2H5NO2', 'NCC(=O)O', 'glycine'], ['Alanin', 'C3H7NO2', 'CC(N)C(=O)O', 'alanine'], ['Karbamid', 'CH4N2O', 'NC(N)=O', 'urea,mochevina'], ['Metilamin', 'CH5N', 'CN', 'methylamine'],
    ['Ammiak', 'NH3', 'N', 'ammonia'], ['Karbonat angidrid', 'CO2', 'O=C=O', 'carbon dioxide,co2'], ['Is gazi', 'CO', '[C-]#[O+]', 'carbon monoxide'], ['Vodorod sulfid', 'H2S', 'S', 'hydrogen sulfide'], ['Oltingugurt(IV) oksid', 'SO2', 'O=S=O', 'sulfur dioxide'],
    ['Sulfat kislota', 'H2SO4', 'OS(=O)(=O)O', 'sulfuric acid'], ['Nitrat kislota', 'HNO3', 'O[N+](=O)[O-]', 'nitric acid'], ['Fosfat kislota', 'H3PO4', 'OP(O)(O)=O', 'phosphoric acid'], ['Xlorid kislota', 'HCl', 'Cl', 'hydrochloric acid'],
    ['Vodorod peroksid', 'H2O2', 'OO', 'hydrogen peroxide'], ['Ozon', 'O3', '[O-][O+]=O', 'ozone'], ['Kislorod', 'O2', 'O=O', 'oxygen'], ['Azot', 'N2', 'N#N', 'nitrogen'], ['Vodorod', 'H2', '[H][H]', 'hydrogen'],
    ['Xloroform', 'CHCl3', 'ClC(Cl)Cl', 'chloroform'], ['Uglerod tetraxlorid', 'CCl4', 'ClC(Cl)(Cl)Cl', 'carbon tetrachloride'], ['Dimetilsulfoksid', 'C2H6OS', 'CS(C)=O', 'dmso'], ['Fosfin', 'PH3', 'P', 'phosphine']
  ].map(([name, formula, smiles, syn]) => ({ name, formula, smiles, syn: syn.split(',') }));
  const norm = (s) => s.toLowerCase().replace(/[ʻʼ'’`]/g, '').replace(/\s+/g, ' ').trim();

  function describe(m, name) {
    const E = explicitH(m); const comp = {};
    E.atoms.forEach((a) => { comp[a.el] = (comp[a.el] || 0) + 1; });
    const f = CE.hill(comp); let mass = 0; Object.keys(comp).forEach((k) => { mass += (CE.BYSYM[k] ? CE.BYSYM[k].mass : 0) * comp[k]; });
    const pct = Object.keys(comp).map((k) => ({ sym: k, n: comp[k], pct: ((CE.BYSYM[k].mass * comp[k]) / mass) * 100 })).sort((a, b) => b.pct - a.pct);
    const nb = { 1: 0, 2: 0, 3: 0 }; m.bonds.forEach((b) => { nb[b.order === 1.5 ? 1 : b.order]++; });
    const hvB = E.bonds.length; const rings = hvB - E.atoms.length + 1;
    return { name, formula: f, mass, pct, atoms: E.atoms.length, heavy: E.heavy, bonds: hvB, rings: Math.max(0, rings), single: E.bonds.filter((b) => b.order === 1 || b.order === 1.5).length, dbl: E.bonds.filter((b) => b.order === 2).length, triple: E.bonds.filter((b) => b.order === 3).length, smiles: m.smiles };
  }

  async function lookup(q) {
    q = String(q).trim(); if (!q) throw new Error("Nom, formula yoki SMILES kiriting");
    if (/^smiles:/i.test(q)) { const s = q.slice(7).trim(); const m = parseSMILES(s); return { m, name: 'SMILES', source: 'smiles' }; }
    const n = norm(q);
    const byName = DB.find((d) => norm(d.name) === n || d.syn.includes(n));
    if (byName) return { m: parseSMILES(byName.smiles), name: byName.name, source: 'baza' };
    const fq = q.replace(/\s+/g, '').replace(/[₀-₉]/g, (d) => String(d.charCodeAt(0) - 8320));
    const byF = DB.find((d) => d.formula.toLowerCase() === fq.toLowerCase() && /[A-Z]\d|[A-Z][A-Z]/.test(fq) || d.formula === fq);
    if (byF) return { m: parseSMILES(byF.smiles), name: byF.name, source: 'baza' };
    const part = DB.find((d) => norm(d.name).startsWith(n) && n.length >= 3);
    if (part) return { m: parseSMILES(part.smiles), name: part.name, source: 'baza' };
    try { const m = parseSMILES(q); return { m, name: 'SMILES: ' + q, source: 'smiles' }; } catch (e) { /* onlayn qidiruv */ }
    try {
      const r = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(q)}/property/ConnectivitySMILES,MolecularFormula,IUPACName/JSON`);
      if (!r.ok) throw new Error();
      const j = await r.json(); const p = j.PropertyTable.Properties[0];
      const smi = p.ConnectivitySMILES || p.CanonicalSMILES || p.SMILES;
      return { m: parseSMILES(smi), name: q, source: 'PubChem', iupac: p.IUPACName };
    } catch (e) { throw new Error(`«${q}» topilmadi. Bazadagi nomni, formulani yoki to'g'ri SMILES kiriting (masalan: CCO yoki smiles:C1CC1).`); }
  }

  Object.assign(CE, { parseSMILES, explicitH, svg2D, Mol3D, MOLDB: DB, describeMol: describe, lookupMolecule: lookup, embed3D: (m) => embed(explicitH(m), 3) });
})();
