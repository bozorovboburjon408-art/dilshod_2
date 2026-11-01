// Paints the colour (PRINT) layer of a sheet onto a canvas. Sheet space is mm, Y-up.
import { affineFrom3, mulMat, rigid, type Mat } from '../core/geom';
import type { LayoutResult, MeshData, PanelOut, SheetOut } from '../core/types';

export interface MatSpec {
  kind: 'color' | 'tex' | 'uv';
  color: string;
  /** library id, user-texture id (kind 'tex') or source texture key (kind 'uv') */
  tex?: string;
  scale: number; // mm per tile width
  rot: number; // deg
  ox: number; oy: number; // mm
  flipX: boolean; flipY: boolean;
}
export interface Decal {
  id: string;
  kind: 'image' | 'text';
  src: string; // image id (lib or user) for 'image'
  text: string; color: string; font: string;
  x: number; y: number; // mm from panel centroid (panel-local, Y up)
  w: number; h: number; // mm
  rot: number; opacity: number;
}
export type Img = CanvasImageSource & { width: number; height: number };

export interface PaintEnv {
  mesh: MeshData;
  result: LayoutResult;
  getImage: (id: string) => Img | null;
  /** UV textures coming from the loaded model */
  getSourceTex: (key: string) => { img: Img; flipY: boolean } | null;
  materialFor: (p: PanelOut) => MatSpec;
  decalsFor: (key: string) => Decal[];
}

export const defaultSpec = (color = '#bbbbbb'): MatSpec => ({ kind: 'color', color, scale: 40, rot: 0, ox: 0, oy: 0, flipX: false, flipY: false });

function trianglePath(ctx: CanvasRenderingContext2D, tri: ArrayLike<number>, i: number) {
  ctx.moveTo(tri[6 * i], tri[6 * i + 1]); ctx.lineTo(tri[6 * i + 2], tri[6 * i + 3]); ctx.lineTo(tri[6 * i + 4], tri[6 * i + 5]); ctx.closePath();
}

function planarMatrix(spec: MatSpec, img: Img, toSheet: Mat): Mat {
  const k = spec.scale / img.width;
  const sx = spec.flipX ? -1 : 1, sy = spec.flipY ? -1 : 1;
  const T1: Mat = [1, 0, 0, 1, -img.width / 2, -img.height / 2];
  const S: Mat = [k * sx, 0, 0, -k * sy, 0, 0];
  const R = rigid((spec.rot * Math.PI) / 180, spec.ox, spec.oy);
  return mulMat(toSheet, mulMat(R, mulMat(S, T1)));
}

function makePattern(ctx: CanvasRenderingContext2D, img: Img, m: Mat): CanvasPattern | null {
  const pat = ctx.createPattern(img, 'repeat');
  if (!pat) return null;
  pat.setTransform(new DOMMatrix([m[0], m[1], m[2], m[3], m[4], m[5]]));
  return pat;
}

