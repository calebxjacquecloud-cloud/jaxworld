/**
 * A deployed Carwash-O-Matic, drawn isometrically for the 2D sections:
 * a paved pad, the container core, the two raised wings, ramps and a car.
 * Uses the original site's isometric helpers (lib/iso.ts).
 */

import { iso, isoBox, poly, type P3 } from '@/lib/iso';

const L = 12.2;
const W = 2.4;
const H = 2.9;

export function isoPoint(x: number, y: number, z: number, s: number) {
  return iso([x, y, z], s);
}

export default function IsoSite({ x, z, s, car = true, lit = false }: { x: number; z: number; s: number; car?: boolean; lit?: boolean }) {
  const pad = poly(
    [
      [x - 11, 0, z - 8],
      [x + 11, 0, z - 8],
      [x + 11, 0, z + 8],
      [x - 11, 0, z + 8],
    ] as P3[],
    s,
  );
  const core = isoBox(x - L / 2, 0, z - W / 2, L, H, W, s);
  const wingA = poly(
    [
      [x - L / 2, H, z + W / 2],
      [x + L / 2, H, z + W / 2],
      [x + L / 2, H + 0.9, z + W / 2 + 2.8],
      [x - L / 2, H + 0.9, z + W / 2 + 2.8],
    ] as P3[],
    s,
  );
  const wingB = poly(
    [
      [x - L / 2, H, z - W / 2],
      [x + L / 2, H, z - W / 2],
      [x + L / 2, H + 0.9, z - W / 2 - 2.8],
      [x - L / 2, H + 0.9, z - W / 2 - 2.8],
    ] as P3[],
    s,
  );
  const ramp = (sx: 1 | -1) =>
    poly(
      [
        [x + sx * (L / 2), 0.1, z - W / 2 + 0.1],
        [x + sx * (L / 2 + 2.7), 0, z - W / 2 + 0.1],
        [x + sx * (L / 2 + 2.7), 0, z + W / 2 - 0.1],
        [x + sx * (L / 2), 0.1, z + W / 2 - 0.1],
      ] as P3[],
      s,
    );
  const carBox = isoBox(x - 2.2, 0.2, z - 0.85, 4.4, 1.3, 1.7, s);
  const [bx, by] = iso([x, H + 2.6, z], s);
  return (
    <g className="vx-isosite">
      <polygon points={pad} className="vx-iso-pad" />
      <polygon points={ramp(-1)} className="vx-iso-ramp" />
      <polygon points={ramp(1)} className="vx-iso-ramp" />
      <polygon points={wingB} className="vx-iso-wing" />
      <polygon points={core.left} className="vx-iso-left" />
      <polygon points={core.right} className="vx-iso-right" />
      {car && (
        <g className="vx-iso-car">
          <polygon points={carBox.top} />
          <polygon points={carBox.left} />
          <polygon points={carBox.right} />
        </g>
      )}
      <polygon points={core.top} className="vx-iso-top" />
      <polygon points={wingA} className="vx-iso-wing vx-iso-wing--front" />
      <circle cx={bx} cy={by} r={lit ? 3.2 : 2.4} className={`vx-iso-beacon${lit ? ' is-lit' : ''}`} />
    </g>
  );
}
