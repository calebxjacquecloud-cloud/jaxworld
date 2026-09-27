'use client';

import { useReveal } from '../components/ScrollScene';

type Level = { label: string; v: number };

const DOMAINS: { id: string; title: string; lead: string; levels?: Level[]; items: string[]; flag?: string }[] = [
  {
    id: 'fluids',
    title: 'Fluids',
    lead: 'Refill forecast · 5 days',
    levels: [
      { label: 'Body wash', v: 46 },
      { label: 'Wheel & tire', v: 71 },
      { label: 'Wax', v: 58 },
      { label: 'Rinse', v: 83 },
    ],
    items: ['Chemistry levels', 'Refill forecasting'],
  },
  {
    id: 'health',
    title: 'Machine health',
    lead: 'All systems running',
    items: ['Robotic arm state', 'Motors and pumps', 'Camera health', 'Sensors and compute'],
    flag: 'Pump B · pressure drift',
  },
  {
    id: 'maint',
    title: 'Maintenance',
    lead: 'Next service · arm A nozzle set',
    levels: [{ label: 'Nozzle set life', v: 22 }],
    items: ['Preventative maintenance', 'Recurring faults', 'Component lifecycle'],
  },
  {
    id: 'quality',
    title: 'Quality',
    lead: '1 clean flagged for review',
    items: ['Cleaning performance', 'Incomplete cleans', 'Inspection confidence', 'Exception review'],
  },
  {
    id: 'software',
    title: 'Software',
    lead: 'Motion planner update · staged',
    items: ['Firmware updates', 'Motion improvements', 'Software releases', 'Vehicle handling behavior'],
  },
  {
    id: 'vision',
    title: 'Vision',
    lead: 'New geometry model · rolling out',
    items: ['Vehicle recognition', 'Geometry handling', 'Anomaly detection'],
  },
];

const SITES = ['Airport garage', 'Open lot', 'Retail pad', 'Fleet depot', 'Parking structure', 'Dealer lot'];

/**
 * The operating layer, as one instrument panel rather than a SaaS dashboard.
 * Concept interface, illustrative data.
 */
export default function Console() {
  const ref = useReveal<HTMLElement>();
  return (
    <section className="vx-block vx-console-block" data-chapter={4} ref={ref} aria-labelledby="vx-console-title">
      <div className="vx-wrap">
        <div className="vx-block__head">
          <p className="vx-eyebrow">What the platform watches</p>
          <h2 className="vx-h2" id="vx-console-title">
            Every site, one operating view.
          </h2>
        </div>
        <div className="vx-console" role="group" aria-label="Concept operations interface with illustrative data">
          <div className="vx-console__bar mono">
            <span>JAX WORLD · NETWORK OPERATIONS</span>
            <span className="vx-console__note">Concept interface · illustrative data</span>
          </div>
          <div className="vx-console__body">
            <ul className="vx-console__sites mono" aria-label="Sites">
              {SITES.map((s, i) => (
                <li key={s} className={i === 0 ? 'is-sel' : ''}>
                  <i className={i === 2 ? 'is-warn' : ''} />
                  <span>
                    Site {String(i + 1).padStart(2, '0')} · {s}
                  </span>
                </li>
              ))}
            </ul>
            <div className="vx-console__grid">
              {DOMAINS.map((d, i) => (
                <div key={d.id} className="vx-domain" style={{ '--i': i } as React.CSSProperties}>
                  <p className="vx-domain__t mono">{d.title}</p>
                  <p className="vx-domain__lead">{d.lead}</p>
                  {d.levels && (
                    <ul className="vx-domain__levels">
                      {d.levels.map((l) => (
                        <li key={l.label}>
                          <span>{l.label}</span>
                          <b className="mono">{l.v}%</b>
                          <i>
                            <em style={{ width: `${l.v}%` }} className={l.v < 30 ? 'is-low' : ''} />
                          </i>
                        </li>
                      ))}
                    </ul>
                  )}
                  {d.flag && <p className="vx-domain__flag mono">▲ {d.flag}</p>}
                  <ul className="vx-domain__items">
                    {d.items.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
