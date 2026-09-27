'use client';

import { ramp } from '@/lib/timeline';
import ScrollScene from '../components/ScrollScene';
import { G, In } from '../film/primitives';
import Cabin from './Cabin';

const BASE = [238, 262] as const;
const L1 = 72;
const L2 = 66;
const REST = [262, 190] as const;
const LOST = [104, 322] as const;
const TEAR = [140, 274] as const;

const lerp = (a: readonly [number, number], b: readonly [number, number], u: number) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u] as const;
const ease = (u: number) => u * u * (3 - 2 * u);

/** Where the interior arm's tool is at scene time t. */
function toolAt(t: number) {
  if (t < 0.7) return REST;
  if (t < 1.3) return lerp(REST, LOST, ease(ramp(t, 0.7, 1.3)));
  if (t < 1.85) return LOST;
  if (t < 2.35) return lerp(LOST, TEAR, ease(ramp(t, 1.85, 2.35)));
  if (t < 2.9) return TEAR;
  return lerp(TEAR, REST, ease(ramp(t, 2.9, 3.5)));
}

/** Two-link IK in the drawing plane, elbow bending away from the car. */
function solve([tx, ty]: readonly [number, number]) {
  const dx = tx - BASE[0];
  const dy = ty - BASE[1];
  const d = Math.min(L1 + L2 - 0.5, Math.max(8, Math.hypot(dx, dy)));
  const th = Math.atan2(dy, dx);
  const a = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d))));
  const j = [BASE[0] + L1 * Math.cos(th + a), BASE[1] + L1 * Math.sin(th + a)];
  const e = [BASE[0] + d * Math.cos(th), BASE[1] + d * Math.sin(th)];
  return { j, e };
}

/**
 * ACT 15 · Phase II. Interior robotics complete the vehicle-care loop:
 * clean the cabin, inspect it, and write what they find to the same record.
 */
export default function Interior() {
  return (
    <ScrollScene
      id="interior"
      units={5.4}
      chapter={5}
      label="Phase II: interior robotics"
      className="vx-split"
      onFrame={(t, root) => {
        const { j, e } = solve(toolAt(t));
        const seg1 = root.querySelector('[data-arm="1"]');
        const seg2 = root.querySelector('[data-arm="2"]');
        const joint = root.querySelector('[data-arm="j"]');
        const tip = root.querySelector('[data-arm="e"]');
        seg1?.setAttribute('x2', j[0].toFixed(1));
        seg1?.setAttribute('y2', j[1].toFixed(1));
        seg2?.setAttribute('x1', j[0].toFixed(1));
        seg2?.setAttribute('y1', j[1].toFixed(1));
        seg2?.setAttribute('x2', e[0].toFixed(1));
        seg2?.setAttribute('y2', e[1].toFixed(1));
        joint?.setAttribute('cx', j[0].toFixed(1));
        joint?.setAttribute('cy', j[1].toFixed(1));
        tip?.setAttribute('cx', e[0].toFixed(1));
        tip?.setAttribute('cy', e[1].toFixed(1));
        const sweep = root.querySelector<SVGGElement>('[data-sweep]');
        if (sweep) {
          const u = ramp(t, 0.2, 0.85);
          sweep.style.opacity = u > 0 && u < 1 ? '1' : '0';
          sweep.style.transform = `translate(0px, ${(40 + u * 340).toFixed(1)}px)`;
        }
      }}
    >
      <div className="vx-split__copy">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={3.65}>
            <p className="vx-eyebrow">Phase II · future capability</p>
            <h2 className="vx-h2">Next: understand the whole vehicle.</h2>
            <p className="vx-body">Interior robotics would close the loop: clean the cabin, inspect it, and add what they find to the same condition record.</p>
            <div className="vx-finds">
              <In at={1.35} className="vx-find">
                <p className="mono">Lost item detected</p>
                <p>Object under rear seat</p>
              </In>
              <In at={2.4} className="vx-find vx-find--alert">
                <p className="mono">New upholstery damage</p>
                <p>Small tear, rear passenger seat</p>
              </In>
            </div>
            <In at={2.95} className="vx-caps mono">
              Vacuuming · surface cleaning · stain treatment · seat, upholstery and floor inspection · lost-item and debris detection · tear detection · cabin-condition record
            </In>
          </div>
          <div className="vx-in vx-stack-gap" data-in={3.7}>
            <div className="vx-roadmap">
              <div>
                <p className="mono vx-roadmap__when">Today</p>
                <p className="vx-h3">Exterior care</p>
                <ol className="mono">
                  <li>Clean</li>
                  <li>Inspect</li>
                  <li>Compare</li>
                  <li>Record</li>
                </ol>
              </div>
              <div className="is-next">
                <p className="mono vx-roadmap__when">Next</p>
                <p className="vx-h3">Interior care</p>
                <ol className="mono">
                  <li>Clean</li>
                  <li>Inspect</li>
                  <li>Compare</li>
                  <li>Record</li>
                </ol>
              </div>
            </div>
            <In as="p" at={4.2} className="vx-h2">
              From autonomous washing to <span className="vx-accent">autonomous vehicle care.</span>
            </In>
          </div>
        </div>
      </div>
      <div className="vx-split__art" aria-hidden="true">
        <svg viewBox="-60 -10 380 420" className="vx-cabin-art">
          <Cabin />
          <g data-sweep className="vx-sweep">
            <rect x={20} y={-14} width={160} height={14} />
            <line x1={18} y1={0} x2={182} y2={0} />
          </g>
          <G at={1.3} className="vx-detect">
            <circle cx={LOST[0]} cy={LOST[1]} r={9} />
            <rect x={LOST[0] - 4} y={LOST[1] - 6} width={8} height={12} rx={2} className="vx-detect__obj" />
          </G>
          <G at={2.35} className="vx-detect vx-detect--alert">
            <circle cx={TEAR[0]} cy={TEAR[1]} r={9} />
            <path d={`M${TEAR[0] - 5} ${TEAR[1] - 3} l4 4 l-2 3 l5 -2`} />
          </G>
          <g className="vx-iarm">
            <rect x={BASE[0] - 10} y={BASE[1] - 16} width={34} height={32} rx={6} className="vx-iarm__base" />
            <line data-arm="1" x1={BASE[0]} y1={BASE[1]} x2={BASE[0]} y2={BASE[1]} />
            <line data-arm="2" x1={BASE[0]} y1={BASE[1]} x2={BASE[0]} y2={BASE[1]} className="vx-iarm__fore" />
            <circle data-arm="j" cx={BASE[0]} cy={BASE[1]} r={6} />
            <circle data-arm="e" cx={BASE[0]} cy={BASE[1]} r={5} className="vx-iarm__tool" />
            <circle cx={BASE[0]} cy={BASE[1]} r={7} />
          </g>
          <G at={0.1}>
            <text x={100} y={-2} textAnchor="middle" className="vx-cabin__empty">
              CONCEPT · INTERIOR ROBOT
            </text>
          </G>
        </svg>
      </div>
    </ScrollScene>
  );
}
