import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import UTIF from 'utif';
import { cleanMesh } from '../core/mesh';
import type { MeshData, SourceMaterial } from '../core/types';

export class LoadError extends Error {
  constructor(public code: 'noFiles' | 'unsupported' | 'empty' | 'parse' | 'image', public detail = '') { super(code + ': ' + detail); }
}

export interface SourceTexture { img: HTMLCanvasElement; flipY: boolean }
export interface LoadedModel {
  name: string;
  format: string;
  mesh: MeshData;
  textures: Map<string, SourceTexture>;
  defaultRot: [number, number, number];
}

const MODEL_EXT = ['glb', 'gltf', 'fbx', 'obj', 'stl'];
const ext = (n: string) => (n.split('.').pop() ?? '').toLowerCase();
const base = (n: string) => decodeURIComponent(n.split(/[\\/]/).pop() ?? n).toLowerCase();

function makeTracker() {
  const manager = new THREE.LoadingManager();
  let pending = 0;
  let waiters: (() => void)[] = [];
  const start = manager.itemStart, end = manager.itemEnd;
  manager.itemStart = (u: string) => { pending++; start(u); };
  manager.itemEnd = (u: string) => {
    pending--; end(u);
    if (pending <= 0) { const w = waiters; waiters = []; w.forEach((f) => f()); }
  };
  const idle = (): Promise<void> => (pending <= 0 ? Promise.resolve() : new Promise((r) => waiters.push(r)));
  return { manager, idle };
}

function toCanvas(img: any, maxSize = 2048): HTMLCanvasElement | null {
  const w = img?.naturalWidth || img?.videoWidth || img?.width, h = img?.naturalHeight || img?.videoHeight || img?.height;
  if (!w || !h) return null;
  const k = Math.min(1, maxSize / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
  try { c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); } catch { return null; }
  return c;
}

export function extractMesh(root: THREE.Object3D, name: string): { mesh: MeshData; textures: Map<string, SourceTexture> } {
  root.updateMatrixWorld(true);
  const pos: number[] = [], uvs: number[] = [], triMat: number[] = [];
  const materials: SourceMaterial[] = [];
  const matIndex = new Map<string, number>();
  const textures = new Map<string, SourceTexture>();
  const v = new THREE.Vector3();
  let anyUv = false;

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    const g = mesh.geometry;
    const p = g.getAttribute('position');
    if (!p) return;
    const uv = g.getAttribute('uv');
    const idx = g.index;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const groups = g.groups.length ? g.groups : [{ start: 0, count: idx ? idx.count : p.count, materialIndex: 0 }];
    const resolve = (mi: number): number => {
      const m = (mats[mi] ?? mats[0]) as THREE.MeshStandardMaterial;
      const key = m.uuid + (uv ? ':uv' : ':nouv');
      let id = matIndex.get(key);
      if (id !== undefined) return id;
      id = materials.length; matIndex.set(key, id);
      let mapKey: string | undefined;
      const map = (m as any).map as THREE.Texture | null | undefined;
      if (map && map.image && uv) {
        const c = toCanvas(map.image);
        if (c) { mapKey = 'src' + textures.size; textures.set(mapKey, { img: c, flipY: map.flipY }); }
      }
      const col = (m as any).color as THREE.Color | undefined;
      materials.push({ name: m.name || `material ${id + 1}`, color: '#' + (col ? col.getHexString() : 'c8ccd2'), mapKey });
      return id;
    };
    for (const grp of groups) {
      const mid = resolve(grp.materialIndex ?? 0);
      for (let i = grp.start; i + 2 < grp.start + grp.count; i += 3) {
        for (let k = 0; k < 3; k++) {
          const vi = idx ? idx.getX(i + k) : i + k;
          v.fromBufferAttribute(p, vi).applyMatrix4(mesh.matrixWorld);
          pos.push(v.x, v.y, v.z);
          if (uv) { uvs.push(uv.getX(vi), uv.getY(vi)); anyUv = true; } else uvs.push(0, 0);
        }
        triMat.push(mid);
      }
    }
  });
  if (!pos.length) throw new LoadError('empty');
  if (!materials.length) materials.push({ name: 'default', color: '#c8ccd2' });
  const raw: MeshData = {
    name, positions: Float32Array.from(pos), uvs: anyUv ? Float32Array.from(uvs) : undefined,
    triMat: Uint16Array.from(triMat), triTag: new Uint16Array(triMat.length), materials, tags: ['-'],
  };
  return { mesh: cleanMesh(raw), textures };
}

export async function loadModelFiles(files: File[]): Promise<LoadedModel> {
  if (!files.length) throw new LoadError('noFiles');
  const main = MODEL_EXT.map((e) => files.find((f) => ext(f.name) === e)).find(Boolean);
  if (!main) throw new LoadError('unsupported', files.map((f) => f.name).join(', '));
  const urls = new Map<string, string>();
  for (const f of files) urls.set(base(f.name), URL.createObjectURL(f));
  const { manager, idle } = makeTracker();
  manager.setURLModifier((u) => {
    if (u.startsWith('data:') || u.startsWith('blob:')) return u;
    return urls.get(base(u)) ?? u;
  });
  const name = main.name.replace(/\.[^.]+$/, '');
  try {
    const e = ext(main.name);
    let root: THREE.Object3D;
    let defaultRot: [number, number, number] = [0, 0, 0];
    if (e === 'stl') {
      const geo = new STLLoader().parse(await main.arrayBuffer());
      root = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xc8ccd2 }));
      defaultRot = [-90, 0, 0]; // STL is conventionally Z-up
    } else if (e === 'obj') {
      const loader = new OBJLoader(manager);
      const mtl = files.find((f) => ext(f.name) === 'mtl');
      if (mtl) {
        const mats = new MTLLoader(manager).parse(await mtl.text(), '');
        mats.preload();
        loader.setMaterials(mats);
      }
      root = loader.parse(await main.text());
      await idle();
    } else if (e === 'fbx') {
      root = new FBXLoader(manager).parse(await main.arrayBuffer(), '');
      await idle();
    } else {
      const data = e === 'glb' ? await main.arrayBuffer() : await main.text();
      root = (await new GLTFLoader(manager).parseAsync(data, '')).scene;
      await idle();
    }
    const { mesh, textures } = extractMesh(root, name);
    root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry.dispose(); } });
    return { name, format: e.toUpperCase(), mesh, textures, defaultRot };
  } catch (err) {
    if (err instanceof LoadError) throw err;
    throw new LoadError('parse', err instanceof Error ? err.message : String(err));
  } finally {
    urls.forEach((u) => URL.revokeObjectURL(u));
  }
}

/** PNG / JPG / TIFF (and other browser-decodable formats) -> canvas. */
export async function loadImageFile(file: File, maxSize = 4096): Promise<HTMLCanvasElement> {
  const e = ext(file.name);
  try {
    if (e === 'tif' || e === 'tiff') {
      const buf = await file.arrayBuffer();
      const ifds = UTIF.decode(buf);
      if (!ifds.length) throw new Error('empty TIFF');
      UTIF.decodeImage(buf, ifds[0]);
      const rgba = UTIF.toRGBA8(ifds[0]);
      const w = ifds[0].width as number, h = ifds[0].height as number;
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
      return toCanvas(c, maxSize)!;
    }
    const bmp = await createImageBitmap(file);
    const c = toCanvas(bmp, maxSize);
    bmp.close();
    if (!c) throw new Error('decode');
    return c;
  } catch (err) {
    throw new LoadError('image', `${file.name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}
