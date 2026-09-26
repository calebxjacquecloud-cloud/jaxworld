/**
 * Prelude: the garage and the road trip before the wash (every device).
 *
 * Plays on its own 0–1 timeline before the main wash timeline:
 *
 *   1 · the Jax World garage door, with Jacque and the teaser printed on it
 *   2 · the door swings up, the car pulls out and the view rises to top-down;
 *       from here the car holds its place on screen and the streets turn
 *       beneath it (the camera rides with the car and turns with it)
 *   3 · four street turns, one statement per turn
 *   4 · the last turn lands on the arrival lane and the camera settles into
 *       the wash timeline's opening shot, so the main sequence carries on
 *       without a cut
 *
 * Main-timeline channels listed in SHARED are overridden while the prelude
 * plays; prelude-only channels read 0 once it is over.
 */

import { TrackBuilder, sampleTrack, type ChannelValues } from '@/lib/timeline';
import { CORNER_D, GARAGE, ROUTE_LENGTH } from '@/lib/roadPath';
import { WASH_TRACKS } from './washSequence';
import type { CopyBlock } from '@/lib/washStages';

const SHARED = ['vAz', 'vEl', 'vDist', 'vTx', 'vTy', 'vTz', 'vFollow', 'vFov', 'vFrameX', 'vFrameY', 'vMobileY', 'vPortraitK', 'headlights'];

/** The main timeline's opening camera, which the prelude hands over to. */
const opening: ChannelValues = {};
for (const k of SHARED) opening[k] = sampleTrack(WASH_TRACKS[k], 0);

const DOOR_Y = 1.4;

const shared: ChannelValues = {
  // garage shot: straight on to the door, from the street side (−z)
  vAz: 180,
  vEl: 4,
  vDist: 10.4,
  vTx: GARAGE.x,
  vTy: DOOR_Y,
  vTz: GARAGE.doorZ,
  vFollow: 0,
  vFov: 30,
  vFrameX: 0,
  vFrameY: 0,
  vMobileY: 0,
  vPortraitK: 0.47,
  headlights: 1,
};

const only: ChannelValues = {
  /** 1 while the prelude drives the car (route pose instead of the arrival path). */
  pOn: 1,
  /** Distance along the road route, metres. */
  pDist: 0,
  /** Garage door: 0 closed, 1 open. */
  door: 0,
  /** 0 = camera azimuth from vAz, 1 = camera rides behind the car so its nose points up the screen. */
  pFollowAz: 0,
  /** Offset added to the ride-along azimuth (degrees). */
  pAzOff: 0,
};

export const PRELUDE_ONLY_CHANNELS = Object.keys(only);

const tb = new TrackBuilder({ ...shared, ...only });
const M = (t0: number, t1: number, set: ChannelValues, e: Parameters<typeof tb.move>[3] = 'inOut') => tb.move(t0, t1, set, e);

/* 1 · garage door (hold, then it swings up) */
M(0.08, 0.17, { door: 1 });
M(0.08, 0.15, { vDist: 9.2 });

/* 2 · pull out, rise to top-down and ride along */
M(0.18, 0.29, { vEl: 89.4, vDist: 25, vFollow: 1, vTy: 0, vFrameX: 0.14, vFrameY: 0, vMobileY: 0.14, vPortraitK: 0.2, vFov: 32 });
M(0.19, 0.28, { pFollowAz: 1 });

/* 3 · the drive: one corner per statement, at a steady pace between corners */
const at = (u: number, d: number, e: 'linear' | 'inOut' | 'in' | 'out' = 'linear') => tb.key(u, { pDist: d }, e);
at(0.13, 0);
at(0.28, CORNER_D[0], 'inOut');
at(0.44, CORNER_D[1]);
at(0.61, CORNER_D[2]);
at(0.78, CORNER_D[3]);
at(0.92, CORNER_D[4]);
at(1, ROUTE_LENGTH, 'out');

/* 4 · settle into the wash timeline's opening shot (azimuth unwrapped +360 to meet it the short way round) */
M(0.88, 1, { ...opening, vAz: opening.vAz + 360, pFollowAz: 0 });

export const PRELUDE_TRACKS = tb.build();

/* ───────────── statements (one per turn) ───────────── */

export interface PreludeBlock extends CopyBlock {
  stats?: { year: string; value: string }[];
  note?: string;
}

export const PRELUDE_COPY: PreludeBlock[] = [
  {
    id: 'market',
    in: 0.285,
    out: 0.43,
    place: 'left',
    eyebrow: 'The market',
    title: 'The automatic car wash industry is expected to grow at a 5% CAGR over the next 5 years.',
    stats: [
      { year: '2026', value: '$9.6B' },
      { year: '2031', value: '$12.3B' },
    ],
  },
  {
    id: 'stalled',
    in: 0.455,
    out: 0.6,
    place: 'left',
    eyebrow: 'The moment',
    title: 'Commercial innovation in car washes stalled for nearly 20 years.',
    body: 'A resurgence is happening now, in 2026.',
  },
  {
    id: 'damage',
    in: 0.625,
    out: 0.77,
    place: 'left',
    eyebrow: 'The problem',
    title: 'Car washes damage vehicles.',
    body: 'Classic contact and friction-based washes leave micro-scratches that grow into chips, which can lead to rust and long-term body damage.',
  },
  {
    id: 'both',
    in: 0.795,
    out: 0.91,
    place: 'left',
    eyebrow: 'The answer',
    title: 'Automated touchless is better. Detailing is best.',
    lines: ['It’s time to have both.'],
  },
];
