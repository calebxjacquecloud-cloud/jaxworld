/**
 * The wash choreography.
 *
 * Every visual in the pinned scene reads from these channels, sampled at the
 * current scroll progress (0–1). Poses only name the channels that change;
 * everything else holds. Positions are metres on the bay floor (X right,
 * Z toward the bottom of the screen in top-down view), angles in degrees.
 *
 * Two cameras: the main view (v* channels) rises to a high top-down shot while
 * the car arrives and then holds it for the rest of the demo, so the whole bay
 * (car, camera pylons, arms) stays in frame. Close-ups (cam* channels) play in
 * a separate detail window in the upper right, opened by `inset`.
 *
 * Arm A rides the XY stage on the driver side (+X), arm B the passenger side (−X).
 *   aBx/aBz   arm base position on its floor stage
 *   aPx..aPz  aim point on (or near) the vehicle surface
 *   aOx..aOz  offset from aim point to nozzle (standoff + approach angle)
 *   aSpray    spray intensity 0–1
 *   aMode     nozzle turret index (0 water, 1 foam, 2 rinse, 3 spot)
 */

import { TrackBuilder, type ChannelValues, type EaseName } from '@/lib/timeline';
import { VEHICLE } from '@/lib/animationConfig';
import { halfWidth, topY } from '@/lib/vehicleShape';
import { FINDINGS, KIND_LABEL, type FindingKind } from './conditionReport';
import { ARM_PARK } from './introSequence';

type V2 = [number, number];
type V3 = [number, number, number];

const initial: ChannelValues = {
  // vehicle
  drive: 0.3,
  carYaw: 0,
  /** Detail camera: 1 = target tracks the car, 0 = target is camT*. */
  follow: 0.6,
  headlights: 1,
  // main view (orbit around target)
  vAz: 30,
  vEl: 7,
  vDist: 11.6,
  vTx: -8.6,
  vTy: 0.75,
  vTz: -6,
  vFollow: 0.6,
  vFov: 30,
  vFrameX: 0.16,
  vFrameY: -0.06,
  /** Extra vertical framing on portrait screens (positive lifts the subject). */
  vMobileY: -0.1,
  /** How strongly narrow (portrait) screens pull the camera back. */
  vPortraitK: 0.45,
  // detail window: 0 closed, 1 open
  inset: 0,
  /** 1 = keep the detail window closed on phones (the completion checklist uses that space). */
  insetPhoneOff: 0,
  // detail camera (orbit around target), shown in the detail window
  camAz: 30,
  camEl: 7,
  camDist: 11.6,
  camTx: -8.6,
  camTy: 0.75,
  camTz: -6,
  fov: 30,
  // computer vision
  camRise: 0,
  camActive: 0,
  beams: 0,
  sweepOn: 0,
  sweepZ: 3.0,
  cloud: 0,
  wire: 0,
  dims: 0,
  marker: 0,
  qcScan: 0,
  // robots, safety, planning
  envelope: 0,
  paths: 0,
  // surface state
  foam: 0,
  drain: 1.8,
  grime: 1,
  dirt: 1,
  holeR: 0,
  gloss: 0,
  // arm A
  aBx: ARM_PARK.x, aBz: ARM_PARK.z, aPx: ARM_PARK.x - 0.55, aPy: 0.95, aPz: ARM_PARK.z, aOx: 0.15, aOy: 1.1, aOz: 0, aSpray: 0, aMode: 0,
  // arm B
  bBx: -ARM_PARK.x, bBz: -ARM_PARK.z, bPx: -ARM_PARK.x + 0.55, bPy: 0.95, bPz: -ARM_PARK.z, bOx: -0.15, bOy: 1.1, bOz: 0, bSpray: 0, bMode: 0,
};

const tb = new TrackBuilder(initial);

/** Global move: hold until t0, travel to the new values by t1. */
function M(t0: number, t1: number, set: ChannelValues, e: EaseName = 'inOut') {
  tb.move(t0, t1, set, e);
}

