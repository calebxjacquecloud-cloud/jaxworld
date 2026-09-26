'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { WASH_COPY } from '@/lib/washStages';
import { OUTRO_COPY } from '@/data/outroSequence';
import { PRELUDE_COPY, type PreludeBlock } from '@/data/preludeSequence';
import { OUTRO, PRELUDE } from '@/lib/animationConfig';
import { SUPPLY_LINES } from '@/data/introSequence';
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

type Track = 'prelude' | 'main' | 'outro';
const BLOCKS: { c: PreludeBlock; track: Track }[] = [
  ...PRELUDE_COPY.map((c) => ({ c, track: 'prelude' as const })),
  ...WASH_COPY.map((c) => ({ c, track: 'main' as const })),
  ...OUTRO_COPY.map((c) => ({ c, track: 'outro' as const })),
];
/** Each track's 0–1 length, as a share of the main timeline (keeps fades and drift the same speed on screen). */
const SPAN: Record<Track, number> = { prelude: PRELUDE.length, main: 1, outro: OUTRO.length };

/** Short scroll-timed statements. Opacity and drift are written per frame, never via React state. */
export default function WashCopy({ bus }: { bus: FrameBus }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const hoses = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(
    () =>
      bus.add(({ t, o: outro, pre, state }) => {
        // CLEAN: supply lines light up one by one with the tool-head close-up
        const lit = Math.ceil(state.hoseStep ?? 0);
        hoses.current.forEach((li, j) => {
          li?.classList.toggle('is-on', j < lit);
          li?.classList.toggle('is-now', j === lit - 1);
        });
        BLOCKS.forEach(({ c, track }, i) => {
          const el = refs.current[i];
          if (!el) return;
          // prelude and outro copy are timed on their own 0–1 tracks
          const x = track === 'prelude' ? pre : track === 'outro' ? outro : t;
          const k = SPAN[track];
          const live = track === 'prelude' ? pre < 1 : track === 'outro' ? outro > 0 : pre >= 1;
          const o = live ? windowed(x, c.in, c.out, 0.009 / k) : 0;
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
          {c.note && <p className="wash-copy__note">{c.note}</p>}
          {c.hoses && (
            <ol className="intro__hoses">
              {SUPPLY_LINES.map((l, j) => (
                <li
                  key={l.id}
                  style={{ '--tone': l.color } as React.CSSProperties}
                  ref={(el) => {
                    hoses.current[j] = el;
                  }}
                >
                  <span className="intro__swatch mono">{j + 1}</span>
                  <span>{l.label}</span>
                </li>
              ))}
            </ol>
          )}
          {c.stats && (
            <dl className="wash-copy__stats">
              {c.stats.map((st) => (
                <div key={st.year}>
                  <dt className="mono">{st.year}</dt>
                  <dd>{st.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {c.source && <p className="wash-copy__source mono">{c.source}</p>}
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
