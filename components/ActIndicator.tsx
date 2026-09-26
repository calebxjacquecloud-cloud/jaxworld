'use client';

import { useEffect, useRef } from 'react';
import { ACTS, getWashAct, onWashAct, type ActNumber } from '@/lib/acts';

/**
 * Minimal act indicator: five numbers, with the current act's name spelled
 * out. It makes the long scroll feel finite. Hidden while the garage door is
 * closed (act 0).
 */
export default function ActIndicator() {
  const root = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    let current: ActNumber | -1 = -1;
    let raf = 0;
    const apply = (a: ActNumber) => {
      if (a === current) return;
      current = a;
      root.current?.classList.toggle('is-on', a > 0);
      items.current.forEach((li, i) => {
        li?.classList.toggle('is-now', i === a - 1);
        li?.classList.toggle('is-done', i < a - 1);
      });
    };
    const measure = () => {
      raf = 0;
      const mid = window.innerHeight / 2;
      const wash = document.getElementById('wash');
      if (wash) {
        const r = wash.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) return apply(getWashAct());
      }
      let act: ActNumber = 0;
      document.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) act = Number(el.dataset.act) as ActNumber;
      });
      if (!act && wash && wash.getBoundingClientRect().bottom <= mid) act = 5;
      apply(act);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const off = onWashAct(schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      off();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="acts" ref={root} aria-hidden="true">
      <ol>
        {ACTS.map((a, i) => (
          <li
            key={a}
            ref={(el) => {
              items.current[i] = el;
            }}
          >
            <span className="acts__num mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="acts__label mono">{a}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
