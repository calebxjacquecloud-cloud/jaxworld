/**
 * Isometric projection helpers for the SVG technical illustrations
 * (container packing, deployment vignettes). World units are metres,
 * x along the container, z across it, y up.
 */

// Constants written out so server and browser render identical SVG numbers.
export const ISO_COS = 0.8660254;
export const ISO_SIN = 0.5;

export type P3 = [number, number, number];

export function iso([x, y, z]: P3, scale = 24): [number, number] {
  const r = (v: number) => Math.round(v * 100) / 100;
  return [r((x - z) * ISO_COS * scale), r(((x + z) * ISO_SIN - y) * scale)];
}

export function poly(points: P3[], scale = 24): string {
  return points.map((p) => iso(p, scale).map((v) => v.toFixed(1)).join(',')).join(' ');
}

export interface BoxFaces {
  top: string;
  left: string;
  right: string;
}

/** Faces of an axis-aligned box whose min corner is (x, y, z) with size (w, h, d). */
export function isoBox(x: number, y: number, z: number, w: number, h: number, d: number, scale = 24): BoxFaces {
  const t: P3[] = [
    [x, y + h, z],
    [x + w, y + h, z],
    [x + w, y + h, z + d],
    [x, y + h, z + d],
  ];
  // "left" face = +z side (facing down-left), "right" face = +x side (facing down-right)
  const l: P3[] = [
    [x, y, z + d],
    [x + w, y, z + d],
    [x + w, y + h, z + d],
    [x, y + h, z + d],
  ];
  const r: P3[] = [
    [x + w, y, z],
    [x + w, y, z + d],
    [x + w, y + h, z + d],
    [x + w, y + h, z],
  ];
  return { top: poly(t, scale), left: poly(l, scale), right: poly(r, scale) };
}
