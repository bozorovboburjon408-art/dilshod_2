import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useLoader, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { OBJLoader } from 'three-stdlib';
import * as THREE from 'three';
import { useData } from '../lib/data';
import { useUI } from '../lib/store';
import type { Part } from '../lib/types';
import { DEFAULT_CAMERA, EKG10_NODES, type NodeDef } from '../model/layout';

const ACCENT = new THREE.Color('#ff7a1a');
const ASM_COLORS = ['#e4572e', '#17bebb', '#ffc914', '#76b041', '#9b5de5', '#f15bb5', '#00bbf9', '#8d99ae', '#fb8500'];
export const asmColor = (i: number) => ASM_COLORS[i % ASM_COLORS.length];

interface Entry {
  part: Part; node: THREE.Object3D; base: THREE.Vector3; box: THREE.Box3; center: THREE.Vector3;
  cur: THREE.Vector3; target: THREE.Vector3; parentInv: THREE.Matrix4; zeroLocal: THREE.Vector3; meshes: THREE.Mesh[];
}
type Mat = THREE.MeshStandardMaterial;
const matsOf = (m: THREE.Mesh) => (Array.isArray(m.material) ? m.material : [m.material]) as Mat[];

// ---------- model content ----------
function Geometry({ n }: { n: NodeDef }) {
  const s = n.shape;
  if (s.kind === 'box') return <boxGeometry args={s.size} />;
  if (s.kind === 'cyl') return <cylinderGeometry args={[s.r, s.r, s.h, 40]} />;
  if (s.kind === 'hex') return <cylinderGeometry args={[s.r, s.r, s.h, 6]} />;
  return <torusGeometry args={[s.R, s.t, 16, 72]} />;
}

function ProceduralContent({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]); // passive: parent ref is attached by now
  return (
    <group name="EKG10">
      {EKG10_NODES.map((n) => (
        <mesh key={n.id} name={n.id} position={n.pos} rotation={n.rot} castShadow receiveShadow>
          <Geometry n={n} />
          <meshStandardMaterial color={n.color} metalness={0.35} roughness={0.55} />
        </mesh>
      ))}
    </group>
  );
}

/** Real models have unknown units/origin: normalise to ~24 m width, standing on the ground. */
function fit(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3());
  const k = 24 / Math.max(size.x, size.y, size.z || 1, 1e-6);
  obj.scale.multiplyScalar(k);
  obj.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(obj);
  const c = b2.getCenter(new THREE.Vector3());
  obj.position.set(5 - c.x, -b2.min.y, -c.z);
}

function LoadedContent({ obj, onReady }: { obj: THREE.Object3D; onReady: () => void }) {
  useLayoutEffect(() => { fit(obj); obj.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }, [obj]);
  useEffect(() => { onReady(); }, [obj, onReady]);
  return <primitive object={obj} />;
}
function GltfContent({ url, onReady }: { url: string; onReady: () => void }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => scene.clone(true), [scene]);
  return <LoadedContent obj={obj} onReady={onReady} />;
}
function ObjContent({ url, onReady }: { url: string; onReady: () => void }) {
  const src = useLoader(OBJLoader, url);
  const obj = useMemo(() => src.clone(true), [src]);
  return <LoadedContent obj={obj} onReady={onReady} />;
}

