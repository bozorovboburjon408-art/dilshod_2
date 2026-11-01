// Application logic (non-React): loading, transforms, layout scheduling, texture assignment.
import { bboxOfMesh, simplifyMesh, transformMesh } from './core/mesh';
import { runLayout } from './core/client';
import { DEMOS, HOUSE_DECALS } from './core/demo';
import { getState, notify, setState, sheetDims, type UserTex } from './store';
import { loadImageFile, loadModelFiles, LoadError } from './three/loaders';
import { defaultSpec, type Decal, type MatSpec, type PaintEnv, type Img } from './render/paint';
import { getLibCanvas, LIBRARY } from './render/textures';
import { tr } from './i18n';
import type { PanelOut } from './core/types';

export const MAX_TRIS = 20000;
const MIN_MARGIN = 5;

export function refreshMesh(resetDims = false, maxDim = 90) {
  const s = getState();
  if (!s.model) { setState({ mesh: null, result: null }); return; }
  let dims = s.dims;
  if (resetDims) {
    const nat = transformMesh(s.model.mesh, s.rot, null).size;
    const k = maxDim / Math.max(...nat, 1e-6);
    dims = [nat[0] * k, nat[1] * k, nat[2] * k];
  }
  const { mesh } = transformMesh(s.model.mesh, s.rot, dims);
  setState({ mesh, dims });
}

let layoutTimer: ReturnType<typeof setTimeout> | undefined;
export function scheduleLayout(delay = 250) {
  clearTimeout(layoutTimer);
  layoutTimer = setTimeout(doLayout, delay);
}

async function doLayout() {
  const s = getState();
  if (!s.mesh) return;
  const nTri = s.mesh.positions.length / 9;
  if (nTri > MAX_TRIS) { setState({ tooManyTris: nTri, result: null, busy: false }); return; }
  setState({ busy: true, tooManyTris: 0 });
  const [w, h] = sheetDims(s.sheet);
  const margin = Math.max(MIN_MARGIN, s.sheet.margin);
  try {
    const { result, ms } = await runLayout({
      positions: s.mesh.positions.slice(), triMat: s.mesh.triMat.slice(), triTag: s.mesh.triTag.slice(),
      unfold: s.unfold, sheet: { width: w, height: h, margin, gap: Math.max(s.sheet.gap, 2 * s.bleed + 1), allowRotate: s.sheet.rotate },
      title: s.model?.name ?? 'model',
    });
    const cur = getState();
    const valid = new Set(result.panels.map((p) => p.key));
    setState({
      result, busy: false, calcMs: ms,
      selection: cur.selection.filter((k) => valid.has(k)),
      activeSheet: Math.min(cur.activeSheet, Math.max(0, result.sheets.length - 1)),
    });
  } catch (e) {
    if (e instanceof Error && e.message === 'cancelled') return;
    setState({ busy: false });
    notify('error', tr('err.compute') + ': ' + (e instanceof Error ? e.message : String(e)));
  }
}

export async function loadFiles(files: File[]) {
  try {
    setState({ busy: true });
    const model = await loadModelFiles(files);
    installModel(model, null);
    notify('ok', tr('msg.loaded', { name: model.name }));
  } catch (e) {
    setState({ busy: false });
    if (e instanceof LoadError) notify('error', tr('err.' + e.code) + (e.detail ? ` (${e.detail})` : ''));
    else notify('error', String(e));
  }
}

export function installModel(model: import('./three/loaders').LoadedModel, demoId: string | null, maxDim = 90, preset?: 'A4' | 'A3' | 'A2') {
  setState({
    model, demoId, rot: model.defaultRot, assign: {}, decals: {}, selection: [], activeSheet: 0, result: null,
    unfold: { ...getState().unfold, manualCuts: [] },
    ...(preset ? { sheet: { ...getState().sheet, preset } } : {}),
  });
  refreshMesh(true, maxDim);
  if (demoId) { /* demo decals are applied after the first layout */ pendingDemoDecals = demoId; }
  scheduleLayout(0);
}

let pendingDemoDecals: string | null = null;
export function applyPendingDemoDecals() {
  const s = getState();
  if (!pendingDemoDecals || !s.result || !s.mesh) return;
  const id = pendingDemoDecals; pendingDemoDecals = null;
  const def = DEMOS.find((d) => d.id === id);
  if (!def?.decals) return;
  const decals: Record<string, Decal[]> = {};
  const tagFor = (p: PanelOut) => s.mesh!.tags[s.mesh!.triTag[p.tris[0]]];
  const byTag = def.decals;
  for (const p of s.result.panels) {
    const list = byTag[tagFor(p)];
    if (!list) continue;
    // scale decals from the demo's design size to the actual model size
    const k = s.dims[0] / 90;
    decals[p.key] = list.map((d, i) => ({
      id: `${p.key}-${i}`, kind: 'image' as const, src: d.id, text: '', color: '#000', font: 'Arial, sans-serif',
      x: d.x * k, y: d.y * k, w: d.w * k, h: d.h * k, rot: 0, opacity: 1,
    }));
  }
  void HOUSE_DECALS;
  setState({ decals });
}

export function loadDemo(id: string) {
  const def = DEMOS.find((d) => d.id === id);
  if (!def) return;
  const mesh = def.build();
  installModel({ name: def.id, format: 'DEMO', mesh, textures: new Map(), defaultRot: [0, 0, 0] }, id, def.sizeMm, def.sheet);
}

