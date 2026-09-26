/**
 * "Pack it up" outro (every device).
 *
 * Plays on its own 0–1 timeline appended after the main wash timeline:
 *
 *   1 · the finished car drives out of the bay
 *   2 · the view pulls back; the equipment that ran the wash but was never on
 *       screen (water, pressurization, chemistry, compute, hose reels) rises
 *       from its floor pockets, and the camera pylons come back up
 *   3 · a 40 ft high-cube container slides in with its long wall folded down,
 *       and every piece arcs into its slot: tracks, utilities, pylons, arms
 *   4 · the roof lowers, the wall folds up, and the camera settles on the
 *       Jax World Carwash-O-Matic livery
 *
 * Channels shared with the main timeline (camera, car, inset…) only override
 * it once the outro has started; outro-only channels read 0 before it.
 */

import { TrackBuilder, sampleTrack, type ChannelValues } from '@/lib/timeline';
import { CONTAINER } from '@/lib/animationConfig';
import { WASH_TRACKS } from './washSequence';
import type { CopyBlock } from '@/lib/washStages';

/* ───────────── equipment that only appears in the outro ───────────── */

export type UtilityKind = 'water' | 'pump' | 'tub' | 'rack' | 'cabinet' | 'reel';

export interface Utility {
  id: string;
  kind: UtilityKind;
  label: string;
  /** Where it rises from, on the utility row above the bay (world x, z). */
  at: [number, number];
  /** Tub / reel accent color. */
  color?: string;
  /** Height of the label anchor above the floor. */
  h: number;
}

const ROW_Z = -9.3;
export const UTILITIES: Utility[] = [
  { id: 'water', kind: 'water', label: 'Water storage', at: [-8.2, ROW_Z], h: 2.2 },
  { id: 'pump', kind: 'pump', label: 'Pressurization system', at: [-5.4, ROW_Z], h: 1.3 },
  { id: 'tub-wash', kind: 'tub', label: 'Body wash', at: [-2.9, ROW_Z - 0.34], color: '#f6e7d2', h: 1.0 },
  { id: 'tub-tire', kind: 'tub', label: 'Tire clean & shine', at: [-2.25, ROW_Z - 0.34], color: '#9b7bff', h: 1.0 },
  { id: 'tub-wax', kind: 'tub', label: 'Hot wax', at: [-2.9, ROW_Z + 0.34], color: '#f2b14a', h: 1.0 },
  { id: 'tub-spot', kind: 'tub', label: 'Spot-free coating', at: [-2.25, ROW_Z + 0.34], color: '#bfeef2', h: 1.0 },
  { id: 'rack', kind: 'rack', label: 'Controller & compute', at: [0.6, ROW_Z], h: 2.05 },
  { id: 'cabinet', kind: 'cabinet', label: 'Network & monitoring', at: [1.8, ROW_Z], h: 1.35 },
  { id: 'reel-hp', kind: 'reel', label: 'High-pressure hose reel', at: [4.8, ROW_Z], color: '#4f9be0', h: 1.0 },
  { id: 'reel-supply', kind: 'reel', label: 'Supply line reel', at: [6.0, ROW_Z], color: '#d9622b', h: 1.0 },
];

/* ───────────── packing plan ───────────── */

/**
 * Every packed unit, in loading order (back of the container first), with its
 * slot in container space: x along the length (−x = closed end), z across the
 * width (+z = the folding wall side), y = floor height of the unit's base,
 * rotY in degrees.
 */
export interface PackSlot {
  id: string;
  x: number;
  z: number;
  y?: number;
  rotY?: number;
}

