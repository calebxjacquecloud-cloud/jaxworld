/**
 * "Meet the bay" intro (desktop only).
 *
 * Plays on its own 0–1 timeline, spliced into the scroll right after the
 * camera pylons rise (INTRO.at). While it runs, the main wash timeline holds
 * still and these channels are layered on top:
 *
 *   1 · green rings draw around the eight camera pylons; the close-up window
 *       opens in the lower left on a single camera, with a callout beside it
 *   2 · the camera rings fade, rings draw around the two robot arms, and the
 *       window shows a whole arm
 *   3 · the window wipes to the tool head: one nozzle fed by five supply lines
 *
 * Channels shared with the main timeline (inset, cam*, camActive) only
 * override it inside the intro; intro-only channels read 0 outside it.
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
  /** 1 = the close-up window sits in the lower left instead of the upper right. */
  insetLL: 1,
  /** 1 = the window shows the tool-head model instead of the bay. */
  toolView: 0,
  ringCam: 0,
  ringCamOut: 0,
  ringArm: 0,
  ringArmOut: 0,
  focusRing: 0,
  linkArm: 0,
  call1: 0,
  call2: 0,
  call3: 0,
  /** Supply line being highlighted, 0–5 (0 = none yet). */
  hoseStep: 0,
  toolAz: 14,
  toolEl: 20,
  toolDist: 2.0,
};

export const INTRO_ONLY_CHANNELS = Object.keys(only);

const tb = new TrackBuilder({ ...shared, ...only });
const M = (t0: number, t1: number, set: ChannelValues, e: Parameters<typeof tb.move>[3] = 'inOut') => tb.move(t0, t1, set, e);

/* ── 1 · cameras: the eyes ── */
M(0.0, 0.14, { ringCam: 1 }, 'linear');
M(0.02, 0.16, { camActive: 1 }, 'linear');
M(0.12, 0.17, { focusRing: 1 });
M(0.14, 0.19, { inset: 1 });
M(0.18, 0.23, { call1: 1 });
M(0.19, 0.36, { camAz: 76, camDist: 1.55 }, 'linear');
M(0.35, 0.39, { call1: 0, inset: 0, focusRing: 0 });
M(0.38, 0.43, { ringCamOut: 1 });

/* ── 2 · robot arms: the physical motion ── */
M(0.4, 0.401, { camAz: 232, camEl: 14, camDist: 6.6, camTx: -ARM_PARK.x, camTy: 1.25, camTz: -ARM_PARK.z });
M(0.42, 0.52, { ringArm: 1 }, 'linear');
M(0.5, 0.54, { linkArm: 1 });
M(0.52, 0.56, { inset: 1 });
M(0.55, 0.59, { call2: 1 });
M(0.56, 0.68, { camAz: 206, camDist: 6.1 }, 'linear');

/* ── 3 · the tool head (window wipes to a new close-up) ── */
M(0.68, 0.71, { inset: 0, call2: 0 });
M(0.705, 0.706, { toolView: 1 });
M(0.71, 0.75, { inset: 1 });
M(0.74, 0.78, { call3: 1 });
M(0.71, 0.93, { toolAz: 40, toolDist: 1.8 }, 'linear');
M(0.77, 0.91, { hoseStep: 5 }, 'linear');

/* ── out: back to the main sequence ── */
M(0.92, 0.97, { inset: 0, call3: 0, linkArm: 0, ringArmOut: 1, camActive: 0 });
M(0.975, 0.976, { toolView: 0 });

export const INTRO_TRACKS = tb.build();
