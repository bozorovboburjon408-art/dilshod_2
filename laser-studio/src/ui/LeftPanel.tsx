import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore, getState, setState } from '../store';
import { useT } from '../i18n';
import {
  addUserTextures, applySpec, fitToSheet, loadDemo, loadFiles, resetSpec, rotateBy, setBleed, setDecals, setDim, setSheet, setUnfold,
  specFor, IMAGE_DECALS, scopePanels,
} from '../actions';
import { DEMOS } from '../core/demo';
import { LIBRARY, libThumb } from '../render/textures';
import { defaultSpec, type Decal, type MatSpec } from '../render/paint';

function Section({ id, title, children, open = true }: { id: string; title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="section" open={open} data-testid={`sec-${id}`}>
      <summary>{title}</summary>
      <div className="section-body">{children}</div>
    </details>
  );
}
function Num({ label, value, onChange, min, max, step = 1, testid }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; testid?: string }) {
  const [text, setText] = useState(String(round(value)));
  const focus = useRef(false);
  useEffect(() => { if (!focus.current) setText(String(round(value))); }, [value]);
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={text} min={min} max={max} step={step} data-testid={testid}
        onFocus={() => { focus.current = true; }} onBlur={() => { focus.current = false; setText(String(round(value))); }}
        onChange={(e) => { setText(e.target.value); const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange(clamp(v, min, max)); }} />
    </label>
  );
}
const round = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, min?: number, max?: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));

function ModelSection() {
  const t = useT();
  const model = useStore((s) => s.model);
  const mesh = useStore((s) => s.mesh);
  const dims = useStore((s) => s.dims);
  const demoId = useStore((s) => s.demoId);
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <Section id="model" title={t('sec.model')}>
      <div
        className={'drop' + (drag ? ' drag' : '')} data-testid="dropzone"
        onClick={() => input.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); loadFiles(Array.from(e.dataTransfer.files)); }}
      >
        <strong>{t('model.drop')}</strong>
        <small>{t('model.formats')}</small>
        <input ref={input} type="file" multiple hidden data-testid="file-input"
          accept=".stl,.obj,.mtl,.glb,.gltf,.bin,.fbx,.png,.jpg,.jpeg,.tif,.tiff,.webp"
          onChange={(e) => { loadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
      </div>
      <select value={demoId ?? ''} onChange={(e) => e.target.value && loadDemo(e.target.value)} data-testid="demo-select">
        <option value="">{t('demo.choose')}</option>
        {DEMOS.map((d) => <option key={d.id} value={d.id}>{t(d.nameKey)}</option>)}
      </select>
      <p className="muted" data-testid="model-info">
        {model && mesh ? `${model.name} (${model.format}) — ` + t('model.info', { tris: mesh.positions.length / 9, w: round(dims[0]), h: round(dims[1]), d: round(dims[2]) }) : t('model.none')}
      </p>
    </Section>
  );
}

function TransformSection() {
  const t = useT();
  const model = useStore((s) => s.model);
  const dims = useStore((s) => s.dims);
  const lock = useStore((s) => s.lock);
  if (!model) return null;
  return (
    <Section id="transform" title={t('sec.transform')}>
      <div className="row"><span className="lbl">{t('xf.rotate')}</span>
        {(['X', 'Y', 'Z'] as const).map((a, i) => (
          <button key={a} className="btn small" onClick={() => rotateBy(i as 0 | 1 | 2, 90)} data-testid={`rot-${a}`}>{a} ↻</button>
        ))}
      </div>
      <div className="grid3">
        {(['X', 'Y', 'Z'] as const).map((a, i) => (
          <Num key={a} label={`${a} (mm)`} value={dims[i]} min={1} max={5000} testid={`dim-${a}`} onChange={(v) => setDim(i as 0 | 1 | 2, v)} />
        ))}
      </div>
      <small className="muted">{t('xf.axisHint')}</small>
      <label className="check"><input type="checkbox" checked={lock} onChange={(e) => setState({ lock: e.target.checked })} />{t('xf.lock')}</label>
      <button className="btn small" onClick={fitToSheet} data-testid="fit-sheet">{t('xf.fit')}</button>
    </Section>
  );
}