interface ArmSet {
  base?: V2;
  aim?: V3;
  off?: V3;
  spray?: number;
  mode?: number;
}

const ARM_FIELDS = ['Bx', 'Bz', 'Px', 'Py', 'Pz', 'Ox', 'Oy', 'Oz', 'Spray', 'Mode'];

/** Arm waypoint. Pins every axis of that arm, so it only moves between waypoints. */
function arm(id: 'a' | 'b', t: number, s: ArmSet, e: EaseName = 'machine') {
  const set: ChannelValues = {};
  for (const f of ARM_FIELDS) set[id + f] = tb.value(id + f);
  if (s.base) { set[id + 'Bx'] = s.base[0]; set[id + 'Bz'] = s.base[1]; }
  if (s.aim) { set[id + 'Px'] = s.aim[0]; set[id + 'Py'] = s.aim[1]; set[id + 'Pz'] = s.aim[2]; }
  if (s.off) { set[id + 'Ox'] = s.off[0]; set[id + 'Oy'] = s.off[1]; set[id + 'Oz'] = s.off[2]; }
  if (s.spray !== undefined) set[id + 'Spray'] = s.spray;
  if (s.mode !== undefined) set[id + 'Mode'] = s.mode;
  tb.key(t, set, e);
}
const A = (t: number, s: ArmSet, e?: EaseName) => arm('a', t, s, e);
const B = (t: number, s: ArmSet, e?: EaseName) => arm('b', t, s, e);

/** Folded, upright "home" pose for an arm whose base sits at (bx, bz). */
function tuck(side: 1 | -1, bx: number, bz: number): ArmSet {
  return { base: [bx, bz], aim: [bx - side * 0.55, 0.95, bz], off: [side * 0.15, 1.1, 0] };
}

/** Points on a circle in the car's side plane (for wheel tracing). */
function circlePath(x: number, cy: number, cz: number, r: number, turns: number, steps: number, phase = 0): V3[] {
  const out: V3[] = [];
  for (let i = 0; i <= steps; i++) {
    const a = phase + (i / steps) * turns * Math.PI * 2;
    out.push([x, cy + Math.sin(a) * r, cz + Math.cos(a) * r]);
  }
  return out;
}

function trace(id: 'a' | 'b', t0: number, t1: number, pts: V3[], e: EaseName = 'linear') {
  pts.forEach((p, i) => {
    const t = t0 + ((t1 - t0) * i) / (pts.length - 1);
    arm(id, t, { aim: p }, i === 0 ? 'machine' : e);
  });
}

function arch(x: number, cz: number, ks: number[]): V3[] {
  return ks.map((k) => [x, 0.36 + 0.46 * Math.sin(k * Math.PI), cz + 0.46 * Math.cos(k * Math.PI)] as V3);
}

/** Aim point on the top surface (deck, fins or canopy) at (x, z). */
function top(x: number, z: number): V3 {
  return [x, topY(x, z) + 0.01, z];
}
/** Aim point on the flank at height y. */
function side(sign: 1 | -1, y: number, z: number): V3 {
  return [sign * (halfWidth(z) + 0.01), y, z];
}

const W = VEHICLE;
const S = VEHICLE.smudge;
const FZ = W.frontAxleZ;
const RZ = W.rearAxleZ;
const WX = W.trackHalf + 0.14;

/* ─────────────── SCENE 1 · ARRIVAL (0.00–0.09) ─────────────── */
M(0, 0.088, { drive: 1 }, 'inOut');
M(0, 0.03, { vFollow: 1, vAz: 22, vEl: 13, vDist: 13.2, vFrameX: 0.12, vMobileY: 0.12, vPortraitK: 0.6 });
M(0.03, 0.058, { vAz: 12, vEl: 40, vDist: 17.5, vFrameX: 0.08, vFrameY: 0 });
// climb to a high top-down view that holds the car, all eight camera pylons and the arm stages;
// the main view stays here for the rest of the demo
M(0.058, 0.094, { vFollow: 0, vTx: 0, vTy: 0, vTz: 0, vAz: 0, vEl: 89.4, vDist: 24, vFov: 32, vFrameX: 0.12, vFrameY: 0, vMobileY: 0.06, vPortraitK: 0.2 });

