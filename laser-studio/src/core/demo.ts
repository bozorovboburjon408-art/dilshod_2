// Procedural demo models (closed solids). Winding is fixed later by cleanMesh().
import { cleanMesh } from './mesh';
import type { MeshData, SourceMaterial } from './types';

/** Ear-clipping triangulation for simple (possibly non-convex) planar polygons. Returns index triples. */
function earClip(pts: number[][]): [number, number, number][] {
  const n = pts.length;
  // project onto the dominant plane
  let nx = 0, ny = 0, nz = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  const proj = (p: number[]): [number, number] => (az >= ax && az >= ay ? [p[0], p[1]] : ax >= ay ? [p[1], p[2]] : [p[0], p[2]]);
  const q = pts.map(proj);
  let area = 0;
  for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  const sign = area >= 0 ? 1 : -1;
  const idx = Array.from({ length: n }, (_, i) => i);
  const out: [number, number, number][] = [];
  const cross = (a: [number, number], b: [number, number], c: [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let guard = 0;
  while (idx.length > 3 && guard++ < 10000) {
    let clipped = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      if (cross(q[i0], q[i1], q[i2]) * sign <= 1e-9) continue; // reflex
      let inside = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        if (cross(q[i0], q[i1], q[j]) * sign >= 0 && cross(q[i1], q[i2], q[j]) * sign >= 0 && cross(q[i2], q[i0], q[j]) * sign >= 0) { inside = true; break; }
      }
      if (inside) continue;
      out.push([i0, i1, i2]); idx.splice(k, 1); clipped = true; break;
    }
    if (!clipped) break;
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}

class Builder {
  pos: number[] = [];
  mat: number[] = [];
  tag: number[] = [];
  tags: string[] = ['-'];
  tagId(name: string) {
    let i = this.tags.indexOf(name);
    if (i < 0) { i = this.tags.length; this.tags.push(name); }
    return i;
  }
  tri(a: number[], b: number[], c: number[], m: number, tag = '-') {
    this.pos.push(...a, ...b, ...c); this.mat.push(m); this.tag.push(this.tagId(tag));
  }
  quad(a: number[], b: number[], c: number[], d: number[], m: number, tag = '-') {
    this.tri(a, b, c, m, tag); this.tri(a, c, d, m, tag);
  }
  fan(pts: number[][], m: number, tag = '-') {
    for (const [a, b, c] of earClip(pts)) this.tri(pts[a], pts[b], pts[c], m, tag);
  }
  /** prism: profile in XY (CCW) extruded along Z from z0 to z1 */
  extrude(profile: [number, number][], z0: number, z1: number, edgeMat: (i: number) => [number, string], capMat: [number, string], backMat?: [number, string]) {
    const n = profile.length;
    this.fan(profile.map(([x, y]) => [x, y, z1]), capMat[0], capMat[1]);
    const bm = backMat ?? capMat;
    this.fan(profile.map(([x, y]) => [x, y, z0]).reverse(), bm[0], bm[1]);
    for (let i = 0; i < n; i++) {
      const [x0, y0] = profile[i], [x1, y1] = profile[(i + 1) % n];
      const [m, t] = edgeMat(i);
      this.quad([x0, y0, z0], [x1, y1, z0], [x1, y1, z1], [x0, y0, z1], m, t);
    }
  }
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number, tag = '-') {
    this.extrude([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], z0, z1, () => [m, tag], [m, tag + ':f'], [m, tag + ':b']);
  }
  frustum(cx: number, cz: number, r0: number, r1: number, y0: number, y1: number, n: number, m: number, capM: number, tag = '-') {
    const ring = (r: number, y: number, i: number) => [cx + r * Math.cos((2 * Math.PI * i) / n), y, cz + r * Math.sin((2 * Math.PI * i) / n)];
    this.fan(Array.from({ length: n }, (_, i) => ring(r0, y0, i)), capM, tag + ':bot');
    this.fan(Array.from({ length: n }, (_, i) => ring(r1, y1, i)), capM, tag + ':top');
    for (let i = 0; i < n; i++) this.quad(ring(r0, y0, i), ring(r0, y0, i + 1), ring(r1, y1, i + 1), ring(r1, y1, i), m, tag);
  }
  finish(name: string, materials: SourceMaterial[]): MeshData {
    return cleanMesh({
      name, positions: Float32Array.from(this.pos), triMat: Uint16Array.from(this.mat), triTag: Uint16Array.from(this.tag),
      materials, tags: this.tags,
    });
  }
}