function SheetSection() {
  const t = useT();
  const sh = useStore((s) => s.sheet);
  return (
    <Section id="sheet" title={t('sec.sheet')}>
      <label className="field"><span>{t('sheet.format')}</span>
        <select value={sh.preset} onChange={(e) => setSheet({ preset: e.target.value as typeof sh.preset })} data-testid="sheet-preset">
          <option value="A4">A4 · 210 × 297</option><option value="A3">A3 · 297 × 420</option><option value="A2">A2 · 420 × 594</option>
          <option value="custom">{t('sheet.custom')}</option>
        </select></label>
      {sh.preset === 'custom' && (
        <div className="grid2">
          <Num label={t('sheet.width')} value={sh.customW} min={50} max={2000} testid="custom-w" onChange={(v) => setSheet({ customW: v })} />
          <Num label={t('sheet.height')} value={sh.customH} min={50} max={2000} testid="custom-h" onChange={(v) => setSheet({ customH: v })} />
        </div>
      )}
      <div className="seg" role="group" aria-label={t('sheet.orientation')}>
        {(['portrait', 'landscape'] as const).map((o) => (
          <button key={o} className={'seg-btn' + (sh.orient === o ? ' on' : '')} onClick={() => setSheet({ orient: o })} data-testid={`orient-${o}`}>{t('sheet.' + o)}</button>
        ))}
      </div>
      <div className="grid2">
        <Num label={t('sheet.margin')} value={sh.margin} min={5} max={50} testid="margin" onChange={(v) => setSheet({ margin: v })} />
        <Num label={t('sheet.gap')} value={sh.gap} min={1} max={30} testid="gap" onChange={(v) => setSheet({ gap: v })} />
      </div>
      <label className="check"><input type="checkbox" checked={sh.rotate} onChange={(e) => setSheet({ rotate: e.target.checked })} />{t('sheet.rotate')}</label>
    </Section>
  );
}

function UnfoldSection() {
  const t = useT();
  const u = useStore((s) => s.unfold);
  const bleed = useStore((s) => s.bleed);
  return (
    <Section id="unfold" title={t('sec.unfold')}>
      <label className="check"><input type="checkbox" checked={u.tabs} onChange={(e) => setUnfold({ tabs: e.target.checked })} data-testid="tabs-on" />{t('unfold.tabs')}</label>
      <label className="field"><span>{t('unfold.tabWidth')}: <b>{u.tabWidth}</b></span>
        <input type="range" min={3} max={8} step={0.5} value={u.tabWidth} data-testid="tab-width" onChange={(e) => setUnfold({ tabWidth: +e.target.value })} disabled={!u.tabs} /></label>
      <label className="field"><span>{t('unfold.bleed')}: <b>{bleed}</b></span>
        <input type="range" min={1} max={2} step={0.5} value={bleed} data-testid="bleed" onChange={(e) => setBleed(+e.target.value)} /></label>
      <Num label={t('unfold.tol')} value={u.planarTol} min={0.1} max={30} step={0.1} testid="tol" onChange={(v) => setUnfold({ planarTol: v })} />
      <label className="check"><input type="checkbox" checked={u.numbers} onChange={(e) => setUnfold({ numbers: e.target.checked })} />{t('unfold.numbers')}</label>
      <label className="check"><input type="checkbox" checked={u.seamLabels} onChange={(e) => setUnfold({ seamLabels: e.target.checked })} />{t('unfold.seamLabels')}</label>
      <div className="subhead">{t('unfold.manual')}: <b data-testid="manual-count">{u.manualCuts.length || t('unfold.none')}</b></div>
      <small className="muted">{t('unfold.manualHint')}</small>
      {u.manualCuts.length > 0 && <button className="btn small" onClick={() => setUnfold({ manualCuts: [] })} data-testid="clear-cuts">{t('unfold.resetCuts')}</button>}
    </Section>
  );
}

function Thumb({ id, label, on, onClick, src }: { id: string; label: string; on: boolean; onClick: () => void; src?: string }) {
  return (
    <button className={'thumb' + (on ? ' on' : '')} title={label} onClick={onClick} data-testid={`thumb-${id}`}>
      <img src={src ?? libThumb(id)} alt={label} /><span>{label}</span>
    </button>
  );
}

