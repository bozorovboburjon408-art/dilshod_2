import type { Mat, V2 } from './geom';

/** Material as found in the source model (or demo). */
export interface SourceMaterial {
  name: string;
  color: string; // #rrggbb
  /** key into the model's embedded texture table (UV mapped) */
  mapKey?: string;
  /** key into the built-in procedural library (planar mapped) */
  lib?: string;
  /** mm per tile for `lib` default mapping */
  mmPerTile?: number;
}

/** Non-indexed triangle soup, positions in model units (later mm). */
export interface MeshData {
  name: string;
  positions: Float32Array; // 9 per triangle
  uvs?: Float32Array; // 6 per triangle (per corner)
  triMat: Uint16Array;
  triTag: Uint16Array; // panels never merge across different tags
  materials: SourceMaterial[];
  tags: string[];
}

export interface UnfoldSettings {
  tabWidth: number; // mm 3..8
  tabs: boolean;
  planarTol: number; // degrees; coplanar merge tolerance
  manualCuts: string[]; // joint keys
  numbers: boolean;
  seamLabels: boolean;
}

export interface SheetSettings {
  width: number; // mm, already orientation-applied
  height: number;
  margin: number; // >= 5
  gap: number; // between parts
  allowRotate: boolean;
}

export interface PanelOut {
  key: string; // stable id (lowest triangle index)
  index: number;
  number: number; // assembly order, 1-based
  tris: number[]; // triangle indices into MeshData
  area: number;
  normal: [number, number, number];
  centroid: [number, number, number];
  sheet: number; // -1 if unplaced
  island: number;
  /** panel-local (mm) -> sheet (mm) */
  toSheet: Mat;
  /** per triangle: local coords (6 numbers) */
  localTri: number[];
  /** per triangle: sheet coords (6 numbers); corner order = MeshData corner order */
  sheetTri: number[];
  /** tab polygons painted with this panel's texture (sheet coords) */
  tabs: V2[][];
  matIndex: number; // dominant source material
}

export interface FoldLine { a: V2; b: V2; kind: 'mountain' | 'valley'; jointKey: string; panels: [string, string] }
export interface TextItem { x: number; y: number; size: number; angle: number; text: string; layer: 'ENGRAVE' | 'REGISTRATION' }
export interface Circle { x: number; y: number; r: number }

export interface SheetOut {
  index: number;
  width: number;
  height: number;
  /** Polylines of the CUT layer. closed=true => polygon */
  cut: { pts: V2[]; closed: boolean }[];
  fold: FoldLine[];
  texts: TextItem[];
  regLines: [V2, V2][];
  regCircles: Circle[];
  panelKeys: string[];
  islandCount: number;
}

export interface Warning { code: string; params?: Record<string, string | number> }

export interface Stats {
  triangles: number;
  panels: number;
  islands: number;
  sheets: number;
  seams: number;
  tabs: number;
  tabsOmitted: number;
  cutLengthMm: number;
  foldLengthMm: number;
}

export interface Validation {
  overlaps: number;
  crossings: number;
  outOfBounds: number;
  unplaced: number;
}

export interface JointInfo { key: string; length: number; cut: boolean; convex: boolean; manual: boolean; p: string; q: string; a3: [number, number, number]; b3: [number, number, number]; seam: number }

export interface LayoutResult {
  panels: PanelOut[];
  sheets: SheetOut[];
  joints: JointInfo[];
  triPanel: Int32Array; // triangle -> panel index
  stats: Stats;
  validation: Validation;
  warnings: Warning[];
  /** assembly instructions: per seam, which panel carries the tab */
  seams: { id: number; tabPanel: string | null; otherPanel: string; length: number }[];
  settings: { unfold: UnfoldSettings; sheet: SheetSettings };
}
