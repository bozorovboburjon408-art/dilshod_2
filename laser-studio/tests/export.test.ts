import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { computeLayout } from '../src/core/layout';
import { buildHouse } from '../src/core/demo';
import { transformMesh } from '../src/core/mesh';
import { sheetToSvg, ALL_LAYERS } from '../src/core/svg';
import { sheetToDxf } from '../src/core/dxf';
import { PdfDoc, drawSheetVectors } from '../src/core/pdf';
import { encodeTiff, pngSetDpi, zipStore, crc32 } from '../src/core/files';

const OUT = process.env.OUT_DIR ?? '/tmp/lms_out';
mkdirSync(OUT, { recursive: true });

function layout() {
  const { mesh } = transformMesh(buildHouse(), [0, 0, 0], [150, 120, 100]);
  return computeLayout(mesh.positions, mesh.triMat, mesh.triTag, { tabWidth: 5, tabs: true, planarTol: 1, manualCuts: [], numbers: true, seamLabels: true }, { width: 297, height: 420, margin: 8, gap: 3, allowRotate: true }, 'House');
}

describe('exports', () => {
  it('writes svg/dxf/pdf/tiff/zip', () => {
    const r = layout();
    const sh = r.sheets[0];
    const svg = sheetToSvg(sh, ALL_LAYERS);
    expect(svg).toContain('id="CUT"'); expect(svg).toContain('width="297mm"'); expect(svg).toContain('stroke-dasharray');
    writeFileSync(`${OUT}/sheet1.svg`, svg);
    writeFileSync(`${OUT}/sheet1.dxf`, sheetToDxf(sh));
    const jpeg = new Uint8Array(readFileSync(`${OUT}/tiny.jpg`));
    const pdf = new PdfDoc('House test');
    const pg = pdf.addPage(sh.width, sh.height);
    pg.image({ jpeg, w: 8, h: 8 }, 0, 0, sh.width, sh.height);
    drawSheetVectors(pg, sh, { cut: true, fold: true, engrave: true, reg: true });
    writeFileSync(`${OUT}/sheet1.pdf`, pdf.build());
    const tiff = encodeTiff(4, 3, 300, (y0, y1) => new Uint8Array((y1 - y0) * 4 * 4).fill(200));
    writeFileSync(`${OUT}/t.tif`, tiff);
    const png = new Uint8Array(readFileSync(`${OUT}/tiny.png`));
    writeFileSync(`${OUT}/tiny300.png`, pngSetDpi(png, 300));
    writeFileSync(`${OUT}/t.zip`, zipStore([{ name: 'a.txt', data: new TextEncoder().encode('hello') }, { name: 'dir/b.txt', data: new TextEncoder().encode('world!') }]));
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});
