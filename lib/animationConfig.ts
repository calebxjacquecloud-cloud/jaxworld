/**
 * Every physical dimension and tuning constant for the wash demo lives here.
 * Units are metres and degrees unless noted. Keeping these in one place means
 * the choreography in /data/washSequence.ts reads as positions on the bay
 * floor rather than a pile of magic numbers.
 */

/**
 * Desktop-only "meet the bay" intro, spliced into the scroll right after the
 * camera pylons rise (see data/introSequence.ts). While it plays, the main
 * timeline holds at `at`; `length` is extra scroll, as a fraction of the main timeline.
 */
export const INTRO = { at: 0.0995, length: 0.14 };

const BASE_WASH_VH = 3200;

export const SCROLL = {
  /** Desktop: height of the pinned wash scene in viewport heights (scrolling scrubs the timeline + intro). */
  washSectionVh: Math.round(BASE_WASH_VH * (1 + INTRO.length)),
  /** Desktop: GSAP scrub smoothing in seconds (higher = the scene eases after each wheel notch instead of jumping). */
  scrub: 1.4,
  /** Touch: one swipe = one step, played at a steady pace (see hooks/useStepProgress.ts). */
  step: {
    /** Playback speed between steps, in timeline progress per second. */
    speed: 0.022,
    /** Shortest and longest time a single step may take, in seconds. */
    minDuration: 1.1,
    maxDuration: 3.2,
    /** Minimum finger travel (px) that counts as a swipe. */
    swipeThreshold: 28,
  },
};

/** Phones and touch-first tablets get stepped playback instead of scroll scrubbing. */
export function isTouchLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
}

/**
 * Placeholder vehicle: a Googie-era bubble-top custom with tail fins.
 * Nose points +Z in vehicle space, driver side is +X. Body shape lives in
 * lib/vehicleShape.ts; these are the headline numbers the rest of the scene uses.
 */
export const VEHICLE = {
  length: 5.58,
  width: 2.0,
  height: 1.4,
  wheelBase: 3.15,
  wheelRadius: 0.36,
  wheelWidth: 0.25,
  trackHalf: 0.79,
  frontAxleZ: 1.62,
  rearAxleZ: -1.53,
  bodyColor: '#3aa9a6',
  grimeColor: '#6a6152',
  /** The stubborn oil / road-grime smudge found by the first scan: driver-side door. Vehicle space. */
  smudge: { x: 1.0, y: 0.56, z: -0.5, radius: 0.36 },
};

/** Arrival path: straight run heading +X, then a right-hand quarter turn into the bay. */
export const ARRIVAL = {
  startX: -17,
  laneZ: -6,
  turnRadius: 6,
  /** Bay centre, where the car finishes facing +Z (the bottom of the screen in top-down). */
  endX: 0,
  endZ: 0,
};

/**
 * Floor-mounted XY stages. Each arm rides its own stage on its own side of the
 * car: a pair of long Z rails plus a cross bridge (X axis) carrying the arm base.
 */
export const GANTRY = {
  innerRailX: 2.05,
  outerRailX: 9.6,
  zMin: -3.3,
  zMax: 3.3,
  /** Minimum clearance between arm base centre and the vehicle body. */
  baseClearance: 1.25,
};

export const ROBOT = {
  shoulderHeight: 0.62,
  upperArm: 1.72,
  foreArm: 1.62,
  tool: 0.38,
  /** Nozzle turret tools, in turret order. */
  nozzles: [
    { id: 'water', label: 'HIGH-PRESSURE H₂O', color: '#bfeef2' },
    { id: 'foam', label: 'CLEANING FOAM', color: '#f6e7d2' },
    { id: 'rinse', label: 'SPOT-FREE RINSE', color: '#8fe3ff' },
    { id: 'spot', label: 'SPOT TREATMENT', color: '#ffb27a' },
  ],
  paint: '#ece5d8',
  accent: '#d9622b',
};

/** Retractable camera pylons around the bay. `count` is configurable. */
export const CAMERA_ARRAY = {
  count: 8,
  radiusX: 3.7,
  radiusZ: 5.2,
  /** Pylons sit on two arcs (front and rear) so they clear the side gantries. */
  arcHalfAngle: 34,
  mastHeight: 2.35,
};

export const SCENE_COLORS = {
  background: '#121417',
  floor: '#1a1d21',
  gridMinor: '#23272c',
  gridMajor: '#2f343a',
  paint: '#d9622b',
  cyan: '#3fe0e8',
  red: '#e5483b',
  chrome: '#c9cdd2',
};

/** Device tiers: effects scale down on small or weak devices. */
export function detectQuality(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';
  const w = window.innerWidth;
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
  if (w < 700 || cores <= 2 || mem <= 2) return 'low';
  if (w < 1100 || cores <= 4 || mem <= 4) return 'medium';
  return 'high';
}

export const QUALITY = {
  high: { dpr: 1.75, shadows: true, splash: 90, cloud: 5200 },
  medium: { dpr: 1.4, shadows: true, splash: 60, cloud: 3200 },
  low: { dpr: 1.25, shadows: false, splash: 32, cloud: 1600 },
} as const;
