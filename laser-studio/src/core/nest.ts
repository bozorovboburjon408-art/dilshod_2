// Raster-based bottom-left nesting of arbitrary islands (convex polygon soups) on one or more sheets.
import { convexHull } from './geom';

export interface NestItem {
  id: number;
  polys: number[][]; // convex polygons, flat [x,y,...]
}
export interface NestSheetSpec {
  width: number; height: number; margin: number; gap: number; corner: number; allowRotate: boolean;
}
export interface NestPlacement {
  id: number; sheet: number;
  angle: number; // radians (rotation about the island origin)
  tx: number; ty: number; // translation applied after rotation
  placed: boolean;
}

interface Mask { w: number; h: number; d: number; minX: number; minY: number; angle: number; runs: Int32Array; rowStart: Int32Array }

function bestAngle(polys: number[][]): number {
  const pts: number[] = [];
  for (const p of polys) for (let i = 0; i < p.length; i++) pts.push(p[i]);
  const hull = convexHull(pts);
  const flat = hull.flatMap((h) => h);
  let best = 0, bestArea = Infinity;
  for (let deg = 0; deg < 90; deg += 1) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0; i < flat.length; i += 2) {
      const x = flat[i] * c - flat[i + 1] * s, y = flat[i] * s + flat[i + 1] * c;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    const area = (maxX - minX) * (maxY - minY);
    if (area < bestArea - 1e-6) { bestArea = area; best = a; }
  }
  return best;
}

function makeMask(polys: number[][], angle: number, d: number): Mask {
  const c = Math.cos(angle), s = Math.sin(angle);
  const rp = polys.map((p) => {
    const o = new Array<number>(p.length);
    for (let i = 0; i < p.length; i += 2) { o[i] = p[i] * c - p[i + 1] * s; o[i + 1] = p[i] * s + p[i + 1] * c; }
    return o;
  });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of rp) for (let i = 0; i < p.length; i += 2) {
    minX = Math.min(minX, p[i]); maxX = Math.max(maxX, p[i]); minY = Math.min(minY, p[i + 1]); maxY = Math.max(maxY, p[i + 1]);
  }
  const w = Math.ceil(maxX - minX) + 1 + 2 * d, h = Math.ceil(maxY - minY) + 1 + 2 * d;
  const grid = new Uint8Array(w * h);
  for (const p of rp) {
    const n = p.length / 2;
    let py0 = Infinity, py1 = -Infinity;
    for (let i = 1; i < p.length; i += 2) { py0 = Math.min(py0, p[i]); py1 = Math.max(py1, p[i]); }
    const j0 = Math.max(0, Math.floor(py0 - minY) + d), j1 = Math.min(h - 1, Math.floor(py1 - minY) + d);
    for (let j = j0; j <= j1; j++) {
      const y0 = j - d + minY, y1 = y0 + 1;
      let xmin = Infinity, xmax = -Infinity;
      for (let i = 0; i < n; i++) {
        const k = (i + 1) % n;
        let ax = p[2 * i], ay = p[2 * i + 1], bx = p[2 * k], by = p[2 * k + 1];
        if (ay > by) { [ax, bx] = [bx, ax]; [ay, by] = [by, ay]; }
        if (by < y0 || ay > y1) continue;
        const xa = by - ay < 1e-12 ? ax : ax + ((Math.max(ay, y0) - ay) / (by - ay)) * (bx - ax);
        const xb = by - ay < 1e-12 ? bx : ax + ((Math.min(by, y1) - ay) / (by - ay)) * (bx - ax);
        xmin = Math.min(xmin, xa, xb); xmax = Math.max(xmax, xa, xb);
      }
      if (xmin > xmax) continue;
      const i0 = Math.max(0, Math.floor(xmin - minX) + d), i1 = Math.min(w - 1, Math.floor(xmax - minX) + d);
      for (let i = i0; i <= i1; i++) grid[j * w + i] = 1;
    }
  }
  // dilate by d (square)
  let cur = grid;
  if (d > 0) {
    const tmp = new Uint8Array(w * h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (!cur[j * w + i]) continue;
      for (let k = Math.max(0, i - d); k <= Math.min(w - 1, i + d); k++) tmp[j * w + k] = 1;
    }
    const out = new Uint8Array(w * h);
    for (let j = 0; j < h; j++) {
      if (!tmp.subarray(j * w, j * w + w).some((v) => v)) continue;
      for (let k = Math.max(0, j - d); k <= Math.min(h - 1, j + d); k++) for (let i = 0; i < w; i++) if (tmp[j * w + i]) out[k * w + i] = 1;
    }
    cur = out;
  }
  const runs: number[] = [], rowStart = new Int32Array(h + 1);
  for (let j = 0; j < h; j++) {
    rowStart[j] = runs.length / 2;
    let i = 0;
    while (i < w) {
      if (!cur[j * w + i]) { i++; continue; }
      const a = i; while (i < w && cur[j * w + i]) i++;
      runs.push(a, i);
    }
  }
  rowStart[h] = runs.length / 2;
  return { w, h, d, minX, minY, angle, runs: Int32Array.from(runs), rowStart };
}

