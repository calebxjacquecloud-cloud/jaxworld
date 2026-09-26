'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { clamp01 } from '@/lib/timeline';
import SectionHead from './sections/SectionHead';

const STAGES = [
  { t: 'Human-owned vehicles', d: 'Today’s drivers and their cars.', icon: 'owner' },
  { t: 'Peer-to-peer fleets', d: 'Shared cars that change hands daily.', icon: 'p2p' },
  { t: 'Commercial fleets', d: 'Delivery, rental and service vans.', icon: 'fleet' },
  { t: 'Autonomous fleets', d: 'No driver on board to notice the dirt.', icon: 'av' },
] as const;

function StageIcon({ kind }: { kind: (typeof STAGES)[number]['icon'] }) {
  return (
    <svg viewBox="0 0 64 40" aria-hidden="true" className="future__icon">
      <rect x="6" y="16" width="52" height="14" rx="6" fill="currentColor" opacity="0.9" />
      <path d="M16 16 Q22 6 32 6 Q42 6 48 16Z" fill="currentColor" opacity="0.6" />
      <circle cx="18" cy="31" r="5" fill="#131518" />
      <circle cx="46" cy="31" r="5" fill="#131518" />
      {kind === 'owner' && <circle cx="28" cy="12" r="3" fill="#131518" />}
      {kind === 'p2p' && (
        <>
          <circle cx="26" cy="12" r="3" fill="#131518" />
          <circle cx="38" cy="12" r="3" fill="#131518" />
        </>
      )}
      {kind === 'fleet' && <text x="32" y="27" textAnchor="middle" fontSize="8" fill="#131518" fontFamily="monospace">FLEET</text>}
      {kind === 'av' && <circle cx="32" cy="5" r="3.5" fill="#3fe0e8" />}
    </svg>
  );
}

export default function AutonomousFuture() {
  const sectionRef = useRef<HTMLElement>(null);
  const stages = useRef<(HTMLLIElement | null)[]>([]);
  const cars = useRef<(SVGGElement | null)[]>([]);
  const road = useRef<SVGPathElement>(null);

  useSectionScrub(sectionRef, (p) => {
    stages.current.forEach((el, i) => el?.classList.toggle('is-on', p > 0.1 + i * 0.1));
    if (road.current) road.current.style.strokeDashoffset = String(1 - clamp01((p - 0.4) / 0.2));
    const path = road.current;
    if (!path) return;
    const len = path.getTotalLength();
    cars.current.forEach((g, i) => {
      if (!g) return;
      const u = clamp01((p - 0.5 - i * 0.07) / 0.3);
      const pt = path.getPointAtLength(u * len);
      g.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      g.setAttribute('opacity', u > 0 && u < 1 ? '1' : '0');
      // clean after passing through the bay
      g.classList.toggle('is-clean', pt.x > 560);
    });
  });

  return (
    <section id="future" data-act="5" ref={sectionRef} className="section section--ink future" aria-labelledby="future-title">
      <div className="section__inner">
        <SectionHead
          id="future-title"
          eyebrow="The autonomous future"
          status="vision"
          title="Autonomous vehicles still get dirty."
          lede="And someone still has to inspect them."
        />
        <p className="future__body">
          As vehicles become increasingly shared, fleet-operated and autonomous, routine care cannot depend on a driver noticing what needs attention.
        </p>
        <p className="future__line">Vehicle care has to become autonomous too.</p>
        <ol className="future__stages">
          {STAGES.map((s, i) => (
            <li
              key={s.t}
              ref={(el) => {
                stages.current[i] = el;
              }}
            >
              <StageIcon kind={s.icon} />
              <p className="future__t">{s.t}</p>
              <p className="future__d">{s.d}</p>
            </li>
          ))}
        </ol>
        <div className="future__flow">
          <svg viewBox="0 0 900 200" role="img" aria-label="Driverless vehicles route into the same Carwash-O-Matic container wash and leave clean">
            {[80, 300, 520, 740].map((x) => (
              <path key={x} d={`M${x} 0 C ${x} 70, 450 40, 450 96`} fill="none" stroke="#33383e" strokeWidth="2" />
            ))}
            <path
              ref={road}
              d="M40 150 L380 150 L520 150 L860 150"
              fill="none"
              stroke="#5d636a"
              strokeWidth="2"
              strokeDasharray="1"
              pathLength={1}
              style={{ strokeDashoffset: 1 }}
            />
            <g>
              <rect x="380" y="100" width="160" height="78" rx="12" fill="#d9622b" />
              <text x="460" y="132" textAnchor="middle" className="future__bay">
                JAX WORLD
              </text>
              <text x="460" y="156" textAnchor="middle" className="future__bay-sub">
                Carwash-O-Matic
              </text>
            </g>
            {[0, 1, 2, 3, 4].map((i) => (
              <g
                key={i}
                className="future__car"
                ref={(el) => {
                  cars.current[i] = el;
                }}
                opacity="0"
              >
                <rect x="-20" y="-9" width="40" height="18" rx="7" />
                <circle cx="0" cy="-12" r="3" fill="#3fe0e8" />
                <text x="0" y="24" textAnchor="middle" className="future__tag">
                  no driver
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
