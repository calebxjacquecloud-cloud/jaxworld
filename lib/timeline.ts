/**
 * Normalized keyframe engine.
 *
 * The wash demo is described as a list of "poses" on a 0–1 timeline. Each pose
 * sets any subset of named channels. Channels that a pose does not mention hold
 * their previous value, so motion only happens where the choreography asks for
 * it. That is what makes the robots stop, settle and move again like machinery
 * instead of drifting continuously.
 *
 * Sampling is pure and allocation-free, so it can run every animation frame
 * without touching React.
 */

export type EaseName = 'linear' | 'inOut' | 'in' | 'out' | 'machine' | 'hold';

export type ChannelValues = Record<string, number>;

export interface Key {
  t: number;
  v: number;
  ease: EaseName;
}

export type Tracks = Record<string, Key[]>;

export const ease: Record<EaseName, (u: number) => number> = {
  linear: (u) => u,
  in: (u) => u * u * u,
  out: (u) => 1 - Math.pow(1 - u, 3),
  inOut: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  // Trapezoidal-ish velocity profile: quick ramp, cruise, controlled stop.
  // Reads as a servo move rather than an organic ease.
  machine: (u) => {
    const a = 0.22;
    const vmax = 1 / (1 - a);
    if (u < a) return (vmax * u * u) / (2 * a);
    if (u > 1 - a) {
      const r = 1 - u;
      return 1 - (vmax * r * r) / (2 * a);
    }
    return vmax * (u - a / 2);
  },
  hold: (u) => (u < 1 ? 0 : 1),
};

/**
 * Builds per-channel keyframe tracks.
 *
 *  - `move(t0, t1, set)` holds each named channel at its current value until t0,
 *    then travels to the new value by t1. Use it for camera and effect moves.
 *  - `key(t, set)` adds a key that interpolates from the channel's previous key.
 *    Robot choreography uses it with the full arm state, so every waypoint pins
 *    every axis of that arm and the machine only moves between waypoints.
 */
export class TrackBuilder {
  private cur: ChannelValues;
  private tracks: Tracks = {};

  constructor(initial: ChannelValues) {
    this.cur = { ...initial };
    for (const name of Object.keys(initial)) this.tracks[name] = [{ t: 0, v: initial[name], ease: 'linear' }];
  }

  value(name: string): number {
    return this.cur[name];
  }

  private check(set: ChannelValues) {
    for (const name of Object.keys(set)) {
      if (!(name in this.cur)) throw new Error(`Unknown timeline channel "${name}"`);
    }
  }

  move(t0: number, t1: number, set: ChannelValues, e: EaseName = 'inOut'): this {
    this.check(set);
    for (const name of Object.keys(set)) {
      const track = this.tracks[name];
      track.push({ t: t0, v: this.cur[name], ease: 'linear' });
      track.push({ t: t1, v: set[name], ease: e });
      this.cur[name] = set[name];
    }
    return this;
  }

  key(t: number, set: ChannelValues, e: EaseName = 'machine'): this {
    this.check(set);
    for (const name of Object.keys(set)) {
      this.tracks[name].push({ t, v: set[name], ease: e });
      this.cur[name] = set[name];
    }
    return this;
  }

  build(): Tracks {
    const out: Tracks = {};
    for (const name of Object.keys(this.tracks)) {
      // stable sort keeps same-time keys in authoring order (instant switches)
      out[name] = this.tracks[name]
        .map((k, i) => ({ k, i }))
        .sort((a, b) => a.k.t - b.k.t || a.i - b.i)
        .map((x) => x.k);
    }
    return out;
  }
}

export function sampleTrack(track: Key[], t: number): number {
  const n = track.length;
  if (t <= track[0].t) return track[0].v;
  if (t >= track[n - 1].t) return track[n - 1].v;
  // Tracks are short (tens of keys); linear scan from the end is fine but a
  // binary search keeps it predictable for the dense robot paths.
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = track[lo];
  const b = track[hi];
  const span = b.t - a.t;
  const u = span <= 0 ? 1 : (t - a.t) / span;
  return a.v + (b.v - a.v) * ease[b.ease](u);
}

/** Sample every channel into `out` (reused object → no per-frame allocation). */
export function sampleAll(tracks: Tracks, t: number, out: ChannelValues): ChannelValues {
  for (const name in tracks) out[name] = sampleTrack(tracks[name], t);
  return out;
}

/** 0→1 ramp across [a, b]. */
export function ramp(t: number, a: number, b: number): number {
  if (t <= a) return 0;
  if (t >= b) return 1;
  return (t - a) / (b - a);
}

/** Fade in over [a, a+f], hold, fade out over [b-f, b]. */
export function windowed(t: number, a: number, b: number, f = 0.008): number {
  if (t < a || t > b) return 0;
  const i = f > 0 ? Math.min(1, (t - a) / f) : 1;
  const o = f > 0 ? Math.min(1, (b - t) / f) : 1;
  return Math.max(0, Math.min(i, o));
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (u: number) => u * u * (3 - 2 * u);
