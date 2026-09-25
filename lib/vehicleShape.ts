/**
 * Shape definition for the placeholder bubble-top custom (a Googie-era show
 * car: long low body, swept tail fins, twin acrylic canopies, open cockpit).
 *
 * The body is lofted from cross-sections whose parameters vary along the car
 * (vehicle Z, nose toward +Z). The same functions drive the 3D mesh AND the
 * robot choreography, so nozzle aim points sit on the real surface. Change the
 * car here and the cleaning paths follow it — which is the point of the demo:
 * the path comes from the geometry, whatever that geometry is.
 */

type Keys = [number, number][];

/** Monotone cubic (Fritsch–Carlson) interpolation through [z, value] keys. */
function monotone(keys: Keys): (z: number) => number {
  const n = keys.length;
  const xs = keys.map((k) => k[0]);
  const ys = keys.map((k) => k[1]);
  const d: number[] = [];
  const m: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (z: number) => {
    if (z <= xs[0]) return ys[0];
    if (z >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (z > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (z - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1]
    );
  };
}

export const BODY = {
  rearZ: -2.82,
  frontZ: 2.76,
  frontAxleZ: 1.62,
  rearAxleZ: -1.53,
  axleY: 0.36,
  trackHalf: 0.79,
  archRadius: 0.47,
  /** Rear wheels sit behind fender skirts; only the lower part shows. */
  rearSkirtY: 0.5,
  rimWidth: 0.17,
};

/** Half width of the body. */
export const halfWidth = monotone([
  [-2.82, 0.9],
  [-2.6, 0.97],
  [-2.0, 1.0],
  [1.4, 1.0],
  [2.2, 0.96],
  [2.55, 0.9],
  [2.76, 0.78],
]);
/** Underbody (centre) height. */
export const bottom = monotone([
  [-2.82, 0.42],
  [-2.5, 0.31],
  [-1.8, 0.26],
  [1.9, 0.26],
  [2.5, 0.32],
  [2.76, 0.42],
]);
/** Deck / shoulder height. */
export const deck = monotone([
  [-2.82, 0.77],
  [-2.0, 0.8],
  [0.9, 0.8],
  [1.4, 0.79],
  [2.2, 0.74],
  [2.55, 0.68],
  [2.76, 0.6],
]);
/** Tail-fin height above the deck, at the outer edge. */
export const fin = monotone([
  [-2.82, 0.24],
  [-2.4, 0.18],
  [-1.6, 0.08],
  [-0.9, 0.0],
  [2.8, 0.0],
]);
/** Depth of the open cockpit tub below the deck. */
export const tub = monotone([
  [-1.46, 0],
  [-1.26, 0.4],
  [0.8, 0.4],
  [0.98, 0],
]);
/** Crown of the hood / rear deck at the centreline. */
export const crown = monotone([
  [-2.82, 0.0],
  [-1.6, 0.03],
  [1.2, 0.05],
  [2.76, 0.02],
]);
/** Concave side cove (the sculpted scallop along the flank). */
export const cove = monotone([
  [-2.6, 0],
  [-2.0, 0.045],
  [2.0, 0.045],
  [2.5, 0],
]);

/** Height of the lower outer body edge: raised into wheel arches / skirts. */
export function outerBottom(z: number): number {
  const b = bottom(z);
  const r = BODY.archRadius;
  const df = z - BODY.frontAxleZ;
  const dr = z - BODY.rearAxleZ;
  let h = b;
  if (Math.abs(df) < r) h = Math.max(h, BODY.axleY + Math.sqrt(r * r - df * df));
  if (Math.abs(dr) < r) h = Math.max(h, Math.min(BODY.rearSkirtY, BODY.axleY + Math.sqrt(r * r - dr * dr)));
  // the fender always keeps a lip above the arch
  return Math.min(h, deck(z) - 0.24);
}

/** Twin bubble canopies (ellipsoid halves sitting on the deck). */
export const CANOPIES = [
  { z: 0.36, rx: 0.74, ry: 0.6, rz: 0.62 },
  { z: -0.79, rx: 0.7, ry: 0.53, rz: 0.55 },
];

/**
 * Cross-section at station z, right half (x ≥ 0), from bottom centre to top
 * centre. The mesh mirrors it for the left half. Point count is constant so
 * sections can be stitched into one smooth surface.
 */
export function sectionRight(z: number): [number, number][] {
  const w = halfWidth(z);
  const b = bottom(z);
  const bo = outerBottom(z);
  const t = deck(z);
  const f = Math.max(0, fin(z));
  const d = Math.max(0, tub(z));
  const c = crown(z);
  const cv = Math.max(0, cove(z));
  const rim = BODY.rimWidth;
  const mid = Math.min(t - 0.14, Math.max((b + t) / 2, bo + 0.08));
  return [
    [0, b],
    [0.55 * w, b + 0.01],
    [0.84 * w, bo],
    [0.96 * w, bo + 0.06],
    [w - cv, mid],
    [w, t - 0.11],
    [w, t + f],
    [w - 0.045, t + f],
    [w - 0.1, t + Math.min(f, 0.02)],
    [w - rim, t + c * 0.5],
    [w - rim - 0.03, t - d],
    [0, t - d + c],
  ];
}

/** Approximate top surface height at (x, z): canopy if inside one, else deck. */
export function topY(x: number, z: number): number {
  for (const c of CANOPIES) {
    const u = (x / c.rx) ** 2 + ((z - c.z) / c.rz) ** 2;
    if (u < 1) return deck(z) + c.ry * Math.sqrt(1 - u);
  }
  const w = halfWidth(z);
  const u = Math.min(1, Math.abs(x) / w);
  return deck(z) + crown(z) * (1 - u * u) + (u > 0.9 ? Math.max(0, fin(z)) : 0);
}

/** Outer side surface x at height y (ignores the cove, fine for aiming). */
export function sideX(z: number): number {
  return halfWidth(z);
}
