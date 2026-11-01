import type { MeshData } from './types';

export function bboxOfMesh(m: MeshData) {
  const p = m.positions;
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    if (p[i] < minX) minX = p[i]; if (p[i] > maxX) maxX = p[i];
    if (p[i + 1] < minY) minY = p[i + 1]; if (p[i + 1] > maxY) maxY = p[i + 1];
    if (p[i + 2] < minZ) minZ = p[i + 2]; if (p[i + 2] > maxZ) maxZ = p[i + 2];
  }
  return { min: [minX, minY, minZ] as [number, number, number], max: [maxX, maxY, maxZ] as [number, number, number] };
}

/** Weld coincident vertices. Returns welded vertices and indexed triangles. */
export function weld(positions: ArrayLike<number>, epsRel = 1e-6) {
  const nTri = positions.length / 9;
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]); maxZ = Math.max(maxZ, positions[i + 2]);
  }
  const diag = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const cell = diag * epsRel * 10; // weld radius ~ cell/2 (robust enough with snapping)
  const map = new Map<string, number>();
  const verts: number[] = [];
  const T = new Int32Array(nTri * 3);
  for (let i = 0; i < nTri * 3; i++) {
    const x = positions[3 * i], y = positions[3 * i + 1], z = positions[3 * i + 2];
    const key = Math.round(x / cell) + ',' + Math.round(y / cell) + ',' + Math.round(z / cell);
    let id = map.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      map.set(key, id);
      verts.push(x, y, z);
    }
    T[i] = id;
  }
  return { V: Float64Array.from(verts), T, diag };
}

/**
 * Remove degenerate triangles and make winding consistent (per connected
 * component). Closed components are oriented so that normals point outward.
 * Open components keep their orientation relative to the first triangle.
 */
export function cleanMesh(src: MeshData): MeshData {
  const nIn = src.positions.length / 9;
  const { V, T, diag } = weld(src.positions);
  const keep: number[] = [];
  const minArea = diag * diag * 1e-10;
  for (let t = 0; t < nIn; t++) {
    const a = T[3 * t], b = T[3 * t + 1], c = T[3 * t + 2];
    if (a === b || b === c || a === c) continue;
    const ux = V[3 * b] - V[3 * a], uy = V[3 * b + 1] - V[3 * a + 1], uz = V[3 * b + 2] - V[3 * a + 2];
    const vx = V[3 * c] - V[3 * a], vy = V[3 * c + 1] - V[3 * a + 1], vz = V[3 * c + 2] - V[3 * a + 2];
    const area = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    if (area > minArea) keep.push(t);
  }
  const n = keep.length;
  const tri = new Int32Array(n * 3);
  keep.forEach((t, i) => { tri[3 * i] = T[3 * t]; tri[3 * i + 1] = T[3 * t + 1]; tri[3 * i + 2] = T[3 * t + 2]; });

  // edge -> triangles
  const nV = V.length / 3;
  const ekey = (a: number, b: number) => (a < b ? a * nV + b : b * nV + a);
  const edgeTris = new Map<number, number[]>();
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const key = ekey(tri[3 * t + k], tri[3 * t + (k + 1) % 3]);
    const l = edgeTris.get(key);
    if (l) l.push(t); else edgeTris.set(key, [t]);
  }
  const flipped = new Uint8Array(n);
  const visited = new Uint8Array(n);
  const hasDirected = (t: number, a: number, b: number) => {
    for (let k = 0; k < 3; k++) if (tri[3 * t + k] === a && tri[3 * t + (k + 1) % 3] === b) return true;
    return false;
  };
  const flipTri = (t: number) => {
    const tmp = tri[3 * t + 1]; tri[3 * t + 1] = tri[3 * t + 2]; tri[3 * t + 2] = tmp;
    flipped[t] ^= 1;
  };
  for (let s = 0; s < n; s++) {
    if (visited[s]) continue;
    const comp: number[] = [s];
    visited[s] = 1;
    let closed = true;
    for (let qi = 0; qi < comp.length; qi++) {
      const t = comp[qi];
      for (let k = 0; k < 3; k++) {
        const a = tri[3 * t + k], b = tri[3 * t + (k + 1) % 3];
        const l = edgeTris.get(ekey(a, b))!;
        if (l.length !== 2) { closed = false; continue; }
        const o = l[0] === t ? l[1] : l[0];
        if (visited[o]) continue;
        visited[o] = 1;
        if (hasDirected(o, a, b)) flipTri(o); // neighbour must traverse b->a
        comp.push(o);
      }
    }
    if (closed) {
      let vol = 0;
      for (const t of comp) {
        const a = tri[3 * t] * 3, b = tri[3 * t + 1] * 3, c = tri[3 * t + 2] * 3;
        vol += V[a] * (V[b + 1] * V[c + 2] - V[b + 2] * V[c + 1])
             - V[a + 1] * (V[b] * V[c + 2] - V[b + 2] * V[c])
             + V[a + 2] * (V[b] * V[c + 1] - V[b + 1] * V[c]);
      }
      if (vol < 0) for (const t of comp) flipTri(t);
    }
  }

  // Build output soup (original float positions, corner swap where flipped)
  const positions = new Float32Array(n * 9);
  const uvs = src.uvs ? new Float32Array(n * 6) : undefined;
  const triMat = new Uint16Array(n);
  const triTag = new Uint16Array(n);
  keep.forEach((t, i) => {
    const order = flipped[i] ? [0, 2, 1] : [0, 1, 2];
    for (let k = 0; k < 3; k++) {
      const c = order[k];
      for (let d = 0; d < 3; d++) positions[9 * i + 3 * k + d] = src.positions[9 * t + 3 * c + d];
      if (uvs && src.uvs) { uvs[6 * i + 2 * k] = src.uvs[6 * t + 2 * c]; uvs[6 * i + 2 * k + 1] = src.uvs[6 * t + 2 * c + 1]; }
    }
    triMat[i] = src.triMat[t];
    triTag[i] = src.triTag[t];
  });
  return { ...src, positions, uvs, triMat, triTag };
}