/* ─────────────── SCENE 2 · COMPUTER-VISION SCAN (0.09–0.20) ─────────────── */
// pylons are fully up before the desktop intro (INTRO.at) starts
M(0.086, 0.099, { camRise: 1 }, 'out');
M(0.104, 0.12, { camActive: 1, beams: 1 });
M(0.12, 0.124, { sweepOn: 1 }, 'out');
// geometry capture: sweep, point cloud, wireframe, dimensions
M(0.124, 0.15, { sweepZ: -3.0, cloud: 1 }, 'linear');
M(0.15, 0.156, { sweepOn: 0, wire: 1, dims: 1 });
M(0.166, 0.172, { dims: 0, cloud: 0 });
M(0.194, 0.2, { marker: 1 }, 'out');
M(0.2, 0.208, { beams: 0, camActive: 0.35 });
M(0.212, 0.23, { wire: 0, marker: 0 });

/* ─────────────── SCENE 3 · ARMS DEPLOY (0.20–0.25) ─────────────── */
M(0.2, 0.232, { envelope: 1, paths: 1 });
A(0.2, { ...tuck(1, ARM_PARK.x, ARM_PARK.z), spray: 0, mode: 0 });
B(0.2, { ...tuck(-1, -ARM_PARK.x, -ARM_PARK.z), spray: 0, mode: 0 });
A(0.234, tuck(1, 3.0, 1.4));
B(0.236, tuck(-1, -3.0, -1.4));
A(0.247, { base: [2.7, 2.2], aim: top(0.45, 2.1), off: [0.35, 0.62, 0.1] });
B(0.248, { base: [-2.7, -2.2], aim: top(-0.45, -2.3), off: [-0.35, 0.62, -0.1] });

/* ─────────────── SCENE 4 · HIGH-PRESSURE PRE-RINSE (0.25–0.34) ─────────────── */
A(0.252, { spray: 1 }, 'out');
B(0.253, { spray: 1 }, 'out');
M(0.256, 0.266, { paths: 0 });
// hood / trunk
A(0.26, { aim: top(-0.6, 2.1) }, 'inOut');
A(0.263, { aim: top(-0.6, 1.45) }, 'inOut');
A(0.27, { aim: top(0.6, 1.45) }, 'inOut');
B(0.261, { aim: top(0.6, -2.3) }, 'inOut');
B(0.264, { aim: top(0.6, -1.75) }, 'inOut');
B(0.271, { aim: top(-0.6, -1.75) }, 'inOut');
// roof
A(0.277, { base: [2.55, 0.9], aim: top(0.3, 0.75), off: [0.45, 0.6, 0] });
A(0.287, { aim: top(0.3, 0.36) }, 'linear');
A(0.297, { base: [2.55, -1.3], aim: top(0.3, -1.1) }, 'inOut');
B(0.278, { base: [-2.55, -1.3], aim: top(-0.3, -1.1), off: [-0.45, 0.6, 0] });
B(0.288, { aim: top(-0.3, -0.79) }, 'linear');
B(0.298, { base: [-2.55, 0.9], aim: top(-0.3, 0.75) }, 'inOut');
// rear glass (A) / hood (B)
A(0.306, { base: [2.6, -2.4], aim: top(0.93, -2.4), off: [0.4, 0.6, -0.15] });
B(0.307, { base: [-2.6, 2.2], aim: top(-0.4, 1.9), off: [-0.35, 0.6, 0.15] });
// sides
A(0.314, { base: [2.7, -2.5], aim: side(1, 0.58, -2.5), off: [0.72, 0.36, 0] });
A(0.336, { base: [2.7, 2.5], aim: side(1, 0.58, 2.45) }, 'inOut');
B(0.315, { base: [-2.7, 2.5], aim: side(-1, 0.58, 2.45), off: [-0.72, 0.36, 0] });
B(0.337, { base: [-2.7, -2.5], aim: side(-1, 0.58, -2.5) }, 'inOut');
A(0.339, { spray: 0 }, 'in');
B(0.34, { spray: 0 }, 'in');

