'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { EQUIPMENT_LABELS, PACK_PLAN, unitProgress } from '@/data/outroSequence';
import { clamp01 } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import type { ScreenPoint } from './WashScene';

const unitIndex = new Map(PACK_PLAN.map((s, i) => [s.id, i]));

/**
 * Outro callouts: names every piece of equipment once it is on screen, and
 * drops each label as its unit lifts off for the container.
 */
export default function OutroOverlay({ bus }: { bus: FrameBus }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const pt: ScreenPoint = { x: 0, y: 0, visible: false };
    return bus.add(({ o, state: s, scene }) => {
      EQUIPMENT_LABELS.forEach((l, i) => {
        const el = refs.current[i];
        if (!el) return;
        if (!scene || o <= 0 || s.labels <= 0.001) {
          setFade(el, 0);
          return;
        }
        const leaving = clamp01(unitProgress(s.pack, unitIndex.get(l.unit) ?? 0) * 8);
        const stagger = clamp01(s.labels * (EQUIPMENT_LABELS.length + 4) / 4 - i * 0.25);
        const op = stagger * (1 - leaving);
        scene.projectPoint(l.at[0], l.at[1], l.at[2], pt);
        setFade(el, pt.visible ? op : 0, `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`);
      });
    });
  }, [bus]);

  return (
    <div className="annotations" aria-hidden="true">
      {EQUIPMENT_LABELS.map((l, i) => (
        <div
          key={l.unit}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`anno anno--${l.tone}${l.minor ? ' anno--minor' : ''}${l.below ? ' anno--below' : ''}`}
        >
          <span className="anno__dot" />
          <span className="anno__leader" />
          <span className="anno__card">
            <span className="anno__label">{l.label}</span>
            {l.sub && <span className="anno__sub">{l.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
