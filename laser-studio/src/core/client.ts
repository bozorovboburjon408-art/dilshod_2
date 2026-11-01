import type { LayoutRequest, LayoutResponse } from './worker';
import type { LayoutResult } from './types';

let worker: Worker | null = null;
let current: { id: number; resolve: (r: { result: LayoutResult; ms: number }) => void; reject: (e: Error) => void } | null = null;
let seq = 0;

function spawn() {
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (ev: MessageEvent<LayoutResponse>) => {
    const m = ev.data;
    if (!current || m.id !== current.id) return;
    const c = current; current = null;
    if (m.ok) c.resolve({ result: m.result, ms: m.ms }); else c.reject(new Error(m.error));
  };
  worker.onerror = (e) => { if (current) { const c = current; current = null; c.reject(new Error(e.message || 'worker error')); } };
}

/** Runs the unfold/nest pipeline off the main thread. A newer request cancels the previous one. */
export function runLayout(req: Omit<LayoutRequest, 'id'>): Promise<{ result: LayoutResult; ms: number }> {
  if (current) { current.reject(new Error('cancelled')); current = null; worker?.terminate(); worker = null; }
  if (!worker) spawn();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    current = { id, resolve, reject };
    worker!.postMessage({ ...req, id });
  });
}