/* ─────────────── SCENE 5 · FOAM (0.34–0.44) ─────────────── */
A(0.344, { mode: 1, off: [0.5, 0.75, 0] });
B(0.345, { mode: 1, off: [-0.5, 0.75, 0] });
A(0.347, { spray: 1 }, 'out');
B(0.348, { spray: 1 }, 'out');
M(0.348, 0.428, { foam: 1 }, 'linear');
{
  const n = 8;
  const t0 = 0.349;
  const t1 = 0.426;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const t = t0 + (t1 - t0) * u;
    const za = 2.5 - 5.0 * u;
    const zb = -2.5 + 5.0 * u;
    const high = i % 2 === 0;
    A(t, { base: [2.6, za * 0.95], aim: high ? top(0.2, za) : side(1, 0.62, za) }, 'inOut');
    B(t + 0.002, { base: [-2.6, zb * 0.95], aim: high ? side(-1, 0.62, zb) : top(-0.2, zb) }, 'inOut');
  }
}
A(0.43, { spray: 0 }, 'in');
B(0.431, { spray: 0 }, 'in');
// pause, then retract toward the outer edges, still visible at rest
A(0.435, {});
B(0.436, {});
A(0.452, tuck(1, 5.7, 0.3));
B(0.454, tuck(-1, -5.7, -0.3));

/* ─────────────── SCENE 6 · DETAIL WINDOW OPENS ON THE DRIVER SIDE (0.44–0.53) ─────────────── */
M(0.444, 0.47, { envelope: 0 });
M(0.46, 0.5, { camRise: 0, camActive: 0 });
// detail camera: parked on a driver-side three-quarter view before the window opens
M(0.44, 0.441, { follow: 0, camTx: 0, camTy: 0.6, camTz: 0, camAz: 62, camEl: 16, camDist: 10.5, fov: 30 });
M(0.458, 0.474, { inset: 1 });
M(0.476, 0.522, { camAz: 84, camEl: 8, camDist: 9.2 });
A(0.458, {});
A(0.505, tuck(1, 3.1, 3.05));
B(0.462, {});
B(0.51, tuck(-1, -3.2, 2.2));

/* ─────────────── SCENE 7 · WHEEL CLEANING (0.53–0.63) ─────────────── */
A(0.532, { base: [2.75, 2.45], aim: [WX, 0.36, FZ], off: [0.72, 0.28, 0.32], mode: 0 });
B(0.533, { base: [-2.75, 2.45], aim: [-WX, 0.36, FZ], off: [-0.72, 0.28, 0.32], mode: 0 });
// wheel close-ups look past the arm base (which sits ahead of / behind each wheel)
M(0.522, 0.538, { camAz: 106, camEl: 14, camDist: 3.5, camTx: WX, camTy: 0.4, camTz: FZ });
A(0.537, { spray: 1 }, 'out');
B(0.538, { spray: 1 }, 'out');
trace('a', 0.539, 0.564, circlePath(WX, 0.36, FZ, 0.2, 1.5, 18));
trace('b', 0.54, 0.565, circlePath(-WX, 0.36, FZ, 0.2, 1.5, 18, Math.PI / 3));
trace('a', 0.566, 0.574, arch(WX, FZ, [0.95, 0.78, 0.55, 0.3, 0.1]), 'inOut');
trace('b', 0.567, 0.575, arch(-WX, FZ, [0.95, 0.78, 0.55, 0.3, 0.1]), 'inOut');
A(0.576, { spray: 0 }, 'in');
B(0.577, { spray: 0 }, 'in');
M(0.577, 0.592, { camAz: 74, camEl: 14, camDist: 3.5, camTz: RZ });
A(0.589, { base: [2.75, -2.5], aim: [WX, 0.36, RZ], off: [0.72, 0.28, -0.32] });
B(0.59, { base: [-2.75, -2.5], aim: [-WX, 0.36, RZ], off: [-0.72, 0.28, -0.32] });
A(0.592, { spray: 1 }, 'out');
B(0.593, { spray: 1 }, 'out');
trace('a', 0.594, 0.617, circlePath(WX, 0.36, RZ, 0.2, 1.5, 18, Math.PI));
trace('b', 0.595, 0.618, circlePath(-WX, 0.36, RZ, 0.2, 1.5, 18, Math.PI / 2));
trace('a', 0.618, 0.625, arch(WX, RZ, [0.9, 0.7, 0.45, 0.2, 0.05]), 'inOut');
trace('b', 0.619, 0.626, arch(-WX, RZ, [0.9, 0.7, 0.45, 0.2, 0.05]), 'inOut');
A(0.627, { spray: 0 }, 'in');
B(0.628, { spray: 0 }, 'in');

