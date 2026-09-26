import { OUTRO } from './animationConfig';

/**
 * The twelve chapters of the wash demo on the normalized 0–1 scroll timeline.
 * `hold` is the representative moment shown to reduced-motion visitors, who
 * step through the chapters as discrete states instead of a continuous scrub.
 */

export interface WashStage {
  id: string;
  index: number;
  label: string;
  short: string;
  start: number;
  end: number;
  hold: number;
  /** Readout for the telemetry strip. */
  mode: string;
}

const raw: Omit<WashStage, 'index'>[] = [
  { id: 'arrival', label: 'Vehicle arrival', short: 'Arrive', start: 0.0, end: 0.09, hold: 0.0, mode: 'GUIDED ENTRY' },
  { id: 'scan', label: 'Geometry + condition scan', short: 'Scan', start: 0.09, end: 0.2, hold: 0.199, mode: 'CONDITION CHECK' },
  { id: 'arms', label: 'Robotic arms deploy', short: 'Deploy', start: 0.2, end: 0.25, hold: 0.248, mode: 'PATH PLANNING' },
  { id: 'prerinse', label: 'High-pressure pre-rinse', short: 'Pre-rinse', start: 0.25, end: 0.34, hold: 0.29, mode: 'H₂O · 70 BAR' },
  { id: 'foam', label: 'Foam application', short: 'Foam', start: 0.34, end: 0.44, hold: 0.425, mode: 'FOAM · DWELL' },
  { id: 'side', label: 'Driver-side view', short: 'Profile', start: 0.44, end: 0.53, hold: 0.525, mode: 'REPOSITION' },
  { id: 'wheels', label: 'Wheel cleaning', short: 'Wheels', start: 0.53, end: 0.63, hold: 0.565, mode: 'WHEEL TRACE' },
  { id: 'target', label: 'Targeted contaminant', short: 'Target', start: 0.63, end: 0.7, hold: 0.668, mode: 'SPOT TREATMENT' },
  { id: 'front', label: 'Front view · final rinse', short: 'Rinse', start: 0.7, end: 0.79, hold: 0.76, mode: 'SPOT-FREE RINSE' },
  { id: 'retract', label: 'Arms return home', short: 'Home', start: 0.79, end: 0.85, hold: 0.845, mode: 'HOMING' },
  { id: 'qc', label: 'Post-wash recheck', short: 'Inspect', start: 0.85, end: 0.92, hold: 0.912, mode: 'RECHECK LIST' },
  { id: 'reveal', label: 'Cycle complete', short: 'Done', start: 0.92, end: 1.0, hold: 1.0, mode: 'COMPLETE' },
];

export const WASH_STAGES: WashStage[] = raw.map((s, index) => ({ ...s, index }));

export function stageAt(t: number): WashStage {
  for (const s of WASH_STAGES) if (t < s.end) return s;
  return WASH_STAGES[WASH_STAGES.length - 1];
}

/**
 * Touch playback steps (hooks/useStepProgress.ts): one stop per distinct
 * movement in the choreography, so each swipe shows one thing happening and
 * then pauses.
 */
const KEY_STOPS: number[] = [
  // arrive
  0, 0.044, 0.074, 0.095,
  // scan & inspect: geometry, then condition findings
  0.16, 0.184, 0.199,
  // wash: arms in, hood + trunk, canopies, rear deck + fins, sides, foam half, foam full, arms out
  0.236, 0.27, 0.298, 0.312, 0.338, 0.388, 0.43, 0.455,
  // detail: side view, front wheel, rear wheel, zoom on FLAG 01, foam cleared, spot treatment, cleared
  0.525, 0.576, 0.627, 0.65, 0.66, 0.68, 0.697,
  // rinse: front view, four passes, arms home
  0.726, 0.744, 0.759, 0.774, 0.79, 0.826, 0.852,
  // verify & record: recheck list resolves, reveal, statement
  0.884, 0.912, 0.945, 0.975, 1,
];

/** Phone steps: every key stop plus a midpoint between each pair, so one swipe covers half the ground. */
export const SWIPE_STOPS: number[] = [
  ...KEY_STOPS.flatMap((t, i) => (i === 0 ? [t] : [+((KEY_STOPS[i - 1] + t) / 2).toFixed(4), t])),
  // outro (data/outroSequence.ts), past the end of the main timeline: 1 + OUTRO.length × outro progress
  ...[0.1, 0.2, 0.31, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.91, 0.96, 1].map((u) => +(1 + OUTRO.length * u).toFixed(4)),
];

/** Reduced-motion mapping: snap continuous progress to the current chapter's hold frame. */
export function discreteProgress(t: number): number {
  return stageAt(t).hold;
}

export type CopyPlacement = 'left' | 'right' | 'bottom';