const FLOOR_Y = 0.16;
export const PACK_PLAN: PackSlot[] = [
  // tracks lie flat along the container floor, against both walls
  { id: 'rail-b-outer', x: -1.6, z: -1.02, rotY: 90 },
  { id: 'rail-b-inner', x: -1.6, z: -0.9, rotY: 90 },
  { id: 'rail-a-outer', x: -1.6, z: 1.02, rotY: 90 },
  { id: 'rail-a-inner', x: -1.6, z: 0.9, rotY: 90 },
  { id: 'bridge-b', x: -1.6, z: -0.7 },
  { id: 'bridge-a', x: -1.6, z: 0.7 },
  // utilities, closed end first
  { id: 'water', x: -5.05, z: 0 },
  { id: 'pump', x: -3.65, z: 0 },
  { id: 'tub-wash', x: -2.62, z: -0.32 },
  { id: 'tub-tire', x: -2.02, z: -0.32 },
  { id: 'tub-wax', x: -2.62, z: 0.32 },
  { id: 'tub-spot', x: -2.02, z: 0.32 },
  { id: 'rack', x: -1.2, z: -0.42 },
  { id: 'cabinet', x: -1.2, z: 0.42 },
  { id: 'reel-hp', x: -0.3, z: -0.45, rotY: 90 },
  { id: 'reel-supply', x: -0.3, z: 0.45, rotY: 90 },
  // camera pylons, masts collapsed, in two rows of four
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ id: `pylon-${i}`, x: 0.5 + (i % 4) * 0.5, z: i < 4 ? -0.5 : 0.5 })),
  // robotic arms last, nearest the doors
  { id: 'arm-b', x: 3.05, z: 0 },
  { id: 'arm-a', x: 4.3, z: 0 },
].map((s) => ({ y: FLOOR_Y, rotY: 0, ...s }));

/** Share of the packing window each unit's move takes (the rest staggers the starts). */
export const PACK_MOVE = 0.16;

/** 0→1 progress of unit `i` for overall packing progress `pack`. */
export function unitProgress(pack: number, i: number, n = PACK_PLAN.length): number {
  const start = (i / Math.max(1, n - 1)) * (1 - PACK_MOVE);
  return Math.min(1, Math.max(0, (pack - start) / PACK_MOVE));
}

/* ───────────── labels shown before packing ───────────── */

export interface EquipmentLabel {
  /** Pack unit whose move hides the label. */
  unit: string;
  label: string;
  sub?: string;
  /** World anchor. */
  at: [number, number, number];
  tone: 'chrome' | 'orange' | 'cyan';
  /** Hidden on phones, where only primary labels fit. */
  minor?: boolean;
  /** Card hangs below the marker instead of above it (keeps neighbours apart). */
  below?: boolean;
}

const util = (id: string) => UTILITIES.find((u) => u.id === id)!;
const top = (id: string, dx = 0): [number, number, number] => [util(id).at[0] + dx, util(id).h, util(id).at[1]];

export const EQUIPMENT_LABELS: EquipmentLabel[] = [
  { unit: 'water', label: 'WATER STORAGE', at: top('water'), tone: 'orange' },
  { unit: 'pump', label: 'PRESSURIZATION', sub: 'pump + pressure vessel', at: top('pump'), tone: 'orange', below: true },
  { unit: 'tub-wash', label: 'CHEMISTRY TUBS ×4', at: top('tub-tire', -0.3), tone: 'chrome', minor: true },
  { unit: 'rack', label: 'CONTROL, COMPUTE + NETWORK', at: top('rack', 0.6), tone: 'orange', below: true, minor: true },
  { unit: 'reel-hp', label: 'HOSE REELS ×2', at: top('reel-hp', 0.6), tone: 'chrome', minor: true },
  { unit: 'pylon-0', label: 'CAMERA PYLONS ×8', sub: 'masts retract for transport', at: [-2.07, 1.3, 4.31], tone: 'cyan' },
  { unit: 'arm-b', label: 'ROBOTIC ARMS ×2', sub: 'fold to travel height', at: [-5.5, 2.1, -2.4], tone: 'orange' },
  { unit: 'rail-a-outer', label: 'XY TRACKS + STAGES', sub: '4 rails · 2 bridges', at: [9.6, 0.1, -3.3], tone: 'chrome', minor: true },
];

/* ───────────── timeline ───────────── */

