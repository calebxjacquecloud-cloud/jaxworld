'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { iso, isoBox, poly, type P3 } from '@/lib/iso';
import { clamp01, smooth, windowed } from '@/lib/timeline';
import SectionHead from './sections/SectionHead';

/**
 * CAR WASH INFRASTRUCTURE THAT CAN MOVE.
 * Pinned, scrubbed isometric illustration: the wash hardware starts exploded,
 * packs into a 40 ft high-cube container, then the long wall folds down into a
 * deck and the robots roll out to form the bay.
 *
 * PRODUCTION SWAP: /public/models/container.glb could drive a 3D version.
 */

const S = 40; // px per metre
const CL = 12.2; // container length
const CH = 2.9; // height
const CD = 2.44; // depth

interface Part {
  id: string;
  label: string;
  box: [number, number, number, number, number, number]; // x y z w h d (packed)
  explode: P3;
  deploy?: P3;
  top: string;
  side: string;
  front: string;
  detail?: 'arm' | 'tanks' | 'rack' | 'camera' | 'hose' | 'rail';
}

const PARTS: Part[] = [
  { id: 'rails', label: 'XY floor stages ×2', box: [0.3, 0, 1.7, 5.4, 0.25, 0.55], explode: [-3.5, 0.2, 5.2], deploy: [0, 0, 0.9], top: '#8a9098', side: '#5d636a', front: '#6c737a', detail: 'rail' },
  { id: 'armA', label: 'Robotic arm A', box: [0.4, 0, 0.3, 1.0, 1.9, 1.0], explode: [-4.2, 3.2, -1.6], deploy: [1.8, 0, 3.1], top: '#f3ebdd', side: '#cfc4b2', front: '#e2d8c6', detail: 'arm' },
  { id: 'armB', label: 'Robotic arm B', box: [1.6, 0, 0.3, 1.0, 1.9, 1.0], explode: [-1.4, 4.6, -2.8], deploy: [7.9, 0, 3.1], top: '#f3ebdd', side: '#cfc4b2', front: '#e2d8c6', detail: 'arm' },
  { id: 'cams', label: 'Camera pylons ×8', box: [2.9, 0, 0.3, 1.2, 1.1, 0.9], explode: [0.4, 5.2, -3.4], deploy: [0, 0, 0], top: '#c9cdd2', side: '#8a9098', front: '#a9aeb4', detail: 'camera' },
  { id: 'water', label: 'Water storage', box: [4.4, 0, 0.3, 1.7, 2.1, 1.7], explode: [1.8, 4.2, -2.2], top: '#9fc3cf', side: '#5f8794', front: '#7ea6b3' },
  { id: 'pump', label: 'Pump system', box: [6.3, 0, 0.3, 1.2, 0.9, 1.0], explode: [3.6, 3.0, -1.6], top: '#f08a4b', side: '#b84f1f', front: '#d9622b' },
  { id: 'hose', label: 'Plumbing & hose routing', box: [6.2, 0, 1.55, 3.2, 0.45, 0.6], explode: [4.2, 1.2, 3.6], top: '#d9622b', side: '#9c4318', front: '#b84f1f', detail: 'hose' },
  { id: 'chem', label: 'Cleaning chemistry', box: [7.7, 0, 0.3, 1.8, 1.4, 0.9], explode: [5.2, 3.6, -1.2], top: '#f3ebdd', side: '#cfc4b2', front: '#e2d8c6', detail: 'tanks' },
  { id: 'ctrl', label: 'Controller & compute', box: [9.8, 0, 0.3, 0.8, 2.0, 0.8], explode: [6.4, 4.4, 0.6], top: '#33383e', side: '#1b1e22', front: '#262a2f', detail: 'rack' },
  { id: 'mon', label: 'Monitoring & network', box: [10.8, 0, 0.3, 0.8, 1.3, 0.8], explode: [7.6, 2.4, 2.2], top: '#33383e', side: '#1b1e22', front: '#262a2f', detail: 'rack' },
];

function translateFor(v: P3, k: number): string {
  const [x, y] = iso([v[0] * k, v[1] * k, v[2] * k], S);
  return `translate(${x.toFixed(1)} ${y.toFixed(1)})`;
}

