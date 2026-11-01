import { useEffect, useState } from 'react';
import { notify, setState, useStore } from '../store';
import { tr, useT } from '../i18n';
import { makePaintEnv } from '../actions';
import { SheetView } from './SheetView';
import { downloadFile, runExport, zipFiles, type ExportChoice, type ExportFile } from '../render/exporter';

const DEFAULT: ExportChoice = { png: true, tiff: false, pdfPrint: true, svg: true, dxf: true, pdfProd: true, pdfInstr: true, perSheetPdf: false };

export function ExportModal({ snapshot, canvases, version }: { snapshot: string | null; canvases: (HTMLCanvasElement | null)[]; version: number }) {
  const t = useT();
  const result = useStore((s) => s.result);
  const model = useStore((s) => s.model);
  const dims = useStore((s) => s.dims);
  const lang = useStore((s) => s.lang);
  const bleed = useStore((s) => s.bleed);
  const [choice, setChoice] = useState<ExportChoice>(DEFAULT);
  const [sheetSel, setSheetSel] = useState<'all' | number>('all');
  const [tab, setTab] = useState<'2d' | '3d'>('2d');
  const [prev, setPrev] = useState(0);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState('');
  const [files, setFiles] = useState<ExportFile[]>([]);

  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setState({ exportOpen: false }); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  if (!result || !model) return null;
  const toggle = (k: keyof ExportChoice) => setChoice((c) => ({ ...c, [k]: !c[k] }));
  const any = choice.png || choice.tiff || choice.pdfPrint || choice.svg || choice.dxf || choice.pdfProd || choice.pdfInstr;
  const sheets = sheetSel === 'all' ? result.sheets.map((_, i) => i) : [sheetSel];

  async function go() {
    if (!any) { notify('error', t('export.noneSelected')); return; }
    const env = makePaintEnv(); if (!env) return;
    setBusy(true); setFiles([]);
    try {
      const out = await runExport(env, bleed, sheets, choice, { name: model!.name, lang, dims, snapshot, previewCanvases: canvases },
        (i, n) => setProg(`${t('export.working')} ${i}/${n}`));
      setFiles(out);
      notify('ok', tr('msg.exported', { n: out.length }));
    } catch (e) {
      notify('error', e instanceof Error && e.message === 'CANVAS' ? t('err.canvas') : `${t('err.export')}: ${e instanceof Error ? e.message : e}`);
    } finally { setBusy(false); setProg(''); }
  }

  const Check = ({ k, label }: { k: keyof ExportChoice; label: string }) => (
    <label className="check"><input type="checkbox" checked={choice[k]} onChange={() => toggle(k)} data-testid={`ex-${k}`} />{label}</label>
  );
  return (
    <div className="modal-back" onClick={(e) => { if (e.target === e.currentTarget) setState({ exportOpen: false }); }} data-testid="export-modal">
      <div className="modal" role="dialog" aria-modal="true" aria-label={t('export.title')}>
        <header><h2>{t('export.title')}</h2><button className="btn icon" onClick={() => setState({ exportOpen: false })} aria-label="close">✕</button></header>
        <div className="modal-body">
          <div className="modal-opts">
            {(result.validation.overlaps + result.validation.crossings + result.validation.outOfBounds + result.validation.unplaced) > 0 && (
              <p className="banner-inline" data-testid="ex-issues">⚠ {t('export.issues')}</p>
            )}
            <label className="field"><span>{t('export.sheet')}</span>
              <select value={String(sheetSel)} onChange={(e) => setSheetSel(e.target.value === 'all' ? 'all' : +e.target.value)} data-testid="ex-sheet">
                <option value="all">{t('export.allSheets')}</option>
                {result.sheets.map((_, i) => <option key={i} value={i}>{t('export.sheet')} {i + 1}</option>)}
              </select></label>
            <div className="subhead">{t('export.color')}</div>
            <Check k="png" label="PNG" /><Check k="tiff" label="TIFF" /><Check k="pdfPrint" label={t('export.pdfPrint')} />
            <div className="subhead">{t('export.laser')}</div>
            <Check k="svg" label="SVG" /><Check k="dxf" label="DXF" />
            <div className="subhead">{t('export.production')}</div>
            <Check k="pdfProd" label={t('export.pdfProd')} />
            <div className="subhead">{t('export.instructions')}</div>
            <Check k="pdfInstr" label={t('export.pdfInstr')} />
            <label className="check"><input type="checkbox" checked={choice.perSheetPdf} onChange={() => toggle('perSheetPdf')} />{t('export.perSheet')} (PDF)</label>
            <button className="btn primary" disabled={busy || !any} onClick={go} data-testid="ex-go">{busy ? prog || t('export.working') : t('export.go')}</button>
            <p className="muted small">{t('export.privacy')}</p>
            {files.length > 0 && (
              <div className="files" data-testid="ex-files">
                {files.map((f) => (
                  <button key={f.name} className="file" onClick={() => downloadFile(f)} data-testid="ex-file">
                    <span>⬇ {f.name}</span><small>{(f.data.length / 1024).toFixed(f.data.length > 1e6 ? 0 : 1)} KB</small>
                  </button>
                ))}
                <button className="btn" onClick={() => downloadFile(zipFiles(files, `${model.name}_laser_studio.zip`))} data-testid="ex-zip">⬇ {t('export.zip')}</button>
              </div>
            )}
          </div>
          <div className="modal-prev">
            <div className="seg">
              <button className={'seg-btn' + (tab === '2d' ? ' on' : '')} onClick={() => setTab('2d')}>{t('export.p2d')}</button>
              <button className={'seg-btn' + (tab === '3d' ? ' on' : '')} onClick={() => setTab('3d')}>{t('export.p3d')}</button>
            </div>
            {tab === '2d' ? (
              <>
                {result.sheets.length > 1 && <div className="tabs">{result.sheets.map((_, i) => <button key={i} className={'chip' + (prev === i ? ' on' : '')} onClick={() => setPrev(i)}>{i + 1}</button>)}</div>}
                <SheetView result={result} index={Math.min(prev, result.sheets.length - 1)} canvas={canvases[Math.min(prev, result.sheets.length - 1)] ?? null} version={version} readOnly forceAll />
              </>
            ) : snapshot ? <img className="snap" src={snapshot} alt="3D preview" /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
