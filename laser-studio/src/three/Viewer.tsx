import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { LayoutResult, MeshData } from '../core/types';

export interface ViewerHandle { snapshot: () => string; fit: () => void }
interface Props {
  mesh: MeshData | null;
  result: LayoutResult | null;
  sheetCanvases: (HTMLCanvasElement | null)[];
  paintVersion: number;
  selection: string[];
  mode: 'textured' | 'solid' | 'wire';
  tool: 'select' | 'cut';
  showEdges: boolean;
  onPick: (panelKey: string | null, additive: boolean) => void;
  onToggleJoint: (key: string) => void;
}

const PALETTE = ['#c8ccd2', '#e0a458', '#8fbf8f', '#7aa7d9', '#d98a8a', '#b89ad9', '#d9d27a'];

export const Viewer = forwardRef<ViewerHandle, Props>(function Viewer(props, ref) {
  const host = useRef<HTMLDivElement>(null);
  const S = useRef<{
    renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls;
    root: THREE.Group; main: THREE.Mesh | null; order: Int32Array | null; textures: THREE.CanvasTexture[]; fitted: MeshData | null; invalidate: () => void;
  } | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useImperativeHandle(ref, () => ({
    snapshot: () => { const s = S.current!; s.renderer.render(s.scene, s.camera); return s.renderer.domElement.toDataURL('image/png'); },
    fit: () => fitCamera(),
  }));

  function fitCamera() {
    const s = S.current; if (!s || !s.main) return;
    const box = new THREE.Box3().setFromObject(s.main);
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const r = Math.max(size.x, size.y, size.z, 1);
    s.controls.target.copy(center);
    s.camera.position.copy(center).add(new THREE.Vector3(r * 1.1, r * 0.8, r * 1.4));
    s.camera.near = r / 100; s.camera.far = r * 100; s.camera.updateProjectionMatrix();
    s.controls.update(); s.invalidate();
  }

  // init
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#eef1f5');
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 5000);
    camera.position.set(150, 120, 200);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.6));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4); dl.position.set(200, 400, 300); scene.add(dl);
    const dl2 = new THREE.DirectionalLight(0xffffff, 0.6); dl2.position.set(-300, 100, -200); scene.add(dl2);
    const grid = new THREE.GridHelper(600, 60, 0x9aa5b1, 0xcfd6de); scene.add(grid);
    const root = new THREE.Group(); scene.add(root);
    let queued = false;
    const render = () => { queued = false; renderer.render(scene, camera); };
    const invalidate = () => { if (!queued) { queued = true; requestAnimationFrame(render); } };
    controls.addEventListener('change', invalidate);
    S.current = { renderer, scene, camera, controls, root, main: null, order: null, textures: [], fitted: null, invalidate };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
      camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    // picking
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    renderer.domElement.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    renderer.domElement.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) { down = null; return; }
      down = null;
      const st = S.current!, p = propsRef.current;
      if (!st.main || !p.result) return;
      const rect = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const hit = ray.intersectObject(st.main, false)[0];
      if (!hit || hit.faceIndex == null || !st.order) { p.onPick(null, false); return; }
      const tri = st.order[hit.faceIndex];
      const panel = p.result.panels[p.result.triPanel[tri]];
      if (p.tool === 'cut') {
        // nearest joint (edge) of this panel to the hit point
        let best: string | null = null, bd = Infinity;
        const pt = hit.point;
        for (const j of p.result.joints) {
          if (j.p !== panel.key && j.q !== panel.key) continue;
          const a = new THREE.Vector3(...j.a3), b = new THREE.Vector3(...j.b3);
          const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, pt.clone().sub(a).dot(ab) / (ab.lengthSq() || 1)));
          const d = a.add(ab.multiplyScalar(t)).distanceTo(pt);
          if (d < bd) { bd = d; best = j.key; }
        }
        if (best) p.onToggleJoint(best);
      } else p.onPick(panel.key, e.shiftKey || e.ctrlKey || e.metaKey);
    });
    return () => {
      ro.disconnect(); controls.dispose(); renderer.dispose(); el.removeChild(renderer.domElement);
      S.current = null;
    };
  }, []);

  // geometry + materials
  useEffect(() => {
    const s = S.current; if (!s) return;
    const { mesh, result, mode } = props;
    // clear
    for (const c of [...s.root.children]) {
      s.root.remove(c);
      c.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); const mat = m.material as THREE.Material | THREE.Material[]; if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose()); });
    }
    s.textures.forEach((t) => t.dispose()); s.textures = []; s.main = null; s.order = null;
    if (!mesh) { s.invalidate(); return; }
    const nTri = mesh.positions.length / 9;
    const useTex = mode === 'textured' && result && result.sheets.length > 0;
    // triangle order (grouped by sheet when textured)
    const order = new Int32Array(nTri);
    const triSheet = new Int32Array(nTri).fill(0);
    const uvByTri = useTex ? new Float32Array(nTri * 6) : null;
    if (useTex && result) {
      for (const p of result.panels) {
        const sh = result.sheets[p.sheet];
        p.tris.forEach((t, k) => {
          triSheet[t] = p.sheet < 0 ? 0 : p.sheet;
          for (let c = 0; c < 3; c++) {
            uvByTri![6 * t + 2 * c] = p.sheetTri[6 * k + 2 * c] / (sh?.width ?? 1);
            uvByTri![6 * t + 2 * c + 1] = p.sheetTri[6 * k + 2 * c + 1] / (sh?.height ?? 1);
          }
        });
      }
    }
    const idx = Array.from({ length: nTri }, (_, i) => i).sort((a, b) => triSheet[a] - triSheet[b] || a - b);
    idx.forEach((t, i) => { order[i] = t; });
    const pos = new Float32Array(nTri * 9), uv = new Float32Array(nTri * 6), col = new Float32Array(nTri * 9);
    const c = new THREE.Color();
    const matColors = mesh.materials.map((m, i) => new THREE.Color(m.color || PALETTE[i % PALETTE.length]));
    order.forEach((t, i) => {
      pos.set(mesh.positions.subarray(9 * t, 9 * t + 9), 9 * i);
      if (uvByTri) uv.set(uvByTri.subarray(6 * t, 6 * t + 6), 6 * i);
      c.copy(matColors[mesh.triMat[t]] ?? matColors[0]);
      for (let k = 0; k < 3; k++) { col[9 * i + 3 * k] = c.r; col[9 * i + 3 * k + 1] = c.g; col[9 * i + 3 * k + 2] = c.b; }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    let material: THREE.Material | THREE.Material[];
    if (useTex && result) {
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const nSheets = result.sheets.length;
      const mats: THREE.Material[] = [];
      for (let sIdx = 0; sIdx < nSheets; sIdx++) {
        const cv = props.sheetCanvases[sIdx];
        const tex = new THREE.CanvasTexture(cv ?? document.createElement('canvas'));
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true;
        s.textures.push(tex);
        mats.push(new THREE.MeshStandardMaterial({ map: cv ? tex : null, color: cv ? 0xffffff : 0xdddddd, roughness: 1, metalness: 0, side: THREE.DoubleSide }));
      }
      let start = 0;
      for (let sIdx = 0; sIdx < nSheets; sIdx++) {
        let n = 0; while (start + n < nTri && triSheet[order[start + n]] === sIdx) n++;
        geo.addGroup(start * 3, n * 3, sIdx); start += n;
      }
      material = mats;
    } else {
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, wireframe: mode === 'wire', side: THREE.DoubleSide });
    }
    const main = new THREE.Mesh(geo, material);
    s.root.add(main); s.main = main; s.order = order;
    if (s.fitted !== mesh && (!s.fitted || s.fitted.name !== mesh.name || s.fitted.positions.length !== mesh.positions.length)) { fitCamera(); }
    s.fitted = mesh;
    s.invalidate();
  }, [props.mesh, props.result, props.mode, props.paintVersion]);

  // overlays: selection + joint lines
  useEffect(() => {
    const s = S.current; if (!s) return;
    const old = s.scene.getObjectByName('overlay');
    if (old) { s.scene.remove(old); old.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose(); (m.material as THREE.Material)?.dispose(); }); }
    const { mesh, result, selection, showEdges } = props;
    if (!mesh || !result) { s.invalidate(); return; }
    const g = new THREE.Group(); g.name = 'overlay';
    if (selection.length) {
      const tris: number[] = [];
      const sel = new Set(selection);
      for (const p of result.panels) if (sel.has(p.key)) tris.push(...p.tris);
      const pos = new Float32Array(tris.length * 9);
      tris.forEach((t, i) => pos.set(mesh.positions.subarray(9 * t, 9 * t + 9), 9 * i));
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x00d0ff, transparent: true, opacity: 0.5, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide, depthWrite: false }));
      g.add(m);
    }
    if (showEdges || props.tool === 'cut') {
      const lp: number[] = [], lc: number[] = [];
      const add = (a: number[], b: number[], r: number, gg: number, bb: number) => { lp.push(...a, ...b); for (let i = 0; i < 2; i++) lc.push(r, gg, bb); };
      for (const j of result.joints) {
        if (j.manual) add(j.a3, j.b3, 1, 0, 1);
        else if (j.cut) add(j.a3, j.b3, 0.95, 0.1, 0.1);
        else if (props.tool === 'cut' || props.showEdges) add(j.a3, j.b3, 0.15, 0.25, 0.95);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(lc, 3));
      const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, depthTest: true }));
      g.add(lines);
    }
    s.scene.add(g);
    s.invalidate();
  }, [props.mesh, props.result, props.selection, props.showEdges, props.tool]);

  return <div ref={host} className="viewer-host" />;
});