export interface CopyBlock {
  id: string;
  in: number;
  out: number;
  place: CopyPlacement;
  eyebrow?: string;
  title?: string;
  /** Display-size headline treatment. */
  big?: boolean;
  /** Hidden on phones, where a panel carries the same message. */
  desktopOnly?: boolean;
  body?: string;
  lines?: string[];
}

/** Short statements shown during the scrub. Longer explanation lives below the demo. */
export const WASH_COPY: CopyBlock[] = [
  {
    id: 'volume',
    in: 0.03,
    out: 0.056,
    place: 'left',
    eyebrow: 'The problem',
    title: 'Car washes were built to move volume.',
    body: 'Brushes, cloth strips and a fixed conveyor treat every car the same way, and repeated contact is a known source of swirl marks and wear.',
  },
  {
    id: 'preserve',
    in: 0.058,
    out: 0.088,
    place: 'left',
    eyebrow: 'The Jax World approach',
    title: 'The Carwash‑O‑Matic is designed to preserve the vehicle while cleaning it.',
    lines: ['Autonomous.', 'Touchless.', 'Precision-cleaned.'],
  },
  {
    id: 'see',
    in: 0.1,
    out: 0.166,
    place: 'left',
    eyebrow: '02 · Computer vision',
    title: 'See the vehicle before touching the vehicle.',
    big: true,
    body: 'Computer vision builds a vehicle-specific cleaning profile before the wash begins. Tail fins, bubble canopies, whitewalls: whatever drives in gets mapped.',
    lines: ['Scan first.', 'Understand the geometry.'],
  },
  {
    id: 'inspect',
    in: 0.17,
    out: 0.214,
    place: 'left',
    eyebrow: '02 · Condition check',
    title: 'Inspect before we clean.',
    body: 'This car has been through Jax World six times. Every mark is compared with its last post-wash record: new damage is flagged, known marks are tracked, and anything uncertain goes on a recheck list.',
    desktopOnly: true,
  },
  {
    id: 'move',
    in: 0.2,
    out: 0.25,
    place: 'left',
    eyebrow: '03 · Two exterior arms',
    title: 'Built to move around the car — not force the car through a fixed machine.',
    big: true,
    body: 'Vehicle-specific paths allow each arm to adapt its movement to the shape in front of it.',
  },
  {
    id: 'rinse',
    in: 0.252,
    out: 0.338,
    place: 'left',
    eyebrow: '04 · Pre-rinse',
    title: 'Plan the path. Clean with precision.',
    body: 'High-pressure water follows the scanned surface: hood and rear deck, a gentler pass over the acrylic canopies, the fins, then the sides.',
  },
  {
    id: 'multi',
    in: 0.342,
    out: 0.438,
    place: 'left',
    eyebrow: '05 · Interchangeable nozzles',
    title: 'One robot. Multiple cleaning functions.',
    big: true,
    body: 'Pressurized water and cleaning chemistry can be delivered through interchangeable nozzle systems.',
  },
  {
    id: 'different',
    in: 0.448,
    out: 0.528,
    place: 'left',
    eyebrow: '06 · Reposition',
    title: 'Every vehicle is different.',
    body: 'No fixed brush tunnel could clean this car without risking the fins and canopies. The arm paths here were generated from its shape.',
    lines: ['Every cleaning path can be too.'],
  },
  {
    id: 'wheels',
    in: 0.535,
    out: 0.628,
    place: 'left',
    eyebrow: '07 · Wheels',
    title: 'Geometry-aware wheel targeting.',
    body: 'Rims, spokes and arches get a traced high-pressure path instead of a spinning brush.',
  },
  {
    id: 'notsame',
    in: 0.632,
    out: 0.698,
    place: 'left',
    eyebrow: '08 · Targeted clean',
    title: 'Not every car needs the same wash.',
    big: true,
    body: 'Computer vision identifies areas that need additional attention and adjusts the cleaning path accordingly.',
  },
  {
    id: 'final',
    in: 0.705,
    out: 0.788,
    place: 'left',
    eyebrow: '09 · Final rinse',
    title: 'Top down. Nothing dragged across the paint.',
    body: 'Spot-free water sheets the suds and loosened grime off the body, working from the roof line to the rocker panels.',
  },
  {
    id: 'home',
    in: 0.795,
    out: 0.848,
    place: 'left',
    eyebrow: '10 · Homing',
    title: 'Machinery home. Envelope clear.',
  },
  {
    id: 'verify',
    in: 0.855,
    out: 0.918,
    place: 'left',
    eyebrow: '11 · Recheck and record',
    title: 'Clean. Verify. Document.',
    desktopOnly: true,
    body: 'The cameras work through the recheck list. Dirt that looked like damage is cleared; real damage is confirmed and the owner is notified. Every visit adds to the car’s wear record.',
  },
];

export const COMPLETION_CHECKS = [
  'Cleaning cycle complete',
  'Recheck list resolved · 4/4',
  'Owner notified · new scratch, headlamp out',
  'Condition record updated · visit 7',
  'Touchless, autonomous sequence',
];
