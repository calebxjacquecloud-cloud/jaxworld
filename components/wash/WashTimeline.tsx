'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';

/** Desktop progress rail: a thin line on the right that fills as the demo plays. (Hidden in stepped touch playback.) */
export default function WashTimeline({ bus }: { bus: FrameBus }) {
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      bus.add(({ p }) => {
        if (fill.current) fill.current.style.setProperty('--p', p.toFixed(4));
      }),
    [bus],
  );

  return (
    <div className="rail" aria-hidden="true">
      <span className="rail__track">
        <span className="rail__fill" ref={fill} />
      </span>
    </div>
  );
}
