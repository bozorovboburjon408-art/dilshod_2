/// <reference lib="webworker" />
import { computeLayout } from './layout';
import type { LayoutResult, SheetSettings, UnfoldSettings } from './types';

export interface LayoutRequest {
  id: number;
  positions: Float32Array; triMat: Uint16Array; triTag: Uint16Array;
  unfold: UnfoldSettings; sheet: SheetSettings; title: string;
}
export type LayoutResponse = { id: number; ok: true; result: LayoutResult; ms: number } | { id: number; ok: false; error: string };

self.onmessage = (ev: MessageEvent<LayoutRequest>) => {
  const r = ev.data;
  const t0 = performance.now();
  try {
    const result = computeLayout(r.positions, r.triMat, r.triTag, r.unfold, r.sheet, r.title);
    (self as unknown as Worker).postMessage({ id: r.id, ok: true, result, ms: performance.now() - t0 } satisfies LayoutResponse);
  } catch (e) {
    (self as unknown as Worker).postMessage({ id: r.id, ok: false, error: e instanceof Error ? e.message : String(e) } satisfies LayoutResponse);
  }
};
