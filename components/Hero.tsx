'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { clamp01 } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import Starburst from './Starburst';

/** Opening statement, layered over the first frame of the wash scene. It clears as the car drives in. */
export default function Hero({ bus }: { bus: FrameBus }) {
  const ref = useRef<HTMLDivElement>(null);
  const heroOpacity = useRef(-1);

  useEffect(
    () =>
      bus.add(({ t }) => {
        const el = ref.current;
        if (!el) return;
        const o = 1 - clamp01(t / 0.026);
        const prev = heroOpacity.current;
        setFade(el, o, `translate3d(0, ${(-t * 1600).toFixed(1)}px, 0)`);
        // lets the progress rail stay out of the way until the hero clears
        const rounded = Math.round(o * 100) / 100;
        if (rounded !== prev) {
          heroOpacity.current = rounded;
          el.parentElement?.style.setProperty('--hero', String(rounded));
        }
      }),
    [bus],
  );

  return (
    <div className="hero" ref={ref}>
      <p className="eyebrow hero__eyebrow">Autonomous vehicle care</p>
      <h1 className="hero__title">
        Car washes need an <em>upgrade.</em>
      </h1>
      <p className="hero__tag">
        <Starburst className="hero__burst" />
        <span>Autonomous.</span> <span>Touchless.</span> <span>Precision-cleaned.</span>
      </p>
    </div>
  );
}
