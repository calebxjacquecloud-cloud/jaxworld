/**
 * Arrival path: a straight run heading +X, then a right-hand quarter turn that
 * leaves the car centred in the bay with its nose toward +Z.
 * Returns position, heading, front-wheel steer and wheel roll for progress u.
 */

import { ARRIVAL, VEHICLE } from './animationConfig';

export interface VehiclePose {
  x: number;
  z: number;
  /** Heading in radians (0 = nose toward +Z). */
  yaw: number;
  /** Front-wheel steer in radians (negative = steering right). */
  steer: number;
  /** Wheel roll angle in radians. */
  roll: number;
}

const R = ARRIVAL.turnRadius;
const straight = ARRIVAL.endX - R - ARRIVAL.startX;
const arc = (Math.PI / 2) * R;
const total = straight + arc;
const steerMax = Math.atan(VEHICLE.wheelBase / R);

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function arrivalPose(u: number, out: VehiclePose): VehiclePose {
  const s = Math.min(1, Math.max(0, u)) * total;
  if (s <= straight) {
    out.x = ARRIVAL.startX + s;
    out.z = ARRIVAL.laneZ;
    out.yaw = Math.PI / 2;
  } else {
    const phi = (s - straight) / R;
    const cx = ARRIVAL.endX - R;
    const cz = ARRIVAL.laneZ + R;
    out.x = cx + R * Math.sin(phi);
    out.z = cz - R * Math.cos(phi);
    out.yaw = Math.PI / 2 - phi;
  }
  out.steer = -steerMax * smoothstep(straight - 1.6, straight + 0.2, s) * (1 - smoothstep(total - 1.4, total, s));
  out.roll = s / VEHICLE.wheelRadius;
  return out;
}
