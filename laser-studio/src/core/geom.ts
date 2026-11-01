// Pure geometry helpers (no DOM). Units: millimetres. 2D sheet space is Y-up.

export type V2 = [number, number];
export type V3 = [number, number, number];
/** Affine matrix [a,b,c,d,e,f]: x' = a*x + c*y + e ; y' = b*x + d*y + f */
export type Mat = [number, number, number, number, number, number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

export function mulMat(m1: Mat, m2: Mat): Mat {
  // m1 ∘ m2  (apply m2 first)
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}
export function applyMat(m: Mat, x: number, y: number): V2 {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}
export function rigid(angle: number, tx: number, ty: number): Mat {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [c, s, -s, c, tx, ty];
}
/** Solve affine mapping 3 source points -> 3 destination points. */
export function affineFrom3(s: number[], d: number[]): Mat | null {
  const [x0, y0, x1, y1, x2, y2] = s;
  const det = x0 * (y1 - y2) - x1 * (y0 - y2) + x2 * (y0 - y1);
  if (Math.abs(det) < 1e-12) return null;
  const solve = (v0: number, v1: number, v2: number): [number, number, number] => {
    const a = (v0 * (y1 - y2) - v1 * (y0 - y2) + v2 * (y0 - y1)) / det;
    const b = (x0 * (v1 - v2) - x1 * (v0 - v2) + x2 * (v0 - v1)) / det;
    const c = (x0 * (y1 * v2 - y2 * v1) - x1 * (y0 * v2 - y2 * v0) + x2 * (y0 * v1 - y1 * v0)) / det;
    return [a, b, c];
  };
  const [a, c, e] = solve(d[0], d[2], d[4]);
  const [b, dd, f] = solve(d[1], d[3], d[5]);
  return [a, b, c, dd, e, f];
}

export const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross3 = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len3 = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export function norm3(a: V3): V3 {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function polyArea(p: V2[]): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

export interface BBox { minX: number; minY: number; maxX: number; maxY: number }
export function bboxOf(pts: ArrayLike<number>): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    const x = pts[i], y = pts[i + 1];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Do two convex polygons overlap by more than `eps` (penetration depth)?
 * Touching / sharing an edge is NOT an overlap. Separating-axis test.
 */
export function convexOverlap(a: ArrayLike<number>, b: ArrayLike<number>, eps: number): boolean {
  const na = a.length / 2, nb = b.length / 2;
  for (let pass = 0; pass < 2; pass++) {
    const p = pass === 0 ? a : b;
    const n = pass === 0 ? na : nb;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      let ax = -(p[2 * j + 1] - p[2 * i + 1]);
      let ay = p[2 * j] - p[2 * i];
      const l = Math.hypot(ax, ay);
      if (l < 1e-12) continue;
      ax /= l; ay /= l;
      let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
      for (let k = 0; k < na; k++) {
        const d = a[2 * k] * ax + a[2 * k + 1] * ay;
        if (d < minA) minA = d; if (d > maxA) maxA = d;
      }
      for (let k = 0; k < nb; k++) {
        const d = b[2 * k] * ax + b[2 * k + 1] * ay;
        if (d < minB) minB = d; if (d > maxB) maxB = d;
      }
      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (overlap <= eps) return false; // separated (or only touching)
    }
  }
  return true;
}

/** Proper segment intersection (crossing in the interiors, endpoints touching ignored). */
export function segmentsCross(a: V2, b: V2, c: V2, d: V2, eps = 1e-6): boolean {
  const o = (p: V2, q: V2, r: V2) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const la = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const lc = Math.hypot(d[0] - c[0], d[1] - c[1]) || 1;
  const o1 = o(a, b, c) / la, o2 = o(a, b, d) / la, o3 = o(c, d, a) / lc, o4 = o(c, d, b) / lc;
  const t = Math.max(eps, 1e-3); // 1 µm tolerance for "touching"
  return ((o1 > t && o2 < -t) || (o1 < -t && o2 > t)) && ((o3 > t && o4 < -t) || (o3 < -t && o4 > t));
}

/** Convex hull (monotone chain) of flat [x,y,...] points. */
export function convexHull(pts: ArrayLike<number>): V2[] {
  const n = pts.length / 2;
  const idx = Array.from({ length: n }, (_, i) => i).sort(
    (i, j) => pts[2 * i] - pts[2 * j] || pts[2 * i + 1] - pts[2 * j + 1],
  );
  const cr = (o: number, a: number, b: number) =>
    (pts[2 * a] - pts[2 * o]) * (pts[2 * b + 1] - pts[2 * o + 1]) -
    (pts[2 * a + 1] - pts[2 * o + 1]) * (pts[2 * b] - pts[2 * o]);
  const lo: number[] = [], up: number[] = [];
  for (const i of idx) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], i) <= 0) lo.pop(); lo.push(i); }
  for (let k = idx.length - 1; k >= 0; k--) { const i = idx[k]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], i) <= 0) up.pop(); up.push(i); }
  lo.pop(); up.pop();
  return lo.concat(up).map((i) => [pts[2 * i], pts[2 * i + 1]] as V2);
}
