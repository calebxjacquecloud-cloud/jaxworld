/**
 * The VC film: Acts 1–8 on one scroll-scrubbed timeline.
 *
 * Time is authored in "units" (roughly one screen of scrolling each), so the
 * pacing reads as a list of beats. Every beat follows the same rhythm:
 * anticipation (see what you're looking at) → action → hold → transition.
 *
 * Channels only move where a beat asks them to; everything else holds. The
 * engine is the original site's keyframe engine (lib/timeline.ts), reused as is.
 */

import { TrackBuilder, type ChannelValues, type EaseName } from '@/lib/timeline';
import { VEHICLE } from '@/lib/animationConfig';
import { halfWidth, topY } from '@/lib/vehicleShape';

type V2 = [number, number];
type V3 = [number, number, number];

/** Total film length in units. */
export const FILM_UNITS = 30;

/** Where each chapter of the site's progress indicator starts, in film units. */
export const FILM_CHAPTERS = [
  { chapter: 0, at: 0 }, // Problem
  { chapter: 1, at: 6.95 }, // Machine
  { chapter: 2, at: 16.0 }, // Intelligence
  { chapter: 3, at: 20.7 }, // Deployment
];

/** Named moments (jump targets, fast path). */
export const MARKS = {
  hook: 0,
  problem: 1.7,
  inversion: 4.3,
  product: 7.0,
  condition: 16.1,
  productize: 20.8,
  deploy: 24.15,
  end: FILM_UNITS,
};

/** Geometry the timeline and scene share. */
export const GARAGE_Z = -64;
export const HERO_START_Z = -67.4;
/** Queue of everyday vehicles in the old tunnel, lead first. */
export const QUEUE = [
  { kind: 'sedan', color: '#b8bdc3' },
  { kind: 'suv', color: '#2e4057' },
  { kind: 'pickup', color: '#8c2f23' },
  { kind: 'compact', color: '#e9e6df' },
  { kind: 'van', color: '#546b52' },
] as const;
export const QUEUE_GAP = 7;
/** Arm stage rails in the bay (same layout as the original machine). */
export const BAY_RAIL_X = [2.05, 9.6];

const initial: ChannelValues = {
  // main camera (orbit around a target), framing offsets for copy
  az: 0,
  el: 5,
  dist: 12.5,
  tx: 0,
  ty: 1.5,
  tz: GARAGE_Z,
  fov: 32,
  /** 1 = the target rides with the hero car. */
  follow: 0,
  frameX: 0.17,
  /** Portrait screens only: positive lifts the subject, negative lowers it. */
  frameYP: -0.2,
  // hero car
  heroZ: HERO_START_Z,
  exitZ: 0,
  grime: 1,
  dirt: 1,
  gloss: 0,
  headlights: 0.2,
  sensors: 0,
  door: 0,
  // old tunnel
  qS: 9.5,
  tunnelUp: 0,
  brushes: 1,
  profile: 0,
  // the machine
  bayFloor: 0,
  rails: 0,
  armsUp: 0,
  camRise: 0,
  camActive: 0,
  beams: 0,
  // vision
  sweepOn: 0,
  sweepZ: 3.1,
  cloud: 0,
  wire: 0,
  dims: 0,
  marker: 0,
  qcScan: 0,
  envelope: 0,
  paths: 0,
  // surface
  foam: 0,
  drain: 2,
  holeR: 0,
  // condition comparison: cmpX = share of the frame (from the left) still showing the pre-wash scan
  cmpOn: 0,
  cmpX: 1,
  // productization
  util: 0,
  contIn: 0,
  pack: 0,
  roof: 0,
  wall: 0,
  // deployment sets: 0 road + bay, 1 airport garage, 2 open lot
  set: 0,
  veil: 0,
  apCarZ: -18,
  apScan: 0,
  apWash: 0,
  lotDrop: 1,
  wingA: 0,
  wingB: 0,
  rampA: 0,
  rampB: 0,
  lotArms: 0,
  lotCams: 0,
  lotCarZ: -20,
  // robot arms (A = driver side +X, B = passenger side −X)
  aBx: 5.7, aBz: 1.4, aPx: 5.15, aPy: 0.95, aPz: 1.4, aOx: 0.15, aOy: 1.1, aOz: 0, aSpray: 0, aMode: 0,
  bBx: -5.7, bBz: -1.4, bPx: -5.15, bPy: 0.95, bPz: -1.4, bOx: -0.15, bOy: 1.1, bOz: 0, bSpray: 0, bMode: 0,
};

