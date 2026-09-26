/**
 * The five acts of the site, shown by the act indicator in the header.
 * The wash section reports its act through `reportWashAct`; sections below the
 * demo carry a `data-act` attribute.
 */

export const ACTS = ['Problem', 'Machine', 'System', 'Network', 'Future'] as const;

/** 0 = no act (garage door still closed), 1–5 = ACTS[n - 1]. */
export type ActNumber = 0 | 1 | 2 | 3 | 4 | 5;

let washAct: ActNumber = 0;
const listeners = new Set<() => void>();

export function reportWashAct(a: ActNumber) {
  if (a === washAct) return;
  washAct = a;
  listeners.forEach((fn) => fn());
}

export function getWashAct(): ActNumber {
  return washAct;
}

export function onWashAct(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
