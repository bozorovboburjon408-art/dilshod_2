import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import { pickPanel, toggleJoint } from '../actions';
import { COLORS, DASH } from '../core/svg';
import { asciiSafe } from '../core/files';
import type { LayoutResult } from '../core/types';

interface Props { result: LayoutResult; index: number; canvas: HTMLCanvasElement | null; version: number; readOnly?: boolean; forceAll?: boolean }

export function SheetView({ result, index, canvas, version, readOnly, forceAll }: Props) {
  const t = useT();
  const layers = useStore((s) => s.view2d);
  const selection = useStore((s) => s.selection);
  const tool = useStore((s) => s.tool);
  const [zoom, setZoom] = useState(1);
  const [url, setUrl] = useState<string | null>(null);
  const sheet = result.sheets[index];
  const L = forceAll ? { print: true, cut: true, fold: true, engrave: true, reg: true } : layers;

  useEffect(() => {
    if (!canvas) { setUrl(null); return; }
    let revoked = false, u: string | null = null;
    canvas.toBlob((b) => { if (b && !revoked) { u = URL.createObjectURL(b); setUrl(u); } }, 'image/jpeg', 0.88);
    return () => { revoked = true; if (u) URL.revokeObjectURL(u); };
  }, [canvas, version]);

  const hit = useMemo(() => {
    return result.panels.filter((p) => p.sheet === index).map((p) => {
      let d = '';
      for (let i = 0; i < p.sheetTri.length; i += 6) {
        const s = p.sheetTri;
        d += `M${r(s[i])} ${r(s[i + 1])}L${r(s[i + 2])} ${r(s[i + 3])}L${r(s[i + 4])} ${r(s[i + 5])}Z`;
      }
      return { key: p.key, d };
    });
  }, [result, index]);
  const cutD = useMemo(() => sheet ? sheet.cut.map((c) => c.pts.map((q, i) => `${i ? 'L' : 'M'}${r(q[0])} ${r(q[1])}`).join('') + (c.closed ? 'Z' : '')).join('') : '', [sheet]);
  if (!sheet) return null;
  const W = sheet.width, H = sheet.height;
  const sel = new Set(selection);
  const cutMode = tool === 'cut' && !readOnly;
  const foldD = (kind: 'valley' | 'mountain') => sheet.fold.filter((f) => f.kind === kind).map((f) => `M${r(f.a[0])} ${r(f.a[1])}L${r(f.b[0])} ${r(f.b[1])}`).join('');
  const flipText = (x: number, y: number, a: number) => `translate(${r(x)} ${r(H - y)}) rotate(${r((-a * 180) / Math.PI)})`;

  return (
    <div className="sheet-view">
      {!readOnly && (
        <div className="zoom-row">
          <label>{t('v2.zoom')}</label>
          <input type="range" min={0.5} max={4} step={0.1} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      )}
      <div className="sheet-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: `${zoom * 100}%` }} className="sheet-svg" data-testid="sheet-svg">
          <rect width={W} height={H} fill="#fff" />
          {L.print && url && <image href={url} x={0} y={0} width={W} height={H} preserveAspectRatio="none" />}
          <g transform={`translate(0 ${H}) scale(1 -1)`} fill="none">
            {!readOnly && hit.map((h) => (
              <path key={h.key} d={h.d} fill={sel.has(h.key) ? 'rgba(0,200,255,0.38)' : 'transparent'} stroke="none"
                style={{ cursor: cutMode ? 'default' : 'pointer' }}
                onClick={(e) => { if (!cutMode) pickPanel(h.key, e.shiftKey || e.ctrlKey || e.metaKey); }} />
            ))}
            {L.cut && <path d={cutD} stroke={COLORS.cut} strokeWidth={1.3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
            {L.fold && <>
              <path d={foldD('valley')} stroke={COLORS.fold} strokeWidth={1.3} vectorEffect="non-scaling-stroke" strokeDasharray={DASH.valley} />
              <path d={foldD('mountain')} stroke={COLORS.fold} strokeWidth={1.3} vectorEffect="non-scaling-stroke" strokeDasharray={DASH.mountain} />
            </>}
            {L.reg && <g stroke={COLORS.reg} strokeWidth={1.1} vectorEffect="non-scaling-stroke">
              {sheet.regCircles.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} vectorEffect="non-scaling-stroke" />)}
              <path d={sheet.regLines.map(([a, b]) => `M${r(a[0])} ${r(a[1])}L${r(b[0])} ${r(b[1])}`).join('')} vectorEffect="non-scaling-stroke" />
            </g>}
            {cutMode && sheet.fold.map((f, i) => (
              <line key={i} x1={f.a[0]} y1={f.a[1]} x2={f.b[0]} y2={f.b[1]} stroke="rgba(255,0,255,0.35)" strokeWidth={3.5} strokeLinecap="round"
                style={{ cursor: 'crosshair' }} onClick={() => toggleJoint(f.jointKey)} />
            ))}
          </g>
          {sheet.texts.map((tx, i) => (tx.layer === 'ENGRAVE' ? L.engrave : L.reg) && (
            <text key={i} transform={flipText(tx.x, tx.y, tx.angle)} fontSize={tx.size} textAnchor="middle" dominantBaseline="central"
              fill={tx.layer === 'ENGRAVE' ? '#000' : COLORS.reg} fontFamily="Arial, sans-serif" pointerEvents="none">{asciiSafe(tx.text)}</text>
          ))}
        </svg>
      </div>
    </div>
  );
}
const r = (n: number) => Math.round(n * 100) / 100;
