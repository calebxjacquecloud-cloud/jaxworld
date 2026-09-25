'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { setFade } from '@/lib/domWrite';

/** What the detail window is looking at, by timeline position. */
const LABELS: [number, string][] = [
  [0.53, 'DRIVER SIDE'],
  [0.578, 'FRONT WHEEL · TRACE'],
  [0.63, 'REAR WHEEL · TRACE'],
  [0.72, 'DRIVER DOOR · FLAG 01'],
  [1.01, 'FINISH · SPOT-FREE'],
];

/** Intro captions, by intro progress. */
const INTRO_LABELS: [number, string][] = [
  [0.4, 'CAMERA PYLON 01'],
  [0.7, 'ROBOTIC ARM B'],
  [1.01, 'TOOL HEAD · 1 NOZZLE, 5 LINES'],
];

/**
 * Frame and label for the close-up window in the upper right. The 3D image
 * itself is rendered by WashScene into the same rectangle; this component
 * only draws the border and caption over it.
 */
export default function DetailWindow({ bus }: { bus: FrameBus }) {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let lastText = '';
    let lastRect = '';
    return bus.add(({ t, u, scene }) => {
      const el = root.current;
      if (!el) return;
      const r = scene?.inset;
      const open = r ? Math.min(1, r.open) : 0;
      if (!r || open <= 0.001) {
        setFade(el, 0);
        return;
      }
      const rect = `${r.x},${r.y},${r.w},${r.h},${open.toFixed(3)}`;
      if (rect !== lastRect) {
        lastRect = rect;
        el.style.width = `${r.w}px`;
        el.style.height = `${Math.max(1, r.h * open).toFixed(1)}px`;
      }
      setFade(el, 1, `translate3d(${r.x}px, ${r.y}px, 0)`);
      const list = u > 0 && u < 1 ? INTRO_LABELS : LABELS;
      const at = u > 0 && u < 1 ? u : t;
      const text = (list.find(([end]) => at < end) ?? list[list.length - 1])[1];
      if (text !== lastText && label.current) {
        lastText = text;
        label.current.textContent = text;
      }
    });
  }, [bus]);

  return (
    <div className="detail" ref={root} aria-hidden="true">
      <span className="detail__corner detail__corner--tl" />
      <span className="detail__corner detail__corner--tr" />
      <span className="detail__corner detail__corner--bl" />
      <span className="detail__corner detail__corner--br" />
      <span className="detail__label mono">
        <span className="detail__tag">CLOSE-UP</span>
        <span ref={label} />
      </span>
    </div>
  );
}
