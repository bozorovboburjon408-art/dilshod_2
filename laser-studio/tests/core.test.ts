import { describe, expect, it } from 'vitest';
import { computeLayout } from '../src/core/layout';
import { buildCube, buildFactory, buildHouse, buildTower } from '../src/core/demo';
import { transformMesh } from '../src/core/mesh';
import type { SheetSettings, UnfoldSettings } from '../src/core/types';

const U: UnfoldSettings = { tabWidth: 5, tabs: true, planarTol: 1, manualCuts: [], numbers: true, seamLabels: true };
const S = (w = 297, h = 420): SheetSettings => ({ width: w, height: h, margin: 8, gap: 3, allowRotate: true });

function run(mesh: ReturnType<typeof buildCube>, size: [number, number, number] | null, u = U, s = S()) {
  const { mesh: m } = transformMesh(mesh, [0, 0, 0], size);
  return computeLayout(m.positions, m.triMat, m.triTag, u, s, 't');
}

describe('unfolding', () => {
  it('cube: 6 panels, 5 folds, 7 seams with tabs, no collisions', () => {
    const r = run(buildCube(), [60, 60, 60]);
    expect(r.stats.panels).toBe(6);
    expect(r.joints.filter((j) => !j.cut).length).toBe(5 * 1 + 0); // spanning tree on 6 nodes
    expect(r.stats.seams).toBe(7);
    expect(r.stats.tabs + r.stats.tabsOmitted).toBe(7);
    expect(r.validation.overlaps).toBe(0);
    expect(r.validation.crossings).toBe(0);
    expect(r.validation.outOfBounds).toBe(0);
    expect(r.joints.every((j) => j.convex)).toBe(true);
    expect(r.sheets.length).toBe(1);
  });
  it('house, factory, tower unfold without overlaps and with mountain+valley folds', () => {
    for (const [mesh, size] of [[buildHouse(), [150, 120, 100]], [buildFactory(), [220, 140, 170]], [buildTower(), [100, 160, 100]]] as const) {
      const r = run(mesh, [...size]);
      expect(r.validation.overlaps, mesh.name).toBe(0);
      expect(r.validation.crossings, mesh.name).toBe(0);
      expect(r.validation.outOfBounds, mesh.name).toBe(0);
      expect(r.validation.unplaced, mesh.name).toBe(0);
      expect(r.stats.panels).toBeGreaterThan(5);
      // every panel placed on a sheet
      expect(r.panels.every((p) => p.sheet >= 0)).toBe(true);
      // assembly numbers are a permutation 1..N
      expect(r.panels.map((p) => p.number).sort((a, b) => a - b)).toEqual(r.panels.map((_, i) => i + 1));
    }
  });
  it('unfolding preserves edge lengths within an island (isometry)', () => {
    const r = run(buildHouse(), [150, 120, 100]);
    for (const p of r.panels) {
      for (let i = 0; i < p.sheetTri.length / 6; i++) {
        const l = p.localTri.slice(6 * i, 6 * i + 6), s = p.sheetTri.slice(6 * i, 6 * i + 6);
        for (let k = 0; k < 3; k++) {
          const k2 = (k + 1) % 3;
          const dl = Math.hypot(l[2 * k] - l[2 * k2], l[2 * k + 1] - l[2 * k2 + 1]);
          const ds = Math.hypot(s[2 * k] - s[2 * k2], s[2 * k + 1] - s[2 * k2 + 1]);
          expect(Math.abs(dl - ds)).toBeLessThan(1e-6);
        }
      }
    }
  });
  it('splits onto several sheets when it does not fit', () => {
    const r = run(buildFactory(), [330, 210, 260], U, S(210, 297));
    expect(r.stats.sheets).toBeGreaterThan(1);
    expect(r.validation.overlaps).toBe(0);
  });
  it('manual cut edges change the layout', () => {
    const base = run(buildCube(), [60, 60, 60]);
    const treeJoint = base.joints.find((j) => !j.cut)!;
    const r2 = run(buildCube(), [60, 60, 60], { ...U, manualCuts: [treeJoint.key] });
    const j2 = r2.joints.find((j) => j.key === treeJoint.key)!;
    expect(j2.cut).toBe(true);
    expect(j2.manual).toBe(true);
  });
  it('respects margin of at least the configured value', () => {
    const r = run(buildHouse(), [150, 120, 100], U, { ...S(), margin: 12 });
    for (const sh of r.sheets) for (const c of sh.cut) for (const [x, y] of c.pts) {
      expect(x).toBeGreaterThanOrEqual(12 - 0.01); expect(y).toBeGreaterThanOrEqual(12 - 0.01);
      expect(x).toBeLessThanOrEqual(297 - 12 + 0.01); expect(y).toBeLessThanOrEqual(420 - 12 + 0.01);
    }
  });
});

import { weld } from '../src/core/mesh';
import { DEMOS } from '../src/core/demo';
describe('demo models', () => {
  for (const d of DEMOS) {
    it(`${d.id} is a watertight, consistently oriented mesh`, () => {
      const m = d.build();
      const { V, T } = weld(m.positions);
      const nV = V.length / 3;
      const directed = new Map<number, number>();
      for (let t = 0; t < T.length / 3; t++) for (let k = 0; k < 3; k++) {
        const a = T[3 * t + k], b = T[3 * t + (k + 1) % 3];
        directed.set(a * nV + b, (directed.get(a * nV + b) ?? 0) + 1);
      }
      let bad = 0;
      directed.forEach((c, key) => { const a = Math.floor(key / nV), b = key % nV; if (c !== 1 || directed.get(b * nV + a) !== 1) bad++; });
      expect(bad).toBe(0);
      // outward orientation: signed volume > 0
      let vol = 0;
      for (let t = 0; t < T.length / 3; t++) {
        const a = T[3 * t] * 3, b = T[3 * t + 1] * 3, c = T[3 * t + 2] * 3;
        vol += V[a] * (V[b + 1] * V[c + 2] - V[b + 2] * V[c + 1]) - V[a + 1] * (V[b] * V[c + 2] - V[b + 2] * V[c]) + V[a + 2] * (V[b] * V[c + 1] - V[b + 1] * V[c]);
      }
      expect(vol).toBeGreaterThan(0);
    });
  }
});
