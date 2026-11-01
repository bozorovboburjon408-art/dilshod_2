// Minimal real PDF 1.4 writer: vector paths, Helvetica text, DCT (JPEG) images. Page units are millimetres (1:1).
import { asciiSafe, concat } from './files';
import type { SheetOut } from './types';
import { COLORS } from './svg';

const PT = 72 / 25.4;
const te = new TextEncoder();
const num = (v: number) => (Math.round(v * 1000) / 1000).toString();
const rgb = (hex: string) => {
  const v = parseInt(hex.slice(1), 16);
  return `${num(((v >> 16) & 255) / 255)} ${num(((v >> 8) & 255) / 255)} ${num((v & 255) / 255)}`;
};
const pdfStr = (s: string) => '(' + asciiSafe(s).replace(/[\\()]/g, (c) => '\\' + c) + ')';

export interface PdfImage { jpeg: Uint8Array; w: number; h: number }

export class PageCtx {
  ops: string[] = [];
  images: { name: string; img: PdfImage }[] = [];
  constructor(public wMm: number, public hMm: number) { this.ops.push(`${num(PT)} 0 0 ${num(PT)} 0 0 cm`); }
  image(img: PdfImage, x: number, y: number, w: number, h: number) {
    const name = 'Im' + (this.images.length + 1);
    this.images.push({ name, img });
    this.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /${name} Do Q`);
  }
  style(stroke: string, width: number, dash: number[] = []) {
    this.ops.push(`${rgb(stroke)} RG ${num(width)} w [${dash.map(num).join(' ')}] 0 d 1 j`);
  }
  polyline(pts: [number, number][], closed = false) {
    if (pts.length < 2) return;
    this.ops.push(`${num(pts[0][0])} ${num(pts[0][1])} m ` + pts.slice(1).map((p) => `${num(p[0])} ${num(p[1])} l`).join(' ') + (closed ? ' h S' : ' S'));
  }
  circle(x: number, y: number, r: number) {
    const k = 0.5522847498 * r;
    this.ops.push(
      `${num(x + r)} ${num(y)} m ${num(x + r)} ${num(y + k)} ${num(x + k)} ${num(y + r)} ${num(x)} ${num(y + r)} c ` +
      `${num(x - k)} ${num(y + r)} ${num(x - r)} ${num(y + k)} ${num(x - r)} ${num(y)} c ` +
      `${num(x - r)} ${num(y - k)} ${num(x - k)} ${num(y - r)} ${num(x)} ${num(y - r)} c ` +
      `${num(x + k)} ${num(y - r)} ${num(x + r)} ${num(y - k)} ${num(x + r)} ${num(y)} c S`,
    );
  }
  /** centred text, angle in radians (CCW) */
  text(s: string, x: number, y: number, size: number, angle = 0, color = '#000000') {
    const t = asciiSafe(s);
    const w = t.length * size * 0.54;
    const c = Math.cos(angle), sn = Math.sin(angle);
    // centre horizontally, vertically ~ cap height/2
    const ox = -w / 2, oy = -size * 0.35;
    const tx = x + ox * c - oy * sn, ty = y + ox * sn + oy * c;
    this.ops.push(`q ${rgb(color)} rg ${num(c)} ${num(sn)} ${num(-sn)} ${num(c)} ${num(tx)} ${num(ty)} cm BT /F1 ${num(size)} Tf 0 0 Td ${pdfStr(s)} Tj ET Q`);
  }
}

export class PdfDoc {
  pages: PageCtx[] = [];
  constructor(public title = 'Laser Model Texture Studio') {}
  addPage(wMm: number, hMm: number): PageCtx { const p = new PageCtx(wMm, hMm); this.pages.push(p); return p; }
  build(): Uint8Array {
    const objs: Uint8Array[] = [];
    const add = (b: string | Uint8Array): number => { objs.push(typeof b === 'string' ? te.encode(b) : b); return objs.length; };
    // reserve ids: 1 catalog, 2 pages, 3 font, 4 info
    add(''); add(''); add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add(`<< /Title ${pdfStr(this.title)} /Producer (Laser Model Texture Studio) /Creator (Laser Model Texture Studio) >>`);
    const pageIds: number[] = [];
    for (const pg of this.pages) {
      const imgRefs: string[] = [];
      for (const im of pg.images) {
        const head = te.encode(`<< /Type /XObject /Subtype /Image /Width ${im.img.w} /Height ${im.img.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.img.jpeg.length} >>\nstream\n`);
        const id = add(concat([head, im.img.jpeg, te.encode('\nendstream')]));
        imgRefs.push(`/${im.name} ${id} 0 R`);
      }
      const content = te.encode(pg.ops.join('\n'));
      const cid = add(concat([te.encode(`<< /Length ${content.length} >>\nstream\n`), content, te.encode('\nendstream')]));
      const pid = add(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(pg.wMm * PT)} ${num(pg.hMm * PT)}] /Contents ${cid} 0 R ` +
        `/Resources << /Font << /F1 3 0 R >> /XObject << ${imgRefs.join(' ')} >> >> >>`,
      );
      pageIds.push(pid);
    }
    objs[0] = te.encode('<< /Type /Catalog /Pages 2 0 R >>');
    objs[1] = te.encode(`<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] >>`);
    const parts: Uint8Array[] = [te.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
    const offsets: number[] = [];
    let pos = parts[0].length;
    objs.forEach((o, i) => {
      offsets.push(pos);
      const b = concat([te.encode(`${i + 1} 0 obj\n`), o, te.encode('\nendobj\n')]);
      parts.push(b); pos += b.length;
    });
    let xref = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
    xref += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
    parts.push(te.encode(xref));
    return concat(parts);
  }
}

/** Draw the vector layers of a sheet onto a PDF page (mm, Y-up – same as sheet space). */
export function drawSheetVectors(pg: PageCtx, sheet: SheetOut, layers: { cut: boolean; fold: boolean; engrave: boolean; reg: boolean }) {
  if (layers.cut) {
    pg.style(COLORS.cut, 0.1);
    for (const c of sheet.cut) pg.polyline(c.pts, c.closed);
  }
  if (layers.fold) {
    for (const kind of ['valley', 'mountain'] as const) {
      pg.style(COLORS.fold, 0.1, kind === 'valley' ? [3, 1.5] : [4, 1.2, 0.8, 1.2]);
      for (const l of sheet.fold) if (l.kind === kind) pg.polyline([l.a, l.b]);
    }
  }
  if (layers.engrave) for (const t of sheet.texts) if (t.layer === 'ENGRAVE') pg.text(t.text, t.x, t.y, t.size, t.angle, COLORS.engrave);
  if (layers.reg) {
    pg.style(COLORS.reg, 0.1);
    for (const c of sheet.regCircles) pg.circle(c.x, c.y, c.r);
    for (const [a, b] of sheet.regLines) pg.polyline([a, b]);
    for (const t of sheet.texts) if (t.layer === 'REGISTRATION') pg.text(t.text, t.x, t.y, t.size, t.angle, COLORS.reg);
  }
}
