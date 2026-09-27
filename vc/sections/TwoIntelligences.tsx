'use client';

import { useReveal } from '../components/ScrollScene';

const COLS = [
  {
    kind: 'Machine intelligence',
    q: 'What is happening to the system?',
    items: ['Fluids', 'Maintenance', 'Robotics', 'System health', 'Quality'],
    tone: 'machine',
  },
  {
    kind: 'Vehicle intelligence',
    q: 'What is happening to the asset?',
    items: ['Condition', 'Scratches and damage', 'Cleaning results', 'Changes over time'],
    tone: 'vehicle',
  },
  {
    kind: 'Interior intelligence',
    q: 'What is happening inside the vehicle?',
    items: ['Cabin condition', 'Lost items', 'Stains and debris', 'Upholstery wear'],
    tone: 'next',
  },
];

/**
 * ACT 11 · Two kinds of intelligence from the same network, and a hint of the
 * third, which sets up the roadmap.
 */
export default function TwoIntelligences() {
  const ref = useReveal<HTMLElement>();
  return (
    <section className="vx-block vx-intel" data-chapter={4} ref={ref} aria-labelledby="vx-intel-title">
      <div className="vx-wrap">
        <div className="vx-block__head">
          <p className="vx-eyebrow">Two kinds of intelligence</p>
          <h2 className="vx-h2" id="vx-intel-title">
            The network learns about the machines and about the vehicles.
          </h2>
        </div>
        <div className="vx-intel__cols">
          {COLS.map((c, i) => (
            <div key={c.kind} className={`vx-intel__col vx-intel__col--${c.tone}`} style={{ '--i': i } as React.CSSProperties}>
              {c.tone === 'next' && <p className="vx-intel__tag mono">Next</p>}
              <p className="vx-intel__kind mono">{c.kind}</p>
              <p className="vx-intel__q">{c.q}</p>
              <ul>
                {c.items.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
