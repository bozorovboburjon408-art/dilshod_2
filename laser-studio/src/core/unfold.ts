// Mesh unwrapping: coplanar panels -> joints -> spanning-tree islands -> glue tabs.
import {
  applyMat, convexOverlap, mulMat, rigid, type Mat, type V2, type V3,
  cross3, dot3, len3, norm3, sub3,
} from './geom';
import { weld } from './mesh';
import type { UnfoldSettings, Warning } from './types';

export interface UnfoldInput {
  positions: Float32Array; // 9 per tri, mm
  triMat: Uint16Array;
  triTag: Uint16Array;
  settings: UnfoldSettings;
  /** usable island area (sheet minus margins & corner zones) */
  maxW: number;
  maxH: number;
}

export interface PanelCore {
  id: number;
  key: string;
  tris: number[];
  normal: V3;
  centroid: V3;
  area: number;
  matIndex: number;
  /** local 2D coords per tri: 6 numbers each */
  localTri: number[][];
  island: number;
  /** panel-local -> island */
  T: Mat;
  number: number;
  minY: number;
}

export interface TabOut { seam: number; panel: number; poly: V2[]; A: V2; B: V2; out: V2 }
export interface IslandOut {
  id: number;
  panels: number[];
  /** convex polygons (triangles + tabs) in island coordinates for nesting/overlap */
  polys: number[][];
  tabs: TabOut[];
  cutSegs: [V2, V2][];
  folds: { a: V2; b: V2; kind: 'mountain' | 'valley'; key: string; p: number; q: number }[];
  texts: { x: number; y: number; size: number; angle: number; text: string }[];
  oversize: boolean;
}

export interface JointCore {
  id: number; p: number; q: number; e0: number; e1: number; len: number; convex: boolean;
  key: string; manual: boolean; tree: boolean; seam: number; a3: V3; b3: V3;
  edges: [number, number][];
}

export interface UnfoldOut {
  panels: PanelCore[];
  islands: IslandOut[];
  joints: JointCore[];
  triPanel: Int32Array;
  seams: { id: number; tabPanel: number | null; otherPanel: number; length: number }[];
  warnings: Warning[];
  tabsOmitted: number;
}

class MaxHeap {
  private a: { k: number; v: number }[] = [];
  get size() { return this.a.length; }
  push(k: number, v: number) {
    const a = this.a; a.push({ k, v });
    let i = a.length - 1;
    while (i > 0) { const p = (i - 1) >> 1; if (a[p].k >= a[i].k) break; [a[p], a[i]] = [a[i], a[p]]; i = p; }
  }
  pop() {
    const a = this.a; const top = a[0]; const last = a.pop()!;
    if (a.length) {
      a[0] = last; let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && a[l].k > a[m].k) m = l;
        if (r < a.length && a[r].k > a[m].k) m = r;
        if (m === i) break; [a[m], a[i]] = [a[i], a[m]]; i = m;
      }
    }
    return top;
  }
}

export const MIN_TAB_LEN = 3;
const OVERLAP_EPS = 0.05;

