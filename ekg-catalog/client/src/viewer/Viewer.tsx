import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { useContextBridge } from '@react-three/drei';
import { DataContext, useData } from '../lib/data';
import { useUI } from '../lib/store';
import { DEFAULT_CAMERA } from '../model/layout';
import { Scene, asmColor } from './Scene';
import { SearchBox } from '../components/SearchBox';
import { PartPanel } from '../components/PartPanel';

function Tooltip() {
  const hoverId = useUI((s) => s.hoverId);
  const { partByPartId } = useData();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`; };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  const p = hoverId ? partByPartId.get(hoverId) : null;
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-50" style={{ opacity: p ? 1 : 0 }}>
      {p && (
        <div className="min-w-[180px] rounded border border-accent/60 bg-panel/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
          <div className="text-sm font-semibold">{p.name}</div>
          {p.name_ru && <div className="text-mute">{p.name_ru}</div>}
          <div className="mt-1 font-mono text-[11px] text-accent">{p.part_id}</div>
          <div className="text-mute">Pozitsiya: <span className="text-ink">{p.position_number ?? '—'}</span></div>
        </div>
      )}
    </div>
  );
}

function Legend() {
  const { catalog } = useData();
  const showParts = useUI((s) => s.showParts);
  const hl = useUI((s) => s.highlightAsm);
  const set = useUI((s) => s.setHighlightAsm);
  if (!showParts) return null;
  return (
    <div className="absolute left-3 top-16 z-10 w-56 rounded border border-line bg-panel/90 p-2 text-xs backdrop-blur max-md:hidden">
      <div className="label px-1">Yig‘ma birliklar</div>
      {catalog.assemblies.map((a, i) => (
        <button key={a.id} onClick={() => set(hl === a.id ? null : a.id)}
          className={`flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-raised ${hl === a.id ? 'bg-raised' : ''}`}>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: asmColor(i) }} />
          <span className="flex-1 truncate">{a.name}</span>
          <span className="text-mute">{catalog.parts.filter((p) => p.assembly_id === a.id).length}</span>
        </button>
      ))}
    </div>
  );
}

function Hud() {
  const ui = useUI();
  const { catalog } = useData();
  const sel = ui.selectedId ? catalog.parts.find((p) => p.part_id === ui.selectedId) : null;
  const explodeAsm = sel?.assembly_id ?? null;
  const asmHasMany = explodeAsm ? catalog.parts.filter((p) => p.assembly_id === explodeAsm).length > 1 : false;
  const explodeLabel = ui.explode.mode === 'off' ? 'Exploded view' : 'Yig‘ish';
  return (
    <div className="absolute inset-x-0 bottom-3 z-10 flex flex-wrap justify-center gap-2 px-3">
      <button className={`btn ${ui.autoRotate ? 'btn-on' : ''}`} onClick={ui.toggleAutoRotate}>⟳ Rotate</button>
      <div className="flex">
        <button className="btn rounded-r-none" onClick={() => ui.zoomBy(1)} aria-label="Zoom in">＋ Zoom</button>
        <button className="btn rounded-l-none border-l-0" onClick={() => ui.zoomBy(-1)} aria-label="Zoom out">－</button>
      </div>
      <button className="btn" onClick={ui.reset}>⌂ Reset view</button>
      <button className={`btn ${ui.explode.mode !== 'off' ? 'btn-on' : ''}`}
        title={asmHasMany ? 'Tanlangan yig‘ma birlikni yoyish' : 'Butun mashinani yoyish'}
        onClick={() => ui.toggleExplode(ui.explode.mode === 'off' && asmHasMany ? explodeAsm : ui.explode.assemblyId)}>
        ⁜ {explodeLabel}{ui.explode.mode === 'off' && asmHasMany ? ' · birlik' : ''}
      </button>
      <button className={`btn ${ui.showParts ? 'btn-on' : ''}`} onClick={ui.toggleShowParts}>▦ Show parts</button>
    </div>
  );
}

export function Viewer() {
  const Bridge = useContextBridge(DataContext);
  const hover = useUI((s) => s.hoverId);
  const select = useUI((s) => s.select);
  const { machineModel } = useData();
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ cursor: hover ? 'pointer' : 'grab' }}>
      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center max-md:hidden">
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-mute">Interactive 3D EKG-10 model</div>
        {!machineModel && <div className="mt-1 text-[10px] text-mute/80">Placeholder model — haqiqiy GLB/GLTF admin panel orqali yuklanadi</div>}
      </div>
      <Canvas shadows dpr={[1, 2]} camera={{ position: DEFAULT_CAMERA.position, fov: 40, near: 0.1, far: 600 }}
        onPointerMissed={() => select(null)} gl={{ antialias: true }}>
        <Bridge><Scene /></Bridge>
      </Canvas>
      <div className="absolute left-3 top-3 z-20 w-[min(22rem,calc(100%-1.5rem))] md:top-3"><SearchBox compact /></div>
      <Legend />
      <Hud />
      <Tooltip />
      <PartPanel />
      <div className="pointer-events-none absolute bottom-14 left-3 hidden text-[10px] text-mute md:block">
        Bir marta bosing — ajratib ko‘rsatish · Ikki marta bosing — ma‘lumot paneli
      </div>
    </div>
  );
}