/** Rotate (degrees, XYZ order) then scale to exact per-axis size in mm; centred on X/Z, resting on Y=0. */
export function transformMesh(
  base: MeshData,
  rot: [number, number, number],
  sizeMm: [number, number, number] | null,
): { mesh: MeshData; size: [number, number, number] } {
  const [rx, ry, rz] = rot.map((d) => (d * Math.PI) / 180);
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const p = base.positions;
  const out = new Float32Array(p.length);
  for (let i = 0; i < p.length; i += 3) {
    let x = p[i], y = p[i + 1], z = p[i + 2];
    let t = y * cx - z * sx; z = y * sx + z * cx; y = t;
    t = x * cy + z * sy; z = -x * sy + z * cy; x = t;
    t = x * cz - y * sz; y = x * sz + y * cz; x = t;
    out[i] = x; out[i + 1] = y; out[i + 2] = z;
  }
  const tmp: MeshData = { ...base, positions: out };
  const bb = bboxOfMesh(tmp);
  const ext = [bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]];
  const target = sizeMm ?? [ext[0], ext[1], ext[2]];
  const k = ext.map((e, i) => (e > 1e-9 ? target[i] / e : 1));
  for (let i = 0; i < out.length; i += 3) {
    out[i] = (out[i] - (bb.min[0] + bb.max[0]) / 2) * k[0];
    out[i + 1] = (out[i + 1] - bb.min[1]) * k[1];
    out[i + 2] = (out[i + 2] - (bb.min[2] + bb.max[2]) / 2) * k[2];
  }
  return { mesh: { ...base, positions: out }, size: [ext[0] * k[0], ext[1] * k[1], ext[2] * k[2]] };
}

/** Vertex-clustering decimation to roughly `target` triangles. UVs are dropped. */
export function simplifyMesh(src: MeshData, target: number): MeshData {
  const nIn = src.positions.length / 9;
  if (nIn <= target) return src;
  const bb = bboxOfMesh(src);
  const ext = Math.max(bb.max[0] - bb.min[0], bb.max[1] - bb.min[1], bb.max[2] - bb.min[2]) || 1;
  let lo = 2, hi = 512, best: MeshData | null = null;
  const run = (res: number): MeshData => {
    const cell = ext / res;
    const idMap = new Map<string, number>();
    const acc: number[] = [];
    const cnt: number[] = [];
    const idx = new Int32Array(nIn * 3);
    for (let i = 0; i < nIn * 3; i++) {
      const x = src.positions[3 * i], y = src.positions[3 * i + 1], z = src.positions[3 * i + 2];
      const key = Math.floor((x - bb.min[0]) / cell) + ',' + Math.floor((y - bb.min[1]) / cell) + ',' + Math.floor((z - bb.min[2]) / cell);
      let id = idMap.get(key);
      if (id === undefined) { id = cnt.length; idMap.set(key, id); acc.push(0, 0, 0); cnt.push(0); }
      acc[3 * id] += x; acc[3 * id + 1] += y; acc[3 * id + 2] += z; cnt[id]++;
      idx[i] = id;
    }
    const pos: number[] = [], mats: number[] = [], tags: number[] = [];
    const seen = new Set<string>();
    for (let t = 0; t < nIn; t++) {
      const a = idx[3 * t], b = idx[3 * t + 1], c = idx[3 * t + 2];
      if (a === b || b === c || a === c) continue;
      const k = [a, b, c].sort((u, v) => u - v).join('_');
      if (seen.has(k)) continue;
      seen.add(k);
      for (const id of [a, b, c]) pos.push(acc[3 * id] / cnt[id], acc[3 * id + 1] / cnt[id], acc[3 * id + 2] / cnt[id]);
      mats.push(src.triMat[t]); tags.push(src.triTag[t]);
    }
    return { ...src, positions: Float32Array.from(pos), uvs: undefined, triMat: Uint16Array.from(mats), triTag: Uint16Array.from(tags) };
  };
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = run(mid);
    if (m.positions.length / 9 <= target) { best = m; lo = mid + 1; } else hi = mid;
  }
  return cleanMesh(best ?? run(lo));
}
