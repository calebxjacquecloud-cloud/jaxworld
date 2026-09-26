import { OUTRO, PRELUDE, introToScroll, mainToScroll } from './animationConfig';

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
  // arrive + product reveal
  0, 0.04, 0.074, 0.095,
  // see: scan geometry, then condition findings
  0.13, 0.16, 0.184, 0.199,
  // think: the cleaning plan
  0.21, 0.221,
  // move: arms leave their parking spots
  0.237, 0.25,
  // clean: rinse passes, then the tool head + foam
  0.27, 0.298, 0.312, 0.338, 0.36, 0.388, 0.41, 0.43, 0.455,
  // adapt + detail: side view, front wheel, rear wheel, zoom on FLAG 01, spot treatment, cleared
  0.49, 0.525, 0.576, 0.627, 0.65, 0.66, 0.68, 0.697,
  // spot-free finish
  0.726, 0.744, 0.759, 0.774, 0.79,
  // verify: arms home, recheck list resolves
  0.826, 0.852, 0.884, 0.912,
  // condition record
  0.945, 0.975, 1,
];

/** Steps inside the "meet the machine" splices (intro progress u). */
const INTRO_STOPS = [0.08, 0.16, 0.24, 0.32, 0.43, 0.52, 0.6, 0.68, 0.78, 0.9, 0.99];

/**
 * Phone steps, on the combined scroll axis (prelude → main with splices → outro;
 * see mapProgress in hooks/useWashTimeline.ts). Main-timeline key stops get a
 * midpoint between each pair, so one swipe covers half the ground.
 */
export const SWIPE_STOPS: number[] = [
  // prelude (data/preludeSequence.ts): PRELUDE.length × prelude progress
  ...[0, 0.14, 0.22, 0.31, 0.37, 0.48, 0.54, 0.65, 0.71, 0.82, 0.88].map((u) => PRELUDE.length * u),
  // main timeline
  ...KEY_STOPS.flatMap((t, i) => (i === 0 ? [t] : [(KEY_STOPS[i - 1] + t) / 2, t])).map((t) => mainToScroll(t, PRELUDE.length)),
  // meet the machine
  ...INTRO_STOPS.map((u) => introToScroll(u, PRELUDE.length)),
  // outro (data/outroSequence.ts), past the end of the main timeline
  ...[0.1, 0.2, 0.31, 0.38, 0.46, 0.54, 0.62, 0.7, 0.78, 0.86, 0.91, 0.96, 1].map((u) => mainToScroll(1, PRELUDE.length) + OUTRO.length * u),
]
  .map((v) => +v.toFixed(4))
  .sort((x, y) => x - y)
  .filter((v, i, all) => i === 0 || v - all[i - 1] > 1e-4);

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
  /** Small supporting line under the body. */
  note?: string;
  /** Show the tool head's supply-line list (lit by the hoseStep channel). */
  hoses?: boolean;
}

/**
 * Short statements shown during the scrub, grouped into the machine's concepts:
 * SEE → THINK → MOVE → CLEAN → ADAPT → DETAIL → VERIFY. (The product reveal is
 * the Hero; the See and Move close-ups add their own callouts.)
 */
export const WASH_COPY: CopyBlock[] = [
  {
    id: 'see',
    in: 0.1,
    out: 0.166,
    place: 'left',
    eyebrow: '01 · See',
    title: 'See the vehicle before touching the vehicle.',
    big: true,
    body: 'Know the vehicle first.',
    lines: ['Geometry.', 'Condition.', 'Cleaning plan.'],
  },
  {
    id: 'inspect',
    in: 0.17,
    out: 0.198,
    place: 'left',
    eyebrow: '01 · See',
    title: 'Existing marks, on file.',
    body: 'Every mark is compared with the car’s last record. New damage is flagged; anything uncertain goes on a recheck list.',
    desktopOnly: true,
  },
  {
    id: 'think',
    in: 0.2,
    out: 0.221,
    place: 'left',
    eyebrow: '02 · Think',
    title: 'Every vehicle gets its own cleaning plan.',
    body: 'The scan becomes a path.',
    lines: ['Where to move. Where to spray.', 'What to clean. What to avoid.', 'What needs more attention.'],
  },
  {
    id: 'move',
    in: 0.223,
    out: 0.25,
    place: 'left',
    eyebrow: '03 · Move',
    title: 'The car stays still. The robots adapt around it.',
    big: true,
  },
  {
    id: 'rinse',
    in: 0.252,
    out: 0.338,
    place: 'left',
    eyebrow: '04 · Clean',
    title: 'Follow the surface.',
    body: 'High-pressure water traces the vehicle’s geometry instead of spraying a generic fixed path.',
  },
  {
    id: 'clean',
    in: 0.342,
    out: 0.438,
    place: 'left',
    eyebrow: '04 · Clean',
    title: 'One robot. Multiple treatments.',
    big: true,
    hoses: true,
  },
  {
    id: 'adapt',
    in: 0.448,
    out: 0.528,
    place: 'left',
    eyebrow: '05 · Adapt',
    title: 'Not every car needs the same wash.',
    body: 'The system can slow down, reposition or target a specific area when needed.',
  },
  {
    id: 'detail',
    in: 0.535,
    out: 0.628,
    place: 'left',
    eyebrow: '06 · Detail',
    title: 'Precision where the vehicle needs it.',
    body: 'Wheels. Problem areas. Targeted treatments.',
  },
  {
    id: 'detail-auto',
    in: 0.632,
    out: 0.698,
    place: 'left',
    eyebrow: '06 · Detail',
    title: 'Automated detailing, one area at a time.',
    big: true,
    body: 'The spot flagged in the first scan gets its own treatment, then a check that it’s gone.',
  },
  {
    id: 'finish',
    in: 0.705,
    out: 0.788,
    place: 'left',
    eyebrow: '06 · Detail',
    title: 'Spot-free finish, top down.',
    body: 'Nothing dragged across the paint.',
  },
  {
    id: 'verify',
    in: 0.8,
    out: 0.866,
    place: 'left',
    eyebrow: '07 · Verify',
    title: 'Clean. Check. Confirm.',
    big: true,
    body: 'After cleaning, the cameras scan the vehicle again.',
    lines: ['What disappeared was dirt.', 'What remains may be damage.'],
  },
];