export function rotateBy(axis: 0 | 1 | 2, deg: number) {
  const s = getState();
  if (!s.model) return;
  const prevMax = Math.max(...s.dims);
  const rot = [...s.rot] as [number, number, number];
  rot[axis] = (rot[axis] + deg) % 360;
  const nat = transformMesh(s.model.mesh, rot, null).size;
  const k = prevMax / Math.max(...nat, 1e-6);
  setState({ rot, dims: [nat[0] * k, nat[1] * k, nat[2] * k], result: null });
  refreshMesh(); scheduleLayout();
}

export function setDim(axis: 0 | 1 | 2, value: number) {
  const s = getState();
  if (!s.model || !(value > 0.5)) return;
  const dims = [...s.dims] as [number, number, number];
  if (s.lock) { const k = value / dims[axis]; for (let i = 0; i < 3; i++) dims[i] *= k; } else dims[axis] = value;
  setState({ dims }); refreshMesh(); scheduleLayout(400);
}

export function fitToSheet() {
  const s = getState();
  if (!s.model) return;
  const [w, h] = sheetDims(s.sheet);
  const nat = transformMesh(s.model.mesh, s.rot, null).size;
  const target = Math.min(w, h) - 2 * Math.max(MIN_MARGIN, s.sheet.margin) - 2 * s.unfold.tabWidth;
  const k = target / Math.max(...nat);
  setState({ dims: [nat[0] * k, nat[1] * k, nat[2] * k] }); refreshMesh(); scheduleLayout(0);
}

export function simplifyModel() {
  const s = getState();
  if (!s.model) return;
  const m = simplifyMesh(s.model.mesh, 6000);
  setState({ model: { ...s.model, mesh: m }, assign: {}, decals: {} });
  const bb = bboxOfMesh(m); void bb;
  refreshMesh(); scheduleLayout(0);
  notify('info', tr('msg.simplified', { n: m.positions.length / 9 }));
}

export function setUnfold(patch: Partial<import('./core/types').UnfoldSettings>) {
  setState((s) => ({ unfold: { ...s.unfold, ...patch } }));
  scheduleLayout(300);
}
export function setSheet(patch: Partial<import('./store').SheetCfg>) {
  setState((s) => ({ sheet: { ...s.sheet, ...patch } }));
  scheduleLayout(300);
}
export function setBleed(b: number) { setState({ bleed: b }); scheduleLayout(300); }

export function toggleJoint(key: string) {
  const cuts = getState().unfold.manualCuts;
  setUnfold({ manualCuts: cuts.includes(key) ? cuts.filter((k) => k !== key) : [...cuts, key] });
}

export function pickPanel(key: string | null, additive: boolean) {
  setState((s) => {
    if (!key) return additive ? {} : { selection: [] };
    if (additive) return { selection: s.selection.includes(key) ? s.selection.filter((k) => k !== key) : [...s.selection, key] };
    return { selection: [key] };
  });
}

// ---------- materials ----------
export function defaultSpecFor(p: PanelOut): MatSpec {
  const s = getState();
  const m = s.mesh?.materials[p.matIndex];
  if (!m) return defaultSpec();
  if (m.mapKey && s.mesh?.uvs) return { ...defaultSpec(m.color), kind: 'uv', tex: m.mapKey };
  if (m.lib) return { ...defaultSpec(m.color), kind: 'tex', tex: m.lib, scale: m.mmPerTile ?? 40 };
  return defaultSpec(m.color);
}
export function specFor(p: PanelOut): MatSpec { return getState().assign[p.key] ?? defaultSpecFor(p); }

export function scopePanels(scope: 'selection' | 'material' | 'all'): PanelOut[] {
  const s = getState();
  if (!s.result) return [];
  const sel = s.result.panels.filter((p) => s.selection.includes(p.key));
  if (scope === 'selection') return sel;
  if (scope === 'all') return s.result.panels;
  const mats = new Set(sel.map((p) => p.matIndex));
  return s.result.panels.filter((p) => mats.has(p.matIndex));
}

export function applySpec(spec: MatSpec, scope: 'selection' | 'material' | 'all') {
  const panels = scopePanels(scope);
  if (!panels.length) { notify('info', tr('msg.selectPanel')); return; }
  setState((s) => {
    const assign = { ...s.assign };
    for (const p of panels) assign[p.key] = spec;
    return { assign };
  });
}
export function resetSpec(scope: 'selection' | 'material' | 'all') {
  const panels = scopePanels(scope);
  setState((s) => { const assign = { ...s.assign }; for (const p of panels) delete assign[p.key]; return { assign }; });
}

export function setDecals(key: string, list: Decal[]) {
  setState((s) => ({ decals: { ...s.decals, [key]: list } }));
}

let texCounter = 0;
export async function addUserTextures(files: File[]): Promise<UserTex[]> {
  const out: UserTex[] = [];
  for (const f of files) {
    try {
      const canvas = await loadImageFile(f);
      out.push({ id: 'u' + ++texCounter, name: f.name, canvas });
    } catch (e) {
      notify('error', e instanceof LoadError ? `${tr('err.image')} (${e.detail})` : String(e));
    }
  }
  if (out.length) setState((s) => ({ userTex: [...s.userTex, ...out] }));
  return out;
}

export function makePaintEnv(): PaintEnv | null {
  const s = getState();
  if (!s.result || !s.mesh) return null;
  const model = s.model;
  return {
    mesh: s.mesh, result: s.result,
    getImage: (id: string): Img | null => getLibCanvas(id) ?? s.userTex.find((u) => u.id === id)?.canvas ?? null,
    getSourceTex: (key) => model?.textures.get(key) ?? null,
    materialFor: specFor,
    decalsFor: (key) => getState().decals[key] ?? [],
  };
}

export const IMAGE_DECALS = LIBRARY.filter((l) => l.kind === 'decal');