export function unfold(inp: UnfoldInput): UnfoldOut {
  const { settings } = inp;
  const warnings: Warning[] = [];
  const nTri = inp.positions.length / 9;
  const { V, T } = weld(inp.positions);
  const nV = V.length / 3;
  const vec = (i: number): V3 => [V[3 * i], V[3 * i + 1], V[3 * i + 2]];
  const ekey = (a: number, b: number) => (a < b ? a * nV + b : b * nV + a);

  // --- triangle normals / areas / edge map
  const N = new Float64Array(nTri * 3);
  const A = new Float64Array(nTri);
  const edgeTris = new Map<number, number[]>();
  for (let t = 0; t < nTri; t++) {
    const a = vec(T[3 * t]), b = vec(T[3 * t + 1]), c = vec(T[3 * t + 2]);
    const cr = cross3(sub3(b, a), sub3(c, a));
    const l = len3(cr) || 1;
    N[3 * t] = cr[0] / l; N[3 * t + 1] = cr[1] / l; N[3 * t + 2] = cr[2] / l;
    A[t] = l / 2;
    for (let k = 0; k < 3; k++) {
      const key = ekey(T[3 * t + k], T[3 * t + (k + 1) % 3]);
      const lst = edgeTris.get(key);
      if (lst) lst.push(t); else edgeTris.set(key, [t]);
    }
  }
  const tn = (t: number): V3 => [N[3 * t], N[3 * t + 1], N[3 * t + 2]];

  // --- cluster coplanar triangles into panels
  const triPanel = new Int32Array(nTri).fill(-1);
  const panelTris: number[][] = [];
  const cosTol = Math.cos((settings.planarTol * Math.PI) / 180);
  for (let s = 0; s < nTri; s++) {
    if (triPanel[s] >= 0) continue;
    const id = panelTris.length;
    const list = [s]; triPanel[s] = id;
    const n0 = tn(s);
    for (let qi = 0; qi < list.length; qi++) {
      const t = list[qi];
      for (let k = 0; k < 3; k++) {
        const l = edgeTris.get(ekey(T[3 * t + k], T[3 * t + (k + 1) % 3]))!;
        if (l.length !== 2) continue;
        const o = l[0] === t ? l[1] : l[0];
        if (triPanel[o] >= 0) continue;
        if (inp.triMat[o] !== inp.triMat[s] || inp.triTag[o] !== inp.triTag[s]) continue;
        if (dot3(tn(o), n0) < cosTol) continue;
        triPanel[o] = id; list.push(o);
      }
    }
    list.sort((x, y) => x - y);
    panelTris.push(list);
  }

  // --- panel frames and local coordinates
  const nP = panelTris.length;
  const panels: PanelCore[] = [];
  const locs: Map<number, V2>[] = [];
  for (let id = 0; id < nP; id++) {
    const tris = panelTris[id];
    let sx = 0, sy = 0, sz = 0, area = 0, cx = 0, cy = 0, cz = 0;
    const verts = new Set<number>();
    for (const t of tris) {
      sx += N[3 * t] * A[t]; sy += N[3 * t + 1] * A[t]; sz += N[3 * t + 2] * A[t]; area += A[t];
      for (let k = 0; k < 3; k++) {
        const v = vec(T[3 * t + k]); verts.add(T[3 * t + k]);
        cx += v[0] * A[t] / 3; cy += v[1] * A[t] / 3; cz += v[2] * A[t] / 3;
      }
    }
    const normal = norm3([sx, sy, sz]);
    let ex = cross3([0, 1, 0], normal);
    if (len3(ex) < 1e-3) ex = [1, 0, 0];
    ex = norm3(sub3(ex, [normal[0] * dot3(ex, normal), normal[1] * dot3(ex, normal), normal[2] * dot3(ex, normal)]));
    const ey = cross3(normal, ex);
    const centroid: V3 = [cx / area, cy / area, cz / area];
    const loc = new Map<number, V2>();
    let minY = Infinity;
    verts.forEach((v) => {
      const p = vec(v), d = sub3(p, centroid);
      loc.set(v, [dot3(d, ex), dot3(d, ey)]);
      if (p[1] < minY) minY = p[1];
    });
    const localTri = tris.map((t) => {
      const o: number[] = [];
      for (let k = 0; k < 3; k++) { const l = loc.get(T[3 * t + k])!; o.push(l[0], l[1]); }
      return o;
    });
    panels.push({
      id, key: String(tris[0]), tris, normal, centroid, area,
      matIndex: inp.triMat[tris[0]], localTri, island: -1, T: [1, 0, 0, 1, 0, 0], number: 0, minY,
    });
    locs.push(loc);
  }

  // --- joints (runs of shared edges between two panels)
  const pairEdges = new Map<number, { a: number; b: number; tp: number; tq: number }[]>();
  edgeTris.forEach((l, key) => {
    if (l.length !== 2) return;
    let p = triPanel[l[0]], q = triPanel[l[1]];
    if (p === q) return;
    let tp = l[0], tq = l[1];
    if (p > q) { [p, q] = [q, p]; [tp, tq] = [tq, tp]; }
    // directed edge as in p's triangle
    let a = -1, b = -1;
    for (let k = 0; k < 3; k++) {
      const u = T[3 * tp + k], w = T[3 * tp + (k + 1) % 3];
      if (ekey(u, w) === key) { a = u; b = w; break; }
    }
    const pk = p * nP + q;
    const arr = pairEdges.get(pk);
    const rec = { a, b, tp, tq };
    if (arr) arr.push(rec); else pairEdges.set(pk, [rec]);
  });

  const manual = new Set(settings.manualCuts);
  const joints: JointCore[] = [];
  const edgeJoint = new Map<number, number>();
  pairEdges.forEach((edges, pk) => {
    const p = Math.floor(pk / nP), q = pk % nP;
    // union-find on vertices -> runs
    const parent = new Map<number, number>();
    const find = (x: number): number => { let r = x; while (parent.get(r)! !== r) r = parent.get(r)!; parent.set(x, r); return r; };
    for (const e of edges) { if (!parent.has(e.a)) parent.set(e.a, e.a); if (!parent.has(e.b)) parent.set(e.b, e.b); }
    for (const e of edges) { const ra = find(e.a), rb = find(e.b); if (ra !== rb) parent.set(ra, rb); }
    const runs = new Map<number, typeof edges>();
    for (const e of edges) { const r = find(e.a); const l = runs.get(r); if (l) l.push(e); else runs.set(r, [e]); }
    runs.forEach((run) => {
      const vs = Array.from(new Set(run.flatMap((e) => [e.a, e.b])));
      const far = (from: number) => {
        let best = vs[0], bd = -1; const f = vec(from);
        for (const v of vs) { const d = len3(sub3(vec(v), f)); if (d > bd) { bd = d; best = v; } }
        return best;
      };
      let e0 = far(vs[0]); let e1 = far(e0);
      const dir = sub3(vec(e1), vec(e0));
      let s = 0;
      for (const e of run) s += dot3(sub3(vec(e.b), vec(e.a)), dir);
      if (s < 0) [e0, e1] = [e1, e0];
      const first = run[0];
      const opp = [0, 1, 2].map((k) => T[3 * first.tq + k]).find((v) => v !== first.a && v !== first.b)!;
      const convex = dot3(sub3(vec(opp), vec(first.a)), panels[p].normal) < 0;
      const a3 = vec(e0), b3 = vec(e1);
      const id = joints.length;
      const key = Math.min(e0, e1) + '-' + Math.max(e0, e1);
      joints.push({
        id, p, q, e0, e1, len: len3(sub3(b3, a3)), convex, key, manual: manual.has(key),
        tree: false, seam: 0, a3, b3, edges: run.map((e) => [e.a, e.b] as [number, number]),
      });
      for (const e of run) edgeJoint.set(ekey(e.a, e.b), id);
    });
  });
  const panelJoints: number[][] = Array.from({ length: nP }, () => []);
  for (const j of joints) { panelJoints[j.p].push(j.id); panelJoints[j.q].push(j.id); }

  // --- grow islands
  const inIsland = new Int32Array(nP).fill(-1);
  const order = panels.map((p) => p.id).sort((a, b) => panels[b].area - panels[a].area);
  const islandsTris: { poly: number[]; panel: number }[][] = [];
  const islandPanels: number[][] = [];
  const oversizeFlags: boolean[] = [];
  const tw = settings.tabs ? settings.tabWidth : 0;
  const fitW = Math.max(10, inp.maxW - 2 * tw), fitH = Math.max(10, inp.maxH - 2 * tw);
  const fits = (w: number, h: number) => (w <= fitW && h <= fitH) || (w <= fitH && h <= fitW);
  const CELL = 20;

  for (const seed of order) {
    if (inIsland[seed] >= 0) continue;
    const iid = islandsTris.length;
    const tris: { poly: number[]; panel: number }[] = [];
    const grid = new Map<number, number[]>();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const gridKeys = (poly: number[]) => {
      const xs = [poly[0], poly[2], poly[4]], ys = [poly[1], poly[3], poly[5]];
      const x0 = Math.floor(Math.min(...xs) / CELL), x1 = Math.floor(Math.max(...xs) / CELL);
      const y0 = Math.floor(Math.min(...ys) / CELL), y1 = Math.floor(Math.max(...ys) / CELL);
      const keys: number[] = [];
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) keys.push(x * 100003 + y);
      return keys;
    };
    const addPanel = (pid: number, M: Mat, polys: number[][]) => {
      panels[pid].T = M; panels[pid].island = iid; inIsland[pid] = iid;
      islandPanels[iid].push(pid);
      for (const poly of polys) {
        const idx = tris.length; tris.push({ poly, panel: pid });
        for (const k of gridKeys(poly)) { const l = grid.get(k); if (l) l.push(idx); else grid.set(k, [idx]); }
        for (let i = 0; i < 6; i += 2) {
          minX = Math.min(minX, poly[i]); maxX = Math.max(maxX, poly[i]);
          minY = Math.min(minY, poly[i + 1]); maxY = Math.max(maxY, poly[i + 1]);
        }
      }
    };
    const transformTris = (pid: number, M: Mat) =>
      panels[pid].localTri.map((lt) => {
        const o: number[] = [];
        for (let i = 0; i < 6; i += 2) { const q = applyMat(M, lt[i], lt[i + 1]); o.push(q[0], q[1]); }
        return o;
      });
    islandPanels.push([]);
    const idM: Mat = [1, 0, 0, 1, 0, 0];
    addPanel(seed, idM, transformTris(seed, idM));
    oversizeFlags.push(!fits(maxX - minX, maxY - minY));

    const heap = new MaxHeap();
    const pushJoints = (pid: number) => {
      for (const jid of panelJoints[pid]) {
        const j = joints[jid];
        if (j.manual) continue;
        const other = j.p === pid ? j.q : j.p;
        if (inIsland[other] < 0) heap.push(j.len, jid);
      }
    };
    pushJoints(seed);
    while (heap.size) {
      const { v: jid } = heap.pop();
      const j = joints[jid];
      const known = inIsland[j.p] === iid ? j.p : inIsland[j.q] === iid ? j.q : -1;
      if (known < 0) continue;
      const other = known === j.p ? j.q : j.p;
      if (inIsland[other] >= 0) continue;
      // alignment: place `other` so that edge e0-e1 coincides
      const MP = panels[known].T;
      const a0 = applyMat(MP, ...locs[known].get(j.e0)!), a1 = applyMat(MP, ...locs[known].get(j.e1)!);
      const b0 = locs[other].get(j.e0)!, b1 = locs[other].get(j.e1)!;
      const ang = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]) - Math.atan2(b1[1] - b0[1], b1[0] - b0[0]);
      const c = Math.cos(ang), s = Math.sin(ang);
      const bm: V2 = [(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2], am: V2 = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2];
      const M = rigid(ang, am[0] - (c * bm[0] - s * bm[1]), am[1] - (s * bm[0] + c * bm[1]));
      const newTris = transformTris(other, M);
      // size
      let nminX = minX, nmaxX = maxX, nminY = minY, nmaxY = maxY;
      for (const poly of newTris) for (let i = 0; i < 6; i += 2) {
        nminX = Math.min(nminX, poly[i]); nmaxX = Math.max(nmaxX, poly[i]);
        nminY = Math.min(nminY, poly[i + 1]); nmaxY = Math.max(nmaxY, poly[i + 1]);
      }
      if (!fits(nmaxX - nminX, nmaxY - nminY)) continue;
      // overlap
      let bad = false;
      outer: for (const poly of newTris) {
        for (const k of gridKeys(poly)) {
          const l = grid.get(k); if (!l) continue;
          for (const idx of l) if (convexOverlap(poly, tris[idx].poly, OVERLAP_EPS)) { bad = true; break outer; }
        }
      }
      if (bad) continue;
      addPanel(other, M, newTris);
      j.tree = true;
      pushJoints(other);
    }
    islandsTris.push(tris);
  }

  // --- assembly numbering: BFS from the lowest panel over all joints
  const visitedNum = new Uint8Array(nP);
  let counter = 0;
  const starts = panels.map((p) => p.id).sort((a, b) => panels[a].minY - panels[b].minY || panels[b].area - panels[a].area);
  for (const s0 of starts) {
    if (visitedNum[s0]) continue;
    const q: number[] = [s0]; visitedNum[s0] = 1;
    for (let qi = 0; qi < q.length; qi++) {
      const pid = q[qi]; panels[pid].number = ++counter;
      const js = panelJoints[pid].map((j) => joints[j]).sort((x, y) => y.len - x.len);
      for (const j of js) {
        const o = j.p === pid ? j.q : j.p;
        if (!visitedNum[o]) { visitedNum[o] = 1; q.push(o); }
      }
    }
  }

  // --- seams & tabs
  let seamCounter = 0;
  const seams: UnfoldOut['seams'] = [];
  const islands: IslandOut[] = islandsTris.map((tris, id) => ({
    id, panels: islandPanels[id], polys: tris.map((t) => t.poly), tabs: [], cutSegs: [], folds: [], texts: [], oversize: oversizeFlags[id],
  }));
  let tabsOmitted = 0;
  const cutJoints = joints.filter((j) => !j.tree).sort((a, b) => b.len - a.len);
  for (const j of cutJoints) j.seam = ++seamCounter;

  const sidePoints = (j: JointCore, pid: number): [V2, V2] => {
    const M = panels[pid].T, loc = locs[pid];
    const [A0, B0] = pid === j.p ? [j.e0, j.e1] : [j.e1, j.e0];
    return [applyMat(M, ...loc.get(A0)!), applyMat(M, ...loc.get(B0)!)];
  };
  const makeTab = (A: V2, B: V2, w: number, pointed = false): { poly: V2[]; out: V2 } | null => {
    const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy);
    if (len < MIN_TAB_LEN) return null;
    const ux = dx / len, uy = dy / len, nx = uy, ny = -ux;
    const sIn = pointed ? len * 0.42 : Math.min(w * 0.8, len / 3);
    return {
      out: [nx, ny],
      poly: [A, [A[0] + ux * sIn + nx * w, A[1] + uy * sIn + ny * w], [B[0] - ux * sIn + nx * w, B[1] - uy * sIn + ny * w], B],
    };
  };
  const flat = (poly: V2[]) => poly.flatMap((p) => p);
  const tabbedEdges = new Set<number>(); // joint-side keys already covered by a tab: jointId*2+(0|1)

  if (settings.tabs) {
    for (const j of cutJoints) {
      const prefer = j.seam % 2 === 0 ? [j.p, j.q] : [j.q, j.p];
      let placed = false;
      for (const [factor, pointed] of [[1, false], [1, true], [0.75, true], [0.55, true]] as const) {
        for (const pid of prefer) {
          const isl = islands[panels[pid].island];
          const [A, B] = sidePoints(j, pid);
          const tab = makeTab(A, B, settings.tabWidth * factor, pointed);
          if (!tab) continue;
          const tp = flat(tab.poly);
          let ok = true;
          for (const poly of isl.polys) if (convexOverlap(tp, poly, 0.1)) { ok = false; break; }
          if (!ok) continue;
          isl.polys.push(tp);
          isl.tabs.push({ seam: j.seam, panel: pid, poly: tab.poly, A, B, out: tab.out });
          tabbedEdges.add(j.id * 2 + (pid === j.p ? 0 : 1));
          seams.push({ id: j.seam, tabPanel: pid, otherPanel: pid === j.p ? j.q : j.p, length: j.len });
          placed = true; break;
        }
        if (placed) break;
      }
      if (!placed) {
        tabsOmitted++;
        seams.push({ id: j.seam, tabPanel: null, otherPanel: j.q, length: j.len });
        if (j.len >= MIN_TAB_LEN) warnings.push({ code: 'tabOmitted', params: { seam: j.seam } });
      }
    }
  } else {
    for (const j of cutJoints) seams.push({ id: j.seam, tabPanel: null, otherPanel: j.q, length: j.len });
  }
  seams.sort((a, b) => a.id - b.id);

  // --- per-island 2D primitives
  const tabByKey = new Map<string, TabOut>();
  islands.forEach((isl) => isl.tabs.forEach((t) => tabByKey.set(t.seam + ':' + t.panel, t)));
  for (const pan of panels) {
    const isl = islands[pan.island];
    const M = pan.T, loc = locs[pan.id];
    const bset = new Map<number, [number, number]>();
    const dirCount = new Map<string, number>();
    for (const t of pan.tris) for (let k = 0; k < 3; k++) {
      const a = T[3 * t + k], b = T[3 * t + (k + 1) % 3];
      dirCount.set(a + '>' + b, (dirCount.get(a + '>' + b) ?? 0) + 1);
    }
    for (const t of pan.tris) for (let k = 0; k < 3; k++) {
      const a = T[3 * t + k], b = T[3 * t + (k + 1) % 3];
      if (dirCount.has(b + '>' + a)) continue; // internal edge of the panel
      bset.set(ekey(a, b) * 2 + (a < b ? 0 : 1), [a, b]);
    }
    bset.forEach(([a, b]) => {
      const jid = edgeJoint.get(ekey(a, b));
      const pa = applyMat(M, ...loc.get(a)!), pb = applyMat(M, ...loc.get(b)!);
      if (jid === undefined) { isl.cutSegs.push([pa, pb]); return; }
      const j = joints[jid];
      if (j.tree) return;
      if (tabbedEdges.has(jid * 2 + (pan.id === j.p ? 0 : 1))) return; // replaced by tab outline
      isl.cutSegs.push([pa, pb]);
    });
    // number label
    const sz = Math.sqrt(pan.area);
    if (settings.numbers && sz >= 4) {
      const tp = isl.polys.length; void tp;
      let sx = 0, sy = 0, sa = 0, big = 0, bigA = -1, bx = 0, by = 0;
      pan.localTri.forEach((lt, i) => {
        const p0 = applyMat(M, lt[0], lt[1]), p1 = applyMat(M, lt[2], lt[3]), p2 = applyMat(M, lt[4], lt[5]);
        const ar = A[pan.tris[i]];
        const cx = (p0[0] + p1[0] + p2[0]) / 3, cy = (p0[1] + p1[1] + p2[1]) / 3;
        sx += cx * ar; sy += cy * ar; sa += ar;
        if (ar > bigA) { bigA = ar; big = i; bx = cx; by = cy; }
      });
      void big;
      let cx = sx / sa, cy = sy / sa;
      const inside = pan.localTri.some((lt) => {
        const p0 = applyMat(M, lt[0], lt[1]), p1 = applyMat(M, lt[2], lt[3]), p2 = applyMat(M, lt[4], lt[5]);
        const d = (a: V2, b: V2, p: V2) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
        const q: V2 = [cx, cy];
        const d1 = d(p0, p1, q), d2 = d(p1, p2, q), d3 = d(p2, p0, q);
        return d1 >= 0 && d2 >= 0 && d3 >= 0;
      });
      if (!inside) { cx = bx; cy = by; }
      isl.texts.push({ x: cx, y: cy, size: Math.min(6, Math.max(1.8, sz * 0.3)), angle: 0, text: String(pan.number) });
    }
  }
  for (const j of joints) {
    const pan = panels[j.p];
    if (j.tree) {
      const [a, b] = sidePoints(j, j.p);
      islands[pan.island].folds.push({ a, b, kind: j.convex ? 'mountain' : 'valley', key: j.key, p: j.p, q: j.q });
    } else if (settings.seamLabels && j.len >= 5) {
      const label = String(j.seam);
      const sz = Math.min(2.6, Math.max(1.6, j.len * 0.25));
      for (const pid of [j.p, j.q]) {
        const isl = islands[panels[pid].island];
        const [A0, B0] = sidePoints(j, pid);
        const dx = B0[0] - A0[0], dy = B0[1] - A0[1], l = Math.hypot(dx, dy) || 1;
        const nx = dy / l, ny = -dx / l; // outward
        let ang = Math.atan2(dy, dx);
        if (ang > Math.PI / 2) ang -= Math.PI; else if (ang <= -Math.PI / 2) ang += Math.PI;
        const tab = tabByKey.get(j.seam + ':' + pid);
        const off = tab ? settings.tabWidth * 0.45 : -sz * 0.9;
        isl.texts.push({ x: (A0[0] + B0[0]) / 2 + nx * off, y: (A0[1] + B0[1]) / 2 + ny * off, size: sz, angle: ang, text: label });
      }
      void len3;
    }
  }
  // tab polylines go to cut layer
  for (const isl of islands) for (const t of isl.tabs) {
    isl.cutSegs.push([t.A, t.poly[1]], [t.poly[1], t.poly[2]], [t.poly[2], t.B]);
  }
  for (const isl of islands) if (isl.oversize) warnings.push({ code: 'islandTooLarge', params: { island: isl.id + 1 } });
  return { panels, islands, joints, triPanel, seams, warnings, tabsOmitted };
}
