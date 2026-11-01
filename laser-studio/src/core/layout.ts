// Unfold + nest + build per-sheet vector primitives.
import { applyMat, convexOverlap, mulMat, rigid, segmentsCross, type Mat, type V2 } from './geom';
import { nest } from './nest';
import { unfold } from './unfold';
import type { FoldLine, LayoutResult, PanelOut, SheetOut, SheetSettings, TextItem, UnfoldSettings, Warning } from './types';

export const CORNER_ZONE = 16;
export const REG_OFFSET = 8;

/** Join loose segments into polylines (tolerant endpoint snapping). */
export function chainSegments(segs: [V2, V2][], tol = 0.2): { pts: V2[]; closed: boolean }[] {
  const nodes: V2[] = [];
  const grid = new Map<string, number[]>();
  const nodeOf = (p: V2) => {
    const gx = Math.floor(p[0] / tol), gy = Math.floor(p[1] / tol);
    for (let x = gx - 1; x <= gx + 1; x++) for (let y = gy - 1; y <= gy + 1; y++) {
      const l = grid.get(x + ',' + y);
      if (l) for (const id of l) if (Math.hypot(nodes[id][0] - p[0], nodes[id][1] - p[1]) <= tol) return id;
    }
    const id = nodes.length; nodes.push(p);
    const k = gx + ',' + gy; const l = grid.get(k); if (l) l.push(id); else grid.set(k, [id]);
    return id;
  };
  const ends = segs.map(([a, b]) => [nodeOf(a), nodeOf(b)] as [number, number]);
  const adj: number[][] = Array.from({ length: nodes.length }, () => []);
  ends.forEach(([a, b], i) => { if (a === b) return; adj[a].push(i); adj[b].push(i); });
  const used = new Uint8Array(segs.length);
  const result: { pts: V2[]; closed: boolean }[] = [];
  const extend = (path: number[], atTail: boolean) => {
    for (;;) {
      const cur = atTail ? path[path.length - 1] : path[0];
      if (path.length > 2 && path[0] === path[path.length - 1]) return;
      const seg = adj[cur].find((s) => !used[s]);
      if (seg === undefined) return;
      used[seg] = 1;
      const [a, b] = ends[seg];
      const nxt = a === cur ? b : a;
      if (atTail) path.push(nxt); else path.unshift(nxt);
    }
  };
  for (let i = 0; i < segs.length; i++) {
    if (used[i] || ends[i][0] === ends[i][1]) continue;
    used[i] = 1;
    const path = [ends[i][0], ends[i][1]];
    extend(path, true);
    extend(path, false);
    const closed = path.length > 2 && path[0] === path[path.length - 1];
    const pts = path.map((n) => nodes[n]);
    if (closed) pts.pop();
    result.push({ pts, closed });
  }
  return result;
}