const tb = new TrackBuilder(initial);
const M = (t0: number, t1: number, set: ChannelValues, e: EaseName = 'inOut') => tb.move(t0, t1, set, e);

/* ── arm helpers (same authoring style as data/washSequence.ts) ── */
interface ArmSet {
  base?: V2;
  aim?: V3;
  off?: V3;
  spray?: number;
  mode?: number;
}
const FIELDS = ['Bx', 'Bz', 'Px', 'Py', 'Pz', 'Ox', 'Oy', 'Oz', 'Spray', 'Mode'];
function arm(id: 'a' | 'b', t: number, s: ArmSet, e: EaseName = 'machine') {
  const set: ChannelValues = {};
  for (const f of FIELDS) set[id + f] = tb.value(id + f);
  if (s.base) [set[id + 'Bx'], set[id + 'Bz']] = s.base;
  if (s.aim) [set[id + 'Px'], set[id + 'Py'], set[id + 'Pz']] = s.aim;
  if (s.off) [set[id + 'Ox'], set[id + 'Oy'], set[id + 'Oz']] = s.off;
  if (s.spray !== undefined) set[id + 'Spray'] = s.spray;
  if (s.mode !== undefined) set[id + 'Mode'] = s.mode;
  tb.key(t, set, e);
}
const A = (t: number, s: ArmSet, e?: EaseName) => arm('a', t, s, e);
const B = (t: number, s: ArmSet, e?: EaseName) => arm('b', t, s, e);
const top = (x: number, z: number): V3 => [x, topY(x, z) + 0.01, z];
const side = (sg: 1 | -1, y: number, z: number): V3 => [sg * (halfWidth(z) + 0.01), y, z];
const tuck = (sg: 1 | -1, bx: number, bz: number): ArmSet => ({ base: [bx, bz], aim: [bx - sg * 0.55, 0.95, bz], off: [sg * 0.15, 1.1, 0] });
/** Aim along a list of points between t0 and t1, base riding alongside. */
function trace(id: 'a' | 'b', t0: number, t1: number, pts: V3[], baseX: number) {
  pts.forEach((p, i) => arm(id, t0 + ((t1 - t0) * i) / (pts.length - 1), { aim: p, base: [baseX, p[2]] }, i === 0 ? 'machine' : 'linear'));
}
const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, i) => a + ((b - a) * i) / n);

const S = VEHICLE.smudge;
const FZ = VEHICLE.frontAxleZ;

/* ═══════════ ACT 1 · THE HOOK (0 – 1.6) ═══════════ */
// 0–0.6 hold on the closed garage: the headline owns the screen
M(0.6, 1.05, { door: 1 }, 'out');
M(0.75, 1.0, { headlights: 1 });
M(0.95, 1.6, { heroZ: -52 }, 'in');
M(0.8, 1.6, { follow: 1, az: 38, el: 12, dist: 10.5, ty: 0.9, frameX: 0.12, frameYP: 0.1 });

/* ═══════════ ACT 2 · THE STRUCTURAL PROBLEM (1.6 – 4.2) ═══════════ */
M(1.6, 2.8, { heroZ: -27 }, 'linear');
M(1.6, 2.8, { az: 112, el: 11, dist: 9.4, frameX: 0.14 }, 'inOut');
M(2.25, 2.45, { sensors: 1 });
M(2.7, 2.9, { sensors: 0 });
// the old tunnel: every vehicle, the same program
M(2.8, 3.25, { follow: 0, tx: 0, ty: 1.2, tz: -1, az: 72, el: 13, dist: 19, fov: 30, frameX: 0.04, frameYP: 0.12 });
M(2.8, 4.2, { qS: 9.5 + 26 }, 'linear');
M(2.8, 4.2, { heroZ: -11 }, 'linear');
M(3.0, 3.2, { profile: 1 });

