'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { WASH_COPY } from '@/lib/washStages';
import { OUTRO_COPY } from '@/data/outroSequence';
import { OUTRO } from '@/lib/animationConfig';

const BLOCKS = [...WASH_COPY.map((c) => ({ c, outro: false })), ...OUTRO_COPY.map((c) => ({ c, outro: true }))];
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

/** Short scroll-timed statements. Opacity and drift are written per frame, never via React state. */
export default function WashCopy({ bus }: { bus: FrameBus }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(
    () =>
      bus.add(({ t, o: outro }) => {
        BLOCKS.forEach(({ c, outro: isOutro }, i) => {
          const el = refs.current[i];
          if (!el) return;
          // outro copy is timed on its own 0–1 track, which spans OUTRO.length of the main timeline
          const x = isOutro ? outro : t;
          const k = isOutro ? OUTRO.length : 1;
          const o = isOutro && outro <= 0 ? 0 : windowed(x, c.in, c.out, 0.009 / k);
          const drift = ((c.in + c.out) / 2 - x) * 260 * k;
          setFade(el, o, `translate3d(0, ${drift.toFixed(1)}px, 0)`);
        });
      }),
    [bus],
  );

  return (
    <div className="wash-copy">
      {BLOCKS.map(({ c }, i) => (
        <div
          key={c.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`wash-copy__block wash-copy__block--${c.place}${c.big ? ' wash-copy__block--big' : ''}${c.desktopOnly ? ' wash-copy__block--desktop' : ''}`}
        >
          {c.eyebrow && <p className="eyebrow">{c.eyebrow}</p>}
          {c.title && <h2 className="wash-copy__title">{c.title}</h2>}
          {c.body && <p className="wash-copy__body">{c.body}</p>}
          {c.lines && (
            <ul className="wash-copy__lines">
              {c.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
