'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { FINDINGS, KIND_LABEL, RECHECK_COUNT, VISIT } from '@/data/conditionReport';
import { clamp01, windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

/**
 * Pre-wash condition scan. Findings appear one by one as the cameras identify
 * them, each compared with the car's previous post-wash record, and anything
 * new or uncertain is added to the post-wash recheck list.
 */
export default function ConditionPanel({ bus }: { bus: FrameBus }) {
  const panel = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      bus.add(({ t }) => {
        const el = panel.current;
        if (!el) return;
        const o = windowed(t, 0.168, 0.216, 0.008);
        setFade(el, o);
        if (o <= 0) return;
        let queued = 0;
        FINDINGS.forEach((f, i) => {
          const on = t >= f.tFound;
          rows.current[i]?.classList.toggle('is-on', on);
          if (on && f.recheck) queued++;
        });
        if (count.current) count.current.textContent = String(queued);
        if (bar.current) bar.current.style.transform = `scaleX(${clamp01((t - 0.168) / 0.03).toFixed(3)})`;
      }),
    [bus],
  );

  return (
    <div className="cond" ref={panel}>
      <p className="cond__head mono">
        <span>Pre-wash condition scan</span>
        <span className="cond__id">
          {VISIT.vehicle} · visit {VISIT.number}
        </span>
      </p>
      <p className="cond__compare mono">
        Compared with visit {VISIT.previous} post-wash record · {VISIT.previousDate}
        <span className="cond__progress" aria-hidden="true">
          <span ref={bar} />
        </span>
      </p>
      <ul className="cond__list">
        {FINDINGS.map((f, i) => (
          <li
            key={f.id}
            ref={(el) => {
              rows.current[i] = el;
            }}
            className="cond__row"
          >
            <span className={`kind kind--${f.pre.kind}`}>{KIND_LABEL[f.pre.kind]}</span>
            <span className="cond__what">
              <span className="cond__label">{f.label}</span>
              <span className="cond__where">
                {f.where} · {f.pre.note}
              </span>
            </span>
            {f.recheck && <span className="cond__queue mono">→ recheck</span>}
          </li>
        ))}
      </ul>
      <p className="cond__foot mono">
        Post-wash recheck list: <span ref={count}>0</span>/{RECHECK_COUNT} items
      </p>
    </div>
  );
}