const M = (name: string, color: string, lib?: string, mmPerTile = 40): SourceMaterial => ({ name, color, lib, mmPerTile });

export interface DemoDef { id: string; nameKey: string; build: () => MeshData; decals?: Record<string, DemoDecal[]>; sizeMm: number; sheet: 'A4' | 'A3' | 'A2' }
export interface DemoDecal { kind: 'lib' | 'text'; id: string; x: number; y: number; w: number; h: number; text?: string }

export function buildCube(): MeshData {
  const b = new Builder();
  b.box(-0.5, 0, -0.5, 0.5, 1, 0.5, 0);
  return b.finish('cube', [M('cube', '#c9a66b', 'wood')]);
}

export function buildHouse(): MeshData {
  const b = new Builder();
  const w = 90, h = 50, r = 28, d = 60;
  b.extrude(
    [[0, 0], [w, 0], [w, h], [w / 2, h + r], [0, h]], 0, d,
    (i) => (i === 0 ? [2, 'bottom'] : i === 1 ? [0, 'side'] : i === 4 ? [0, 'side2'] : [1, 'roof']),
    [0, 'front'], [0, 'back'],
  );
  return b.finish('house', [M('walls', '#e8dcc4', 'plaster', 60), M('roof', '#b5523b', 'roof_tiles', 30), M('base', '#9aa0a6', 'concrete', 60)]);
}
export const HOUSE_DECALS: Record<string, DemoDecal[]> = {
  front: [
    { kind: 'lib', id: 'door', x: 0, y: -19.5, w: 14, h: 26 },
    { kind: 'lib', id: 'window', x: -26, y: -2.5, w: 16, h: 18 },
    { kind: 'lib', id: 'window', x: 26, y: -2.5, w: 16, h: 18 },
    { kind: 'lib', id: 'window', x: 0, y: 28.5, w: 12, h: 12 },
  ],
  back: [{ kind: 'lib', id: 'window', x: -20, y: -2.5, w: 16, h: 18 }, { kind: 'lib', id: 'window', x: 20, y: -2.5, w: 16, h: 18 }],
  side: [{ kind: 'lib', id: 'window', x: 0, y: 0, w: 14, h: 16 }],
  side2: [{ kind: 'lib', id: 'window', x: 0, y: 0, w: 14, h: 16 }],
};

export function buildFactory(): MeshData {
  const b = new Builder();
  // production hall with sawtooth roof (extruded profile)
  const L = 110, H = 34, sw = 22;
  const prof: [number, number][] = [[0, 0], [L, 0], [L, H]];
  for (let x = L; x > 0; x -= sw) { prof.push([x - sw, H + 8]); if (x - sw > 0) prof.push([x - sw, H]); }
  prof.push([0, H]);
  // fix: ensure last point arrangement is a simple polygon
  b.extrude(prof, 0, 56, (i) => (i === 0 ? [2, 'floor'] : i === 1 ? [0, 'wall'] : i === prof.length - 1 ? [0, 'wall'] : [1, 'roof' + i]), [0, 'hallF'], [0, 'hallB']);
  // office block
  b.box(115, 0, 0, 150, 26, 36, 3, 'office');
  // chimney
  b.frustum(-22, 14, 7, 4.2, 0, 85, 16, 4, 4, 'chimney');
  // storage tanks
  b.frustum(135, 80, 14, 14, 0, 36, 24, 5, 5, 'tank');
  b.frustum(100, 82, 11, 11, 0, 30, 24, 5, 5, 'tank2');
  return b.finish('factory', [
    M('wall', '#c7cdd1', 'corrugated', 50), M('roof', '#8e969c', 'roof_metal', 40), M('floor', '#7b7f83', 'concrete', 60),
    M('office', '#d9d4c7', 'facade', 60), M('chimney', '#a85b44', 'brick', 30), M('tank', '#d8dde1', 'steel_plate', 50),
  ]);
}

