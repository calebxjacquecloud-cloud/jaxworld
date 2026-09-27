'use client';

import { useReveal } from '../components/ScrollScene';
import { MARKET } from '../lib/content';

const SHIFTS = [
  'Computer vision is improving',
  'Robotics is improving',
  'Autonomous driving is progressing',
  'Fleet and shared-vehicle models are growing',
  'Consumers increasingly expect automated services',
];

/**
 * ACT 12 · Why now. The market comes only after the difference is clear, and
 * is kept deliberately plain.
 */
export default function Market() {
  const ref = useReveal<HTMLElement>();
  const max = MARKET.to.value;
  return (
    <section id="future" className="vx-block vx-block--cream vx-market" data-chapter={5} ref={ref} aria-labelledby="vx-market-title">
      <div className="vx-wrap">
        <div className="vx-block__head">
          <p className="vx-eyebrow">Why now</p>
          <h2 className="vx-h2" id="vx-market-title">
            A large market entering a technology shift.
          </h2>
        </div>
        <div className="vx-market__grid">
          <figure className="vx-market__chart" aria-label={`${MARKET.from.label}: $${MARKET.from.value}B in ${MARKET.from.year}, projected $${MARKET.to.value}B in ${MARKET.to.year}, ${MARKET.cagr}`}>
            {[MARKET.from, MARKET.to].map((m, i) => (
              <div key={m.year} className="vx-market__bar" style={{ '--h': m.value / max, '--i': i } as React.CSSProperties}>
                <b className="vx-market__v">${m.value.toFixed(1)}B</b>
                <i />
                <span className="mono">
                  {m.year} · {i === 0 ? 'automatic car wash market' : 'projected'}
                </span>
              </div>
            ))}
            <p className="vx-market__cagr mono">{MARKET.cagr}</p>
            <figcaption className="vx-market__src mono">
              {MARKET.source ? `Source: ${MARKET.source}` : 'Market estimate, 2026–2031 · source citation to be attached before distribution'}
            </figcaption>
          </figure>
          <ol className="vx-shifts">
            {SHIFTS.map((s, i) => (
              <li key={s} style={{ '--i': i } as React.CSSProperties}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <p className="vx-display vx-market__close">
          The car is changing. <span>The infrastructure around it will have to change too.</span>
        </p>
      </div>
    </section>
  );
}