function PartShape({ p }: { p: Part }) {
  const [x, y, z, w, h, d] = p.box;
  const f = isoBox(x, y, z, w, h, d, S);
  const c = iso([x + w / 2, y + h, z + d / 2], S);
  return (
    <g>
      <polygon points={f.left} fill={p.front} />
      <polygon points={f.right} fill={p.side} />
      <polygon points={f.top} fill={p.top} />
      {p.detail === 'arm' && (
        <g stroke="#d9622b" strokeWidth="4" strokeLinecap="round" fill="none">
          <polyline points={`${c[0] - 6},${c[1] + 10} ${c[0] - 2},${c[1] - 26} ${c[0] + 22},${c[1] - 34}`} stroke="#ece5d8" strokeWidth="7" />
          <circle cx={c[0] - 2} cy={c[1] - 26} r="4" fill="#23272c" stroke="none" />
          <circle cx={c[0] + 22} cy={c[1] - 34} r="3.5" fill="#d9622b" stroke="none" />
        </g>
      )}
      {p.detail === 'tanks' &&
        [0, 1, 2].map((i) => {
          const t = iso([x + 0.3 + i * 0.6, y + h, z + d / 2], S);
          return <ellipse key={i} cx={t[0]} cy={t[1]} rx="9" ry="5" fill="#d9622b" />;
        })}
      {p.detail === 'rack' &&
        [0, 1, 2, 3].map((i) => {
          const a = iso([x + w, y + h - 0.35 - i * 0.35, z + 0.2], S);
          return <circle key={i} cx={a[0] + 4} cy={a[1]} r="2.2" fill="#3fe0e8" />;
        })}
      {p.detail === 'camera' &&
        [0, 1, 2, 3].map((i) => {
          const a = iso([x + 0.2 + i * 0.28, y + h, z + d / 2], S);
          return <circle key={i} cx={a[0]} cy={a[1] - 3} r="4" fill="#3fe0e8" stroke="#131518" strokeWidth="1.5" />;
        })}
    </g>
  );
}

