import { useEffect, useRef, useState } from 'react';
import { getState, setState, useStore } from './store';
import { LANGS, useT } from './i18n';
import { Viewer, type ViewerHandle } from './three/Viewer';
import { LeftPanel } from './ui/LeftPanel';
import { SheetView } from './ui/SheetView';
import { ExportModal } from './ui/ExportModal';
import { applyPendingDemoDecals, loadDemo, makePaintEnv, pickPanel, simplifyModel, toggleJoint, MAX_TRIS } from './actions';
import { paintSheet } from './render/paint';

const PREVIEW_PX_PER_MM = 4;

export default function App() {
  const t = useT();
  const s = {
    lang: useStore((x) => x.lang), model: useStore((x) => x.model), mesh: useStore((x) => x.mesh), result: useStore((x) => x.result),
    busy: useStore((x) => x.busy), tool: useStore((x) => x.tool), view3d: useStore((x) => x.view3d), showEdges: useStore((x) => x.showEdges),
    selection: useStore((x) => x.selection), toast: useStore((x) => x.toast), exportOpen: useStore((x) => x.exportOpen),
    mobileTab: useStore((x) => x.mobileTab), activeSheet: useStore((x) => x.activeSheet), assign: useStore((x) => x.assign),
    decals: useStore((x) => x.decals), userTex: useStore((x) => x.userTex), bleed: useStore((x) => x.bleed), tooMany: useStore((x) => x.tooManyTris),
    calcMs: useStore((x) => x.calcMs),
  };
  const viewer = useRef<ViewerHandle>(null);
  const [canvases, setCanvases] = useState<(HTMLCanvasElement | null)[]>([]);
  const [version, setVersion] = useState(0);
  const [painting, setPainting] = useState(false);
  const [snap, setSnap] = useState<string | null>(null);

  // demo model on first start
  useEffect(() => { if (!getState().model) loadDemo('house'); }, []);
  useEffect(() => { document.documentElement.lang = s.lang; document.title = t('app.title'); }, [s.lang]);

  // paint preview rasters whenever anything that affects colour changes
  useEffect(() => {
    if (!s.result) { setCanvases([]); return; }
    applyPendingDemoDecals();
    setPainting(true);
    const h = setTimeout(() => {
      const env = makePaintEnv();
      if (!env) return;
      try {
        const next = env.result.sheets.map((_, i) => paintSheet(env, i, PREVIEW_PX_PER_MM, s.bleed, { reg: true }));
        setCanvases(next); setVersion((v) => v + 1);
      } catch (e) { console.error(e); }
      setPainting(false);
    }, 80);
    return () => clearTimeout(h);
  }, [s.result, s.assign, s.decals, s.userTex, s.bleed]);

  const result = s.result;
  const nSheets = result?.sheets.length ?? 0;
  const sheetIdx = Math.min(s.activeSheet, Math.max(0, nSheets - 1));

  const openExport = () => {
    if (!result) return;
    setSnap(viewer.current?.snapshot() ?? null);
    setState({ exportOpen: true });
  };

  return (
    <div className="app" data-testid="app">
      <header className="top">
        <div className="brand"><span className="logo">◩</span><div><h1>{t('app.title')}</h1><small>{t('app.tagline')}</small></div></div>
        <div className="top-actions">
          <select className="lang" value={s.lang} aria-label={t('hdr.lang')} onChange={(e) => setState({ lang: e.target.value as typeof s.lang })} data-testid="lang">
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="btn primary" onClick={openExport} disabled={!result || !nSheets} data-testid="export-btn">⬇ {t('hdr.export')}</button>
        </div>
      </header>

      <main className={`panes show-${s.mobileTab}`}>
        <div className="pane pane-left"><LeftPanel /></div>

        <section className="pane pane-center" data-testid="pane-3d">
          <div className="toolbar">
            <div className="seg">
              {(['select', 'cut'] as const).map((tool) => (
                <button key={tool} className={'seg-btn' + (s.tool === tool ? ' on' : '')} onClick={() => setState({ tool })} data-testid={`tool-${tool}`}>{t('tool.' + tool)}</button>
              ))}
            </div>
            <div className="seg">
              {(['textured', 'solid', 'wire'] as const).map((m) => (
                <button key={m} className={'seg-btn' + (s.view3d === m ? ' on' : '')} onClick={() => setState({ view3d: m })} data-testid={`view-${m}`}>{t('view.' + m)}</button>
              ))}
            </div>
            <label className="check inline"><input type="checkbox" checked={s.showEdges} onChange={(e) => setState({ showEdges: e.target.checked })} />{t('view.edges')}</label>
            <button className="btn small" onClick={() => viewer.current?.fit()}>{t('view.fit')}</button>
          </div>
          <div className="viewer-wrap">
            <Viewer
              ref={viewer} mesh={s.mesh} result={s.result} sheetCanvases={canvases} paintVersion={version}
              selection={s.selection} mode={s.view3d} tool={s.tool} showEdges={s.showEdges}
              onPick={pickPanel} onToggleJoint={toggleJoint}
            />
            {(s.busy || painting) && <div className="busy" data-testid="busy">{s.busy ? t('busy.compute') : t('busy.paint')}</div>}
            {s.tooMany > 0 && (
              <div className="banner" data-testid="too-many">
                {t('model.simplifyBanner', { n: s.tooMany, max: MAX_TRIS })}
                <button className="btn small primary" onClick={simplifyModel}>{t('model.simplify')}</button>
              </div>
            )}
            <div className="hint">{t('view.hint3d')}</div>
          </div>
        </section>

        <section className="pane pane-right" data-testid="pane-2d">
          {result && nSheets > 0 ? (
            <>
              <div className="toolbar wrap">
                <div className="tabs" role="tablist">
                  {result.sheets.map((_, i) => (
                    <button key={i} role="tab" className={'chip' + (i === sheetIdx ? ' on' : '')} onClick={() => setState({ activeSheet: i })} data-testid={`sheet-tab-${i}`}>{t('v2.sheet')} {i + 1}</button>
                  ))}
                </div>
              </div>
              <Layers />
              <SheetView result={result} index={sheetIdx} canvas={canvases[sheetIdx] ?? null} version={version} />
              <Stats />
            </>
          ) : <p className="empty muted">{t('v2.empty')}</p>}
        </section>
      </main>

      <nav className="mobile-nav">
        {(['settings', 'view3d', 'view2d'] as const).map((m) => (
          <button key={m} className={s.mobileTab === m ? 'on' : ''} onClick={() => setState({ mobileTab: m })} data-testid={`nav-${m}`}>{t(m === 'settings' ? 'nav.settings' : m === 'view3d' ? 'nav.model3d' : 'nav.sheets')}</button>
        ))}
      </nav>

      {s.toast && (
        <div className={`toast ${s.toast.type}`} role={s.toast.type === 'error' ? 'alert' : 'status'} data-testid="toast">
          <span>{s.toast.text}</span><button onClick={() => setState({ toast: null })} aria-label="close">✕</button>
        </div>
      )}
      {s.exportOpen && <ExportModal snapshot={snap} canvases={canvases} version={version} />}
    </div>
  );
}