class SheetGrid {
  W: number; H: number; occ: Uint8Array; pre: Int32Array[];
  constructor(spec: NestSheetSpec, d: number) {
    this.W = Math.ceil(spec.width); this.H = Math.ceil(spec.height);
    this.occ = new Uint8Array(this.W * this.H);
    const mx0 = Math.ceil(spec.margin) - d, mx1 = Math.floor(spec.width - spec.margin) + d;
    const my0 = Math.ceil(spec.margin) - d, my1 = Math.floor(spec.height - spec.margin) + d;
    for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) {
      let f = x < mx0 || x + 1 > mx1 || y < my0 || y + 1 > my1;
      const z = spec.corner;
      const nx = x < z || x >= this.W - z, ny = y < z || y >= this.H - z;
      if (nx && ny) f = true;
      if (f) this.occ[y * this.W + x] = 1;
    }
    this.pre = Array.from({ length: this.H }, () => new Int32Array(this.W + 1));
    for (let y = 0; y < this.H; y++) this.rebuild(y);
  }
  rebuild(y: number) {
    const p = this.pre[y]; let s = 0; p[0] = 0;
    for (let x = 0; x < this.W; x++) { s += this.occ[y * this.W + x]; p[x + 1] = s; }
  }
  fits(m: Mask, gx: number, gy: number): boolean {
    for (let j = 0; j < m.h; j++) {
      const p = this.pre[gy + j];
      for (let r = m.rowStart[j]; r < m.rowStart[j + 1]; r++) {
        if (p[gx + m.runs[2 * r + 1]] - p[gx + m.runs[2 * r]] !== 0) return false;
      }
    }
    return true;
  }
  mark(m: Mask, gx: number, gy: number) {
    for (let j = 0; j < m.h; j++) {
      for (let r = m.rowStart[j]; r < m.rowStart[j + 1]; r++)
        for (let x = m.runs[2 * r]; x < m.runs[2 * r + 1]; x++) this.occ[(gy + j) * this.W + gx + x] = 1;
      this.rebuild(gy + j);
    }
  }
  /** first bottom-left feasible position or null */
  find(m: Mask, yLimit: number): { gx: number; gy: number } | null {
    for (let gy = 0; gy + m.h <= this.H && gy + m.h <= yLimit; gy++) {
      for (let gx = 0; gx + m.w <= this.W; gx++) if (this.fits(m, gx, gy)) return { gx, gy };
    }
    return null;
  }
}

export function nest(items: NestItem[], spec: NestSheetSpec): NestPlacement[] {
  const d = Math.max(1, Math.ceil(spec.gap / 2));
  const prepared = items.map((it) => {
    const a0 = bestAngle(it.polys);
    let area = 0;
    const base = makeMask(it.polys, a0, 0);
    area = base.w * base.h;
    return { it, a0, area };
  }).sort((a, b) => b.area - a.area);

  const sheets: SheetGrid[] = [];
  const out: NestPlacement[] = [];
  const emptyFit = new SheetGrid(spec, d);
  for (const { it, a0 } of prepared) {
    const angles = spec.allowRotate
      ? [a0, a0 + Math.PI / 2, a0 + Math.PI, a0 + (3 * Math.PI) / 2]
      : [0];
    const masks = angles.map((a) => makeMask(it.polys, a, d));
    let done = false;
    for (let s = 0; s <= sheets.length && !done; s++) {
      const grid = s < sheets.length ? sheets[s] : null;
      const g = grid ?? emptyFit;
      let best: { m: Mask; gx: number; gy: number; score: number } | null = null;
      for (const m of masks) {
        const limit = best ? best.score - 0 : Infinity;
        const pos = g.find(m, limit === Infinity ? Infinity : limit);
        if (!pos) continue;
        const score = pos.gy + m.h + pos.gx / 10000;
        if (!best || score < best.score) best = { m, gx: pos.gx, gy: pos.gy, score };
      }
      if (!best) continue;
      let target = grid;
      let idx = s;
      if (!target) { target = new SheetGrid(spec, d); sheets.push(target); idx = sheets.length - 1; }
      target.mark(best.m, best.gx, best.gy);
      out.push({
        id: it.id, sheet: idx, angle: best.m.angle, placed: true,
        tx: best.gx + best.m.d - best.m.minX, ty: best.gy + best.m.d - best.m.minY,
      });
      done = true;
    }
    if (!done) {
      // does not fit anywhere – park it on its own sheet at the margin (flagged unplaced)
      const m = masks[0];
      sheets.push(new SheetGrid(spec, d));
      out.push({ id: it.id, sheet: sheets.length - 1, angle: m.angle, placed: false, tx: spec.margin - m.minX, ty: spec.margin - m.minY });
    }
  }
  return out;
}
