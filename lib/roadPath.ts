/**
 * The prelude road trip: garage → four street turns → the arrival lane.
 *
 * A right-angle street route with rounded corners, sampled as a dense
 * polyline so the car can be placed at any distance along it. The route ends
 * exactly where the wash timeline's arrival starts (arrivalPose at drive 0.3),
 * so the hand-off into the main sequence is seamless.
 */

import { ARRIVAL, VEHICLE } from './animationConfig';
import { arrivalPose, type VehiclePose } from './vehiclePath';

/** Where the main timeline picks the car up (its `drive` channel starts at 0.3). */
const handoff = arrivalPose(0.3, { x: 0, z: 0, yaw: 0, steer: 0, roll: 0 });

/** Corner radius of every street turn (metres). */
export const TURN_R = 4;

/** Garage: the car starts inside, nose toward −z, and drives out through the door at DOOR_Z. */
export const GARAGE = { x: -66, doorZ: -30, carZ: -26.6 };

/** Route corners, in order (after the garage exit). */
export const CORNERS: [number, number][] = [
  [GARAGE.x, -44],
  [-48, -44],
  [-48, -26],
  [-30, -26],
  [-30, ARRIVAL.laneZ],
];

const WAYPOINTS: [number, number][] = [[GARAGE.x, GARAGE.carZ], ...CORNERS, [handoff.x, handoff.z]];

interface Sample {
  d: number;
  x: number;
  z: number;
  yaw: number;
  /** Signed curvature: + for left turns, − for right turns, 0 on straights. */
  k: number;
}

const STEP = 0.1;
const samples: Sample[] = [];
/** Distance along the route to the middle of each corner. */
export const CORNER_D: number[] = [];

(function build() {
  let d = 0;
  let yaw = 0;
  const push = (x: number, z: number, heading: number, k: number) => {
    const last = samples[samples.length - 1];
    if (last) d += Math.hypot(x - last.x, z - last.z);
    // unwrap so the heading never jumps by 2π
    if (last) {
      while (heading - last.yaw > Math.PI) heading -= Math.PI * 2;
      while (heading - last.yaw < -Math.PI) heading += Math.PI * 2;
    }
    yaw = heading;
    samples.push({ d, x, z, yaw, k });
  };
  const line = (ax: number, az: number, bx: number, bz: number) => {
    const len = Math.hypot(bx - ax, bz - az);
    const h = Math.atan2(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / STEP));
    for (let i = samples.length ? 1 : 0; i <= n; i++) push(ax + ((bx - ax) * i) / n, az + ((bz - az) * i) / n, h, 0);
  };

  let [px, pz] = WAYPOINTS[0];
  for (let i = 1; i < WAYPOINTS.length - 1; i++) {
    const [cx, cz] = WAYPOINTS[i];
    const [nx, nz] = WAYPOINTS[i + 1];
    const la = Math.hypot(cx - px, cz - pz);
    const lb = Math.hypot(nx - cx, nz - cz);
    const ax = (cx - px) / la;
    const az = (cz - pz) / la;
    const bx = (nx - cx) / lb;
    const bz = (nz - cz) / lb;
    const tinX = cx - ax * TURN_R;
    const tinZ = cz - az * TURN_R;
    line(px, pz, tinX, tinZ);
    // quarter arc around the corner's centre
    const ox = tinX + bx * TURN_R;
    const oz = tinZ + bz * TURN_R;
    const a0 = Math.atan2(tinX - ox, tinZ - oz);
    const cross = ax * bz - az * bx; // > 0: turning toward +z from +x … sign gives turn direction
    const dir = cross > 0 ? -1 : 1;
    const steps = Math.round(((Math.PI / 2) * TURN_R) / STEP);
    const h0 = Math.atan2(ax, az);
    const start = samples[samples.length - 1].d;
    for (let s = 1; s <= steps; s++) {
      const f = s / steps;
      const ang = a0 + dir * f * (Math.PI / 2);
      push(ox + Math.sin(ang) * TURN_R, oz + Math.cos(ang) * TURN_R, h0 + dir * f * (Math.PI / 2), dir / TURN_R);
    }
    CORNER_D.push(start + (Math.PI / 4) * TURN_R);
    px = cx + bx * TURN_R;
    pz = cz + bz * TURN_R;
  }
  const [ex, ez] = WAYPOINTS[WAYPOINTS.length - 1];
  line(px, pz, ex, ez);
})();

export const ROUTE_LENGTH = samples[samples.length - 1].d;

/** Route centreline as a polyline (for building the road meshes). */
export function routePoints(): { x: number; z: number; yaw: number }[] {
  return samples.filter((_, i) => i % 5 === 0 || i === samples.length - 1);
}

const steerMax = Math.atan(VEHICLE.wheelBase / TURN_R);

/** Car pose at distance `d` along the route (same shape as arrivalPose). */
export function routePose(d: number, out: VehiclePose): VehiclePose {
  const dd = Math.min(ROUTE_LENGTH, Math.max(0, d));
  let lo = 0;
  let hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].d <= dd) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const f = b.d > a.d ? (dd - a.d) / (b.d - a.d) : 0;
  out.x = a.x + (b.x - a.x) * f;
  out.z = a.z + (b.z - a.z) * f;
  out.yaw = a.yaw + (b.yaw - a.yaw) * f;
  // ease the steer in and out around each corner (look ahead / behind a little)
  const k = curvatureNear(dd);
  out.steer = Math.sign(k) * steerMax * Math.min(1, Math.abs(k) * TURN_R);
  out.roll = dd / VEHICLE.wheelRadius;
  return out;
}

function curvatureNear(d: number): number {
  let best = 0;
  for (const c of CORNER_D) {
    const half = (Math.PI / 4) * TURN_R + 1.2;
    const x = Math.abs(d - c);
    if (x < half) {
      const w = x < half - 1.2 ? 1 : 1 - (x - (half - 1.2)) / 1.2;
      const s = samples[Math.min(samples.length - 1, Math.round(c / STEP))];
      best = (s?.k ?? 0) * w;
    }
  }
  return best;
}

/** Camera azimuth (degrees) that keeps the car's nose pointing up the screen in a top-down view. */
export function routeCamAz(yaw: number): number {
  return (yaw * 180) / Math.PI + 180;
}
