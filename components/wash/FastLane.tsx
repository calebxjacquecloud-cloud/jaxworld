'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { windowed } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';

const PLAY_SECONDS = 60;

/**
 * The fast lane (desktop), offered right after the garage door opens:
 *  - "View the 60-second experience": plays the whole demo hands-free as an
 *    eased auto-scroll. Any wheel, touch or key press hands control back.
 *  - "Skip to overview": jumps past the demo.
 */
export default function FastLane({ bus, sectionRef }: { bus: FrameBus; sectionRef: RefObject<HTMLElement> }) {
  const root = useRef<HTMLDivElement>(null);
  const stopRef = useRef<() => void>(() => {});

  useEffect(
    () =>
      bus.add(({ pre }) => {
        const o = pre > 0 && pre < 1 ? windowed(pre, 0.09, 0.27, 0.03) : 0;
        setFade(root.current, o);
        if (root.current) root.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
      }),
    [bus],
  );

  useEffect(() => () => stopRef.current(), []);

  const play = () => {
    stopRef.current();
    const el = sectionRef.current;
    if (!el) return;
    let tween: gsap.core.Tween | null = null;
    const stop = () => {
      tween?.kill();
      ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((t) => window.removeEventListener(t, onUser, true));
      stopRef.current = () => {};
    };
    const onUser = (e: Event) => {
      if (e.isTrusted) stop();
    };
    const top = el.getBoundingClientRect().top + window.scrollY;
    const end = top + el.offsetHeight - window.innerHeight;
    const proxy = { y: window.scrollY };
    tween = gsap.to(proxy, {
      y: end,
      duration: PLAY_SECONDS * (1 - Math.min(0.9, (window.scrollY - top) / Math.max(1, end - top))),
      ease: 'none',
      onUpdate: () => window.scrollTo(0, proxy.y),
      onComplete: stop,
    });
    // give the click itself a moment to finish before listening for take-over
    window.setTimeout(() => ['wheel', 'touchstart', 'mousedown', 'keydown'].forEach((t) => window.addEventListener(t, onUser, true)), 300);
    stopRef.current = stop;
  };

  const skip = () => {
    stopRef.current();
    document.getElementById('after-demo')?.scrollIntoView({ behavior: 'auto' });
  };

  return (
    <div className="fastlane" ref={root}>
      <button type="button" className="fastlane__play" onClick={play}>
        View the 60-second experience <span aria-hidden="true">→</span>
      </button>
      <button type="button" className="fastlane__skip" onClick={skip}>
        Skip to overview
      </button>
    </div>
  );
}
