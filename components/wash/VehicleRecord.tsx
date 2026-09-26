'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { FINDINGS, HISTORY, KIND_LABEL, VISIT } from '@/data/conditionReport';
import { clamp01 } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

const NEW_DAMAGE = FINDINGS.filter((f) => f.pre.kind === 'new').length;
const RESOLVED = FINDINGS.filter((f) => f.post.kind === 'ok').length;
const KNOWN = FINDINGS.filter((f) => f.post.kind === 'known').length;

/**
 * THE VEHICLE RECORD: a full-screen beat after VERIFY. Every wash leaves a
 * before / after / what-changed record, and each visit adds to the car's
 * running condition history. It clears as the outro (car drives out) begins.
 */
export default function VehicleRecord({ bus }: { bus: FrameBus }) {
  const root = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const extras = useRef<(HTMLElement | null)[]>([]);

  useEffect(
    () =>
      bus.add(({ t, o }) => {
        const inO = clamp01((t - 0.928) / 0.012);
        const outO = 1 - clamp01(o / 0.035);
        const op = inO * outO;
        setFade(root.current, op, `translate3d(0, ${((1 - inO) * 16).toFixed(1)}px, 0)`);
        if (op <= 0) return;
        rows.current.forEach((li, i) => li?.classList.toggle('is-on', t > 0.936 + i * 0.006));
        extras.current.forEach((el, i) => el?.classList.toggle('is-on', t > 0.97 + i * 0.008));
      }),
    [bus],
  );

  const extra = (i: number) => (el: HTMLElement | null) => {
    extras.current[i] = el;
  };

  return (
    <div className="vrec" ref={root}>
      <div className="vrec__lead">
        <p className="eyebrow">Condition record</p>
        <h2 className="vrec__title">Every wash leaves a record.</h2>
        <ul className="vrec__lines">
          <li>Before.</li>
          <li>After.</li>
          <li>What changed.</li>
        </ul>
        <p className="vrec__body">A running condition history for every vehicle.</p>
        <p className="vrec__kicker" ref={extra(2)}>
          Useful long after the wash is finished.
        </p>
      </div>

      <div className="vrec__card">
        <p className="vrec__head mono">
          <span>{VISIT.vehicle}</span>
          <span>
            Visit {VISIT.number} · vs visit {VISIT.previous}
          </span>
        </p>
        <ol className="vrec__rows">
          <li className="vrec__cols mono" aria-hidden="true">
            <span>Finding</span>
            <span>Before</span>
            <span>After</span>
          </li>
          {FINDINGS.map((f, i) => (
            <li
              key={f.id}
              className="vrec__row"
              ref={(el) => {
                rows.current[i] = el;
              }}
            >
              <span className="vrec__what">
                {f.label}
                <span className="vrec__where">{f.where}</span>
              </span>
              <span className={`kind kind--${f.pre.kind}`}>{KIND_LABEL[f.pre.kind]}</span>
              <span className={`kind kind--${f.post.kind}`}>{KIND_LABEL[f.post.kind]}</span>
            </li>
          ))}
        </ol>
        <ul className="vrec__changed" ref={extra(0)} aria-label="What changed">
          <li>
            <b className="mono">{NEW_DAMAGE}</b> newly detected damage
          </li>
          <li>
            <b className="mono">{RESOLVED}</b> resolved as dirt or debris
          </li>
          <li>
            <b className="mono">{KNOWN}</b> known mark, unchanged
          </li>
          <li>Owner notified</li>
        </ul>
        <div className="vrec__history" ref={extra(1)}>
          <p className="mono">Previous visits · marks on file</p>
          <ol>
            {HISTORY.map((h) => (
              <li key={h.visit} className={h.visit === VISIT.number ? 'is-now' : ''}>
                <span className="vrec__bar" style={{ height: `${6 + h.marks * 12}px` }} />
                <span className="mono">V{h.visit}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