// ---------- engine: registry, visuals, explode, camera ----------
export function Engine({ url, format }: { url: string | null; format: string | null }) {
  const { catalog, partByNode, asmById } = useData();
  const ui = useUI();
  const root = useRef<THREE.Group>(null!);
  const reg = useRef(new Map<string, Entry>());
  const animating = useRef(false);
  const [ready, setReady] = useState(false);
  const { camera } = useThree();
  const controls = useThree((s) => s.controls) as unknown as (THREE.EventDispatcher<{ start: object }> & { target: THREE.Vector3; update: () => void }) | null;
  const fly = useRef<null | { t: number; p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3 }>(null);
  const last = useRef({ id: '', t: 0 });

  const flyTo = useCallback((target: THREE.Vector3, dist: number, pos?: THREE.Vector3) => {
    if (!controls) return;
    const dir = camera.position.clone().sub(controls.target).normalize();
    fly.current = { t: 0, p0: camera.position.clone(), p1: pos ?? target.clone().add(dir.multiplyScalar(dist)), t0: controls.target.clone(), t1: target.clone() };
  }, [camera, controls]);

  useEffect(() => {
    if (!controls) return;
    const stop = () => { fly.current = null; };
    controls.addEventListener('start', stop);
    return () => controls.removeEventListener('start', stop);
  }, [controls]);

  // build registry once content is mounted
  const onReady = useCallback(() => {
    const g = root.current; if (!g) return;
    g.updateMatrixWorld(true);
    const map = new Map<string, Entry>();
    g.traverse((o) => {
      const part = partByNode.get(o.name);
      if (!part || map.has(part.part_id)) return;
      const box = new THREE.Box3().setFromObject(o);
      const parentInv = (o.parent ? o.parent.matrixWorld.clone() : new THREE.Matrix4()).invert();
      const meshes: THREE.Mesh[] = [];
      o.traverse((m) => { if ((m as THREE.Mesh).isMesh) meshes.push(m as THREE.Mesh); });
      for (const m of meshes) {
        m.material = Array.isArray(m.material) ? m.material.map((x) => x.clone()) : m.material.clone();
        for (const mat of matsOf(m)) {
          const x = mat as Mat;
          x.userData.orig = { color: x.color?.clone(), emissive: x.emissive?.clone(), ei: x.emissiveIntensity, opacity: x.opacity, transparent: x.transparent, depthWrite: x.depthWrite };
        }
        m.userData.raycast = m.raycast;
      }
      map.set(part.part_id, { part, node: o, base: o.position.clone(), box, center: box.getCenter(new THREE.Vector3()), cur: new THREE.Vector3(), target: new THREE.Vector3(), parentInv, zeroLocal: new THREE.Vector3().applyMatrix4(parentInv), meshes });
    });
    reg.current = map;
    setReady(true);
  }, [partByNode]);

  // visual state
  useEffect(() => {
    if (!ready) return;
    const asmIndex = new Map(catalog.assemblies.map((a, i) => [a.id, i]));
    const hard = ui.explode.mode === 'assembly';
    for (const e of reg.current.values()) {
      const sel = e.part.part_id === ui.selectedId, hov = e.part.part_id === ui.hoverId;
      const dimHard = hard && e.part.assembly_id !== ui.explode.assemblyId;
      const dimSoft = !!ui.highlightAsm && e.part.assembly_id !== ui.highlightAsm;
      const asmHit = !!ui.highlightAsm && e.part.assembly_id === ui.highlightAsm;
      for (const m of e.meshes) {
        m.raycast = dimHard ? () => undefined : (m.userData.raycast as typeof m.raycast);
        for (const x of matsOf(m)) {
          const o = x.userData.orig; if (!o) continue;
          x.color?.copy(o.color); x.emissive?.copy(o.emissive); x.emissiveIntensity = o.ei;
          x.opacity = o.opacity; x.transparent = o.transparent; x.depthWrite = o.depthWrite;
          if (ui.showParts && x.color) x.color.set(asmColor(asmIndex.get(e.part.assembly_id ?? '') ?? 0)).lerp(o.color, 0.12);
          if (dimHard || dimSoft) { x.transparent = true; x.opacity = dimHard ? 0.1 : 0.22; x.depthWrite = false; }
          if (x.emissive && (sel || hov || asmHit)) { x.emissive.copy(ACCENT); x.emissiveIntensity = sel ? 0.85 : asmHit ? 0.4 : 0.35; }
          x.needsUpdate = true;
        }
      }
    }
  }, [ready, catalog.assemblies, ui.selectedId, ui.hoverId, ui.showParts, ui.highlightAsm, ui.explode]);

  // explode targets + camera framing
  const boxOf = useCallback((ids?: string[]) => {
    const b = new THREE.Box3();
    for (const e of reg.current.values()) if (!ids || ids.includes(e.part.part_id)) b.union(e.box.clone().translate(e.target));
    return b;
  }, []);
  const frame = useCallback((b: THREE.Box3, k = 2.6, min = 3) => {
    if (b.isEmpty()) return;
    const s = b.getBoundingSphere(new THREE.Sphere());
    flyTo(s.center, Math.max(s.radius * k, min));
  }, [flyTo]);

  const firstExplode = useRef(true);
  useEffect(() => {
    if (!ready) return;
    const all = [...reg.current.values()];
    const mean = (es: Entry[]) => es.reduce((v, e) => v.add(e.center), new THREE.Vector3()).divideScalar(Math.max(es.length, 1));
    const M = mean(all);
    const groups = new Map<string, Entry[]>();
    for (const e of all) { const k = e.part.assembly_id ?? '-'; groups.set(k, [...(groups.get(k) ?? []), e]); }
    for (const e of all) e.target.set(0, 0, 0);
    const { mode, assemblyId } = ui.explode;
    if (mode === 'all') {
      for (const es of groups.values()) { const C = mean(es); for (const e of es) e.target.copy(C.clone().sub(M).multiplyScalar(0.9)).add(e.center.clone().sub(C).multiplyScalar(0.6)); }
    } else if (mode === 'assembly' && assemblyId) {
      const es = (groups.get(assemblyId) ?? []).sort((a, b) => (a.part.explode_order ?? 999) - (b.part.explode_order ?? 999));
      const asm = asmById.get(assemblyId); const C = mean(es);
      const vec = new THREE.Vector3(...(asm?.explode_vector ?? [1.4, 0, 0]));
      es.forEach((e, i) => e.target.copy(C).addScaledVector(vec, i - (es.length - 1) / 2).add(new THREE.Vector3(0, asm?.explode_lift ?? 0, 0)).sub(e.center));
    }
    animating.current = true;
    if (firstExplode.current) { firstExplode.current = false; return; }
    if (mode === 'assembly' && assemblyId) frame(boxOf(all.filter((e) => e.part.assembly_id === assemblyId).map((e) => e.part.part_id)), 2.2, 6);
    else if (mode === 'all') frame(boxOf(), 1.7, 10);
    else if (controls) flyTo(new THREE.Vector3(...DEFAULT_CAMERA.target), 0, new THREE.Vector3(...DEFAULT_CAMERA.position));
  }, [ready, ui.explode]); // eslint-disable-line react-hooks/exhaustive-deps

  // focus request (double-click / search / catalog)
  useEffect(() => {
    if (!ready || !ui.focus) return;
    frame(boxOf(ui.focus.ids), 2.6, 3);
  }, [ready, ui.focus?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstReset = useRef(ui.resetNonce);
  useEffect(() => {
    if (ui.resetNonce === firstReset.current || !controls) return;
    flyTo(new THREE.Vector3(...DEFAULT_CAMERA.target), 0, new THREE.Vector3(...DEFAULT_CAMERA.position));
  }, [ui.resetNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  const firstZoom = useRef(ui.zoom.nonce);
  useEffect(() => {
    if (ui.zoom.nonce === firstZoom.current || !controls) return;
    const d = camera.position.distanceTo(controls.target);
    flyTo(controls.target.clone(), THREE.MathUtils.clamp(d * (ui.zoom.dir > 0 ? 0.7 : 1.4), 1.5, 90));
  }, [ui.zoom.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, dt) => {
    const f = fly.current;
    if (f && controls) {
      f.t = Math.min(1, f.t + dt / 0.9);
      const e = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2;
      camera.position.lerpVectors(f.p0, f.p1, e);
      controls.target.lerpVectors(f.t0, f.t1, e);
      controls.update();
      if (f.t >= 1) fly.current = null;
    }
    if (animating.current) {
      const k = 1 - Math.exp(-7 * dt);
      let moving = false;
      for (const e of reg.current.values()) {
        if (e.cur.distanceToSquared(e.target) < 1e-6) { if (!e.cur.equals(e.target)) e.cur.copy(e.target); else continue; } else { e.cur.lerp(e.target, k); moving = true; }
        const l = e.cur.clone().applyMatrix4(e.parentInv).sub(e.zeroLocal);
        e.node.position.copy(e.base).add(l);
      }
      if (!moving) animating.current = false;
    }
  });

  const partOf = (obj: THREE.Object3D | null): Part | null => { for (let o = obj; o; o = o.parent) { const p = partByNode.get(o.name); if (p) return p; } return null; };
  const { setHover, select, openPanel } = useUI.getState();
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 4) return;
    const p = partOf(e.object); if (!p) return;
    e.stopPropagation();
    const now = performance.now();
    // double click / double tap (works for touch too): 2 clicks on same part within 400 ms
    if (last.current.id === p.part_id && now - last.current.t < 400) { last.current.t = 0; openPanel(p.part_id); }
    else { last.current = { id: p.part_id, t: now }; select(p.part_id); }
  };

  return (
    <group ref={root}
      onPointerMove={(e) => { const p = partOf(e.object); if (p) { e.stopPropagation(); if (useUI.getState().hoverId !== p.part_id) setHover(p.part_id); } }}
      onPointerOut={() => setHover(null)}
      onClick={onClick}>
      <Suspense fallback={null}>
        {!url ? <ProceduralContent onReady={onReady} /> : format === 'obj' ? <ObjContent url={url} onReady={onReady} /> : <GltfContent url={url} onReady={onReady} />}
      </Suspense>
    </group>
  );
}

export function Scene() {
  const { machineModel, modelUrl } = useData();
  const autoRotate = useUI((s) => s.autoRotate);
  const theme = useUI((s) => s.theme);
  const url = machineModel ? modelUrl(machineModel) : null;
  return (
    <>
      <hemisphereLight args={['#ffffff', '#555a63', 0.9]} />
      <directionalLight position={[18, 30, 14]} intensity={1.7} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-30} shadow-camera-right={30} shadow-camera-top={30} shadow-camera-bottom={-30} shadow-camera-far={90} />
      <directionalLight position={[-20, 10, -16]} intensity={0.5} />
      <gridHelper args={[120, 60, theme === 'dark' ? '#4a505a' : '#9aa1ab', theme === 'dark' ? '#2c3037' : '#d0d4da']} position={[0, -0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <shadowMaterial opacity={0.28} />
      </mesh>
      <Engine key={url ?? 'procedural'} url={url} format={machineModel?.converted_url ? 'glb' : machineModel?.format ?? null} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={1.2} maxDistance={90}
        maxPolarAngle={Math.PI / 2 - 0.02} target={DEFAULT_CAMERA.target} autoRotate={autoRotate} autoRotateSpeed={0.8} zoomToCursor />
    </>
  );
}