function TextureSection() {
  const t = useT();
  const selection = useStore((s) => s.selection);
  const result = useStore((s) => s.result);
  const assign = useStore((s) => s.assign);
  const userTex = useStore((s) => s.userTex);
  const [scope, setScope] = useState<'selection' | 'material' | 'all'>('selection');
  const first = result?.panels.find((p) => p.key === selection[0]);
  const cur: MatSpec = first ? (assign[first.key] ?? specFor(first)) : defaultSpec();
  const upload = useRef<HTMLInputElement>(null);
  const apply = (patch: Partial<MatSpec>) => applySpec({ ...cur, ...patch }, scope);
  const tiles = LIBRARY.filter((l) => l.kind === 'tile');
  return (
    <Section id="texture" title={t('sec.texture')}>
      <p className="muted" data-testid="tex-hint">{selection.length ? t('tex.selected', { n: selection.length }) : t('tex.selectHint')}</p>
      <label className="field"><span>{t('tex.scope')}</span>
        <select value={scope} onChange={(e) => setScope(e.target.value as typeof scope)} data-testid="scope">
          <option value="selection">{t('scope.selection')}</option><option value="material">{t('scope.material')}</option><option value="all">{t('scope.all')}</option>
        </select></label>
      <div className="subhead">{t('tex.library')}</div>
      <div className="thumbs">
        {tiles.map((l) => <Thumb key={l.id} id={l.id} label={t('lib.' + l.id)} on={cur.kind === 'tex' && cur.tex === l.id} onClick={() => apply({ kind: 'tex', tex: l.id, scale: l.mm })} />)}
      </div>
      {userTex.length > 0 && <><div className="subhead">{t('tex.mine')}</div>
        <div className="thumbs">{userTex.map((u) => (
          <Thumb key={u.id} id={u.id} label={u.name} src={thumbOf(u.canvas)} on={cur.kind === 'tex' && cur.tex === u.id} onClick={() => apply({ kind: 'tex', tex: u.id, scale: 60 })} />
        ))}</div></>}
      <button className="btn small" onClick={() => upload.current?.click()} data-testid="tex-upload-btn">{t('tex.upload')}</button>
      <input ref={upload} type="file" hidden multiple accept=".png,.jpg,.jpeg,.tif,.tiff,.webp" data-testid="tex-upload"
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []); e.target.value = '';
          const added = await addUserTextures(files);
          if (added[0] && getState().selection.length) applySpec({ ...cur, kind: 'tex', tex: added[0].id, scale: 60 }, scope);
        }} />
      <div className="row">
        <label className="field grow"><span>{t('tex.color')}</span>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(cur.color) ? cur.color : '#bbbbbb'} data-testid="color" onChange={(e) => apply({ kind: 'color', color: e.target.value })} /></label>
        <button className="btn small" onClick={() => resetSpec(scope)} data-testid="reset-tex">{t('tex.reset')}</button>
      </div>
      {cur.kind !== 'color' && cur.kind !== 'uv' && <>
        <Num label={t('tex.scale')} value={cur.scale} min={2} max={500} testid="tex-scale" onChange={(v) => apply({ scale: v })} />
        <Num label={t('tex.rotate')} value={cur.rot} min={-360} max={360} testid="tex-rot" onChange={(v) => apply({ rot: v })} />
        <div className="grid2">
          <Num label={t('tex.offsetX')} value={cur.ox} min={-500} max={500} testid="tex-ox" onChange={(v) => apply({ ox: v })} />
          <Num label={t('tex.offsetY')} value={cur.oy} min={-500} max={500} testid="tex-oy" onChange={(v) => apply({ oy: v })} />
        </div>
        <label className="check"><input type="checkbox" checked={cur.flipX} onChange={(e) => apply({ flipX: e.target.checked })} />{t('tex.flipX')}</label>
        <label className="check"><input type="checkbox" checked={cur.flipY} onChange={(e) => apply({ flipY: e.target.checked })} />{t('tex.flipY')}</label>
      </>}
      {cur.kind === 'uv' && <small className="muted">{t('tex.original')}</small>}
    </Section>
  );
}
const thumbCache = new WeakMap<HTMLCanvasElement, string>();
function thumbOf(c: HTMLCanvasElement) {
  let u = thumbCache.get(c);
  if (!u) {
    const k = 72 / Math.max(c.width, c.height);
    const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(c.width * k)); o.height = Math.max(1, Math.round(c.height * k));
    o.getContext('2d')!.drawImage(c, 0, 0, o.width, o.height);
    u = o.toDataURL(); thumbCache.set(c, u);
  }
  return u;
}

