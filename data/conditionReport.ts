/**
 * Condition inspection story for the demo car.
 *
 * The car is a returning customer (visit 7). The pre-wash scan compares what
 * it sees with the post-wash record from the previous visit, flags anything
 * new or uncertain, and builds a recheck list. The post-wash inspection works
 * through that list: dirt that looked like damage gets cleared, real damage is
 * confirmed and the owner notified. Over many visits this becomes a wear and
 * tear record for the vehicle.
 *
 * Illustrative data. Anchors are in vehicle space (nose +Z, driver side +X).
 */

import { VEHICLE } from '@/lib/animationConfig';
import { deck, topY } from '@/lib/vehicleShape';

export type FindingKind = 'new' | 'alert' | 'known' | 'check' | 'ok';

export interface Finding {
  id: string;
  label: string;
  where: string;
  anchor: [number, number, number];
  pre: { kind: FindingKind; note: string };
  /** Goes on the post-wash recheck list. */
  recheck: boolean;
  post: { kind: FindingKind; note: string };
  /** Timeline moment the finding is identified (pre-wash) and resolved (post-wash). */
  tFound: number;
  tResolved: number;
}

export const VISIT = { number: 7, previous: 6, previousDate: 'Aug 12', vehicle: 'VIN ···4Q72' };

/** Surface marks drawn on the placeholder car (vehicle space). */
export const MARKS = {
  /** New scratch along the driver-side rear quarter. */
  scratch: { a: [1.0, 0.66, -2.02] as const, b: [0.995, 0.61, -1.62] as const, width: 0.011 },
  /** Known stone chip on the hood. */
  chip: { x: 0.34, z: 1.95, radius: 0.028 },
  /** Road debris on the rear deck that reads like a scratch until it is washed. */
  debris: { x: -0.36, z: -2.28, radius: 0.1 },
  /** The passenger-side outer headlamp is out. */
  lampOut: { x: -0.74, z: 2.64 },
};

const S = VEHICLE.smudge;

export const FINDINGS: Finding[] = [
  {
    id: 'scratch',
    label: 'Scratch · 40 cm',
    where: 'Driver rear quarter',
    anchor: [1.0, 0.64, -1.82],
    pre: { kind: 'new', note: `Not on visit ${VISIT.previous} record` },
    recheck: true,
    post: { kind: 'alert', note: 'Confirmed new damage · owner notified' },
    tFound: 0.171,
    tResolved: 0.876,
  },
  {
    id: 'lamp',
    label: 'Headlamp not lit',
    where: 'Front passenger, outer',
    anchor: [MARKS.lampOut.x, 0.55, MARKS.lampOut.z + 0.08],
    pre: { kind: 'alert', note: 'Owner alert queued · recheck lens' },
    recheck: true,
    post: { kind: 'alert', note: 'Still out · owner notified' },
    tFound: 0.174,
    tResolved: 0.883,
  },
  {
    id: 'chip',
    label: 'Stone chip',
    where: 'Hood, driver side',
    anchor: [MARKS.chip.x, topY(MARKS.chip.x, MARKS.chip.z), MARKS.chip.z],
    pre: { kind: 'known', note: 'Logged visit 4 · unchanged' },
    recheck: false,
    post: { kind: 'known', note: 'Unchanged since visit 4' },
    tFound: 0.177,
    tResolved: 0.89,
  },
  {
    id: 'deck',
    label: 'Possible scratch',
    where: 'Rear deck',
    anchor: [MARKS.debris.x, deck(MARKS.debris.z) + 0.02, MARKS.debris.z],
    pre: { kind: 'check', note: 'Could be debris · recheck clean' },
    recheck: true,
    post: { kind: 'ok', note: 'Road debris, not damage · cleared' },
    tFound: 0.18,
    tResolved: 0.896,
  },
  {
    id: 'grime',
    label: 'Road grime · FLAG 01',
    where: 'Driver door',
    anchor: [S.x, S.y, S.z],
    pre: { kind: 'check', note: 'Targeted clean planned' },
    recheck: true,
    post: { kind: 'ok', note: 'Cleared by targeted pass' },
    tFound: 0.183,
    tResolved: 0.902,
  },
];

export const RECHECK_COUNT = FINDINGS.filter((f) => f.recheck).length;

export const KIND_LABEL: Record<FindingKind, string> = {
  new: 'New',
  alert: 'Alert',
  known: 'Known',
  check: 'Recheck',
  ok: 'Clear',
};

/** Body damage on record after each visit, for the wear-over-time strip (illustrative). */
export const HISTORY = [
  { visit: 1, date: 'Jan 08', marks: 0 },
  { visit: 2, date: 'Feb 19', marks: 0 },
  { visit: 3, date: 'Apr 02', marks: 0 },
  { visit: 4, date: 'May 14', marks: 1 },
  { visit: 5, date: 'Jun 30', marks: 1 },
  { visit: 6, date: 'Aug 12', marks: 1 },
  { visit: 7, date: 'Today', marks: 2 },
];
