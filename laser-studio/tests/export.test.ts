import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeLayout } from '../src/core/layout';
import { buildHouse } from '../src/core/demo';
import { transformMesh } from '../src/core/mesh';
import { sheetToSvg, ALL_LAYERS } from '../src/core/svg';
import { sheetToDxf } from '../src/core/dxf';
import { PdfDoc, drawSheetVectors } from '../src/core/pdf';
import { encodeTiff, pngSetDpi, zipStore, crc32 } from '../src/core/files';

const OUT = process.env.OUT_DIR ?? join(tmpdir(), 'lms_out');
const TINY_JPG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDs6KKK8I7T/9k=', 'base64');
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFElEQVR4nGM8saWCARtgwio6aCUAih8CBG3lGu8AAAAASUVORK5CYII=', 'base64');
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
    const jpeg = new Uint8Array(TINY_JPG);
    const pdf = new PdfDoc('House test');
    const pg = pdf.addPage(sh.width, sh.height);
    pg.image({ jpeg, w: 8, h: 8 }, 0, 0, sh.width, sh.height);
    drawSheetVectors(pg, sh, { cut: true, fold: true, engrave: true, reg: true });
    writeFileSync(`${OUT}/sheet1.pdf`, pdf.build());
    const tiff = encodeTiff(4, 3, 300, (y0, y1) => new Uint8Array((y1 - y0) * 4 * 4).fill(200));
    writeFileSync(`${OUT}/t.tif`, tiff);
    const png = new Uint8Array(TINY_PNG);
    writeFileSync(`${OUT}/tiny300.png`, pngSetDpi(png, 300));
    writeFileSync(`${OUT}/t.zip`, zipStore([{ name: 'a.txt', data: new TextEncoder().encode('hello') }, { name: 'dir/b.txt', data: new TextEncoder().encode('world!') }]));
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});
