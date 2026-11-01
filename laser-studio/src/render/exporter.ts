import { encodeTiff, pngSetDpi, zipStore, asciiSafe } from '../core/files';
import { sheetToDxf } from '../core/dxf';
import { sheetToSvg, ALL_LAYERS } from '../core/svg';
import { PdfDoc, drawSheetVectors, type PdfImage } from '../core/pdf';
import { paintSheet, type PaintEnv } from './paint';
import { buildInstructionsPdf } from './instructions';
import type { Lang } from '../i18n';

export const DPI = 300;
export interface ExportChoice {
  png: boolean; tiff: boolean; pdfPrint: boolean; svg: boolean; dxf: boolean; pdfProd: boolean; pdfInstr: boolean;
  perSheetPdf: boolean;
}
export interface ExportFile { name: string; data: Uint8Array; mime: string }

async function toBytes(c: HTMLCanvasElement, type: string, q?: number): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, type, q));
  if (!blob) throw new Error('CANVAS');
  return new Uint8Array(await blob.arrayBuffer());
}
function safeName(s: string) { return asciiSafe(s).replace(/[^A-Za-z0-9._-]+/g, '_') || 'model'; }
const pad = (n: number) => String(n).padStart(2, '0');

export async function runExport(
  env: PaintEnv, bleed: number, sheets: number[], choice: ExportChoice,
  ctx: { name: string; lang: Lang; dims: [number, number, number]; snapshot: string | null; previewCanvases: (HTMLCanvasElement | null)[] },
  progress?: (i: number, n: number) => void,
): Promise<ExportFile[]> {
  const base = safeName(ctx.name);
  const out: ExportFile[] = [];
  const pxmm = DPI / 25.4;
  const printImgs: { sheet: number; img: PdfImage }[] = [];
  const needRaster = choice.png || choice.tiff || choice.pdfPrint || choice.pdfProd;
  let step = 0; const total = sheets.length;

  for (const i of sheets) {
    progress?.(step++, total);
    const sh = env.result.sheets[i];
    const tag = `${base}_sheet${pad(i + 1)}`;
    if (needRaster) {
      let canvas: HTMLCanvasElement;
      try { canvas = paintSheet(env, i, pxmm, bleed, { reg: true }); } catch { throw new Error('CANVAS'); }
      if (!canvas.getContext('2d') || canvas.width < 2) throw new Error('CANVAS');
      if (choice.png) out.push({ name: `${tag}_print_300dpi.png`, data: pngSetDpi(await toBytes(canvas, 'image/png'), DPI), mime: 'image/png' });
      if (choice.tiff) {
        const g = canvas.getContext('2d')!;
        out.push({ name: `${tag}_print_300dpi.tif`, data: encodeTiff(canvas.width, canvas.height, DPI, (y0, y1) => g.getImageData(0, y0, canvas.width, y1 - y0).data), mime: 'image/tiff' });
      }
      if (choice.pdfPrint || choice.pdfProd) {
        const jpeg = await toBytes(canvas, 'image/jpeg', 0.92);
        printImgs.push({ sheet: i, img: { jpeg, w: canvas.width, h: canvas.height } });
      }
      canvas.width = 1; canvas.height = 1;
    }
    if (choice.svg || choice.dxf) {
      if (choice.dxf) out.push({ name: `${tag}_laser.dxf`, data: new TextEncoder().encode(sheetToDxf(sh)), mime: 'application/dxf' });
      if (choice.svg) {
        let href: string | undefined;
        const pc = ctx.previewCanvases[i];
        if (pc) href = 'data:image/jpeg;base64,' + b64(await toBytes(pc, 'image/jpeg', 0.88));
        out.push({ name: `${tag}_laser.svg`, data: new TextEncoder().encode(sheetToSvg(sh, ALL_LAYERS, href)), mime: 'image/svg+xml' });
      }
    }
  }
  progress?.(total, total);

  const pdfOf = (kind: 'print' | 'prod', list: typeof printImgs, name: string) => {
    const pdf = new PdfDoc(`${ctx.name} – ${kind}`);
    for (const { sheet, img } of list) {
      const sh = env.result.sheets[sheet];
      const pg = pdf.addPage(sh.width, sh.height);
      pg.image(img, 0, 0, sh.width, sh.height);
      if (kind === 'prod') drawSheetVectors(pg, sh, { cut: true, fold: true, engrave: true, reg: true });
    }
    out.push({ name, data: pdf.build(), mime: 'application/pdf' });
  };
  for (const kind of ['print', 'prod'] as const) {
    if (!(kind === 'print' ? choice.pdfPrint : choice.pdfProd)) continue;
    const suffix = kind === 'print' ? 'print_300dpi' : 'production';
    if (choice.perSheetPdf) for (const p of printImgs) pdfOf(kind, [p], `${base}_sheet${pad(p.sheet + 1)}_${suffix}.pdf`);
    else pdfOf(kind, printImgs, `${base}_${suffix}.pdf`);
  }
  if (choice.pdfInstr) {
    out.push({ name: `${base}_assembly_instructions.pdf`, data: await buildInstructionsPdf(env.result, ctx.lang, { name: ctx.name, dims: ctx.dims }, ctx.snapshot, ctx.previewCanvases), mime: 'application/pdf' });
  }
  return out;
}

function b64(bytes: Uint8Array): string {
  let s = ''; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}

export function zipFiles(files: ExportFile[], name: string): ExportFile {
  return { name, data: zipStore(files.map((f) => ({ name: f.name, data: f.data }))), mime: 'application/zip' };
}

export function downloadFile(f: ExportFile) {
  const url = URL.createObjectURL(new Blob([f.data as BlobPart], { type: f.mime }));
  const a = document.createElement('a'); a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
