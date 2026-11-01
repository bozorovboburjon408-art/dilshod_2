// Binary helpers: CRC32, PNG dpi metadata, TIFF encoder, ZIP (store) writer.

let CRC_TABLE: Uint32Array | null = null;
export function crc32(data: Uint8Array, seed = 0): number {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = ~seed >>> 0;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

const te = new TextEncoder();

/** Insert a pHYs chunk (pixels per metre) right after IHDR so the PNG carries its DPI. */
export function pngSetDpi(png: Uint8Array, dpi: number): Uint8Array {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (png[i] !== sig[i]) throw new Error('Not a PNG');
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set(te.encode('pHYs'), 4);
  dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  // strip any existing pHYs
  const out: Uint8Array[] = [png.subarray(0, 33), chunk];
  let p = 33;
  while (p < png.length) {
    const len = new DataView(png.buffer, png.byteOffset + p, 4).getUint32(0);
    const type = String.fromCharCode(...png.subarray(p + 4, p + 8));
    if (type !== 'pHYs') out.push(png.subarray(p, p + 12 + len));
    p += 12 + len;
  }
  return concat(out);
}

export function concat(parts: Uint8Array[]): Uint8Array {
  let n = 0;
  for (const p of parts) n += p.length;
  const o = new Uint8Array(n);
  let off = 0;
  for (const p of parts) { o.set(p, off); off += p.length; }
  return o;
}

/**
 * Uncompressed baseline RGB TIFF, little-endian, with XResolution/YResolution = dpi.
 * `rows(y0, y1)` must return RGBA bytes for those rows.
 */
export function encodeTiff(width: number, height: number, dpi: number, rows: (y0: number, y1: number) => Uint8ClampedArray | Uint8Array): Uint8Array {
  const entries = 12;
  const ifdOff = 8;
  const ifdSize = 2 + entries * 12 + 4;
  const extra = ifdOff + ifdSize; // bpp(6) + xres(8) + yres(8)
  const dataOff = extra + 6 + 8 + 8;
  const stripBytes = width * height * 3;
  const out = new Uint8Array(dataOff + stripBytes);
  const dv = new DataView(out.buffer);
  out[0] = 0x49; out[1] = 0x49; dv.setUint16(2, 42, true); dv.setUint32(4, ifdOff, true);
  dv.setUint16(ifdOff, entries, true);
  let p = ifdOff + 2;
  const ent = (tag: number, type: number, count: number, value: number) => {
    dv.setUint16(p, tag, true); dv.setUint16(p + 2, type, true); dv.setUint32(p + 4, count, true);
    if (type === 3 && count === 1) dv.setUint16(p + 8, value, true); else dv.setUint32(p + 8, value, true);
    p += 12;
  };
  ent(256, 4, 1, width); ent(257, 4, 1, height); ent(258, 3, 3, extra); ent(259, 3, 1, 1); ent(262, 3, 1, 2);
  ent(273, 4, 1, dataOff); ent(277, 3, 1, 3); ent(278, 4, 1, height); ent(279, 4, 1, stripBytes);
  ent(282, 5, 1, extra + 6); ent(283, 5, 1, extra + 14); ent(296, 3, 1, 2);
  dv.setUint32(p, 0, true);
  dv.setUint16(extra, 8, true); dv.setUint16(extra + 2, 8, true); dv.setUint16(extra + 4, 8, true);
  dv.setUint32(extra + 6, Math.round(dpi), true); dv.setUint32(extra + 10, 1, true);
  dv.setUint32(extra + 14, Math.round(dpi), true); dv.setUint32(extra + 18, 1, true);
  let o = dataOff;
  const band = 256;
  for (let y = 0; y < height; y += band) {
    const y1 = Math.min(height, y + band);
    const px = rows(y, y1);
    for (let i = 0; i < (y1 - y) * width; i++) { out[o++] = px[4 * i]; out[o++] = px[4 * i + 1]; out[o++] = px[4 * i + 2]; }
  }
  return out;
}

export interface ZipEntry { name: string; data: Uint8Array }
export function zipStore(entries: ZipEntry[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const date = 0x5a21, time = 0; // 2025-01-01
  for (const e of entries) {
    const name = te.encode(e.name);
    const crc = crc32(e.data);
    const lh = new Uint8Array(30 + name.length);
    const d = new DataView(lh.buffer);
    d.setUint32(0, 0x04034b50, true); d.setUint16(4, 20, true); d.setUint16(6, 0x0800, true); d.setUint16(8, 0, true);
    d.setUint16(10, time, true); d.setUint16(12, date, true); d.setUint32(14, crc, true);
    d.setUint32(18, e.data.length, true); d.setUint32(22, e.data.length, true); d.setUint16(26, name.length, true);
    lh.set(name, 30);
    parts.push(lh, e.data);
    const ch = new Uint8Array(46 + name.length);
    const c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
    c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true);
    c.setUint32(20, e.data.length, true); c.setUint32(24, e.data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    ch.set(name, 46);
    central.push(ch);
    offset += lh.length + e.data.length;
  }
  const cd = concat(central);
  const end = new Uint8Array(22);
  const ed = new DataView(end.buffer);
  ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, entries.length, true); ed.setUint16(10, entries.length, true);
  ed.setUint32(12, cd.length, true); ed.setUint32(16, offset, true);
  return concat([...parts, cd, end]);
}

export function asciiSafe(s: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'ў':'o','қ':'q','ғ':'g','ҳ':'h','ʻ':"'",'ʼ':"'",'’':"'",'‘':"'",'–':'-','—':'-','×':'x',
  };
  return s.replace(/./gu, (ch) => {
    const lower = ch.toLowerCase();
    if (/^[\x20-\x7e]$/.test(ch)) return ch;
    const m = map[lower];
    if (m !== undefined) return ch === lower ? m : m.charAt(0).toUpperCase() + m.slice(1);
    return '_';
  });
}
