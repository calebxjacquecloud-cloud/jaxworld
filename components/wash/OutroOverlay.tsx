'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { PACK_LIST, PACK_PLAN, unitProgress } from '@/data/outroSequence';
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

const unitIndex = new Map(PACK_PLAN.map((s, i) => [s.id, i]));
const groups = PACK_LIST.map((g) => g.units.map((u) => unitIndex.get(u) ?? 0));

/**
 * Packing checklist for the outro. Each row slides in as the first piece of
 * its group lifts off for the container, and gets a green check once the
 * last piece has landed in its slot.
 */
export default function OutroOverlay({ bus }: { bus: FrameBus }) {
  const panel = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastDone = -1;
    return bus.add(({ o, state: s }) => {
      const show = o > 0 ? windowed(o, 0.365, 0.93, 0.02) : 0;
      setFade(panel.current, show, `translate3d(0, ${((1 - show) * 12).toFixed(1)}px, 0)`);
      if (show <= 0) return;
      let done = 0;
      groups.forEach((units, i) => {
        const li = rows.current[i];
        const started = units.some((u) => unitProgress(s.pack, u) > 0);
        const landed = units.every((u) => unitProgress(s.pack, u) >= 1);
        if (landed) done++;
        li?.classList.toggle('is-in', started);
        li?.classList.toggle('is-done', landed);
      });
      if (done !== lastDone && count.current) {
        lastDone = done;
        count.current.textContent = `${done}/${PACK_LIST.length}`;
      }
    });
  }, [bus]);

  return (
    <div className="packlist" ref={panel}>
      <p className="eyebrow">
        14 · Pack up <span className="packlist__count mono" ref={count}>0/{PACK_LIST.length}</span>
      </p>
      <h2 className="packlist__title">One 40 ft high-cube container.</h2>
      <ol className="packlist__rows">
        {PACK_LIST.map((g, i) => (
          <li
            key={g.id}
            ref={(el) => {
              rows.current[i] = el;
            }}
          >
            <span className="packlist__tick" aria-hidden="true">
              ✓
            </span>
            <span className="packlist__label">{g.label}</span>
            {g.sub && <span className="packlist__sub mono">{g.sub}</span>}
          </li>
        ))}
      </ol>
      <p className="packlist__note">Design target: the complete system in one standard shipping container.</p>
    </div>
  );
}