function DecalSection() {
  const t = useT();
  const selection = useStore((s) => s.selection);
  const decals = useStore((s) => s.decals);
  const dims = useStore((s) => s.dims);
  const upload = useRef<HTMLInputElement>(null);
  const [sel, setSel] = useState<string | null>(null);
  const key = selection[0];
  const list = key ? decals[key] ?? [] : [];
  const k = Math.max(...dims) / 120;
  let uid = 0;
  const add = (d: Omit<Decal, 'id'>) => {
    const keys = getState().selection;
    if (!keys.length) return;
    const id = 'd' + Date.now() + '-' + uid++;
    for (const kk of keys) setDecals(kk, [...(getState().decals[kk] ?? []), { ...d, id }]);
    setSel(id);
  };
  const upd = (id: string, patch: Partial<Decal>) => setDecals(key, list.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const cur = list.find((d) => d.id === sel) ?? list[list.length - 1];
  return (
    <Section id="decals" title={t('sec.decals')} open={false}>
      {!key && <p className="muted">{t('tex.selectHint')}</p>}
      <div className="subhead">{t('decal.add')}</div>
      <div className="thumbs">
        {IMAGE_DECALS.map((l) => (
          <Thumb key={l.id} id={l.id} label={t('lib.' + l.id)} on={false} onClick={() => add({ kind: 'image', src: l.id, text: '', color: '#000000', font: 'Arial, sans-serif', x: 0, y: 0, w: l.mm * k, h: l.mm * k * (l.aspect ?? 1), rot: 0, opacity: 1 })} />
        ))}
      </div>
      <div className="row">
        <button className="btn small" onClick={() => add({ kind: 'text', src: '', text: t('decal.textDefault'), color: '#111111', font: 'Arial, sans-serif', x: 0, y: 0, w: 40 * k, h: 8 * k, rot: 0, opacity: 1 })} data-testid="add-text">{t('decal.text')}</button>
        <button className="btn small" onClick={() => upload.current?.click()} data-testid="decal-upload-btn">{t('decal.upload')}</button>
        <input ref={upload} type="file" hidden accept=".png,.jpg,.jpeg,.tif,.tiff,.webp" data-testid="decal-upload"
          onChange={async (e) => {
            const f = Array.from(e.target.files ?? []); e.target.value = '';
            const [u] = await addUserTextures(f);
            if (u) { const asp = u.canvas.height / u.canvas.width; add({ kind: 'image', src: u.id, text: '', color: '#000', font: 'Arial, sans-serif', x: 0, y: 0, w: 20 * k, h: 20 * k * asp, rot: 0, opacity: 1 }); }
          }} />
      </div>
      {key && list.length === 0 && <p className="muted">{t('decal.none')}</p>}
      {list.length > 0 && (
        <div className="decal-list">
          {list.map((d, i) => (
            <button key={d.id} className={'chip' + (cur?.id === d.id ? ' on' : '')} onClick={() => setSel(d.id)}>{d.kind === 'text' ? `“${d.text}”` : t('lib.' + d.src) === 'lib.' + d.src ? `#${i + 1}` : t('lib.' + d.src)}</button>
          ))}
        </div>
      )}
      {cur && (
        <div className="decal-edit">
          {cur.kind === 'text' && <>
            <label className="field"><span>{t('decal.content')}</span><input type="text" value={cur.text} data-testid="decal-text" onChange={(e) => upd(cur.id, { text: e.target.value })} /></label>
            <label className="field"><span>{t('decal.color')}</span><input type="color" value={cur.color} onChange={(e) => upd(cur.id, { color: e.target.value })} /></label>
          </>}
          <div className="grid2">
            <Num label={t('decal.x')} value={cur.x} step={0.5} onChange={(v) => upd(cur.id, { x: v })} />
            <Num label={t('decal.y')} value={cur.y} step={0.5} onChange={(v) => upd(cur.id, { y: v })} />
            <Num label={t('decal.w')} value={cur.w} min={0.5} step={0.5} onChange={(v) => upd(cur.id, { w: v })} />
            <Num label={t('decal.h')} value={cur.h} min={0.5} step={0.5} onChange={(v) => upd(cur.id, { h: v })} />
            <Num label={t('decal.rot')} value={cur.rot} min={-360} max={360} onChange={(v) => upd(cur.id, { rot: v })} />
            <Num label={t('decal.opacity')} value={cur.opacity} min={0.05} max={1} step={0.05} onChange={(v) => upd(cur.id, { opacity: v })} />
          </div>
          <button className="btn small danger" onClick={() => { setDecals(key, list.filter((d) => d.id !== cur.id)); setSel(null); }}>{t('decal.remove')}</button>
        </div>
      )}
    </Section>
  );
}

export function LeftPanel() {
  const t = useT();
  void scopePanels;
  return (
    <aside className="left" data-testid="left-panel">
      <ModelSection />
      <TransformSection />
      <SheetSection />
      <UnfoldSection />
      <TextureSection />
      <DecalSection />
      <p className="privacy muted">🔒 {t('privacy.note')}</p>
    </aside>
  );
}