/* ─────────────── SCENE 8 · AI-DETECTED PROBLEM AREA (0.63–0.70) ─────────────── */
M(0.63, 0.637, { marker: 1 }, 'out');
M(0.63, 0.646, { camAz: 64, camEl: 10, camDist: 3.4, camTx: S.x, camTy: S.y, camTz: S.z });
A(0.645, { base: [2.9, -2.4], aim: [S.x + 0.02, S.y, S.z], off: [0.6, 0.22, -0.2], mode: 0 });
B(0.645, tuck(-1, -3.0, -2.2));
A(0.649, { spray: 1 }, 'out');
M(0.649, 0.657, { holeR: 0.5 }, 'out');
A(0.658, { spray: 0 }, 'in');
A(0.661, { mode: 3, off: [0.48, 0.18, -0.12] });
A(0.663, { spray: 0.8 }, 'out');
trace('a', 0.664, 0.679, circlePath(S.x + 0.02, S.y, S.z, 0.12, 2, 16));
M(0.664, 0.679, { dirt: 0.35 }, 'linear');
A(0.68, { spray: 0 }, 'in');
A(0.682, { mode: 0, off: [0.6, 0.22, -0.2] });
A(0.684, { spray: 1 }, 'out');
trace('a', 0.685, 0.692, [[S.x, S.y + 0.14, S.z - 0.28], [S.x, S.y + 0.02, S.z + 0.28], [S.x, S.y - 0.12, S.z - 0.2]], 'inOut');
M(0.685, 0.692, { dirt: 0 });
A(0.694, { spray: 0 }, 'in');
M(0.692, 0.696, { marker: 2 }, 'out');

/* ─────────────── SCENE 9 · FRONT VIEW + FINAL RINSE (0.70–0.79) ─────────────── */
M(0.7, 0.708, { marker: 0 });
M(0.7, 0.712, { inset: 0 });
A(0.703, { mode: 2 });
B(0.703, { mode: 2 });
A(0.724, { base: [2.55, 2.85], aim: top(0.4, 0.55), off: [0.45, 0.65, 0.2] });
B(0.724, { base: [-2.55, 2.85], aim: top(-0.4, 0.55), off: [-0.45, 0.65, 0.2] });
// four alternating passes, working top down
A(0.728, { spray: 1 }, 'out');
A(0.742, { aim: top(-0.05, -0.8) }, 'inOut');
A(0.744, { spray: 0 }, 'in');
M(0.728, 0.742, { drain: 1.2, grime: 0.75 }, 'linear');
B(0.741, { aim: top(-0.6, 1.3) });
B(0.743, { spray: 1 }, 'out');
B(0.757, { aim: top(0.1, 1.9) }, 'inOut');
B(0.759, { spray: 0 }, 'in');
M(0.743, 0.757, { drain: 0.78, grime: 0.45 }, 'linear');
A(0.755, { aim: top(0.8, 2.2), off: [0.4, 0.6, 0.35] });
A(0.758, { spray: 1 }, 'out');
A(0.772, { aim: top(-0.1, 2.6) }, 'inOut');
A(0.774, { spray: 0 }, 'in');
M(0.758, 0.772, { drain: 0.4, grime: 0.2 }, 'linear');
B(0.771, { aim: [-0.75, 0.5, 2.78], off: [-0.4, 0.55, 0.45] });
B(0.773, { spray: 1 }, 'out');
B(0.787, { aim: [0.35, 0.4, 2.86] }, 'inOut');
B(0.789, { spray: 0 }, 'in');
M(0.773, 0.787, { drain: -0.25, grime: 0 }, 'linear');
M(0.78, 0.8, { gloss: 1 });

