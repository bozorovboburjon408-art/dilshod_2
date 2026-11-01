import { asciiSafe } from './files';
import type { SheetOut } from './types';

// AutoCAD R12 ASCII DXF (widest compatibility with laser software). Units: mm, Y-up, origin X0/Y0 = bottom-left.
const LAYERS: { name: string; color: number; ltype: string }[] = [
  { name: 'CUT', color: 1, ltype: 'CONTINUOUS' },
  { name: 'FOLD', color: 5, ltype: 'DASHED' },
  { name: 'ENGRAVE', color: 7, ltype: 'CONTINUOUS' },
  { name: 'PRINT', color: 8, ltype: 'CONTINUOUS' },
  { name: 'REGISTRATION', color: 3, ltype: 'CONTINUOUS' },
];

const n = (v: number) => (Math.round(v * 10000) / 10000).toString();

export function sheetToDxf(sheet: SheetOut): string {
  const o: string[] = [];
  const g = (code: number, value: string | number) => { o.push(String(code), String(value)); };
  g(0, 'SECTION'); g(2, 'HEADER');
  g(9, '$ACADVER'); g(1, 'AC1009');
  g(9, '$INSBASE'); g(10, 0); g(20, 0); g(30, 0);
  g(9, '$EXTMIN'); g(10, 0); g(20, 0); g(30, 0);
  g(9, '$EXTMAX'); g(10, n(sheet.width)); g(20, n(sheet.height)); g(30, 0);
  g(9, '$LIMMIN'); g(10, 0); g(20, 0);
  g(9, '$LIMMAX'); g(10, n(sheet.width)); g(20, n(sheet.height));
  g(9, '$MEASUREMENT'); g(70, 1);
  g(9, '$LUNITS'); g(70, 2);
  g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'TABLES');
  g(0, 'TABLE'); g(2, 'LTYPE'); g(70, 3);
  g(0, 'LTYPE'); g(2, 'CONTINUOUS'); g(70, 0); g(3, 'Solid line'); g(72, 65); g(73, 0); g(40, 0);
  g(0, 'LTYPE'); g(2, 'DASHED'); g(70, 0); g(3, 'Dashed'); g(72, 65); g(73, 2); g(40, 4.5); g(49, 3); g(49, -1.5);
  g(0, 'LTYPE'); g(2, 'DASHDOT'); g(70, 0); g(3, 'Dash dot'); g(72, 65); g(73, 4); g(40, 7); g(49, 4); g(49, -1.2); g(49, 0.8); g(49, -1);
  g(0, 'ENDTAB');
  g(0, 'TABLE'); g(2, 'LAYER'); g(70, LAYERS.length);
  for (const l of LAYERS) { g(0, 'LAYER'); g(2, l.name); g(70, 0); g(62, l.color); g(6, l.ltype); }
  g(0, 'ENDTAB');
  g(0, 'TABLE'); g(2, 'STYLE'); g(70, 1);
  g(0, 'STYLE'); g(2, 'STANDARD'); g(70, 0); g(40, 0); g(41, 1); g(50, 0); g(71, 0); g(42, 2.5); g(3, 'txt'); g(4, '');
  g(0, 'ENDTAB');
  g(0, 'ENDSEC');
  g(0, 'SECTION'); g(2, 'ENTITIES');

  const line = (layer: string, a: [number, number], b: [number, number], ltype?: string) => {
    g(0, 'LINE'); g(8, layer); if (ltype) g(6, ltype);
    g(10, n(a[0])); g(20, n(a[1])); g(30, 0); g(11, n(b[0])); g(21, n(b[1])); g(31, 0);
  };
  for (const c of sheet.cut) {
    if (c.pts.length < 2) continue;
    g(0, 'POLYLINE'); g(8, 'CUT'); g(66, 1); g(70, c.closed ? 1 : 0); g(10, 0); g(20, 0); g(30, 0);
    for (const p of c.pts) { g(0, 'VERTEX'); g(8, 'CUT'); g(10, n(p[0])); g(20, n(p[1])); g(30, 0); }
    g(0, 'SEQEND'); g(8, 'CUT');
  }
  for (const l of sheet.fold) line('FOLD', l.a, l.b, l.kind === 'mountain' ? 'DASHDOT' : 'DASHED');
  for (const t of sheet.texts) {
    g(0, 'TEXT'); g(8, t.layer); g(10, n(t.x)); g(20, n(t.y)); g(30, 0); g(40, n(t.size)); g(1, asciiSafe(t.text));
    g(50, n((t.angle * 180) / Math.PI)); g(72, 1); g(11, n(t.x)); g(21, n(t.y)); g(31, 0); g(73, 2);
  }
  for (const c of sheet.regCircles) { g(0, 'CIRCLE'); g(8, 'REGISTRATION'); g(10, n(c.x)); g(20, n(c.y)); g(30, 0); g(40, n(c.r)); }
  for (const [a, b] of sheet.regLines) line('REGISTRATION', a, b);
  // print area frame
  const W = sheet.width, H = sheet.height;
  g(0, 'POLYLINE'); g(8, 'PRINT'); g(66, 1); g(70, 1); g(10, 0); g(20, 0); g(30, 0);
  for (const p of [[0, 0], [W, 0], [W, H], [0, H]]) { g(0, 'VERTEX'); g(8, 'PRINT'); g(10, n(p[0])); g(20, n(p[1])); g(30, 0); }
  g(0, 'SEQEND'); g(8, 'PRINT');
  g(0, 'ENDSEC'); g(0, 'EOF');
  return o.join('\n') + '\n';
}