/* ═══════════ ACT 3 · THE ARCHITECTURAL INVERSION (4.2 – 6.95) ═══════════ */
M(4.2, 4.8, { qS: 64 }, 'linear');
M(4.2, 5.0, { heroZ: 0 }, 'out');
M(4.9, 5.1, { profile: 0, brushes: 0 });
// the tunnel lifts away; the machine rises around the stationary car
M(5.05, 5.55, { tunnelUp: 1 }, 'in');
M(5.0, 5.9, { az: 38, el: 36, dist: 26, ty: 0.4, tz: 0, frameX: 0.06, frameYP: 0.16 });
M(5.35, 5.7, { bayFloor: 1 });
M(5.45, 5.8, { rails: 1 });
M(5.55, 5.95, { armsUp: 1 }, 'out');
M(5.7, 6.05, { camRise: 1 }, 'out');
M(6.2, 6.95, { az: 22, el: 32, dist: 23 }, 'linear');

/* ═══════════ ACT 4 · THE PRODUCT (6.95 – 11.0) ═══════════ */
M(6.95, 7.75, { az: -24, el: 38, dist: 19, frameX: 0.17, frameYP: 0.2 }, 'inOut');
// SEE
M(7.8, 8.0, { camActive: 1 });
M(7.85, 8.05, { beams: 1 });
M(7.95, 8.02, { sweepOn: 1 });
M(8.0, 8.5, { sweepZ: -3.1 }, 'linear');
M(8.0, 8.4, { cloud: 1 });
M(8.5, 8.58, { sweepOn: 0 });
M(8.38, 8.6, { wire: 1 });
M(8.5, 8.65, { dims: 1 });
M(8.62, 8.72, { marker: 1 });
M(7.8, 8.9, { az: 58, el: 24, dist: 12.5, ty: 0.7, frameX: 0.16 }, 'inOut');
M(8.8, 9.05, { cloud: 0, beams: 0.25 });
// THINK
M(9.0, 9.3, { wire: 0.35, dims: 0 });
M(9.15, 9.6, { paths: 1 }, 'linear');
M(9.3, 9.5, { envelope: 1 });
M(9.0, 9.7, { az: 24, el: 58, dist: 15.5, frameX: 0.15 });
// ACT: the arms leave their parking spots
A(10.1, tuck(1, 5.7, 1.4));
B(10.1, tuck(-1, -5.7, -1.4));
A(10.5, tuck(1, 3.1, 2.2));
B(10.52, tuck(-1, -3.1, 2.2));
A(10.85, { base: [2.75, 2.5], aim: top(0.45, 2.45), off: [0.4, 0.66, 0.08] });
B(10.87, { base: [-2.75, 2.5], aim: top(-0.45, 2.45), off: [-0.4, 0.66, 0.08] });
M(10.1, 10.9, { az: 48, el: 30, dist: 14, beams: 0, envelope: 0.4 });
// pylons retract out of the spray while the arms work, and rise again to verify
M(10.15, 10.55, { camRise: 0.08, camActive: 0 });

