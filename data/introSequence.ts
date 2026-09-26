/**
 * "Meet the machine" close-ups (every device).
 *
 * One 0–1 timeline, played in two splices at different points of the main
 * wash timeline (INTRO.splices in lib/animationConfig.ts); the main timeline
 * holds while each plays:
 *
 *   0.00–0.45 · SEE   right after the camera pylons rise: green rings draw
 *               around the eight cameras, the close-up window shows one of
 *               them, and a callout names them "the eyes"
 *   0.45–1.00 · MOVE  just before the arms leave their parking spots: rings
 *               draw around both arms, the window shows a whole arm, and a
 *               callout names them "the hands"
 *
 * Channels shared with the main timeline (inset, cam*, camActive, insetLL…)
 * only override it inside a splice; intro-only channels read 0 outside.
 */

import { TrackBuilder, type ChannelValues } from '@/lib/timeline';
import { CAMERA_ARRAY } from '@/lib/animationConfig';

/** The pylon the close-up looks at (front-left, nearest the window). */
export const FOCUS_PYLON = 0;
/** The arm the close-up looks at (arm B, passenger side, nearest the window). */
export const FOCUS_ARM = 1;
/** Tool-head supply lines, in callout order. Colors are shared by the 3D hoses and the HTML callout. */
export const SUPPLY_LINES = [
  { id: 'water', label: 'High-pressure water', note: 'main line', color: '#4f9be0', radius: 0.042 },
  { id: 'wash', label: 'Body wash', color: '#f6e7d2', radius: 0.017 },
  { id: 'tire', label: 'Tire cleaning & shine', color: '#9b7bff', radius: 0.017 },
  { id: 'wax', label: 'Hot wax', color: '#f2b14a', radius: 0.017 },
  { id: 'spotfree', label: 'Spot-free coating', color: '#bfeef2', radius: 0.017 },
] as const;

/** Where the arms park before the wash (inside the frame of the main view). */
export const ARM_PARK = { x: 5.7, z: 1.4 };

// Pylon 0 is the first on the front arc (same layout as components/wash/CameraArray.ts).
const A0 = -(CAMERA_ARRAY.arcHalfAngle * Math.PI) / 180;
const P = { x: Math.sin(A0) * CAMERA_ARRAY.radiusX, y: Math.cos(A0) * CAMERA_ARRAY.radiusZ };
const HEAD_Y = CAMERA_ARRAY.mastHeight + 0.2;

const shared: ChannelValues = {
  inset: 0,
  /** 1 = the close-up window sits in the lower left (desktop) instead of the upper right. */
  insetLL: 1,
  toolView: 0,
  camAz: 118,
  camEl: 9,
  camDist: 1.8,
  camTx: P.x,
  camTy: HEAD_Y,
  camTz: P.y,
  fov: 30,
  follow: 0,
  camActive: 0,
};

const only: ChannelValues = {
  ringCam: 0,
  ringCamOut: 0,
  ringArm: 0,
  ringArmOut: 0,
  focusRing: 0,
  linkArm: 0,
  call1: 0,
  call2: 0,
};

export const INTRO_ONLY_CHANNELS = Object.keys(only);

const tb = new TrackBuilder({ ...shared, ...only });
const M = (t0: number, t1: number, set: ChannelValues, e: Parameters<typeof tb.move>[3] = 'inOut') => tb.move(t0, t1, set, e);

/* ── SEE (0–0.45): the cameras, the eyes ── */
M(0.0, 0.15, { ringCam: 1 }, 'linear');
M(0.02, 0.17, { camActive: 1 }, 'linear');
M(0.13, 0.18, { focusRing: 1 });
M(0.15, 0.2, { inset: 1 });
M(0.19, 0.24, { call1: 1 });
M(0.2, 0.39, { camAz: 76, camDist: 1.55 }, 'linear');
M(0.37, 0.41, { call1: 0, inset: 0, focusRing: 0 });
M(0.39, 0.44, { ringCamOut: 1, camActive: 0 });

/* ── MOVE (0.45–1): the robot arms, the hands (arms still in their parking spots) ── */
M(0.45, 0.451, { camActive: 0.35, camAz: 232, camEl: 14, camDist: 6.6, camTx: -ARM_PARK.x, camTy: 1.25, camTz: -ARM_PARK.z });
M(0.47, 0.6, { ringArm: 1 }, 'linear');
M(0.58, 0.62, { linkArm: 1 });
M(0.6, 0.65, { inset: 1 });
M(0.64, 0.7, { call2: 1 });
M(0.65, 0.9, { camAz: 206, camDist: 6.1 }, 'linear');
M(0.88, 0.97, { inset: 0, call2: 0, linkArm: 0, ringArmOut: 1 });

export const INTRO_TRACKS = tb.build();
