import { asciiSafe } from './files';
import type { SheetOut } from './types';

export interface SvgLayers { cut: boolean; fold: boolean; engrave: boolean; print: boolean; reg: boolean }
export const ALL_LAYERS: SvgLayers = { cut: true, fold: true, engrave: true, print: true, reg: true };

export const COLORS = { cut: '#ff0000', fold: '#0000ff', engrave: '#000000', reg: '#00a000' };
export const DASH = { valley: '3 1.5', mountain: '4 1.2 0.8 1.2' };

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/**
 * Real vector SVG, 1 user unit = 1 mm, 1:1 scale (width/height in mm).
 * Sheet coordinates are Y-up internally; SVG is flipped so the laser origin X0/Y0 is the bottom-left corner.
 */
export function sheetToSvg(sheet: SheetOut, layers: SvgLayers, printHref?: string, opts: { hairline?: number } = {}): string {
  const W = sheet.width, H = sheet.height;
  const Y = (y: number) => f(H - y);
  const sw = f(opts.hairline ?? 0.1);
  const o: string[] = [];
  o.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${f(W)}mm" height="${f(H)}mm" viewBox="0 0 ${f(W)} ${f(H)}" version="1.1">`);
  o.push(`<title>Laser Model Texture Studio — sheet ${sheet.index + 1}</title>`);
  o.push(`<desc>Units: millimetres, scale 1:1. Laser origin X0/Y0 = bottom-left corner of the sheet.</desc>`);
  if (layers.print && printHref) {
    o.push(`<g id="PRINT" inkscape:groupmode="layer" inkscape:label="PRINT"><image x="0" y="0" width="${f(W)}" height="${f(H)}" preserveAspectRatio="none" xlink:href="${printHref}" href="${printHref}"/></g>`);
  }
  if (layers.cut) {
    o.push(`<g id="CUT" inkscape:groupmode="layer" inkscape:label="CUT" fill="none" stroke="${COLORS.cut}" stroke-width="${sw}" stroke-linejoin="round">`);
    for (const c of sheet.cut) {
      if (c.pts.length < 2) continue;
      const d = c.pts.map((p, i) => `${i ? 'L' : 'M'}${f(p[0])} ${Y(p[1])}`).join('') + (c.closed ? 'Z' : '');
      o.push(`<path d="${d}"/>`);
    }
    o.push('</g>');
  }
  if (layers.fold) {
    o.push(`<g id="FOLD" inkscape:groupmode="layer" inkscape:label="FOLD" fill="none" stroke="${COLORS.fold}" stroke-width="${sw}">`);
    for (const kind of ['valley', 'mountain'] as const) {
      o.push(`<g id="FOLD_${kind.toUpperCase()}" stroke-dasharray="${DASH[kind]}">`);
      for (const l of sheet.fold) if (l.kind === kind) o.push(`<path d="M${f(l.a[0])} ${Y(l.a[1])}L${f(l.b[0])} ${Y(l.b[1])}"/>`);
      o.push('</g>');
    }
    o.push('</g>');
  }
  const text = (t: SheetOut['texts'][number], color: string) =>
    `<text x="${f(t.x)}" y="${Y(t.y)}" font-size="${f(t.size)}" font-family="Arial, Helvetica, sans-serif" text-anchor="middle" dominant-baseline="central" fill="${color}" stroke="none"${t.angle ? ` transform="rotate(${f((-t.angle * 180) / Math.PI)} ${f(t.x)} ${Y(t.y)})"` : ''}>${esc(asciiSafe(t.text))}</text>`;
  if (layers.engrave) {
    o.push(`<g id="ENGRAVE" inkscape:groupmode="layer" inkscape:label="ENGRAVE">`);
    for (const t of sheet.texts) if (t.layer === 'ENGRAVE') o.push(text(t, COLORS.engrave));
    o.push('</g>');
  }
  if (layers.reg) {
    o.push(`<g id="REGISTRATION" inkscape:groupmode="layer" inkscape:label="REGISTRATION" fill="none" stroke="${COLORS.reg}" stroke-width="${sw}">`);
    for (const c of sheet.regCircles) o.push(`<circle cx="${f(c.x)}" cy="${Y(c.y)}" r="${f(c.r)}"/>`);
    for (const [a, b] of sheet.regLines) o.push(`<path d="M${f(a[0])} ${Y(a[1])}L${f(b[0])} ${Y(b[1])}"/>`);
    for (const t of sheet.texts) if (t.layer === 'REGISTRATION') o.push(text(t, COLORS.reg));
    o.push('</g>');
  }
  o.push('</svg>');
  return o.join('\n');
}
