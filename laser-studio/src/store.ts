import { useSyncExternalStore } from 'react';
import type { LoadedModel } from './three/loaders';
import type { LayoutResult, MeshData, UnfoldSettings } from './core/types';
import type { Decal, MatSpec } from './render/paint';
import type { Lang } from './i18n';

export type SheetPreset = 'A4' | 'A3' | 'A2' | 'custom';
export interface SheetCfg { preset: SheetPreset; customW: number; customH: number; orient: 'portrait' | 'landscape'; margin: number; gap: number; rotate: boolean }
export interface UserTex { id: string; name: string; canvas: HTMLCanvasElement }
export interface Toast { type: 'error' | 'info' | 'ok'; text: string; id: number }

export interface State {
  lang: Lang;
  model: LoadedModel | null;
  demoId: string | null;
  rot: [number, number, number];
  dims: [number, number, number];
  lock: boolean;
  sheet: SheetCfg;
  unfold: UnfoldSettings;
  bleed: number;
  mesh: MeshData | null;
  result: LayoutResult | null;
  busy: boolean;
  calcMs: number;
  assign: Record<string, MatSpec>;
  decals: Record<string, Decal[]>;
  userTex: UserTex[];
  selection: string[];
  tool: 'select' | 'cut';
  activeSheet: number;
  view2d: { print: boolean; cut: boolean; fold: boolean; engrave: boolean; reg: boolean };
  view3d: 'textured' | 'solid' | 'wire';
  showEdges: boolean;
  toast: Toast | null;
  exportOpen: boolean;
  mobileTab: 'settings' | 'view3d' | 'view2d';
  paintVersion: number;
  tooManyTris: number; // >0 when model exceeds the limit
}

export const SHEETS: Record<Exclude<SheetPreset, 'custom'>, [number, number]> = { A4: [210, 297], A3: [297, 420], A2: [420, 594] };

export const initialState: State = {
  lang: 'uz', model: null, demoId: null, rot: [0, 0, 0], dims: [100, 100, 100], lock: true,
  sheet: { preset: 'A4', customW: 250, customH: 350, orient: 'portrait', margin: 8, gap: 3, rotate: true },
  unfold: { tabWidth: 5, tabs: true, planarTol: 1, manualCuts: [], numbers: true, seamLabels: true },
  bleed: 1.5, mesh: null, result: null, busy: false, calcMs: 0,
  assign: {}, decals: {}, userTex: [], selection: [], tool: 'select', activeSheet: 0,
  view2d: { print: true, cut: true, fold: true, engrave: true, reg: true },
  view3d: 'textured', showEdges: true, toast: null, exportOpen: false, mobileTab: 'view3d', paintVersion: 0, tooManyTris: 0,
};

let state: State = initialState;
const listeners = new Set<() => void>();
export const getState = () => state;
export function setState(patch: Partial<State> | ((s: State) => Partial<State>)) {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => sel(state));
}

export function sheetDims(c: SheetCfg): [number, number] {
  const [w, h] = c.preset === 'custom' ? [Math.max(50, c.customW), Math.max(50, c.customH)] : SHEETS[c.preset];
  const a = Math.min(w, h), b = Math.max(w, h);
  return c.orient === 'portrait' ? [a, b] : [b, a];
}

let toastId = 0;
export function notify(type: Toast['type'], text: string) {
  const id = ++toastId;
  setState({ toast: { type, text, id } });
  if (type !== 'error') setTimeout(() => { if (state.toast?.id === id) setState({ toast: null }); }, 4000);
}