export default function ModularSystem() {
  const sectionRef = useRef<HTMLElement>(null);
  const partRefs = useRef<(SVGGElement | null)[]>([]);
  const labelRefs = useRef<(SVGGElement | null)[]>([]);
  const walls = useRef<SVGGElement>(null);
  const foldBack = useRef<SVGPolygonElement>(null);
  const foldFront = useRef<SVGPolygonElement>(null);
  const deckLines = useRef<SVGGElement>(null);
  const car = useRef<SVGGElement>(null);
  const captions = useRef<(HTMLDivElement | null)[]>([]);
  const deployLabels = useRef<SVGGElement>(null);

  useSectionScrub(
    sectionRef,
    (p) => {
      // 1 · pack (0.08–0.46)
      PARTS.forEach((part, i) => {
        const g = partRefs.current[i];
        const lab = labelRefs.current[i];
        const start = 0.08 + i * 0.025;
        const e = smooth(clamp01((p - start) / 0.2));
        let tf = translateFor(part.explode, 1 - e);
        // 3 · deploy: robots, rails and pylons move out onto the deck
        if (part.deploy) {
          const d = smooth(clamp01((p - 0.74) / 0.14));
          if (d > 0) tf = translateFor(part.deploy, d);
          if (part.id === 'cams' || part.id === 'rails') g?.setAttribute('opacity', String(1 - d));
        }
        g?.setAttribute('transform', tf);
        if (lab) {
          lab.setAttribute('transform', translateFor(part.explode, 1 - e));
          lab.setAttribute('opacity', String(1 - clamp01((p - start) / 0.12)));
        }
      });

      // 2 · close (0.46–0.6)
      const close = smooth(clamp01((p - 0.46) / 0.12));
      walls.current?.setAttribute('opacity', String(close));

      // 3 · unfold the long wall into a deck (0.62–0.76)
      const fold = smooth(clamp01((p - 0.62) / 0.14));
      const th = fold * (Math.PI / 2);
      const topY = CH * Math.cos(th);
      const topZ = CD + CH * Math.sin(th);
      const pts = poly(
        [
          [0, 0, CD],
          [CL, 0, CD],
          [CL, topY, topZ],
          [0, topY, topZ],
        ],
        S,
      );
      const upright = fold < 0.5;
      foldFront.current?.setAttribute('points', pts);
      foldBack.current?.setAttribute('points', pts);
      foldFront.current?.setAttribute('opacity', upright ? String(close) : '0');
      foldBack.current?.setAttribute('opacity', upright ? '0' : String(close));
      deckLines.current?.setAttribute('opacity', String(clamp01((fold - 0.9) / 0.1)));

      // 4 · a car rolls onto the new deck (0.86–0.98)
      const c = smooth(clamp01((p - 0.86) / 0.12));
      if (car.current) {
        car.current.setAttribute('opacity', String(clamp01(c * 3)));
        car.current.setAttribute('transform', translateFor([-7, 0, 0], 1 - c));
      }
      deployLabels.current?.setAttribute('opacity', String(clamp01((p - 0.88) / 0.06)));

      const caps = [windowed(p, -0.1, 0.4, 0.06), windowed(p, 0.4, 0.66, 0.05), windowed(p, 0.66, 1.1, 0.05)];
      captions.current.forEach((el, i) => {
        if (!el) return;
        el.style.opacity = String(caps[i]);
        el.style.transform = `translateY(${(1 - caps[i]) * 14}px)`;
      });
    },
    { start: 'top top', end: 'bottom bottom', scrub: 1.2 },
  );

  const floor = poly(
    [
      [0, 0, 0],
      [CL, 0, 0],
      [CL, 0, CD],
      [0, 0, CD],
    ],
    S,
  );
  const backWall = poly(
    [
      [0, 0, 0],
      [CL, 0, 0],
      [CL, CH, 0],
      [0, CH, 0],
    ],
    S,
  );
  const endWallBack = poly(
    [
      [0, 0, 0],
      [0, 0, CD],
      [0, CH, CD],
      [0, CH, 0],
    ],
    S,
  );
  const shell = isoBox(0, 0, 0, CL, CH, CD, S);
  const corrugation: string[] = [];
  for (let x = 0.3; x < CL; x += 0.3) {
    const a = iso([x, 0.08, CD], S);
    const b = iso([x, CH - 0.08, CD], S);
    corrugation.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  const deckRails: string[] = [];
  for (const z of [CD + 0.35, CD + 2.55]) {
    const a = iso([0.2, 0.01, z], S);
    const b = iso([CL - 0.2, 0.01, z], S);
    deckRails.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${b[0].toFixed(1)} ${b[1].toFixed(1)}`);
  }
  const carBody = isoBox(4.2, 0.25, CD + 0.5, 4.7, 0.6, 1.9, S);
  const wheels: [number, number][] = [
    [5.1, CD + 2.4],
    [7.9, CD + 2.4],
  ];

  const labelPos = (p: Part) => {
    const [x, y, z, w, h, d] = p.box;
    return iso([x + w / 2, y + h + 0.2, z + d / 2], S);
  };

  return (
    <section id="modular" ref={sectionRef} className="modular" aria-labelledby="modular-title">
      <div className="modular__pin">
        <div className="modular__copy">
          <SectionHead
            id="modular-title"
            eyebrow="Modular infrastructure"
            status="vision"
            title="Car wash infrastructure that can move."
          />
          <div className="modular__captions">
            <div
              className="modular__caption"
              ref={(el) => {
                captions.current[0] = el;
              }}
            >
              <p className="mono modular__step">01 · Everything in the bay</p>
              <p>Two arms, their XY floor stages, eight camera pylons, water storage, pumps, chemistry, plumbing, compute and monitoring.</p>
            </div>
            <div
              className="modular__caption"
              ref={(el) => {
                captions.current[1] = el;
              }}
            >
              <p className="mono modular__step">02 · Packs into one container</p>
              <p>The design target: the primary wash hardware fits inside a standard 40 ft high-cube shipping container, so it can move by truck, rail or ship.</p>
            </div>
            <div
              className="modular__caption"
              ref={(el) => {
                captions.current[2] = el;
              }}
            >
              <p className="mono modular__step">03 · Unfolds into the wash</p>
              <p>On site, the container becomes the equipment core of the bay. The robots roll out onto their stages and the wash is ready for vehicles.</p>
            </div>
          </div>
          <ul className="modular__apps" aria-label="Potential applications">
            {['Temporary installations', 'Fleet hubs', 'Parking facilities', 'Peer-to-peer rental hubs', 'Autonomous vehicle depots', 'Permanent retail sites'].map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="modular__art">
          <svg viewBox="-260 -300 1000 720" role="img" aria-label="Wash hardware packing into a shipping container, which then unfolds into a wash bay">
            <defs>
              <pattern id="modgrid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="rgba(29,27,24,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect x="-260" y="-300" width="1000" height="720" fill="url(#modgrid)" />
            {/* ground footprint */}
            <polygon points={floor} fill="#d9cbb1" />
            <g opacity="0.9">
              <polygon points={backWall} fill="#c9bca3" />
              <polygon points={endWallBack} fill="#bcae93" />
            </g>
            <polygon ref={foldBack} points="" fill="#d9622b" opacity="0" />
            <g ref={deckLines} opacity="0">
              {deckRails.map((d) => (
                <path key={d} d={d} stroke="#5d636a" strokeWidth="3" />
              ))}
            </g>

            {PARTS.map((p, i) => (
              <g
                key={p.id}
                ref={(el) => {
                  partRefs.current[i] = el;
                }}
                transform={translateFor(p.explode, 1)}
              >
                <PartShape p={p} />
              </g>
            ))}

            <g ref={car} opacity="0">
              <polygon points={carBody.left} fill="#3aa9a6" />
              <polygon points={carBody.right} fill="#23807d" />
              <polygon points={carBody.top} fill="#56c2bf" />
              {[0.36, -0.79].map((dz) => {
                const c = iso([6.55 + dz, 0.85, CD + 1.45], S);
                return <ellipse key={dz} cx={c[0]} cy={c[1] - 10} rx="30" ry="18" fill="#eafcff" fillOpacity="0.35" stroke="#e3e6ea" strokeWidth="1.5" />;
              })}
              {wheels.map(([x, z]) => {
                const w = iso([x, 0.34, z], S);
                return <ellipse key={x} cx={w[0]} cy={w[1]} rx="11" ry="13" fill="#131518" />;
              })}
            </g>

            {/* closing shell */}
            <g ref={walls} opacity="0">
              <polygon points={shell.right} fill="#c4552a" />
              <polygon points={shell.top} fill="#e07a45" />
              <path d={corrugation.join('')} stroke="rgba(0,0,0,0.12)" strokeWidth="1.2" />
              <g transform={`translate(${iso([CL * 0.5, CH + 0.02, CD * 0.5], S).join(' ')})`}>
                <text className="modular__stencil" textAnchor="middle" transform="rotate(30) skewX(-30)">
                  CARWASH-O-MATIC
                </text>
              </g>
            </g>
            <polygon ref={foldFront} points="" fill="#d9622b" opacity="0" />

            {/* exploded labels */}
            {PARTS.map((p, i) => {
              const [lx, ly] = labelPos(p);
              return (
                <g
                  key={`l-${p.id}`}
                  ref={(el) => {
                    labelRefs.current[i] = el;
                  }}
                  transform={translateFor(p.explode, 1)}
                >
                  <line x1={lx} y1={ly} x2={lx + 14} y2={ly - 22} stroke="#1d1b18" strokeWidth="1" />
                  <text x={lx + 18} y={ly - 24} className="modular__label">
                    {p.label}
                  </text>
                </g>
              );
            })}

            <g ref={deployLabels} opacity="0">
              {(
                [
                  [0.4, CD + 0.3],
                  [CL - 0.4, CD + 0.3],
                  [0.4, CD + 2.6],
                  [CL - 0.4, CD + 2.6],
                ] as [number, number][]
              ).map(([x, z]) => {
                const b = iso([x, 0, z], S);
                const t = iso([x, 1.6, z], S);
                return (
                  <g key={`${x}-${z}`}>
                    <line x1={b[0]} y1={b[1]} x2={t[0]} y2={t[1]} stroke="#8a9098" strokeWidth="3" />
                    <circle cx={t[0]} cy={t[1]} r="6" fill="#ece5d8" stroke="#3fe0e8" strokeWidth="2" />
                  </g>
                );
              })}
              {(() => {
                const a = iso([3.5, 0, CD + 3.4], S);
                const b = iso([CL, CH, 0], S);
                return (
                  <>
                    <text x={a[0] - 120} y={a[1] + 34} className="modular__label modular__label--accent">
                      Bay deck · vehicle position
                    </text>
                    <text x={b[0] - 40} y={b[1] - 24} className="modular__label">
                      Equipment core · water, chemistry, compute
                    </text>
                  </>
                );
              })()}
            </g>
            <text x="-240" y="400" className="modular__axis">
              40 ft high-cube · 12.2 × 2.44 × 2.9 m · illustrative layout, not to scale
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