/* ─────────────── SCENE 10 · ARMS RETRACT (0.79–0.85) ─────────────── */
A(0.793, {});
B(0.795, {});
A(0.824, tuck(1, 5.5, -2.4));
B(0.828, tuck(-1, -5.5, -2.4));

/* ─────────────── SCENE 11 · POST-WASH QUALITY SCAN (0.85–0.92) ─────────────── */
M(0.846, 0.864, { camRise: 1 }, 'out');
M(0.862, 0.872, { camActive: 1, beams: 1 });
M(0.872, 0.915, { qcScan: 1 }, 'linear');
M(0.862, 0.918, { carYaw: 26 }, 'inOut');
M(0.874, 0.886, { wire: 0.55 });
M(0.908, 0.92, { wire: 0, beams: 0 });

/* ─────────────── SCENE 12 · HERO REVEAL (0.92–1.00) ─────────────── */
M(0.922, 0.962, { carYaw: -4, camRise: 0, camActive: 0 });
// detail window reopens on a finished three-quarter shot and slowly orbits
M(0.92, 0.921, { insetPhoneOff: 1, camAz: 30, camEl: 11, camDist: 7.4, camTx: 0, camTy: 0.5, camTz: 0.1 });
M(0.926, 0.94, { inset: 1 });
M(0.926, 1, { camAz: 56, camDist: 7.0 }, 'linear');

export const WASH_TRACKS = tb.build();
export const WASH_CHANNELS = Object.keys(initial);

/* ─────────────── HTML annotations projected from 3D anchors ─────────────── */

export type AnnotationTone = 'cyan' | 'orange' | 'chrome' | 'ok' | 'alert';

export interface Annotation {
  id: string;
  /** Vehicle-space anchor, or a live nozzle. */
  anchor: V3 | 'nozzleA' | 'nozzleB';
  label: string;
  sub?: string;
  in: number;
  out: number;
  tone: AnnotationTone;
  /** Hidden on small screens, where only primary callouts are shown. */
  minor?: boolean;
  /** On phones, show only the marker dot (a panel lists the detail). */
  dotOnMobile?: boolean;
  /** Project into the detail window instead of the main view (hidden while the window is closed). */
  detail?: boolean;
  /** Screen-space nudge in px. */
  dx?: number;
  dy?: number;
}

