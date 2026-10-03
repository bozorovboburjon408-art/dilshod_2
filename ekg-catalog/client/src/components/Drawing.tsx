import { useMemo } from 'react';
import * as THREE from 'three';
import type { Part, PartDrawing } from '../lib/types';
import { nodeById, type NodeDef } from '../model/layout';
import { PdfViewer } from './PdfViewer';
import { SourceBlock, Na } from './bits';

/** Orthographic wireframe of the placeholder shape (front / top / side). Not a manufacturing drawing. */
function views(n: NodeDef) {
  const s = n.shape;
  const g = s.kind === 'box' ? new THREE.BoxGeometry(...s.size) : s.kind === 'torus' ? new THREE.TorusGeometry(s.R, s.t, 12, 48) : new THREE.CylinderGeometry(s.r, s.r, s.h, s.kind === 'hex' ? 6 : 32);
  if (n.rot) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(...n.rot)));
  const e = new THREE.EdgesGeometry(g, 25).attributes.position;
  g.computeBoundingBox();
  const bb = g.boundingBox!, size = bb.getSize(new THREE.Vector3());
  const proj = (a: 'x' | 'y' | 'z', b: 'x' | 'y' | 'z') => {
    let d = '';
    for (let i = 0; i < e.count; i += 2) {
      const p = (k: number) => { const v = new THREE.Vector3().fromBufferAttribute(e, k); return [v[a], -v[b]]; };
      const [x1, y1] = p(i), [x2, y2] = p(i + 1);
      d += `M${x1.toFixed(3)} ${y1.toFixed(3)}L${x2.toFixed(3)} ${y2.toFixed(3)}`;
    }
    return d;
  };
  return { size, front: proj('x', 'y'), top: proj('x', 'z'), side: proj('z', 'y') };
}

function Placeholder({ part }: { part: Part }) {
  const n = part.model_object_id ? nodeById.get(part.model_object_id) : undefined;
  const v = useMemo(() => (n ? views(n) : null), [n]);
  if (!v) return <div className="text-sm"><Na /></div>;
  const R = Math.max(v.size.x, v.size.y, v.size.z) * 0.6;
  const cell = (d: string, label: string, dim: string) => (
    <figure className="rounded border border-line bg-white p-1">
      <svg viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} className="h-28 w-full"><path d={d} fill="none" stroke="#222" strokeWidth={R / 60} vectorEffect="non-scaling-stroke" style={{ strokeWidth: 1.2 }} /></svg>
      <figcaption className="text-center font-mono text-[10px] text-neutral-600">{label} · {dim}</figcaption>
    </figure>
  );
  const f = (x: number) => x.toFixed(2);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {cell(v.front, 'Old', `${f(v.size.x)}×${f(v.size.y)}`)}{cell(v.top, 'Tepa', `${f(v.size.x)}×${f(v.size.z)}`)}{cell(v.side, 'Yon', `${f(v.size.z)}×${f(v.size.y)}`)}
      </div>
      <p className="mt-2 text-[11px] text-amber-500">Sxematik kontur (placeholder 3D shakldan). Bu ishlab chiqarish chizmasi EMAS; o‘lchamlar demo model birliklarida. Haqiqiy chizma admin panel orqali yuklanadi.</p>
    </div>
  );
}

export function DrawingView({ part, drawings }: { part: Part; drawings: PartDrawing[] }) {
  if (!drawings.length) return <Placeholder part={part} />;
  return (
    <div className="space-y-4">
      {drawings.map((d) => (
        <div key={d.id}>
          <div className="mb-1 text-sm font-medium">{d.title ?? 'Chizma'} {d.drawing_number && <span className="font-mono text-xs text-mute">№ {d.drawing_number}</span>}</div>
          {!d.file_url ? <Na /> : d.file_type === 'pdf' || d.file_url.endsWith('.pdf')
            ? <div className="h-[420px] overflow-hidden rounded border border-line"><PdfViewer url={d.file_url} title={d.title ?? 'Chizma'} /></div>
            : <img src={d.file_url} alt={d.title ?? 'drawing'} className="max-h-[420px] w-full rounded border border-line bg-white object-contain" />}
          <SourceBlock s={d} />
        </div>
      ))}
    </div>
  );
}