export function computeLayout(
  positions: Float32Array, triMat: Uint16Array, triTag: Uint16Array,
  uset: UnfoldSettings, sset: SheetSettings, title = 'model',
): LayoutResult {
  const warnings: Warning[] = [];
  const usableW = sset.width - 2 * sset.margin, usableH = sset.height - 2 * sset.margin;
  const nestSpec = { width: sset.width, height: sset.height, margin: sset.margin, gap: sset.gap, corner: CORNER_ZONE, allowRotate: sset.allowRotate };
  // Try several island-size caps; keep the arrangement that needs the fewest sheets (then fewest islands).
  let un!: ReturnType<typeof unfold>;
  let placements!: ReturnType<typeof nest>;
  let bestScore = Infinity;
  for (const cap of [1, 0.7, 0.5, 0.35]) {
    const u = unfold({ positions, triMat, triTag, settings: uset, maxW: usableW * cap, maxH: usableH * cap });
    const pls = nest(u.islands.map((i) => ({ id: i.id, polys: i.polys })), nestSpec);
    const sheetsUsed = pls.length ? Math.max(...pls.map((p) => p.sheet)) + 1 : 0;
    const unplacedN = pls.filter((p) => !p.placed).length;
    const score = unplacedN * 1e6 + sheetsUsed * 1000 + u.islands.length;
    if (score < bestScore) { bestScore = score; un = u; placements = pls; }
    if (sheetsUsed <= 1 && unplacedN === 0 && cap === 1) break; // already on one sheet
  }
  warnings.push(...un.warnings);
  const pl = new Map(placements.map((p) => [p.id, p]));
  const nSheets = placements.length ? Math.max(...placements.map((p) => p.sheet)) + 1 : 0;
  const sheets: SheetOut[] = Array.from({ length: nSheets }, (_, index) => ({
    index, width: sset.width, height: sset.height, cut: [], fold: [], texts: [],
    regLines: [], regCircles: [], panelKeys: [], islandCount: 0,
  }));

  const panelsOut: PanelOut[] = un.panels.map((p) => ({
    key: p.key, index: p.id, number: p.number, tris: p.tris, area: p.area, normal: p.normal, centroid: p.centroid,
    sheet: -1, island: p.island, toSheet: [1, 0, 0, 1, 0, 0] as Mat, localTri: p.localTri.flat(), sheetTri: [], tabs: [], matIndex: p.matIndex,
  }));
  const keyOf = (id: number) => un.panels[id].key;
  const islandMat = new Map<number, Mat>();
  let cutLen = 0, foldLen = 0, unplaced = 0;

  for (const isl of un.islands) {
    const p = pl.get(isl.id)!;
    if (!p.placed) { unplaced++; warnings.push({ code: 'unplaced', params: { island: isl.id + 1 } }); }
    const M: Mat = rigid(p.angle, p.tx, p.ty);
    islandMat.set(isl.id, M);
    const sh = sheets[p.sheet];
    sh.islandCount++;
    const tp = (q: V2): V2 => applyMat(M, q[0], q[1]);
    for (const c of chainSegments(isl.cutSegs)) {
      const pts = c.pts.map(tp);
      sh.cut.push({ pts, closed: c.closed });
      for (let i = 0; i + 1 < pts.length; i++) cutLen += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
      if (c.closed) cutLen += Math.hypot(pts[0][0] - pts[pts.length - 1][0], pts[0][1] - pts[pts.length - 1][1]);
    }
    for (const f of isl.folds) {
      const a = tp(f.a), b = tp(f.b);
      sh.fold.push({ a, b, kind: f.kind, jointKey: f.key, panels: [keyOf(f.p), keyOf(f.q)] } as FoldLine);
      foldLen += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    for (const t of isl.texts) {
      const q = tp([t.x, t.y]);
      sh.texts.push({ x: q[0], y: q[1], size: t.size, angle: t.angle + p.angle, text: t.text, layer: 'ENGRAVE' } as TextItem);
    }
    for (const pid of isl.panels) {
      const po = panelsOut[pid];
      po.sheet = p.sheet;
      po.toSheet = mulMat(M, un.panels[pid].T);
      const out: number[] = [];
      for (let i = 0; i < po.localTri.length; i += 2) { const q = applyMat(po.toSheet, po.localTri[i], po.localTri[i + 1]); out.push(q[0], q[1]); }
      po.sheetTri = out;
      sh.panelKeys.push(po.key);
    }
    for (const t of isl.tabs) panelsOut[t.panel].tabs.push(t.poly.map(tp));
  }

  // registration marks, origin, footer
  const W = sset.width, H = sset.height;
  sheets.forEach((sh, i) => {
    const pts: V2[] = [[REG_OFFSET, REG_OFFSET], [W - REG_OFFSET, REG_OFFSET], [REG_OFFSET, H - REG_OFFSET], [W - REG_OFFSET, H - REG_OFFSET]];
    for (const [x, y] of pts) {
      sh.regCircles.push({ x, y, r: 2.5 });
      sh.regLines.push([[x - 5, y], [x + 5, y]], [[x, y - 5], [x, y + 5]]);
    }
    // laser origin X0/Y0 at the bottom-left corner
    sh.regLines.push([[0, 0], [6, 0]], [[0, 0], [0, 6]], [[6, 0], [4.6, 0.8]], [[6, 0], [4.6, -0.8]], [[0, 6], [0.8, 4.6]], [[0, 6], [-0.8, 4.6]]);
    sh.texts.push({ x: 8, y: 0.8, size: 2.2, angle: 0, text: 'X0/Y0', layer: 'REGISTRATION' });
    sh.texts.push({ x: CORNER_ZONE + 2, y: H - 3.2, size: 2.4, angle: 0, text: `${title}  |  ${i + 1}/${nSheets}  |  ${W} x ${H} mm`, layer: 'ENGRAVE' });
  });

  // --- validation
  const validation = validateLayout(un, placements, islandMat, sheets, sset);
  if (validation.overlaps) warnings.push({ code: 'overlap', params: { n: validation.overlaps } });
  if (validation.crossings) warnings.push({ code: 'crossing', params: { n: validation.crossings } });
  validation.unplaced = unplaced;

  const tabCount = un.islands.reduce((s, i) => s + i.tabs.length, 0);
  const joints = un.joints.map((j) => ({
    key: j.key, length: j.len, cut: !j.tree, convex: j.convex, manual: j.manual, p: keyOf(j.p), q: keyOf(j.q), a3: j.a3, b3: j.b3, seam: j.seam,
  }));
  return {
    panels: panelsOut, sheets, joints, triPanel: un.triPanel,
    stats: {
      triangles: positions.length / 9, panels: un.panels.length, islands: un.islands.length, sheets: nSheets,
      seams: un.seams.length, tabs: tabCount, tabsOmitted: un.tabsOmitted, cutLengthMm: cutLen, foldLengthMm: foldLen,
    },
    validation, warnings,
    seams: un.seams.map((s) => ({ id: s.id, tabPanel: s.tabPanel === null ? null : keyOf(s.tabPanel), otherPanel: keyOf(s.otherPanel), length: s.length })),
    settings: { unfold: uset, sheet: sset },
  };
}

function validateLayout(
  un: ReturnType<typeof unfold>, placements: ReturnType<typeof nest>, islandMat: Map<number, Mat>, sheets: SheetOut[], sset: SheetSettings,
) {
  let overlaps = 0, crossings = 0, outOfBounds = 0;
  const pl = new Map(placements.map((p) => [p.id, p]));
  // island polys in sheet space + bbox
  const perSheet = new Map<number, { id: number; polys: number[][]; bb: number[] }[]>();
  for (const isl of un.islands) {
    const M = islandMat.get(isl.id)!;
    const polys = isl.polys.map((p) => {
      const o: number[] = [];
      for (let i = 0; i < p.length; i += 2) { const q = applyMat(M, p[i], p[i + 1]); o.push(q[0], q[1]); }
      return o;
    });
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polys) for (let i = 0; i < p.length; i += 2) {
      minX = Math.min(minX, p[i]); maxX = Math.max(maxX, p[i]); minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1]);
    }
    const s = pl.get(isl.id)!.sheet;
    if (pl.get(isl.id)!.placed && (minX < sset.margin - 0.01 || minY < sset.margin - 0.01 || maxX > sset.width - sset.margin + 0.01 || maxY > sset.height - sset.margin + 0.01)) outOfBounds++;
    const arr = perSheet.get(s) ?? []; arr.push({ id: isl.id, polys, bb: [minX, minY, maxX, maxY] }); perSheet.set(s, arr);
  }
  perSheet.forEach((list) => {
    for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const A = list[a].bb, B = list[b].bb;
      if (A[2] < B[0] || B[2] < A[0] || A[3] < B[1] || B[3] < A[1]) continue;
      let hit = false;
      for (const pa of list[a].polys) { for (const pb of list[b].polys) if (convexOverlap(pa, pb, 0.05)) { hit = true; break; } if (hit) break; }
      if (hit) overlaps++;
    }
  });
  // cut vs fold crossings (per sheet)
  for (const sh of sheets) {
    const cutSegs: [V2, V2][] = [];
    for (const c of sh.cut) {
      for (let i = 0; i + 1 < c.pts.length; i++) cutSegs.push([c.pts[i], c.pts[i + 1]]);
      if (c.closed) cutSegs.push([c.pts[c.pts.length - 1], c.pts[0]]);
    }
    for (const f of sh.fold) {
      const minx = Math.min(f.a[0], f.b[0]) - 1, maxx = Math.max(f.a[0], f.b[0]) + 1, miny = Math.min(f.a[1], f.b[1]) - 1, maxy = Math.max(f.a[1], f.b[1]) + 1;
      for (const [c, d] of cutSegs) {
        if (Math.max(c[0], d[0]) < minx || Math.min(c[0], d[0]) > maxx || Math.max(c[1], d[1]) < miny || Math.min(c[1], d[1]) > maxy) continue;
        if (segmentsCross(f.a, f.b, c, d)) crossings++;
      }
    }
  }
  return { overlaps, crossings, outOfBounds, unplaced: 0 };
}