const L = VEHICLE.length / 2;
export const ANNOTATIONS: Annotation[] = [
  { id: 'len', anchor: [-1.5, 0, 0], label: 'LENGTH 5.58 m', sub: 'fin tip to bumper', in: 0.152, out: 0.172, tone: 'cyan', dx: -18 },
  { id: 'wid', anchor: [0, 0, L + 0.45], label: 'WIDTH 2.00 m', sub: 'no mirrors · open cockpit', in: 0.152, out: 0.172, tone: 'cyan', dy: 10 },
  { id: 'fins', anchor: [0.95, 1.03, -2.7], label: 'TAIL FINS ×2', sub: 'swept · +0.24 m above deck', in: 0.152, out: 0.172, tone: 'cyan' },
  { id: 'canopy', anchor: [0.3, 1.36, 0.36], label: 'BUBBLE CANOPIES ×2', sub: 'acrylic · low-pressure zone', in: 0.152, out: 0.172, tone: 'cyan' },
  { id: 'wfl', anchor: [WX, 0.36, FZ], label: 'WHITEWALL FL', sub: 'Ø 0.72 m · soft-wall rinse', in: 0.152, out: 0.172, tone: 'cyan', minor: true },
  { id: 'wrr', anchor: [-WX, 0.36, RZ], label: 'FENDER SKIRT RR', sub: 'wheel partly enclosed', in: 0.152, out: 0.172, tone: 'cyan', minor: true },
  { id: 'lamps', anchor: [0.63, 0.56, L], label: 'QUAD HEADLAMPS', sub: 'chrome bezels · slow zone', in: 0.152, out: 0.172, tone: 'cyan', minor: true },
  { id: 'rockets', anchor: [-0.5, 0.58, -L - 0.1], label: 'ROCKET TAIL-LIGHTS ×10', sub: 'protrusions mapped', in: 0.152, out: 0.172, tone: 'cyan', minor: true },

  { id: 'nozA-rinse', anchor: 'nozzleA', label: 'ARM A', sub: 'H₂O · pressure set per surface', in: 0.254, out: 0.338, tone: 'chrome', minor: true },
  { id: 'nozB-rinse', anchor: 'nozzleB', label: 'ARM B', sub: 'H₂O · mirrored path', in: 0.256, out: 0.338, tone: 'chrome', minor: true },
  { id: 'nozA-foam', anchor: 'nozzleA', label: 'NOZZLE → FOAM', sub: 'turret position 2', in: 0.344, out: 0.428, tone: 'orange', minor: true },
  { id: 'nozA-wheel', anchor: 'nozzleA', label: 'GEOMETRY-AWARE WHEEL TARGETING', sub: 'spoke-by-spoke trace', in: 0.54, out: 0.626, tone: 'cyan', detail: true },
  { id: 'nozB-wheel', anchor: 'nozzleB', label: 'ARM B · PASSENGER WHEELS', sub: 'mirrored path', in: 0.545, out: 0.626, tone: 'chrome', minor: true },

  { id: 'flag', anchor: [S.x + 0.05, S.y + 0.2, S.z], label: 'ADDITIONAL CLEANING REQUIRED', sub: 'FLAG 01 · recalled from pre-wash scan', in: 0.637, out: 0.69, tone: 'orange', dy: -8, detail: true },
  { id: 'flagok', anchor: [S.x + 0.05, S.y + 0.2, S.z], label: 'FLAG 01 · CLEARED', sub: 'targeted pass · 14 s', in: 0.692, out: 0.705, tone: 'ok', dy: -8, detail: true },
  { id: 'nozA-front', anchor: 'nozzleA', label: 'SPOT-FREE RINSE', sub: 'top-down passes', in: 0.73, out: 0.788, tone: 'cyan', minor: true },

  { id: 'qc-roof', anchor: [0, 1.36, 0.36], label: 'CANOPIES', sub: 'clear · no film ✓', in: 0.884, out: 0.922, tone: 'ok' },
  { id: 'qc-wheels', anchor: [-WX, 0.36, FZ], label: 'WHEELS 4/4', sub: 'verified ✓', in: 0.904, out: 0.922, tone: 'ok', minor: true },
];

const TONE: Record<FindingKind, AnnotationTone> = { new: 'alert', alert: 'alert', known: 'chrome', check: 'orange', ok: 'ok' };

// Condition findings: identified by the pre-wash scan, resolved by the post-wash recheck.
for (const f of FINDINGS) {
  ANNOTATIONS.push({
    id: `pre-${f.id}`,
    anchor: f.anchor,
    label: f.label.toUpperCase(),
    sub: `${KIND_LABEL[f.pre.kind]} · ${f.pre.note}`,
    in: f.tFound,
    out: f.id === 'grime' ? 0.226 : 0.214,
    tone: TONE[f.pre.kind],
    dotOnMobile: true,
  });
  ANNOTATIONS.push({
    id: `post-${f.id}`,
    anchor: f.anchor,
    label: f.label.toUpperCase(),
    sub: `${KIND_LABEL[f.post.kind]} · ${f.post.note}`,
    in: f.tResolved,
    out: 0.924,
    tone: TONE[f.post.kind],
    dotOnMobile: true,
  });
}
