'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { COMPLETION_CHECKS } from '@/lib/washStages';
import { FINDINGS, HISTORY, KIND_LABEL, VISIT } from '@/data/conditionReport';
import { clamp01, windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

/**
 * Post-wash condition record and the final
 * completion checklist + concept statement.
 */
export default function InspectionOverlay({ bus }: { bus: FrameBus }) {
  const record = useRef<HTMLDivElement>(null);
  const checks = useRef<(HTMLLIElement | null)[]>([]);
  const checklist = useRef<HTMLDivElement>(null);
  const finale = useRef<HTMLDivElement>(null);
  const scanPct = useRef<HTMLSpanElement>(null);
  const resolved = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(
    () =>
      bus.add(({ t, o: outro, state }) => {
        // the finale clears as the outro (car drives out) begins
        const keep = 1 - clamp01(outro / 0.04);
        const ro = windowed(t, 0.868, 0.926, 0.008);
        setFade(record.current, ro);
        if (ro > 0) {
          if (scanPct.current) scanPct.current.textContent = `${Math.round(state.qcScan * 100)}%`;
          FINDINGS.forEach((f, i) => resolved.current[i]?.classList.toggle('is-on', t >= f.tResolved));
        }
        const co = clamp01((t - 0.93) / 0.01);
        setFade(checklist.current, co * keep);
        if (co > 0) checks.current.forEach((li, i) => li?.classList.toggle('is-on', t > 0.936 + i * 0.006));
        {
          const o = clamp01((t - 0.962) / 0.014);
          setFade(finale.current, o * keep, `translate3d(0, ${((1 - o) * 24).toFixed(1)}px, 0)`);
        }
      }),
    [bus],
  );

  return (
    <>
      <div className="record" ref={record}>
        <p className="record__head mono">
          Post-wash recheck <span className="record__id">{VISIT.vehicle} · visit {VISIT.number}</span>
        </p>
        <p className="record__scan mono">
          Inspection pass <span ref={scanPct}>0%</span>
        </p>
        <ul className="record__list">
          {FINDINGS.map((f, i) => (
            <li
              key={f.id}
              ref={(el) => {
                resolved.current[i] = el;
              }}
            >
              <span className="record__item">
                {f.label}
                <span className="record__where">{f.where}</span>
              </span>
              <span className="record__result">
                <span className={`kind kind--${f.post.kind}`}>{KIND_LABEL[f.post.kind]}</span>
                <span className="record__note">{f.post.note}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="history" aria-label="Body damage on record after each visit">
          <p className="history__title mono">Wear record · damage on file per visit</p>
          <ol className="history__bars">
            {HISTORY.map((h) => (
              <li key={h.visit} title={`Visit ${h.visit} · ${h.date}: ${h.marks} on file`} className={h.visit === VISIT.number ? 'is-now' : ''}>
                <span className="history__val mono">{h.marks}</span>
                <span className="history__bar" style={{ height: `${6 + h.marks * 14}px` }} />
                <span className="history__v mono">V{h.visit}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="record__note-foot">
          Owner notified: 1 new scratch, 1 headlamp out. Inspection documents visible condition; it is not a guarantee that every defect is detected.
        </p>
      </div>

      <div className="checklist" ref={checklist}>
        <ul>
          {COMPLETION_CHECKS.map((c, i) => (
            <li
              key={c}
              ref={(el) => {
                checks.current[i] = el;
              }}
            >
              <span className="checklist__tick" aria-hidden="true">
                ✓
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="finale" ref={finale}>
        <h2 className="finale__title">
          Autonomous cleaning for the <em>autonomous age.</em>
        </h2>
        <p className="finale__body">
          Computer vision, robotics and modular infrastructure — designed around the vehicle instead of the conveyor.
        </p>
      </div>
    </>
  );
}
