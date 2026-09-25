/**
 * Per-frame DOM writes for the overlays. Values are cached per element and
 * only written when they actually change, and hidden elements skip transform
 * updates, so an idle or mostly-hidden overlay costs next to nothing.
 */

interface Last {
  o: number;
  tf: string;
}

const cache = new WeakMap<HTMLElement, Last>();

export function setFade(el: HTMLElement | null, opacity: number, transform?: string) {
  if (!el) return;
  let last = cache.get(el);
  if (!last) {
    last = { o: -1, tf: '' };
    cache.set(el, last);
  }
  const o = Math.round(Math.max(0, Math.min(1, opacity)) * 1000) / 1000;
  if (o !== last.o) {
    el.style.opacity = String(o);
    if ((o > 0) !== (last.o > 0) || last.o < 0) el.style.visibility = o > 0 ? 'visible' : 'hidden';
    last.o = o;
  }
  if (o > 0 && transform !== undefined && transform !== last.tf) {
    el.style.transform = transform;
    last.tf = transform;
  }
}
