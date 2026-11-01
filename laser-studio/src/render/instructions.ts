// Assembly instructions PDF, rendered on canvas (so Cyrillic / Uzbek characters work) and embedded as JPEG pages.
import { PdfDoc } from '../core/pdf';
import { COLORS, DASH } from '../core/svg';
import { trLang, type Lang } from '../i18n';
import type { LayoutResult } from '../core/types';

const DPI = 300;
const PX = DPI / 25.4;
const PW = 210, PH = 297;

async function canvasJpeg(c: HTMLCanvasElement, q = 0.9): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', q));
  if (!blob) throw new Error('canvas');
  return new Uint8Array(await blob.arrayBuffer());
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/); const lines: string[] = []; let cur = '';
  for (const w of words) { const n = cur ? cur + ' ' + w : w; if (ctx.measureText(n).width > maxW && cur) { lines.push(cur); cur = w; } else cur = n; }
  if (cur) lines.push(cur);
  return lines;
}
async function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

function newPage(): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas'); c.width = Math.round(PW * PX); c.height = Math.round(PH * PX);
  const g = c.getContext('2d', { alpha: false })!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.scale(PX, PX);
  g.textBaseline = 'alphabetic';
  return { c, g };
}

export async function buildInstructionsPdf(
  result: LayoutResult, lang: Lang, model: { name: string; dims: [number, number, number] }, snapshot: string | null, printCanvases: (HTMLCanvasElement | null)[],
): Promise<Uint8Array> {
  const T = (k: string, p?: Record<string, string | number>) => trLang(lang, k, p);
  const pdf = new PdfDoc(`${model.name} – ${T('instr.title')}`);
  const pages: HTMLCanvasElement[] = [];
  const font = 'Arial, Helvetica, sans-serif';

  // ---- page 1: summary + legend + snapshot
  let { c, g } = newPage();
  g.fillStyle = '#111'; g.font = `bold 9px ${font}`; g.fillText(T('instr.title'), 15, 25);
  g.font = `4.5px ${font}`; g.fillStyle = '#333';
  g.fillText(`${T('instr.model')}: ${model.name}`, 15, 36);
  g.fillText(`${T('instr.size')}: ${model.dims.map((d) => Math.round(d * 10) / 10).join(' × ')} mm`, 15, 43);
  g.fillText(`${T('instr.faces')}: ${result.stats.panels}   ·   ${T('instr.sheets')}: ${result.stats.sheets}   ·   ${T('stat.seams')}: ${result.stats.seams}`, 15, 50);
  if (snapshot) {
    try {
      const im = await loadImg(snapshot);
      const maxW = 180, maxH = 110; const k = Math.min(maxW / im.width, maxH / im.height);
      g.drawImage(im, 15, 58, im.width * k, im.height * k);
    } catch { /* snapshot optional */ }
  }
  let y = 178;
  g.fillStyle = '#111'; g.font = `bold 5.5px ${font}`; g.fillText(T('instr.legend'), 15, y); y += 8;
  g.font = `4.2px ${font}`;
  const legend: [string, () => void][] = [
    [T('v2.legendCut'), () => { g.strokeStyle = COLORS.cut; g.setLineDash([]); }],
    [T('v2.legendValley'), () => { g.strokeStyle = COLORS.fold; g.setLineDash(DASH.valley.split(' ').map(Number)); }],
    [T('v2.legendMountain'), () => { g.strokeStyle = COLORS.fold; g.setLineDash(DASH.mountain.split(' ').map(Number)); }],
  ];
  for (const [label, style] of legend) {
    g.save(); style(); g.lineWidth = 0.5; g.beginPath(); g.moveTo(15, y - 1.5); g.lineTo(45, y - 1.5); g.stroke(); g.restore();
    g.fillStyle = '#222'; g.fillText(label, 50, y); y += 7;
  }
  g.fillStyle = COLORS.reg; g.strokeStyle = COLORS.reg; g.lineWidth = 0.4; g.beginPath(); g.arc(30, y - 1.5, 2.5, 0, 7); g.moveTo(24, y - 1.5); g.lineTo(36, y - 1.5); g.moveTo(30, y - 7.5); g.lineTo(30, y + 4.5); g.stroke();
  g.fillStyle = '#222'; g.fillText(T('v2.legendReg'), 50, y); y += 10;
  g.font = `4.2px ${font}`; g.fillStyle = '#111';
  for (const line of wrap(g, T('instr.how'), 180)) { g.fillText(line, 15, y); y += 6; }
  pages.push(c);

  // ---- sheet overview
  ({ c, g } = newPage());
  g.fillStyle = '#111'; g.font = `bold 7px ${font}`; g.fillText(T('instr.overview'), 15, 22);
  const cols = 2, cw = 88, chh = 120;
  for (let i = 0; i < result.sheets.length; i++) {
    if (i > 0 && i % 4 === 0) { pages.push(c); ({ c, g } = newPage()); g.fillStyle = '#111'; g.font = `bold 7px ${font}`; g.fillText(T('instr.overview'), 15, 22); }
    const idx = i % 4, col = idx % cols, row = Math.floor(idx / cols);
    const sh = result.sheets[i];
    const k = Math.min(cw / sh.width, (chh - 8) / sh.height);
    const x0 = 15 + col * (cw + 14), y0 = 30 + row * (chh + 6);
    g.save(); g.translate(x0, y0 + 6);
    g.fillStyle = '#fff'; g.fillRect(0, 0, sh.width * k, sh.height * k);
    const pc = printCanvases[i]; if (pc) g.drawImage(pc, 0, 0, sh.width * k, sh.height * k);
    g.strokeStyle = '#888'; g.lineWidth = 0.2; g.setLineDash([]); g.strokeRect(0, 0, sh.width * k, sh.height * k);
    g.translate(0, sh.height * k); g.scale(k, -k);
    g.strokeStyle = COLORS.cut; g.lineWidth = 0.35 / k;
    for (const cc of sh.cut) { g.beginPath(); cc.pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); if (cc.closed) g.closePath(); g.stroke(); }
    g.strokeStyle = COLORS.fold; g.lineWidth = 0.35 / k; g.setLineDash([2, 1.5]);
    for (const f of sh.fold) { g.beginPath(); g.moveTo(f.a[0], f.a[1]); g.lineTo(f.b[0], f.b[1]); g.stroke(); }
    g.restore();
    g.save(); g.translate(x0, y0 + 6); g.fillStyle = '#000';
    for (const p of result.panels) if (p.sheet === i) {
      // face number at the first triangle centroid
      let sx = 0, sy = 0, n = 0;
      for (let j = 0; j < p.sheetTri.length; j += 6) { sx += (p.sheetTri[j] + p.sheetTri[j + 2] + p.sheetTri[j + 4]) / 3; sy += (p.sheetTri[j + 1] + p.sheetTri[j + 3] + p.sheetTri[j + 5]) / 3; n++; }
      g.font = `bold ${Math.max(2.2, Math.min(5, Math.sqrt(p.area) * k * 0.45))}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(p.number), (sx / n) * k, sh.height * k - (sy / n) * k);
    }
    g.restore(); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = '#111'; g.font = `bold 4.5px ${font}`; g.fillText(`${T('instr.onSheet')} ${i + 1} / ${result.sheets.length}`, x0, y0 + 3);
  }
  pages.push(c);

  // ---- assembly steps table
  const order = [...result.panels].sort((a, b) => a.number - b.number);
  const byKey = new Map(result.panels.map((p) => [p.key, p]));
  const tabsOf = new Map<string, string[]>();
  for (const s of result.seams) if (s.tabPanel) {
    const other = byKey.get(s.otherPanel);
    const l = tabsOf.get(s.tabPanel) ?? []; l.push(T('instr.tabs', { a: s.id, b: other?.number ?? '?' })); tabsOf.set(s.tabPanel, l);
  }
  const rowsPerPage = 36;
  for (let start = 0; start < order.length; start += rowsPerPage) {
    ({ c, g } = newPage());
    g.fillStyle = '#111'; g.font = `bold 7px ${font}`; g.fillText(T('instr.steps'), 15, 22);
    g.font = `bold 4.2px ${font}`; g.fillText(T('instr.step'), 15, 32); g.fillText(T('instr.onSheet'), 38, 32); g.fillText(T('instr.glue'), 60, 32);
    g.strokeStyle = '#555'; g.lineWidth = 0.3; g.beginPath(); g.moveTo(15, 34); g.lineTo(195, 34); g.stroke();
    g.font = `4px ${font}`;
    order.slice(start, start + rowsPerPage).forEach((p, i) => {
      const yy = 41 + i * 6.8;
      if (i % 2 === 0) { g.fillStyle = '#f3f5f8'; g.fillRect(14, yy - 4.6, 182, 6.4); }
      g.fillStyle = '#111';
      g.fillText(`${p.number}`, 15, yy); g.fillText(`${p.sheet + 1}`, 38, yy);
      const txt = (tabsOf.get(p.key) ?? []).join(';  ') || T('instr.none');
      let shown = txt; while (g.measureText(shown).width > 130 && shown.length > 4) shown = shown.slice(0, -2);
      g.fillText(shown === txt ? txt : shown + '…', 60, yy);
    });
    pages.push(c);
  }

  for (const pc of pages) {
    const jpeg = await canvasJpeg(pc, 0.88);
    const pg = pdf.addPage(PW, PH);
    pg.image({ jpeg, w: pc.width, h: pc.height }, 0, 0, PW, PH);
    pc.width = 1; pc.height = 1; // free memory
  }
  return pdf.build();
}
