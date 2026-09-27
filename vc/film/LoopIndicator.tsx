import { forwardRef } from 'react';

/** The core loop, and where each step (and each ACT sub-beat) sits on the film timeline. */
export const LOOP_STEPS = [
  { label: 'See', range: [7.75, 9.02] },
  { label: 'Think', range: [9.02, 10.12] },
  { label: 'Act', range: [10.12, 15.18] },
  { label: 'Verify', range: [15.18, 16.02] },
] as const;

const ACT_SUB = [
  { label: 'Rinse', range: [11.0, 12.0] },
  { label: 'Clean', range: [12.0, 13.1] },
  { label: 'Adapt', range: [13.1, 14.1] },
  { label: 'Detail', range: [14.1, 15.18] },
] as const;

/**
 * SEE → THINK → ACT → VERIFY, pinned while the machine works so the viewer
 * always knows where in the loop the demonstration is.
 */
const LoopIndicator = forwardRef<HTMLDivElement>(function LoopIndicator(_, ref) {
  return (
    <div className="vx-loop" ref={ref} aria-hidden="true">
      <ol>
        {LOOP_STEPS.map((s, i) => (
          <li key={s.label} data-loop={i}>
            <span className="vx-loop__n mono">{String(i + 1).padStart(2, '0')}</span>
            <span className="vx-loop__l">{s.label}</span>
            {i === 2 && (
              <ol className="vx-loop__sub">
                {ACT_SUB.map((a) => (
                  <li key={a.label} className="vx-on mono" data-on={a.range.join(',')}>
                    {a.label}
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
});

export default LoopIndicator;
