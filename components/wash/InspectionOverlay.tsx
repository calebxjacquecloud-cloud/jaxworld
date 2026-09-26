'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { FINDINGS, KIND_LABEL, VISIT } from '@/data/conditionReport';
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

/** VERIFY: the post-wash recheck panel, working through the recheck list. */
export default function InspectionOverlay({ bus }: { bus: FrameBus }) {
  const record = useRef<HTMLDivElement>(null);
  const scanPct = useRef<HTMLSpanElement>(null);
  const resolved = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(
    () =>
      bus.add(({ t, state }) => {
        const ro = windowed(t, 0.868, 0.926, 0.008);
        setFade(record.current, ro);
        if (ro > 0) {
          if (scanPct.current) scanPct.current.textContent = `${Math.round(state.qcScan * 100)}%`;
          FINDINGS.forEach((f, i) => resolved.current[i]?.classList.toggle('is-on', t >= f.tResolved));
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
      </div>
    </>
  );
}