/* ═══════════ ACT 5 · THE WASH (11.0 – 16.0) ═══════════ */
// RINSE · follow the surface, nose to tail along the scanned top line
A(11.02, { spray: 1, mode: 0 }, 'out');
B(11.03, { spray: 1, mode: 0 }, 'out');
trace('a', 11.08, 11.85, range(2.45, -2.5, 16).map((z) => top(Math.min(0.45, halfWidth(z) * 0.55), z)), 2.75);
trace('b', 11.1, 11.87, range(2.45, -2.5, 16).map((z) => top(-Math.min(0.45, halfWidth(z) * 0.55), z)), -2.75);
M(11.1, 11.9, { grime: 0.55, paths: 0 }, 'linear');
M(11.0, 11.95, { az: 76, el: 22, dist: 11, ty: 0.8, frameX: 0.16 });
// CLEAN · one robot, multiple treatments (turret indexes; body wash builds foam)
A(12.02, { base: [2.7, -2.5], aim: side(1, 0.62, -2.5), off: [0.75, 0.34, 0], mode: 1 });
B(12.03, { base: [-2.7, -2.5], aim: side(-1, 0.62, -2.5), off: [-0.75, 0.34, 0], mode: 1 });
trace('a', 12.12, 12.8, range(-2.5, 2.45, 10).map((z) => side(1, 0.62, z)), 2.7);
trace('b', 12.13, 12.81, range(-2.5, 2.45, 10).map((z) => side(-1, 0.62, z)), -2.7);
M(12.12, 12.85, { foam: 1 }, 'linear');
A(12.9, { mode: 3 });
A(12.98, { mode: 1 });
A(13.05, { mode: 2 });
B(12.9, { mode: 3 });
B(12.98, { mode: 1 });
B(13.05, { mode: 2 });
M(12.0, 13.0, { az: 58, el: 32, dist: 13 });
// ADAPT · the flagged area gets its own treatment
A(13.15, { spray: 0 }, 'in');
B(13.15, { spray: 0 }, 'in');
A(13.4, { base: [2.4, S.z], aim: [S.x + 0.02, S.y, S.z], off: [0.5, 0.14, 0], mode: 3 });
B(13.4, tuck(-1, -3.4, 0.6));
A(13.5, { spray: 0.9 }, 'out');
{
  // slow, tight passes over the smudge
  const pts: V3[] = [];
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI * 4;
    pts.push([S.x + 0.03, S.y + Math.sin(a) * 0.14, S.z + Math.cos(a) * 0.2 * (1 - i / 30)]);
  }
  pts.forEach((p, i) => A(13.52 + (0.4 * i) / 18, { aim: p }, 'linear'));
}
M(13.5, 13.92, { holeR: 0.55, dirt: 0 }, 'linear');
M(13.9, 14.0, { marker: 2 });
A(14.0, { spray: 0 }, 'in');
M(13.1, 13.5, { az: 36, el: 30, dist: 7.6, tx: 0.95, ty: 0.62, tz: S.z, frameX: 0.16 });
// DETAIL · wheel-specific treatment, then rinse off
M(14.08, 14.2, { marker: 0 });
A(14.35, tuck(1, 3.2, 1.2));
B(14.3, { base: [-2.5, FZ], aim: [-(VEHICLE.trackHalf + 0.14), 0.36 + 0.3, FZ], off: [-0.62, 0.08, 0.05], mode: 3 });
B(14.36, { spray: 1 }, 'out');
{
  const pts: V3[] = [];
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI * 2.5 + Math.PI / 2;
    pts.push([-(VEHICLE.trackHalf + 0.14), 0.36 + Math.sin(a) * 0.28, FZ + Math.cos(a) * 0.28]);
  }
  pts.forEach((p, i) => B(14.38 + (0.36 * i) / 20, { aim: p }, 'linear'));
}
B(14.78, { spray: 0 }, 'in');
M(14.1, 14.45, { az: -28, el: 24, dist: 7.2, tx: -0.9, ty: 0.45, tz: FZ, frameX: 0.16 });
// final rinse: foam drains, the finish comes up
A(14.82, { base: [2.75, 2.45], aim: top(0.45, 2.45), off: [0.4, 0.66, 0.08], mode: 2 });
B(14.84, { base: [-2.75, 2.45], aim: top(-0.45, 2.45), off: [-0.4, 0.66, 0.08], mode: 2 });
A(14.86, { spray: 1 }, 'out');
B(14.87, { spray: 1 }, 'out');
trace('a', 14.88, 15.12, range(2.45, -2.5, 6).map((z) => top(0.4, z)), 2.75);
trace('b', 14.89, 15.13, range(2.45, -2.5, 6).map((z) => top(-0.4, z)), -2.75);
M(14.86, 15.12, { drain: -0.4, grime: 0, gloss: 1 }, 'linear');
A(15.16, { spray: 0 }, 'in');
B(15.17, { spray: 0 }, 'in');
M(14.8, 15.2, { az: -30, el: 30, dist: 14, tx: 0, ty: 0.6, tz: 0 });
// VERIFY · then it looks again
A(15.45, tuck(1, 5.7, 1.4));
B(15.47, tuck(-1, -5.7, -1.4));
M(15.1, 15.4, { camRise: 1, camActive: 1 }, 'out');
M(15.3, 15.45, { beams: 0.55, envelope: 0 });
M(15.45, 15.95, { qcScan: 1 }, 'linear');
M(15.2, 16.0, { az: 26, el: 36, dist: 15.5, frameX: 0.15 });

