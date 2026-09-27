'use client';

import { useEffect, useRef } from 'react';
import Starburst from '@/components/Starburst';
import { CHAPTERS, getFilmChapter, jumpTo, onFilmChapter } from '../lib/chapters';
import { MARKS } from '../film/sequence';

const TARGETS: ({ unit: number } | { id: string })[] = [
  { unit: MARKS.problem },
  { unit: MARKS.product },
  { unit: MARKS.condition },
  { unit: MARKS.productize },
  { id: 'network' },
  { id: 'future' },
];

/**
 * Header: the Jax World lockup, a quiet six-part story-progress indicator,
 * the investor overview (fast path) and the one primary action.
 * Hidden while the garage door owns the opening screen.
 */
export default function Header() {
  const root = useRef<HTMLElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const bars = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let last = '';
    const apply = (index: number, frac: number) => {
      const key = `${index}:${frac.toFixed(3)}`;
      if (key === last) return;
      last = key;
      root.current?.classList.toggle('is-hidden', index < 0);
      items.current.forEach((li, i) => {
        li?.classList.toggle('is-now', i === index);
        li?.classList.toggle('is-done', i < index);
      });
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleX(${i < index ? 1 : i === index ? frac : 0})`;
      });
    };
    const measure = () => {
      raf = 0;
      const film = getFilmChapter();
      if (film) return apply(film.index, film.frac);
      // below the film: sections carry data-chapter; the one crossing mid-screen is current
      const mid = window.innerHeight * 0.5;
      let index = 3;
      let frac = 1;
      const filmEl = document.getElementById('film');
      if (filmEl && filmEl.getBoundingClientRect().top > 0) return apply(-1, 0);
      const groups = new Map<number, { top: number; bottom: number }>();
      document.querySelectorAll<HTMLElement>('[data-chapter]').forEach((el) => {
        const c = Number(el.dataset.chapter);
        const r = el.getBoundingClientRect();
        const g = groups.get(c);
        groups.set(c, g ? { top: Math.min(g.top, r.top), bottom: Math.max(g.bottom, r.bottom) } : { top: r.top, bottom: r.bottom });
      });
      for (const [c, g] of groups) {
        if (g.top <= mid) {
          index = c;
          frac = Math.min(1, Math.max(0, (mid - g.top) / (g.bottom - g.top)));
        }
      }
      apply(index, frac);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const off = onFilmChapter(schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      off();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header className="vx-header is-hidden" ref={root}>
      <a className="vx-logo" href="#film" onClick={(e) => (e.preventDefault(), window.scrollTo({ top: 0, behavior: 'auto' }))} aria-label="Jax World, back to the start">
        <Starburst className="vx-logo__burst" />
        <span className="vx-logo__jax">JAX</span>
        <span className="vx-logo__world">WORLD</span>
      </a>
      <nav className="vx-progress" aria-label="Story progress">
        <ol>
          {CHAPTERS.map((c, i) => (
            <li
              key={c}
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <button type="button" onClick={() => jumpTo(TARGETS[i])} aria-label={`Go to ${c}`}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                <span className="vx-progress__name">{c}</span>
              </button>
              <span className="vx-progress__bar" aria-hidden="true">
                <i
                  ref={(el) => {
                    bars.current[i] = el;
                  }}
                />
              </span>
            </li>
          ))}
        </ol>
      </nav>
      <div className="vx-header__actions">
        <button type="button" className="vx-link-btn vx-header__overview" onClick={() => window.dispatchEvent(new Event('vx:overview'))}>
          Investor overview
        </button>
        <a className="vx-cta-btn" href="#brief" onClick={(e) => (e.preventDefault(), jumpTo({ id: 'brief' }))}>
          Request<span className="vx-cta-btn__long"> the brief</span>
        </a>
      </div>
    </header>
  );
}
