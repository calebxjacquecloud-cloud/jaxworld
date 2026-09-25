'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { ANNOTATIONS } from '@/data/washSequence';
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import type { ScreenPoint } from './WashScene';

/**
 * Diagnostic callouts pinned to points on the vehicle (or to a live nozzle).
 * Positions come from projecting 3D anchors every frame.
 */
export default function ScannerOverlay({ bus }: { bus: FrameBus }) {
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const pt: ScreenPoint = { x: 0, y: 0, visible: false };
    return bus.add(({ t, scene }) => {
      ANNOTATIONS.forEach((a, i) => {
        const el = refs.current[i];
        if (!el) return;
        const o = scene ? windowed(t, a.in, a.out, 0.005) : 0;
        if (o <= 0.001) {
          setFade(el, 0);
          return;
        }
        if (a.anchor === 'nozzleA' || a.anchor === 'nozzleB') scene!.projectNozzle(a.anchor === 'nozzleA' ? 0 : 1, pt, a.detail);
        else scene!.projectVehicle(a.anchor[0], a.anchor[1], a.anchor[2], pt, a.detail);
        setFade(
          el,
          pt.visible ? o : 0,
          `translate3d(${(pt.x + (a.dx ?? 0)).toFixed(1)}px, ${(pt.y + (a.dy ?? 0)).toFixed(1)}px, 0)`,
        );
      });
    });
  }, [bus]);

  return (
    <div className="annotations" aria-hidden="true">
      {ANNOTATIONS.map((a, i) => (
        <div
          key={a.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`anno anno--${a.tone}${a.minor ? ' anno--minor' : ''}${a.dotOnMobile ? ' anno--dot' : ''}${a.detail ? ' anno--detail' : ''}`}
        >
          <span className="anno__dot" />
          <span className="anno__leader" />
          <span className="anno__card">
            <span className="anno__label">{a.label}</span>
            {a.sub && <span className="anno__sub">{a.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}