/* ═══════════ ACT 6 · CONDITION INTELLIGENCE (16.0 – 20.7) ═══════════ */
M(16.0, 16.2, { beams: 0, camActive: 0, wire: 0 });
M(16.0, 16.35, { camRise: 0.08 });
M(20.7, 21.1, { camRise: 1 });
M(16.0, 16.45, { az: 128, el: 30, dist: 7.4, tx: 0.3, ty: 0.62, tz: -1.5, fov: 30, frameX: 0.18, frameYP: 0.18 });
M(16.35, 16.36, { cmpOn: 1 });
M(16.55, 17.0, { cmpX: 0 }, 'inOut');
M(17.4, 18.4, { az: 136, el: 27, dist: 7.8 }, 'linear');
M(18.4, 20.6, { az: 150 }, 'linear');

/* ═══════════ ACT 7 · PRODUCTIZATION (20.7 – 24.1) ═══════════ */
M(20.6, 20.62, { cmpOn: 0 });
M(20.62, 20.64, { cmpX: 1 });
M(20.7, 21.2, { exitZ: 40 }, 'in');
M(20.62, 21.3, { az: 22, el: 42, dist: 31, tx: 0, ty: 0.5, tz: -3, fov: 32, frameX: 0.05, frameYP: 0.1 });
M(20.95, 21.35, { util: 1 }, 'out');
M(21.7, 22.0, { contIn: 1 }, 'out');
M(22.0, 22.95, { pack: 1 }, 'linear');
M(21.6, 22.9, { az: 14, el: 46, dist: 30, tz: 3.5 });
M(23.0, 23.25, { roof: 1 });
M(23.2, 23.5, { wall: 1 });
M(22.95, 23.6, { az: 0, el: 9, dist: 19, ty: 1.45, tz: 10.2, frameX: 0.2, frameYP: 0.14 });

/* ═══════════ ACT 8 · DEPLOYMENT (24.1 – 30) ═══════════ */
M(24.25, 24.45, { veil: 1 });
M(24.45, 24.46, { set: 1 }, 'hold');
M(24.46, 24.47, { az: 32, el: 29, dist: 21, tx: 0, ty: 0.8, tz: 0, frameX: 0.12, frameYP: 0.14 });
M(24.5, 24.7, { veil: 0 });
M(24.7, 26.5, { az: 20 }, 'linear');
M(24.85, 25.35, { apCarZ: 0 }, 'out');
M(25.35, 25.75, { apWash: 1 }, 'linear');
M(25.75, 26.05, { apScan: 1 }, 'linear');
M(26.12, 26.45, { apCarZ: 18 }, 'in');
M(26.4, 26.55, { veil: 1 });
M(26.55, 26.56, { set: 2 }, 'hold');
M(26.56, 26.57, { az: 52, el: 28, dist: 23, ty: 1, frameX: 0.14 });
M(26.6, 26.75, { veil: 0 });
M(26.7, 27.0, { lotDrop: 0 }, 'out');
M(27.1, 27.4, { wingA: 1 });
M(27.35, 27.65, { wingB: 1 });
M(27.7, 27.95, { rampA: 1 }, 'out');
M(27.9, 28.15, { rampB: 1 }, 'out');
M(28.1, 28.4, { lotArms: 1 });
M(28.3, 28.55, { lotCams: 1 }, 'out');
M(28.5, 28.9, { lotCarZ: 0 }, 'out');
M(26.75, 28.95, { az: 36, dist: 21 }, 'linear');
M(29.0, 29.6, { az: 40, el: 56, dist: 34, frameX: 0.06 });

export const FILM_TRACKS = tb.build();
export const FILM_CHANNELS = Object.keys(initial);

/** Arm-plan sample window (the planned pre-rinse paths drawn during THINK). */
export const PLAN_WINDOW: [number, number] = [11.08, 11.87];
