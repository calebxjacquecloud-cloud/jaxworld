'use client';

import { ramp } from '@/lib/timeline';
import ScrollScene from '../components/ScrollScene';
import { Burst, G, In } from '../film/primitives';

/** Camera stops on the map (metres): centre and visible width. */
const STOPS = [
  { t: 0.6, x: 0, y: 0, w: 13 },
  { t: 1.3, x: 0, y: 0, w: 32 },
  { t: 2.3, x: 0, y: 0, w: 150 },
  { t: 3.3, x: 0, y: 40, w: 1500 },
  { t: 4.3, x: 0, y: -60, w: 4700 },
  { t: 5.0, x: 0, y: -260, w: 4900 },
];
const MOVE = 0.7;

const SITES: { x: number; y: number; env?: string }[] = [
  { x: 0, y: 0, env: 'Parking lot' },
  { x: -1330, y: -520, env: 'Airport' },
  { x: 930, y: -470, env: 'Retail site' },
  { x: 1150, y: 640, env: 'Fleet depot' },
  { x: -620, y: 520 },
  { x: 380, y: 760 },
  { x: -260, y: -640 },
  { x: 520, y: 230 },
  { x: -420, y: 120 },
];
const HUB = { x: 0, y: -1250 };

function Unit() {
  return (
    <g className="vx-map-unit">
      <rect x={-8.8} y={-1.1} width={17.6} height={2.2} className="vx-map-unit__ramp" />
      <rect x={-6.1} y={-4.0} width={12.2} height={2.8} className="vx-map-unit__wing" />
      <rect x={-6.1} y={1.2} width={12.2} height={2.8} className="vx-map-unit__wing" />
      <rect x={-6.1} y={-1.2} width={12.2} height={2.4} className="vx-map-unit__core" />
    </g>
  );
}

function Lot() {
  const stalls = [];
  for (let i = -8; i <= 8; i++) {
    stalls.push(<line key={`a${i}`} x1={i * 2.7} y1={-26} x2={i * 2.7} y2={-20.5} />);
    stalls.push(<line key={`b${i}`} x1={i * 2.7} y1={20.5} x2={i * 2.7} y2={26} />);
  }
  return (
    <g className="vx-map-lot">
      <rect x={-46} y={-30} width={92} height={60} rx={2} />
      <g className="vx-map-lot__stalls">{stalls}</g>
      {[-18.9, -8.1, 5.4, 13.5, 18.9].map((x, i) => (
        <rect key={x} x={x - 0.9} y={i % 2 ? 21.2 : -25.4} width={1.8} height={4.4} rx={0.5} className="vx-map-lot__car" />
      ))}
    </g>
  );
}

/**
 * ACT 16 · The final scale visual: zoom out from one vehicle to a connected
 * network of locations in different environments.
 */
