'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { iso, isoBox, poly } from '@/lib/iso';
import { clamp01 } from '@/lib/timeline';
import SectionHead from './SectionHead';

/**
 * WHERE IT GOES: one machine, different environments. The same container
 * drops into four very different sites in turn as you scroll.
 */

const S = 13;

function Car({ x, z, color = '#1c3a57', sensor = false }: { x: number; z: number; color?: string; sensor?: boolean }) {
  const b = isoBox(x, 0.2, z, 2.3, 0.5, 1.0, S);
  const c = isoBox(x + 0.5, 0.7, z + 0.1, 1.2, 0.35, 0.8, S);
  const top = iso([x + 1.1, 1.1, z + 0.5], S);
  return (
    <g>
      <polygon points={b.left} fill={color} />
      <polygon points={b.right} fill="#101d2a" />
      <polygon points={b.top} fill={color} opacity="0.85" />
      <polygon points={c.left} fill="#0b1115" />
      <polygon points={c.right} fill="#0b1115" />
      <polygon points={c.top} fill={color} />
      {sensor && <circle cx={top[0]} cy={top[1]} r="2.6" fill="#3fe0e8" />}
    </g>
  );
}

function Ground({ tone }: { tone: string }) {
  return (
    <polygon
      points={poly(
        [
          [-2, 0, -2],
          [22, 0, -2],
          [22, 0, 14],
          [-2, 0, 14],
        ],
        S,
      )}
      fill={tone}
    />
  );
}

function Container({ lift }: { lift: number }) {
  const b = isoBox(9, 0, 1, 12.2, 2.9, 2.44, S);
  const deck = poly(
    [
      [9, 0.01, 3.44],
      [21.2, 0.01, 3.44],
      [21.2, 0.01, 6.6],
      [9, 0.01, 6.6],
    ],
    S,
  );
  return (
    <g transform={`translate(0 ${-lift * 140})`} opacity={lift > 0.98 ? 0 : 1}>
      <polygon points={deck} fill="#d9622b" opacity={lift < 0.02 ? 0.9 : 0} />
      <polygon points={b.left} fill="#d9622b" />
      <polygon points={b.right} fill="#b84f1f" />
      <polygon points={b.top} fill="#f08a4b" />
    </g>
  );
}

const SITES = [
  {
    id: 'urban',
    name: 'Urban parking',
    note: 'A compact site where permanent construction may not make sense.',
    ground: '#2a2f35',
    scene: (
      <>
        {[0, 3, 6].map((z) => (
          <path
            key={z}
            d={`M${iso([0, 0, z + 7], S).join(' ')}L${iso([8, 0, z + 7], S).join(' ')}`}
            stroke="#ece5d8"
            strokeOpacity="0.4"
            strokeWidth="1.5"
          />
        ))}
        <Car x={1} z={8} color="#8a9098" />
        <Car x={4.5} z={11} color="#5d636a" />
      </>
    ),
  },
  {
    id: 'depot',
    name: 'Fleet depot',
    note: 'Vehicles cleaned and inspected while they are already parked.',
    ground: '#23272c',
    scene: (
      <>
        {[7.5, 9.5, 11.5].map((z) => (
          <Car key={z} x={0.5} z={z} color="#ece5d8" sensor />
        ))}
        {[7.5, 9.5, 11.5].map((z) => {
          const a = iso([4, 0, z + 0.5], S);
          const b = iso([4, 1.4, z + 0.5], S);
          return <line key={`c${z}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#3fe0e8" strokeWidth="2.5" />;
        })}
      </>
    ),
  },
  {
    id: 'airport',
    name: 'Airport rental return',
    note: 'Clean. Inspect. Record. Turn around.',
    ground: '#262a2f',
    scene: (
      <>
        {(() => {
          const a = iso([0, 0, 8], S);
          const t = iso([0, 5, 8], S);
          const r = iso([2.4, 0.6, 8], S);
          return <polygon points={`${a[0]},${a[1]} ${t[0]},${t[1]} ${r[0]},${r[1]}`} fill="#c9cdd2" />;
        })()}
        <Car x={3} z={9} color="#ece5d8" />
        <Car x={3} z={11.2} color="#8a9098" />
      </>
    ),
  },
  {
    id: 'retail',
    name: 'Retail car wash',
    note: 'The familiar use case, rebuilt around robotic infrastructure.',
    ground: '#2f343a',
    scene: (
      <>
        {(() => {
          const a = iso([2, 0, 9], S);
          const b = iso([2, 6, 9], S);
          return (
            <g>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#ece5d8" strokeWidth="5" strokeLinecap="round" />
              {Array.from({ length: 10 }, (_, i) => {
                const ang = (i / 10) * Math.PI * 2;
                const r = i % 2 ? 7 : 12;
                return <line key={i} x1={b[0]} y1={b[1]} x2={(b[0] + Math.cos(ang) * r).toFixed(2)} y2={(b[1] + Math.sin(ang) * r).toFixed(2)} stroke="#d9622b" strokeWidth="2" strokeLinecap="round" />;
              })}
            </g>
          );
        })()}
        <Car x={4} z={10} color="#b23a2e" />
      </>
    ),
  },
];

export default function DeploymentVisual() {
  const sectionRef = useRef<HTMLElement>(null);
  const drops = useRef<(SVGGElement | null)[]>([]);
  const pills = useRef<(HTMLSpanElement | null)[]>([]);

  useSectionScrub(
    sectionRef,
    (p) => {
      SITES.forEach((_, i) => {
        const local = clamp01((p - 0.1 - i * 0.16) / 0.16);
        // drop with a slight settle, like a crane set-down
        const lift = local < 1 ? Math.pow(1 - local, 2.2) : 0;
        drops.current[i]?.setAttribute('transform', `translate(0 ${(-lift * 150).toFixed(1)})`);
        drops.current[i]?.setAttribute('opacity', String(clamp01(local * 4)));
        const pill = pills.current[i];
        if (pill) pill.classList.toggle('is-on', local >= 1);
      });
    },
    { start: 'top 80%', end: 'bottom 70%' },
  );

  return (
    <section id="deploy" data-act="3" ref={sectionRef} className="section section--ink-2 deploy" aria-labelledby="deploy-title">
      <div className="section__inner">
        <SectionHead
          id="deploy-title"
          eyebrow="Where it goes"
          status="vision"
          title="One machine. Different environments."
        />
        <ul className="deploy__grid">
          {SITES.map((site, i) => (
            <li key={site.id} className="deploy__tile">
              <svg viewBox="-190 -70 470 320" role="img" aria-label={`Concept: container wash at an ${site.name.toLowerCase()}`}>
                <Ground tone={site.ground} />
                {site.scene}
                <g
                  ref={(el) => {
                    drops.current[i] = el;
                  }}
                >
                  <Container lift={0} />
                </g>
              </svg>
              <div className="deploy__meta">
                <p className="deploy__name">{site.name}</p>
                <p className="deploy__note">{site.note}</p>
                <span
                  className="deploy__pill mono"
                  ref={(el) => {
                    pills.current[i] = el;
                  }}
                >
                  Concept site
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className="deploy__foot mono">Illustrative environments. No Jax World sites are deployed.</p>
      </div>
    </section>
  );
}