/** Everything that is painted for a panel: pass 'bleed' strokes, pass 'fill' fills. */
function paintPanel(ctx: CanvasRenderingContext2D, env: PaintEnv, p: PanelOut, pass: 'bleed' | 'fill', bleed: number) {
  const spec = env.materialFor(p);
  const nTri = p.sheetTri.length / 6;
  const lineW = bleed * 2;
  const apply = (style: string | CanvasPattern | null, path: Path2D) => {
    if (!style) return;
    if (pass === 'bleed') { ctx.strokeStyle = style; ctx.lineWidth = lineW; ctx.lineJoin = 'round'; ctx.stroke(path); }
    else { ctx.fillStyle = style; ctx.fill(path); }
  };
  const tabsPath = new Path2D();
  for (const tab of p.tabs) { tabsPath.moveTo(tab[0][0], tab[0][1]); for (let i = 1; i < tab.length; i++) tabsPath.lineTo(tab[i][0], tab[i][1]); tabsPath.closePath(); }

  if (spec.kind === 'uv' && spec.tex && env.mesh.uvs) {
    const src = env.getSourceTex(spec.tex);
    if (src) {
      let firstM: Mat | null = null;
      for (let i = 0; i < nTri; i++) {
        const t = p.tris[i];
        const uv: number[] = [];
        for (let k = 0; k < 3; k++) {
          const u = env.mesh.uvs[6 * t + 2 * k], v = env.mesh.uvs[6 * t + 2 * k + 1];
          uv.push(u * src.img.width, (src.flipY ? 1 - v : v) * src.img.height);
        }
        const m = affineFrom3(uv, p.sheetTri.slice(6 * i, 6 * i + 6));
        if (!m) continue;
        if (!firstM) firstM = m;
        const path = new Path2D();
        path.moveTo(p.sheetTri[6 * i], p.sheetTri[6 * i + 1]); path.lineTo(p.sheetTri[6 * i + 2], p.sheetTri[6 * i + 3]); path.lineTo(p.sheetTri[6 * i + 4], p.sheetTri[6 * i + 5]); path.closePath();
        apply(makePattern(ctx, src.img, m), path);
      }
      if (p.tabs.length && firstM) apply(makePattern(ctx, src.img, firstM), tabsPath);
      return;
    }
  }
  const path = new Path2D();
  for (let i = 0; i < nTri; i++) {
    path.moveTo(p.sheetTri[6 * i], p.sheetTri[6 * i + 1]); path.lineTo(p.sheetTri[6 * i + 2], p.sheetTri[6 * i + 3]); path.lineTo(p.sheetTri[6 * i + 4], p.sheetTri[6 * i + 5]); path.closePath();
  }
  path.addPath(tabsPath);
  let style: string | CanvasPattern | null = spec.color;
  if (spec.kind === 'tex' && spec.tex) {
    const img = env.getImage(spec.tex);
    if (img) style = makePattern(ctx, img, planarMatrix(spec, img, p.toSheet)) ?? spec.color;
  }
  apply(style, path);
}

function paintDecals(ctx: CanvasRenderingContext2D, env: PaintEnv, p: PanelOut) {
  const decals = env.decalsFor(p.key);
  if (!decals.length) return;
  ctx.save();
  const clip = new Path2D();
  for (let i = 0; i < p.sheetTri.length / 6; i++) trianglePath(clip as unknown as CanvasRenderingContext2D, p.sheetTri, i);
  ctx.clip(clip);
  for (const d of decals) {
    ctx.save();
    ctx.transform(...(p.toSheet as [number, number, number, number, number, number]));
    ctx.translate(d.x, d.y);
    ctx.rotate((d.rot * Math.PI) / 180);
    ctx.scale(1, -1);
    ctx.globalAlpha = d.opacity;
    if (d.kind === 'image') {
      const img = env.getImage(d.src);
      if (img) ctx.drawImage(img, -d.w / 2, -d.h / 2, d.w, d.h);
    } else if (d.text) {
      ctx.fillStyle = d.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.max(0.5, d.h)}px ${d.font}`;
      ctx.fillText(d.text, 0, 0, d.w > 0 ? d.w : undefined);
    }
    ctx.restore();
  }
  ctx.restore();
}

export function drawRegistration(ctx: CanvasRenderingContext2D, sheet: SheetOut, pxPerMm: number) {
  ctx.save();
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(0.15, 0.7 / pxPerMm);
  for (const c of sheet.regCircles) { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath();
  for (const [a, b] of sheet.regLines) { ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
  ctx.restore();
}

export function paintSheet(env: PaintEnv, sheetIndex: number, pxPerMm: number, bleed: number, opts: { reg: boolean; background?: string } = { reg: true }, into?: HTMLCanvasElement): HTMLCanvasElement {
  const sheet = env.result.sheets[sheetIndex];
  const canvas = into ?? document.createElement('canvas');
  const w = Math.round(sheet.width * pxPerMm), h = Math.round(sheet.height * pxPerMm);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.fillStyle = opts.background ?? '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.setTransform(w / sheet.width, 0, 0, -h / sheet.height, 0, h);
  const panels = env.result.panels.filter((p) => p.sheet === sheetIndex);
  for (const pass of ['bleed', 'fill'] as const) for (const p of panels) paintPanel(ctx, env, p, pass, bleed);
  for (const p of panels) paintDecals(ctx, env, p);
  if (opts.reg) drawRegistration(ctx, sheet, pxPerMm);
  return canvas;
}