export default function FinalScale() {
  return (
    <ScrollScene
      units={6.4}
      chapter={5}
      label="From one vehicle to a network"
      className="vx-scale"
      onFrame={(t, root) => {
        const svg = root.querySelector<SVGSVGElement>('svg.vx-map');
        if (!svg) return;
        // piecewise zoom between stops (each move takes MOVE units), log-scaled so each step feels the same
        let a = STOPS[0];
        let b = STOPS[0];
        let u = 0;
        for (let i = 1; i < STOPS.length; i++) {
          const s1 = STOPS[i];
          if (t >= s1.t) {
            a = b = s1;
            continue;
          }
          if (t > s1.t - MOVE) {
            a = STOPS[i - 1];
            b = s1;
            u = ramp(t, s1.t - MOVE, s1.t);
          }
          break;
        }
        const e = u * u * (3 - 2 * u);
        const w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * e);
        const cx = a.x + (b.x - a.x) * e;
        const cy = a.y + (b.y - a.y) * e;
        const W = svg.clientWidth || 1;
        const H = svg.clientHeight || 1;
        const h = (w * H) / W;
        svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(3)} ${(cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
        // HTML labels pinned to map points
        root.querySelectorAll<HTMLElement>('[data-map]').forEach((el) => {
          const [mx, my] = (el.dataset.map || '0,0').split(',').map(Number);
          el.style.left = `${(((mx - (cx - w / 2)) / w) * W).toFixed(1)}px`;
          el.style.top = `${(((my - (cy - h / 2)) / h) * H).toFixed(1)}px`;
        });
      }}
    >
      <svg className="vx-map" viewBox="-6.5 -4 13 8" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {/* city scale: streets */}
        <G at={2.4} className="vx-map-streets">
          {Array.from({ length: 15 }, (_, i) => -2100 + i * 300).map((v) => (
            <g key={v}>
              <line x1={v} y1={-1500} x2={v} y2={1500} />
              <line x1={-2200} y1={v * 0.7} x2={2200} y2={v * 0.7} />
            </g>
          ))}
        </G>
        {/* environments */}
        <G at={3.6} className="vx-map-env">
          <g transform="translate(-1330 -520)">
            <rect x={-760} y={-160} width={1500} height={46} rx={6} className="vx-map-runway" />
            <rect x={-620} y={120} width={1300} height={40} rx={6} className="vx-map-runway" transform="rotate(-8)" />
            <rect x={-160} y={-60} width={320} height={110} rx={8} className="vx-map-bldg" />
          </g>
          <g transform="translate(930 -470)">
            <rect x={-150} y={-130} width={300} height={140} rx={6} className="vx-map-bldg" />
          </g>
          <g transform="translate(1150 640)">
            {Array.from({ length: 24 }, (_, i) => (
              <rect key={i} x={-160 + (i % 8) * 40} y={-120 + Math.floor(i / 8) * 50} width={26} height={12} rx={3} className="vx-map-van" />
            ))}
          </g>
        </G>
        {/* links to Jax World */}
        <G at={4.45} className="vx-map-links">
          {SITES.map((s, i) => (
            <path
              key={i}
              d={`M${s.x},${s.y} Q${(s.x + HUB.x) / 2},${Math.min(s.y, HUB.y) - 160} ${HUB.x},${HUB.y}`}
              pathLength={1}
              className="vx-link"
              data-draw={`${4.5 + i * 0.04},${4.95 + i * 0.04}`}
            />
          ))}
        </G>
        {/* other locations */}
        {SITES.slice(1).map((s, i) => (
          <G key={i} at={2.55 + i * 0.05}>
            <g transform={`translate(${s.x} ${s.y}) scale(1.4)`}>
              <Lot />
              <Unit />
            </g>
            <circle cx={s.x} cy={s.y} r={70} className="vx-map-site" />
          </G>
        ))}
        {/* the first location */}
        <G at={1.4}>
          <Lot />
        </G>
        <G at={2.9}>
          <circle cx={0} cy={0} r={70} className="vx-map-site" />
        </G>
        <G at={0.75}>
          <Unit />
          {[-2.75, 2.75].map((y) => (
            <circle key={y} cx={y > 0 ? 1.2 : -1.2} cy={y} r={0.42} className="vx-map-arm" />
          ))}
          {[-4.8, -1.6, 1.6, 4.8].flatMap((x) => [-4.3, 4.3].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={0.16} className="vx-map-pylon" />))}
        </G>
        <g className="vx-map-car">
          <rect x={-2.8} y={-1.0} width={5.6} height={2.0} rx={0.9} />
          <ellipse cx={0.5} cy={0} rx={0.7} ry={0.62} className="vx-map-car__glass" />
          <ellipse cx={-0.7} cy={0} rx={0.62} ry={0.58} className="vx-map-car__glass" />
        </g>
        <G at={4.4}>
          <g transform={`translate(${HUB.x} ${HUB.y}) scale(8)`} className="vx-map-hub">
            <circle r={14} className="vx-hub" />
            <Burst r={9} />
          </g>
        </G>
      </svg>

      <div className="vx-map-labels" aria-hidden="true">
        {SITES.filter((s) => s.env).map((s) => (
          <In key={s.env} at={4.0} out={5.15} className="vx-map-label mono">
            <span data-map={`${s.x},${s.y}`}>{s.env}</span>
          </In>
        ))}
        <In at={4.75} className="vx-map-label vx-map-label--hub mono">
          <span data-map={`${HUB.x},${HUB.y}`}>Jax World</span>
        </In>
      </div>

      <div className="vx-scale__copy">
        <div className="vx-swap">
          {[
            [-1, 0.95, 'One vehicle.'],
            [1.0, 1.95, 'One Carwash‑O‑Matic.'],
            [2.0, 2.95, 'One franchise location.'],
            [3.0, 3.95, 'Several locations.'],
            [4.0, 4.65, 'Different environments.'],
            [4.7, 5.25, 'Connected to Jax World.'],
          ].map(([a, b, text]) => (
            <In key={text as string} as="p" at={a as number} out={b as number} className="vx-h2">
              {text}
            </In>
          ))}
          <div className="vx-in vx-stack-gap" data-in={5.3}>
            <p className="vx-display vx-big">
              Autonomous vehicle care. <span className="vx-accent">Built to deploy.</span>
            </p>
            <In as="p" at={5.7} className="vx-chain vx-chain--static mono">
              Clean · Inspect · Record · Improve
            </In>
          </div>
        </div>
      </div>
    </ScrollScene>
  );
}
