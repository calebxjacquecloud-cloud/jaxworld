'use client';

import ScrollScene from '../components/ScrollScene';
import { G, In } from '../film/primitives';
import Cabin, { SPOTS } from './Cabin';

const NOTICED: { key: keyof typeof SPOTS; label: string; side: 'l' | 'r'; y: number }[] = [
  { key: 'wheel', label: 'Damaged wheels', side: 'l', y: 70 },
  { key: 'warning', label: 'Warning signs', side: 'l', y: 120 },
  { key: 'stain', label: 'Stains', side: 'l', y: 280 },
  { key: 'lost', label: 'Lost items', side: 'l', y: 340 },
  { key: 'dirty', label: 'Dirty surfaces', side: 'r', y: 70 },
  { key: 'tear', label: 'Torn upholstery', side: 'r', y: 160 },
  { key: 'trash', label: 'Trash', side: 'r', y: 215 },
  { key: 'scratch', label: 'Scratches', side: 'r', y: 280 },
];

/**
 * ACT 14 · Autonomous vehicles still get dirty — and without a driver, nobody
 * is noticing what the driver used to notice.
 */
export default function Autonomous() {
  return (
    <ScrollScene id="autonomy" units={4.8} chapter={5} label="The autonomous vehicle future" className="vx-split vx-split--flip">
      <div className="vx-split__copy">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={1.3}>
            <p className="vx-eyebrow">The autonomous future</p>
            <h2 className="vx-h2 vx-lines">
              <span>Autonomous vehicles still get dirty.</span>
              <In as="span" at={0.55} className="vx-accent">
                And someone still has to inspect them.
              </In>
            </h2>
          </div>
          <div className="vx-in vx-stack-gap" data-in={1.35} data-out={2.7}>
            <p className="vx-eyebrow">Today</p>
            <h2 className="vx-h2">The driver notices.</h2>
            <p className="vx-body">
              Scratches, stains, trash, a phone left under a seat, a torn seat, a warning light. Much of this is reported by the person behind the wheel.
            </p>
          </div>
          <div className="vx-in vx-stack-gap" data-in={2.75}>
            <p className="vx-eyebrow">Tomorrow</p>
            <h2 className="vx-h2">Driverless vehicles lose the driver as the inspector.</h2>
            <In as="p" at={3.5} className="vx-display vx-big vx-accent">
              Vehicle care has to become autonomous too.
            </In>
          </div>
        </div>
      </div>
      <div className="vx-split__art" aria-hidden="true">
        <svg viewBox="-150 -10 500 420" className="vx-cabin-art">
          <Cabin />
          <G at={1.3} out={2.75}>
            <g className="vx-cabin__driver">
              <circle cx={68} cy={176} r={14} />
              <path d="M58 200 Q68 188 78 200" />
            </g>
          </G>
          {NOTICED.map((n, i) => {
            const [x, y] = SPOTS[n.key];
            const lx = n.side === 'l' ? -40 : 240;
            return (
              <g key={n.key}>
                <G at={1.45 + i * 0.1} out={2.75} className="vx-notice">
                  <line x1={x} y1={y} x2={lx} y2={n.y} />
                  <circle cx={x} cy={y} r={5} />
                  <text x={n.side === 'l' ? lx - 6 : lx + 6} y={n.y + 4} textAnchor={n.side === 'l' ? 'end' : 'start'}>
                    {n.label}
                  </text>
                </G>
                <G at={2.8 + i * 0.03} className="vx-notice vx-notice--lost">
                  <circle cx={x} cy={y} r={7} />
                  <text x={x} y={y + 4} textAnchor="middle">
                    ?
                  </text>
                </G>
              </g>
            );
          })}
          <G at={2.8}>
            <text x={100} y={-2} textAnchor="middle" className="vx-cabin__empty">
              NO DRIVER
            </text>
          </G>
        </svg>
      </div>
    </ScrollScene>
  );
}
