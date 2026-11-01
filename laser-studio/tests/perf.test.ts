import { describe, expect, it } from 'vitest';
import { computeLayout } from '../src/core/layout';
import { cleanMesh, simplifyMesh, transformMesh } from '../src/core/mesh';
import type { MeshData } from '../src/core/types';

function sphere(nu: number, nv: number): MeshData {
  const pos: number[] = [];
  const P = (u: number, v: number) => { const a = (2 * Math.PI * u) / nu, b = (Math.PI * v) / nv; return [Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)]; };
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if (j > 0) pos.push(...a, ...b, ...c);
    if (j < nv - 1) pos.push(...a, ...c, ...d);
  }
  const n = pos.length / 9;
  return cleanMesh({ name: 'sphere', positions: Float32Array.from(pos), triMat: new Uint16Array(n), triTag: new Uint16Array(n), materials: [{ name: 'm', color: '#ccc' }], tags: ['-'] });
}
const U = { tabWidth: 4, tabs: true, planarTol: 1, manualCuts: [], numbers: true, seamLabels: true };

describe('complex meshes', () => {
  for (const [nu, nv, w, h] of [[16, 10, 210, 297], [24, 16, 297, 420]] as const) {
    it(`sphere ${nu}x${nv}: no overlaps, reasonable time`, () => {
      const { mesh } = transformMesh(sphere(nu, nv), [0, 0, 0], [120, 120, 120]);
      const t0 = performance.now();
      const r = computeLayout(mesh.positions, mesh.triMat, mesh.triTag, U, { width: w, height: h, margin: 8, gap: 3, allowRotate: true }, 's');
      const ms = performance.now() - t0;
      console.log(`sphere ${nu}x${nv}: tris=${r.stats.triangles} panels=${r.stats.panels} islands=${r.stats.islands} sheets=${r.stats.sheets} tabs=${r.stats.tabs}/${r.stats.seams} omitted=${r.stats.tabsOmitted} ${Math.round(ms)}ms`, r.validation);
      expect(r.validation.overlaps).toBe(0);
      expect(r.validation.crossings).toBe(0);
      expect(r.validation.unplaced).toBe(0);
      expect(ms).toBeLessThan(20000);
    });
  }
  it('simplifies a dense mesh', () => {
    const m = sphere(120, 80); // ~19k tris
    const s = simplifyMesh(m, 3000);
    expect(s.positions.length / 9).toBeLessThanOrEqual(3000);
    expect(s.positions.length / 9).toBeGreaterThan(500);
  });
});
