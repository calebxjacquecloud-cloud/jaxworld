'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { clamp01 } from '@/lib/timeline';
import SectionHead from './sections/SectionHead';
import Starburst from './Starburst';

type Status = 'good' | 'warn' | 'critical';

// Illustrative sample data only — there is no live Jax World network.
const SITES: { name: string; kind: string; robots: Status; cams: string; chem: number; water: number; flag: string; status: Status }[] = [
  { name: 'Site 01 · Fleet depot', kind: 'Depot', robots: 'good', cams: '8/8', chem: 82, water: 74, flag: '—', status: 'good' },
  { name: 'Site 02 · Airport return', kind: 'Rental', robots: 'good', cams: '8/8', chem: 46, water: 61, flag: '—', status: 'good' },
  { name: 'Site 03 · Parking garage', kind: 'Urban', robots: 'warn', cams: '7/8', chem: 68, water: 88, flag: 'Lens C4 needs wipe', status: 'warn' },
  { name: 'Site 04 · Retail pad', kind: 'Retail', robots: 'good', cams: '8/8', chem: 19, water: 55, flag: 'Foam concentrate low', status: 'warn' },
  { name: 'Site 05 · AV depot', kind: 'Depot', robots: 'critical', cams: '8/8', chem: 90, water: 93, flag: 'Arm B paused · E-stop test', status: 'critical' },
];

const STATUS_TEXT: Record<Status, string> = { good: 'Nominal', warn: 'Attention', critical: 'Paused' };
const STATUS_ICON: Record<Status, string> = { good: '●', warn: '▲', critical: '■' };

function Pill({ s, text }: { s: Status; text?: string }) {
  return (
    <span className={`pill pill--${s}`}>
      <span aria-hidden="true">{STATUS_ICON[s]}</span> {text ?? STATUS_TEXT[s]}
    </span>
  );
}

function Level({ v, label }: { v: number; label: string }) {
  return (
    <span className="level" title={`${label}: ${v}%`}>
      <span className="level__track">
        <span className="level__fill" style={{ width: `${v}%` }} />
      </span>
      <span className="level__v mono">{v}%</span>
    </span>
  );
}

const NODES = [
  [80, 70],
  [210, 40],
  [330, 90],
  [60, 190],
  [300, 210],
];

export default function OperationsPlatform() {
  const sectionRef = useRef<HTMLElement>(null);
  const links = useRef<(SVGPathElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);

  useSectionScrub(sectionRef, (p) => {
    links.current.forEach((l, i) => {
      if (l) l.style.strokeDashoffset = String(1 - clamp01((p - 0.05 - i * 0.05) / 0.2));
    });
    if (counter.current) counter.current.textContent = String(Math.round(3 * clamp01(p / 0.5)));
  });

  return (
    <section id="platform" data-act="4" ref={sectionRef} className="section section--ink-2 ops" aria-labelledby="ops-title">
      <div className="section__inner">
        <SectionHead
          id="ops-title"
          eyebrow="The network"
          status="vision"
          title="One machine becomes many."
          lede="Centralized intelligence. Distributed infrastructure. Multiple locations, multiple machines, one platform."
        />

        <div className="console" role="group" aria-label="Concept operations console with sample data">
          <div className="console__bar mono">
            <span>
              <Starburst className="console__burst" /> JAX WORLD OPS
            </span>
            <span className="console__sample">Concept interface · sample data · no live network</span>
          </div>

          <ul className="console__kpis">
            <li className="kpi">
              <p className="kpi__k">System health</p>
              <p className="kpi__v mono">
                5<span className="kpi__of">/5 online</span>
              </p>
            </li>
            <li className="kpi">
              <p className="kpi__k">Wash quality</p>
              <p className="kpi__v mono">
                97.8<span className="kpi__of">%</span>
              </p>
            </li>
            <li className="kpi">
              <p className="kpi__k">Chemistry</p>
              <p className="kpi__v mono">
                <Pill s="warn" text="1 low" />
              </p>
            </li>
            <li className="kpi">
              <p className="kpi__k">Camera status</p>
              <p className="kpi__v mono">
                39<span className="kpi__of">/40</span>
              </p>
            </li>
            <li className="kpi">
              <p className="kpi__k">Exceptions</p>
              <p className="kpi__v mono">
                <span ref={counter}>3</span>
              </p>
            </li>
          </ul>

          <div className="console__main">
            <div className="console__table-wrap">
              <table className="console__table">
                <thead>
                  <tr>
                    <th scope="col">Location</th>
                    <th scope="col">System</th>
                    <th scope="col">Cameras</th>
                    <th scope="col">Chemistry</th>
                    <th scope="col">Exception</th>
                  </tr>
                </thead>
                <tbody>
                  {SITES.map((s) => (
                    <tr key={s.name}>
                      <th scope="row">
                        <span className="console__site">{s.name}</span>
                      </th>
                      <td>
                        <Pill s={s.robots} />
                      </td>
                      <td className="mono">{s.cams}</td>
                      <td>
                        <Level v={s.chem} label="Chemistry level" />
                      </td>
                      <td className="console__flag">{s.flag}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="console__side">
              <svg viewBox="0 0 400 260" className="console__map" role="img" aria-label="Five locations linked to one central control platform">
                {NODES.map(([x, y], i) => (
                  <path
                    key={`${x}-${y}`}
                    ref={(el) => {
                      links.current[i] = el;
                    }}
                    d={`M${x} ${y} Q ${(x + 200) / 2} ${(y + 130) / 2 - 30} 200 130`}
                    pathLength={1}
                    fill="none"
                    stroke="#3fe0e8"
                    strokeOpacity="0.6"
                    strokeWidth="1.5"
                    style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                  />
                ))}
                {NODES.map(([x, y], i) => (
                  <g key={`n${i}`}>
                    <circle cx={x} cy={y} r="9" fill="#262a2f" stroke="#c9cdd2" strokeWidth="1.5" />
                    <text x={x} y={y + 24} textAnchor="middle" className="console__node">
                      {String(i + 1).padStart(2, '0')}
                    </text>
                  </g>
                ))}
                <circle cx="200" cy="130" r="26" fill="#d9622b" />
                <text x="200" y="134" textAnchor="middle" className="console__hub">
                  HQ
                </text>
              </svg>
            </div>
          </div>
        </div>
        <p className="ops__close">
          The physical machines are local. <em>The intelligence doesn&rsquo;t have to be.</em>
        </p>
      </div>
    </section>
  );
}
