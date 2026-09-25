'use client';

import { useEffect, useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import SectionHead from './SectionHead';

/**
 * PRECISION MOTION, SCALED TO A VEHICLE.
 * Two scrubbed diagrams side by side: a 3D printer head tracing a part, and a
 * Jax arm tracing the scanned outline of a car from its XY floor stage.
 */

// A small car profile for the printer to "print" (bed coordinates).
const PRINT_PATH =
  'M110 250 L118 222 Q124 206 146 202 L196 196 Q214 170 246 160 L300 156 Q326 158 344 178 L360 196 Q378 200 382 222 L384 250 Z M150 250 A20 20 0 1 1 190 250 M300 250 A20 20 0 1 1 340 250';

// Offset outline around the top-down car: arm A traces the right half, arm B the left.
const HALF_PATHS = [
  'M240 42 Q300 42 306 90 L310 270 Q310 318 240 318',
  'M240 42 Q180 42 174 90 L170 270 Q170 318 240 318',
];
const BASE_X = [402, 78];

const L1 = 78;
const L2 = 74;

export default function MotionAnalogy() {
  const sectionRef = useRef<HTMLElement>(null);
  const printPath = useRef<SVGPathElement>(null);
  const printHead = useRef<SVGGElement>(null);
  const gantry = useRef<SVGGElement>(null);
  const armRefs = useRef(
    [0, 1].map(() => ({
      path: null as SVGPathElement | null,
      bridge: null as SVGGElement | null,
      upper: null as SVGLineElement | null,
      fore: null as SVGLineElement | null,
      elbow: null as SVGCircleElement | null,
      nozzle: null as SVGGElement | null,
      len: 1,
    })),
  );
  const printLen = useRef(1);

  useEffect(() => {
    if (printPath.current) printLen.current = printPath.current.getTotalLength();
    armRefs.current.forEach((a) => {
      if (a.path) a.len = a.path.getTotalLength();
    });
  }, []);

  useSectionScrub(
    sectionRef,
    (p) => {
      const u = Math.min(1, Math.max(0, (p - 0.08) / 0.84));
      const pp = printPath.current;
      if (!pp) return;
      const print = printLen.current;

      // Printer: head follows the part outline, gantry beam follows head Y.
      const a = pp.getPointAtLength(u * print);
      pp.style.strokeDashoffset = String(print * (1 - u));
      printHead.current?.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)})`);
      gantry.current?.setAttribute('transform', `translate(0 ${a.y.toFixed(1)})`);

      // Two arms: each nozzle follows its half of the outline while the XY base tracks along its rails.
      armRefs.current.forEach((arm, i) => {
        if (!arm.path) return;
        const side = i === 0 ? 1 : -1;
        const b = arm.path.getPointAtLength(u * arm.len);
        arm.path.style.strokeDashoffset = String(arm.len * (1 - u));
        const baseX = BASE_X[i];
        const baseY = Math.min(296, Math.max(64, b.y));
        arm.bridge?.setAttribute('transform', `translate(${baseX} ${baseY.toFixed(1)})`);
        const dx = b.x - baseX;
        const dy = b.y - baseY;
        const d = Math.max(8, Math.min(L1 + L2 - 0.5, Math.hypot(dx, dy)));
        const heading = Math.atan2(dy, dx);
        const bend = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
        const ang = heading + side * bend;
        const ex = baseX + Math.cos(ang) * L1;
        const ey = baseY + Math.sin(ang) * L1;
        const set = (el: Element | null, attrs: Record<string, number>) => {
          if (el) for (const k in attrs) el.setAttribute(k, attrs[k].toFixed(1));
        };
        set(arm.upper, { x1: baseX, y1: baseY, x2: ex, y2: ey });
        set(arm.fore, { x1: ex, y1: ey, x2: b.x, y2: b.y });
        set(arm.elbow, { cx: ex, cy: ey });
        arm.nozzle?.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)})`);
      });
    },
    { start: 'top 70%', end: 'bottom 40%' },
  );

  return (
    <section id="motion" ref={sectionRef} className="section section--ink motion" aria-labelledby="motion-title">
      <div className="section__inner">
        <SectionHead
          id="motion-title"
          eyebrow="The motion system"
          status="vision"
          title="Precision motion, scaled to a vehicle."
          lede="Like a 3D printer coordinates multiple axes to follow a digital geometry, the Carwash-O-Matic combines a movable robotic base with a multi-axis arm to navigate the geometry of each vehicle."
        />

        <div className="motion__grid">
          <figure className="motion__panel">
            <svg viewBox="0 0 480 360" role="img" aria-label="3D printer head tracing a part outline">
              <defs>
                <pattern id="bedgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M20 0H0V20" fill="none" stroke="#2a2f35" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="40" y="30" width="400" height="300" rx="18" fill="#171a1e" stroke="#33383e" />
              <rect x="80" y="70" width="320" height="230" rx="6" fill="url(#bedgrid)" stroke="#2f343a" />
              <line x1="60" y1="46" x2="60" y2="314" stroke="#5d636a" strokeWidth="6" strokeLinecap="round" />
              <line x1="420" y1="46" x2="420" y2="314" stroke="#5d636a" strokeWidth="6" strokeLinecap="round" />
              <path
                ref={printPath}
                d={PRINT_PATH}
                fill="none"
                stroke="#d9622b"
                strokeWidth="3"
                strokeLinejoin="round"
                style={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
              />
              <g ref={gantry}>
                <rect x="52" y="-6" width="376" height="12" rx="6" fill="#8a9098" />
                <rect x="46" y="-11" width="22" height="22" rx="5" fill="#d9622b" />
                <rect x="412" y="-11" width="22" height="22" rx="5" fill="#d9622b" />
              </g>
              <g ref={printHead}>
                <rect x="-16" y="-16" width="32" height="32" rx="8" fill="#ece5d8" />
                <circle r="5" fill="#3fe0e8" />
              </g>
              <text x="60" y="352" className="motion__axis">X · Y gantry + Z · programmed toolpath</text>
            </svg>
            <figcaption>
              <p className="motion__cap-title">3D printer</p>
              <ul>
                <li>Moving carriage on a gantry</li>
                <li>Controlled axes, coordinated in time</li>
                <li>Precise, programmed path from a digital model</li>
              </ul>
            </figcaption>
          </figure>

          <figure className="motion__panel">
            <svg viewBox="0 0 480 360" role="img" aria-label="Carwash-O-Matic arm tracing a car outline from its XY floor stage">
              <rect x="40" y="30" width="400" height="300" rx="18" fill="#171a1e" stroke="#33383e" />
              {/* XY stage rails, both sides */}
              {[64, 92, 388, 416].map((x) => (
                <line key={x} x1={x} y1="46" x2={x} y2="314" stroke="#3a4046" strokeWidth="4" strokeLinecap="round" />
              ))}
              {/* car, top down */}
              {/* bubble-top custom, top down: nose at top, fins at the tail */}
              <path d="M200 64 Q240 50 280 64 L290 250 L296 306 L278 294 L202 294 L184 306 L190 250 Z" fill="#3aa9a6" />
              <rect x="204" y="128" width="72" height="140" rx="14" fill="#1f5f5d" />
              <rect x="210" y="140" width="60" height="30" rx="8" fill="#efe9df" />
              <rect x="210" y="210" width="60" height="30" rx="8" fill="#efe9df" />
              <ellipse cx="240" cy="160" rx="36" ry="30" fill="#eafcff" fillOpacity="0.25" stroke="#e3e6ea" strokeWidth="1.5" />
              <ellipse cx="240" cy="226" rx="34" ry="28" fill="#eafcff" fillOpacity="0.25" stroke="#e3e6ea" strokeWidth="1.5" />
              {HALF_PATHS.map((d, i) => (
                <path
                  key={d}
                  ref={(el) => {
                    armRefs.current[i].path = el;
                  }}
                  d={d}
                  fill="none"
                  stroke={i === 0 ? '#3fe0e8' : '#f08a4b'}
                  strokeWidth="2.5"
                  style={{ strokeDasharray: 1000, strokeDashoffset: 1000 }}
                />
              ))}
              {HALF_PATHS.map((d, i) => (
                <g key={`arm-${d}`}>
                  <g
                    ref={(el) => {
                      armRefs.current[i].bridge = el;
                    }}
                    transform={`translate(${BASE_X[i]} 64)`}
                  >
                    <rect x="-24" y="-7" width="48" height="14" rx="7" fill="#5d636a" />
                    <rect x="-17" y="-17" width="34" height="34" rx="10" fill="#ece5d8" stroke="#d9622b" strokeWidth="3" />
                  </g>
                  <line
                    ref={(el) => {
                      armRefs.current[i].upper = el;
                    }}
                    stroke="#ece5d8"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <line
                    ref={(el) => {
                      armRefs.current[i].fore = el;
                    }}
                    stroke="#d8d0c2"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  <circle
                    ref={(el) => {
                      armRefs.current[i].elbow = el;
                    }}
                    r="8"
                    fill="#23272c"
                    stroke="#8a9098"
                    strokeWidth="2"
                  />
                  <g
                    ref={(el) => {
                      armRefs.current[i].nozzle = el;
                    }}
                  >
                    <circle r="7" fill="#d9622b" />
                    <circle r="14" fill="none" stroke={i === 0 ? '#3fe0e8' : '#f08a4b'} strokeOpacity="0.55" />
                  </g>
                </g>
              ))}
              <text x="60" y="352" className="motion__axis">XY floor stage + multi-axis arm · vision-derived path</text>
            </svg>
            <figcaption>
              <p className="motion__cap-title">Carwash-O-Matic exterior robot</p>
              <ul>
                <li>XY mobile platform on floor rails</li>
                <li>Multi-axis robotic arm on top</li>
                <li>Path derived from computer vision, per vehicle</li>
              </ul>
            </figcaption>
          </figure>
        </div>
        <p className="motion__note">
          An explanatory analogy. The mechanics are not identical: a printer deposits material on a flat bed, while the Carwash-O-Matic holds a nozzle at a set standoff from a
          three-dimensional painted surface.
        </p>
      </div>
    </section>
  );
}