/** Main-timeline channels the outro takes over (starting from their values at the end of the wash). */
const SHARED = [
  'inset', 'carYaw', 'camRise', 'camActive', 'beams', 'headlights', 'gloss',
  'vAz', 'vEl', 'vDist', 'vTx', 'vTy', 'vTz', 'vFov', 'vFrameX', 'vFrameY', 'vMobileY', 'vPortraitK',
];
const shared: ChannelValues = {};
for (const k of SHARED) shared[k] = sampleTrack(WASH_TRACKS[k], 1);

const only: ChannelValues = {
  /** Car travel out of the bay along +z, metres. */
  exitZ: 0,
  /** Utilities rise from their floor pockets. */
  util: 0,
  /** Equipment labels. */
  labels: 0,
  /** Container slides in (0 = parked off to the right, 1 = in place). */
  contIn: 0,
  /** Overall packing progress (per-unit timing: unitProgress). */
  pack: 0,
  /** Roof lowered onto the container. */
  roof: 0,
  /** Long wall folded up (0 = flat on the ground, 1 = closed). */
  wall: 0,
};

export const OUTRO_ONLY_CHANNELS = Object.keys(only);

const tb = new TrackBuilder({ ...shared, ...only });
const M = (t0: number, t1: number, set: ChannelValues, e: Parameters<typeof tb.move>[3] = 'inOut') => tb.move(t0, t1, set, e);

/* 1 · drive out */
M(0.0, 0.035, { inset: 0 });
M(0.0, 0.045, { carYaw: 0, gloss: 0.6 });
M(0.04, 0.19, { exitZ: 30 }, 'inOut');

/* 2 · pull back; the hidden equipment appears */
M(0.15, 0.3, { vAz: 0, vEl: 60, vDist: 45, vTx: 0, vTy: 0, vTz: 0.6, vFov: 32, vFrameX: 0.1, vFrameY: -0.02, vMobileY: 0.16, vPortraitK: 0.42 });
M(0.2, 0.3, { util: 1 });
M(0.21, 0.29, { camRise: 0.42 });
M(0.25, 0.31, { labels: 1 });

/* 3 · container arrives, everything packs */
M(0.27, 0.37, { contIn: 1 });
M(0.37, 0.85, { pack: 1 }, 'linear');

/* 4 · close up, then the livery */
M(0.85, 0.9, { roof: 1 });
M(0.89, 0.95, { wall: 1 });
M(0.86, 0.97, {
  vAz: 14, vEl: 8, vDist: 20, vTx: 0, vTy: 1.35, vTz: CONTAINER.z, vFov: 30, vFrameX: 0, vFrameY: 0.1, vMobileY: -0.14, vPortraitK: 0.8,
});
M(0.97, 1, { vAz: 20, vDist: 19.2 }, 'linear');

export const OUTRO_TRACKS = tb.build();

/* ───────────── copy ───────────── */

export const OUTRO_COPY: CopyBlock[] = [
  {
    id: 'driveout',
    in: 0.035,
    out: 0.19,
    place: 'left',
    eyebrow: '12 · Drive out',
    title: 'Clean car out. Bay clear.',
    body: 'The next vehicle pulls straight in.',
  },
  {
    id: 'canmove',
    in: 0.22,
    out: 0.44,
    place: 'left',
    eyebrow: '13 · Modular',
    title: 'Car wash infrastructure that can move.',
    body: 'Everything behind the wash, most of it never on screen: water, pressure, chemistry, compute, hoses, tracks, cameras and arms.',
  },
  {
    id: 'packs',
    in: 0.47,
    out: 0.84,
    place: 'left',
    eyebrow: '14 · Pack up',
    title: 'One 40 ft high-cube container.',
    body: 'The design target: the complete system packs into a standard shipping container, so it can move by truck, rail or ship.',
  },
  {
    id: 'shipped',
    in: 0.955,
    out: 1.2,
    place: 'bottom',
    eyebrow: 'Ready to ship',
    title: 'Unfolds wherever there’s power and water.',
  },
];
