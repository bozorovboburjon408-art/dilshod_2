// Procedural PLACEHOLDER geometry for EKG-10 (demo only, NOT to scale of the real machine).
// Each node name == parts.model_object_id, so the DB <-> 3D link works exactly like a real GLB:
// replace this by uploading a GLB whose node names match model_object_id (admin panel).
// 1 unit = 1 m. Machine front points to +X, Y is up.
export type Shape =
  | { kind: 'box'; size: [number, number, number] }
  | { kind: 'cyl'; r: number; h: number }
  | { kind: 'torus'; R: number; t: number }
  | { kind: 'hex'; r: number; h: number };
export interface NodeDef { id: string; shape: Shape; pos: [number, number, number]; rot?: [number, number, number]; color: string }

const H = Math.PI / 2;
const AX = [H, 0, 0] as [number, number, number]; // cylinder axis along Z
const AY = [0, 0, H] as [number, number, number]; // cylinder axis along X
const steel = '#9aa1ab', dark = '#4b515a', mid = '#6f7782', light = '#c4c9d1', yellow = '#d8c06a';
const BOOM_A = Math.PI / 4;
const HANDLE_A = -0.476; // ~ -27.3 deg

export const EKG10_NODES: NodeDef[] = [
  // crawler
  { id: 'crawler_track_left_01', shape: { kind: 'box', size: [7.6, 1.2, 1.7] }, pos: [0, 0.65, 4.3], color: dark },
  { id: 'crawler_track_right_01', shape: { kind: 'box', size: [7.6, 1.2, 1.7] }, pos: [0, 0.65, -4.3], color: dark },
  { id: 'crawler_frame_01', shape: { kind: 'box', size: [6, 0.6, 6.4] }, pos: [0, 1.5, 0], color: mid },
  { id: 'drive_wheel_left_01', shape: { kind: 'cyl', r: 0.75, h: 1.7 }, pos: [-4, 0.75, 4.3], rot: AX, color: steel },
  { id: 'drive_wheel_right_01', shape: { kind: 'cyl', r: 0.75, h: 1.7 }, pos: [-4, 0.75, -4.3], rot: AX, color: steel },
  { id: 'gear_ring_01', shape: { kind: 'torus', R: 3.2, t: 0.2 }, pos: [0, 2.0, 0], rot: [H, 0, 0], color: light },
  // platform + revolving part
  { id: 'platform_01', shape: { kind: 'box', size: [10, 0.5, 5.6] }, pos: [-0.5, 2.55, 0], color: mid },
  { id: 'revolving_platform_01', shape: { kind: 'box', size: [2.4, 2.6, 5.0] }, pos: [-3.4, 4.1, 0], color: yellow },
  { id: 'counterweight_01', shape: { kind: 'box', size: [1.8, 2.0, 5.0] }, pos: [-5.5, 3.8, 0], color: dark },
  { id: 'operator_cab_01', shape: { kind: 'box', size: [2.0, 2.2, 1.6] }, pos: [2.0, 3.9, 2.0], color: '#7fa3bd' },
  { id: 'a_frame_01', shape: { kind: 'box', size: [0.5, 6, 3.4] }, pos: [0.4, 5.8, 0], color: yellow },
  // hoist / pressure / swing
  { id: 'hoist_drum_01', shape: { kind: 'cyl', r: 0.7, h: 2.0 }, pos: [-1.2, 3.5, 0], rot: AX, color: steel },
  { id: 'hoist_motor_01', shape: { kind: 'cyl', r: 0.6, h: 1.2 }, pos: [-1.2, 3.5, 2.0], rot: AX, color: dark },
  { id: 'pressure_shaft_01', shape: { kind: 'cyl', r: 0.2, h: 3.2 }, pos: [1.6, 3.4, 0], rot: AX, color: light },
  { id: 'pressure_motor_01', shape: { kind: 'cyl', r: 0.45, h: 1.0 }, pos: [1.6, 3.4, -2.1], rot: AX, color: dark },
  { id: 'swing_motor_01', shape: { kind: 'cyl', r: 0.5, h: 1.6 }, pos: [0.6, 3.6, -1.0], color: dark },
  { id: 'swing_pinion_01', shape: { kind: 'cyl', r: 0.3, h: 0.35 }, pos: [0, 2.0, 2.9], color: light },
  // gearbox (centre -0.9, 3.5, -2.0)
  { id: 'gearbox_housing_01', shape: { kind: 'box', size: [1.4, 1.2, 1.4] }, pos: [-0.9, 3.5, -2.0], color: mid },
  { id: 'gearbox_shaft_01', shape: { kind: 'cyl', r: 0.15, h: 2.2 }, pos: [-0.9, 3.5, -2.0], rot: AY, color: light },
  { id: 'gearbox_bearing_01', shape: { kind: 'torus', R: 0.28, t: 0.09 }, pos: [0.0, 3.5, -2.0], rot: [0, H, 0], color: steel },
  { id: 'gearbox_gear_01', shape: { kind: 'cyl', r: 0.6, h: 0.25 }, pos: [-1.85, 3.5, -2.0], rot: AY, color: '#b9bfc8' },
  { id: 'gearbox_bolt_01', shape: { kind: 'cyl', r: 0.08, h: 0.4 }, pos: [-0.45, 4.3, -1.6], color: dark },
  { id: 'gearbox_nut_01', shape: { kind: 'hex', r: 0.14, h: 0.12 }, pos: [-1.35, 4.15, -1.6], color: dark },
  // working equipment
  { id: 'boom_01', shape: { kind: 'box', size: [13.86, 0.8, 2.2] }, pos: [3.4 + Math.cos(BOOM_A) * 6.93, 3.0 + Math.sin(BOOM_A) * 6.93, 0], rot: [0, 0, BOOM_A], color: yellow },
  { id: 'boom_sheave_01', shape: { kind: 'cyl', r: 0.7, h: 1.8 }, pos: [3.4 + Math.cos(BOOM_A) * 13.86, 3.0 + Math.sin(BOOM_A) * 13.86, 0], rot: AX, color: steel },
  { id: 'handle_01', shape: { kind: 'box', size: [7.2, 0.5, 0.9] }, pos: [11.2, 5.05, 0], rot: [0, 0, HANDLE_A], color: '#c9a94d' },
  { id: 'bucket_01', shape: { kind: 'box', size: [2.6, 2.0, 3.0] }, pos: [15.2, 2.2, 0], color: dark },
];

export const nodeById = new Map(EKG10_NODES.map((n) => [n.id, n]));
export const DEFAULT_CAMERA = { position: [22, 12, 27] as [number, number, number], target: [5, 5.5, 0] as [number, number, number] };