function Layers() {
  const t = useT();
  const v = useStore((x) => x.view2d);
  return (
    <div className="layers">
      {(['print', 'cut', 'fold', 'engrave', 'reg'] as const).map((k) => (
        <label key={k} className={'chip layer-' + k + (v[k] ? ' on' : '')}>
          <input type="checkbox" checked={v[k]} onChange={(e) => setState({ view2d: { ...v, [k]: e.target.checked } })} data-testid={`layer-${k}`} />{t('v2.' + k)}
        </label>
      ))}
    </div>
  );
}

function Stats() {
  const t = useT();
  const r = useStore((x) => x.result)!;
  const ms = useStore((x) => x.calcMs);
  const v = r.validation;
  const ok = (good: boolean, goodKey: string, badKey: string, n: number) => (
    <li className={good ? 'ok' : 'bad'}>{good ? '✔' : '✖'} {good ? t(goodKey) : t(badKey, { n })}</li>
  );
  return (
    <div className="stats" data-testid="stats">
      <dl>
        <div><dt>{t('stat.panels')}</dt><dd data-testid="stat-panels">{r.stats.panels}</dd></div>
        <div><dt>{t('stat.islands')}</dt><dd>{r.stats.islands}</dd></div>
        <div><dt>{t('stat.sheets')}</dt><dd data-testid="stat-sheets">{r.stats.sheets}</dd></div>
        <div><dt>{t('stat.seams')}</dt><dd>{r.stats.seams}</dd></div>
        <div><dt>{t('stat.tabs')}</dt><dd>{r.stats.tabs}</dd></div>
        <div><dt>{t('stat.cut')}</dt><dd>{(r.stats.cutLengthMm / 1000).toFixed(2)} m</dd></div>
        <div><dt>{t('stat.fold')}</dt><dd>{(r.stats.foldLengthMm / 1000).toFixed(2)} m</dd></div>
        <div><dt>{t('stat.time')}</dt><dd>{Math.round(ms)} ms</dd></div>
      </dl>
      <h4>{t('check.title')}</h4>
      <ul className="checks" data-testid="checks">
        {ok(v.overlaps === 0, 'check.overlap', 'check.overlapBad', v.overlaps)}
        {ok(v.crossings === 0, 'check.cross', 'check.crossBad', v.crossings)}
        {ok(v.outOfBounds === 0, 'check.bounds', 'check.boundsBad', v.outOfBounds)}
        {ok(v.unplaced === 0, 'check.placed', 'check.placedBad', v.unplaced)}
      </ul>
      {r.warnings.filter((w) => !['overlap', 'crossing'].includes(w.code)).slice(0, 6).map((w, i) => <p key={i} className="warn">⚠ {t('warn.' + w.code, w.params as Record<string, string | number>)}</p>)}
    </div>
  );
}
