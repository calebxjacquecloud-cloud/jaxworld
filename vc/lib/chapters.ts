/**
 * The six chapters of the VC narrative, shown by the story-progress indicator.
 * The film reports its own chapter and progress; sections below it carry a
 * `data-chapter` attribute and are measured by the indicator.
 */

export const CHAPTERS = ['Problem', 'Machine', 'Intelligence', 'Deployment', 'Network', 'Future'] as const;

export interface ChapterState {
  /** -1 = none yet (the opening garage), 0–5 = CHAPTERS index. */
  index: number;
  /** 0–1 through the current chapter. */
  frac: number;
}

let film: ChapterState | null = null;
const listeners = new Set<() => void>();

/** Called by the film while it is on screen; null when it is not. */
export function reportFilmChapter(s: ChapterState | null) {
  if (s && film && s.index === film.index && Math.abs(s.frac - film.frac) < 0.004) return;
  film = s ? { ...s } : null;
  listeners.forEach((fn) => fn());
}

export function getFilmChapter() {
  return film;
}

export function onFilmChapter(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Jump instantly to a film moment (in film units) or to an element id. */
export function jumpTo(target: { unit: number } | { id: string }) {
  if ('id' in target) {
    const el = document.getElementById(target.id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
    return;
  }
  const film = document.getElementById('film');
  if (!film) return;
  const units = Number(film.dataset.units || 1);
  const top = film.getBoundingClientRect().top + window.scrollY;
  const span = film.offsetHeight - window.innerHeight;
  window.scrollTo({ top: top + span * (target.unit / units) + 2, behavior: 'auto' });
}