export function buildTower(): MeshData {
  const b = new Builder();
  const tiers: [number, number, number][] = [[60, 0, 40], [44, 40, 85], [28, 85, 120]]; // half-size, y0, y1
  // closed stepped tower made of 3 prisms; shared faces are kept (small, hidden) -> use rings instead
  for (let i = 0; i < tiers.length; i++) {
    const [s, y0, y1] = tiers[i];
    const sn = i + 1 < tiers.length ? tiers[i + 1][0] : 0;
    const f = (x: number, y: number, z: number) => [x, y, z];
    // walls
    b.quad(f(-s, y0, s), f(s, y0, s), f(s, y1, s), f(-s, y1, s), 0, 'wall' + i);
    b.quad(f(s, y0, s), f(s, y0, -s), f(s, y1, -s), f(s, y1, s), 0, 'wall' + i);
    b.quad(f(s, y0, -s), f(-s, y0, -s), f(-s, y1, -s), f(s, y1, -s), 0, 'wall' + i);
    b.quad(f(-s, y0, -s), f(-s, y0, s), f(-s, y1, s), f(-s, y1, -s), 0, 'wall' + i);
    if (i === 0) b.quad(f(-s, y0, -s), f(s, y0, -s), f(s, y0, s), f(-s, y0, s), 2, 'bottom');
    // top: ring around the next tier, or full roof / spire
    if (sn) {
      b.quad(f(-s, y1, s), f(s, y1, s), f(sn, y1, sn), f(-sn, y1, sn), 1, 'ring' + i);
      b.quad(f(s, y1, s), f(s, y1, -s), f(sn, y1, -sn), f(sn, y1, sn), 1, 'ring' + i);
      b.quad(f(s, y1, -s), f(-s, y1, -s), f(-sn, y1, -sn), f(sn, y1, -sn), 1, 'ring' + i);
      b.quad(f(-s, y1, -s), f(-s, y1, s), f(-sn, y1, sn), f(-sn, y1, -sn), 1, 'ring' + i);
    } else {
      const apex = f(0, y1 + 36, 0);
      b.tri(f(-s, y1, s), f(s, y1, s), apex, 1, 'spire');
      b.tri(f(s, y1, s), f(s, y1, -s), apex, 1, 'spire');
      b.tri(f(s, y1, -s), f(-s, y1, -s), apex, 1, 'spire');
      b.tri(f(-s, y1, -s), f(-s, y1, s), apex, 1, 'spire');
    }
  }
  return b.finish('tower', [M('facade', '#c8d3de', 'glass', 36), M('roof', '#5d6b78', 'metal', 40), M('base', '#8a8f94', 'concrete', 60)]);
}

export const DEMOS: DemoDef[] = [
  { id: 'house', nameKey: 'demo.house', build: buildHouse, decals: HOUSE_DECALS, sizeMm: 90, sheet: 'A4' },
  { id: 'factory', nameKey: 'demo.factory', build: buildFactory, sizeMm: 240, sheet: 'A3' },
  { id: 'tower', nameKey: 'demo.tower', build: buildTower, sizeMm: 120, sheet: 'A4' },
  { id: 'cube', nameKey: 'demo.cube', build: buildCube, sizeMm: 60, sheet: 'A4' },
];
