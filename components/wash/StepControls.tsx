'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import type { ProgressRef } from '@/hooks/useScrollProgress';

/**
 * Phones only (stepped playback): on-screen controls so the viewer drives the
 * story one move at a time. "Start" on the first screen, then Back / Next.
 * On the last step, Next continues down the page. Swipes still work too.
 */
export default function StepControls({
  bus,
  progress,
  sectionRef,
}: {
  bus: FrameBus;
  progress: ProgressRef;
  sectionRef: RefObject<HTMLElement>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let last = '';
    const sync = () => {
      const i = progress.index ?? 0;
      const n = progress.count ?? 1;
      const state = `${i}/${n}`;
      if (state === last) return;
      last = state;
      const first = i === 0;
      const end = i >= n - 1;
      root.current?.classList.toggle('is-start', first);
      if (back.current) back.current.disabled = first;
      if (next.current) next.current.textContent = first ? 'Start' : end ? 'Continue ↓' : 'Next →';
      if (count.current) count.current.textContent = first ? '' : `${i} / ${n - 1}`;
    };
    sync();
    // index changes by swipe, key or button; the frame bus runs whenever anything moves
    const off = bus.add(sync);
    const t = window.setInterval(sync, 400);
    return () => {
      off();
      window.clearInterval(t);
    };
  }, [bus, progress]);

  const bringIntoView = () => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    if (Math.abs(window.scrollY - top) > 2) window.scrollTo({ top, behavior: 'smooth' });
  };

  const onNext = () => {
    const i = progress.index ?? 0;
    const n = progress.count ?? 1;
    if (i >= n - 1) {
      document.getElementById('after-demo')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    bringIntoView();
    progress.go?.(1);
  };
  const onBack = () => {
    bringIntoView();
    progress.go?.(-1);
  };

  return (
    <div className="stepctl" ref={root} role="group" aria-label="Demo controls">
      <button type="button" className="stepctl__back" ref={back} onClick={onBack} aria-label="Previous step">
        ←
      </button>
      <span className="stepctl__count mono" ref={count} aria-hidden="true" />
      <button type="button" className="stepctl__next" ref={next} onClick={onNext}>
        Start
      </button>
    </div>
  );
}
