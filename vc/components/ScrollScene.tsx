'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { ramp } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';

interface Refs {
  ins: { el: HTMLElement; a: number; b: number }[];
  ons: { el: HTMLElement; a: number; b: number }[];
  draws: { el: SVGElement; a: number; b: number }[];
}

const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : Number(v));

function collect(root: HTMLElement): Refs {
  return {
    ins: Array.from(root.querySelectorAll<HTMLElement>('.vx-in')).map((el) => ({ el, a: num(el.dataset.in, -99), b: num(el.dataset.out, 999) })),
    ons: Array.from(root.querySelectorAll<HTMLElement>('.vx-on')).map((el) => {
      const [a, b] = (el.dataset.on || '0,0').split(',').map(Number);
      return { el, a, b };
    }),
    // SVG strokes drawn on between a and b (give the path pathLength={1})
    draws: Array.from(root.querySelectorAll<SVGElement>('[data-draw]')).map((el) => {
      const [a, b] = (el.dataset.draw || '0,1').split(',').map(Number);
      return { el, a, b };
    }),
  };
}

/**
 * A pinned, scroll-driven scene for the sections below the film. It shares
 * the film's vocabulary: children marked with <In at out> and <On a b> are
 * driven on a local timeline of `units` (about 0.7 screens of scroll each),
 * and `onFrame(t)` can drive custom SVG. Scrolling is damped slightly so it
 * feels weighted; big jumps (nav, overview links) cut straight to the target.
 */
export default function ScrollScene({
  id,
  units,
  chapter,
  tone = 'ink',
  className = '',
  label,
  onFrame,
  children,
}: {
  id?: string;
  units: number;
  chapter: number;
  tone?: 'ink' | 'ink-2' | 'cream';
  className?: string;
  label?: string;
  onFrame?: (t: number, root: HTMLElement) => void;
  children: ReactNode;
}) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    const el = section.current!;
    const root = pin.current!;
    const refs = collect(root);
    const reduced = prefersReducedMotion();
    let raf = 0;
    let value = -1;
    let last = -1;
    let lastNow = performance.now();
    let visible = false;

    const target = () => {
      const r = el.getBoundingClientRect();
      const span = r.height - root.offsetHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
    };
    const write = (t: number) => {
      for (const c of refs.ins) {
        const v = ramp(t, c.a, c.a + 0.14) * (1 - ramp(t, c.b - 0.08, c.b));
        setFade(c.el, v, `translate3d(0, ${((1 - v) * 14).toFixed(1)}px, 0)`);
      }
      for (const c of refs.ons) {
        c.el.classList.toggle('is-on', t >= c.a && t < c.b);
        c.el.classList.toggle('is-done', t >= c.b);
      }
      for (const c of refs.draws) c.el.style.strokeDashoffset = (1 - ramp(t, c.a, c.b)).toFixed(4);
      cb.current?.(t, root);
    };
    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      const goal = target();
      if (value < 0 || reduced || Math.abs(goal - value) * units > 1.5) value = goal;
      else value += (goal - value) * (1 - Math.exp(-dt * 8));
      if (Math.abs(goal - value) < 1e-5) value = goal;
      const t = value * units;
      if (Math.abs(t - last) > 1e-5) {
        write(t);
        last = t;
      }
      if (value !== goal) raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      lastNow = performance.now();
      if (!raf && visible) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        kick();
      },
      { rootMargin: '20% 0px' },
    );
    io.observe(el);
    write(0);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [units]);

  return (
    <section
      id={id}
      ref={section}
      className={`vx-scene vx-scene--${tone} ${className}`}
      data-chapter={chapter}
      style={{ '--vx-scene-units': units } as React.CSSProperties}
      aria-label={label}
    >
      <div className="vx-scene__pin" ref={pin}>
        {children}
      </div>
    </section>
  );
}

/** Adds `is-in` once a block scrolls into view (non-pinned sections). */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.classList.add('is-in');
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
