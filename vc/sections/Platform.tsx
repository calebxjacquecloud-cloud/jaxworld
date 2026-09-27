'use client';

import ScrollScene from '../components/ScrollScene';
import { Burst, COM, G, In } from '../film/primitives';

const SITES = [
  { label: 'Airport garage', a: -150 },
  { label: 'Open lot', a: -90 },
  { label: 'Retail pad', a: -30 },
  { label: 'Fleet depot', a: 30 },
  { label: 'Parking structure', a: 90 },
  { label: 'Dealer lot', a: 150 },
];
const RX = 190;
const RY = 136;
const pos = (a: number) => [Math.cos((a * Math.PI) / 180) * RX, Math.sin((a * Math.PI) / 180) * RY] as const;
const spoke = (a: number, inward: boolean) => {
  const [x, y] = pos(a);
  const k = 44 / Math.hypot(x, y);
  const hx = x * k;
  const hy = y * k;
  const sx = x * 0.84;
  const sy = y * 0.84;
  return inward ? `M${sx.toFixed(1)},${sy.toFixed(1)} L${hx.toFixed(1)},${hy.toFixed(1)}` : `M${hx.toFixed(1)},${hy.toFixed(1)} L${sx.toFixed(1)},${sy.toFixed(1)}`;
};

/**
 * ACT 10 · Every location connects to Jax World. Operating data flows in,
 * improvements flow back out: the relationship continues after installation.
 */
export default function Platform() {
  return (
    <ScrollScene id="network" units={5} chapter={4} label="The Jax World platform" className="vx-split">
      <div className="vx-split__copy">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={1.4}>
            <p className="vx-eyebrow">The Jax World platform</p>
            <h2 className="vx-h2">Centralized intelligence. Distributed infrastructure.</h2>
            <In as="p" at={0.4} className="vx-body">
              Every {COM} location connects to Jax World.
            </In>
          </div>
          <div className="vx-in vx-stack-gap" data-in={1.45} data-out={2.9}>
            <p className="vx-eyebrow">The Jax World platform</p>
            <p className="vx-h2 vx-lines">
              <In as="span" at={1.5}>Every location runs locally.</In>
              <In as="span" at={1.8} className="vx-accent">The intelligence improves centrally.</In>
            </p>
            <In as="p" at={2.05} className="vx-body">
              Machines wash and inspect on site. Small streams of operating data travel to Jax World.
            </In>
          </div>
          <div className="vx-in vx-stack-gap" data-in={2.95}>
            <p className="vx-eyebrow">The Jax World platform</p>
            <p className="vx-display vx-big">
              <In as="span" at={3.0}>Learn once.</In>
              <br />
              <In as="span" at={3.2} className="vx-accent">Improve everywhere.</In>
            </p>
            <In as="p" at={3.7} className="vx-body">
              An improvement found at one site (a better motion path, a sharper vision model, a maintenance pattern) ships to every site. Jax World&rsquo;s role doesn&rsquo;t end when a unit is installed.
            </In>
          </div>
        </div>
      </div>

      <div className="vx-split__art" aria-hidden="true">
        <svg viewBox="-260 -200 520 400" className="vx-net">
          <ellipse rx={RX} ry={RY} className="vx-net__orbit" />
          {SITES.map((s, i) => (
            <path key={s.label} d={spoke(s.a, true)} pathLength={1} className="vx-link" data-draw={`${0.5 + i * 0.08},${0.9 + i * 0.08}`} />
          ))}
          <G at={1.55} out={2.95} className="vx-pulses vx-pulses--in">
            {SITES.map((s, i) => (
              <circle key={s.label} r={3.2}>
                <animateMotion dur="2.2s" begin={`${(i * 0.37).toFixed(2)}s`} repeatCount="indefinite" path={spoke(s.a, true)} />
              </circle>
            ))}
            {SITES.map((s, i) => (
              <circle key={`${s.label}b`} r={2.2}>
                <animateMotion dur="2.2s" begin={`${(1.1 + i * 0.37).toFixed(2)}s`} repeatCount="indefinite" path={spoke(s.a, true)} />
              </circle>
            ))}
          </G>
          <G at={3.0} className="vx-pulses vx-pulses--out">
            {SITES.map((s, i) => (
              <circle key={s.label} r={3.4}>
                <animateMotion dur="1.8s" begin={`${(i * 0.12).toFixed(2)}s`} repeatCount="indefinite" path={spoke(s.a, false)} />
              </circle>
            ))}
          </G>
          {SITES.map((s, i) => {
            const [x, y] = pos(s.a);
            return (
              <G key={s.label} at={0.2 + i * 0.08}>
                <g transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`} className="vx-net__site">
                  <circle r={22} className="vx-net__local" />
                  <rect x={-13} y={-5} width={26} height={10} rx={2} className="vx-net__unit" />
                  <line x1={-13} y1={-5} x2={-17} y2={-11} className="vx-net__wing" />
                  <line x1={13} y1={-5} x2={17} y2={-11} className="vx-net__wing" />
                  <text y={38} className="vx-net__label">
                    {s.label}
                  </text>
                  <G at={3.45 + i * 0.06}>
                    <text y={51} className="vx-net__update">
                      ✓ update installed
                    </text>
                  </G>
                </g>
              </G>
            );
          })}
          <g className="vx-net__hub">
            <circle r={40} className="vx-hub" />
            <Burst r={15} />
            <text y={64} className="vx-hub__t">
              JAX WORLD
            </text>
          </g>
        </svg>
      </div>
    </ScrollScene>
  );
}
