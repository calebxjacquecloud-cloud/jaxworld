'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { SCROLL } from '@/lib/animationConfig';
import type { ProgressRef } from './useScrollProgress';
import { prefersReducedMotion } from './useReducedMotion';

/**
 * Stepped playback for touch screens.
 *
 * The demo occupies exactly one screen. While it fills the screen, a swipe (or
 * wheel notch / arrow key) moves one step forward or back, and the timeline
 * plays to that step at a steady pace, then stops. Native scrolling is only
 * blocked for gestures that change the step, so a swipe past the last step
 * continues down the page and scrolling back up re-enters the demo.
 *
 * The visitor never fights momentum or a snap: the page doesn't scroll while
 * stepping, and the animation is time-based, not position-based.
 */
export function useStepProgress(
  sectionRef: RefObject<HTMLElement>,
  stops: number[],
  enabled: boolean,
  /** In-page links (e.g. "#modular") that should jump straight to a step. */
  jumps: Record<string, number> = {},
): ProgressRef {
  const progress = useRef<ProgressRef>({ value: 0, raw: 0, stepped: true });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !enabled) return;
    const proxy = progress.current;
    const last = stops.length - 1;
    const reduced = prefersReducedMotion();
    const cfg = SCROLL.step;
    let index = 0;
    let tween: gsap.core.Tween | null = null;

    /**
     * True while the page is scrolled no further than the demo's own top edge,
     * i.e. the demo is what's on screen. Measured against the document rather
     * than the viewport edge, because hosts (like the Claude app) may inset the
     * page from the top of the screen.
     */
    const engaged = () => {
      const docTop = el.getBoundingClientRect().top + window.scrollY;
      return window.scrollY <= docTop + 2;
    };
    const canStep = (dir: 1 | -1) => engaged() && (dir > 0 ? index < last : index > 0);

    const goTo = (i: number, instant = false) => {
      const from = index;
      index = Math.max(0, Math.min(last, i));
      proxy.index = index;
      const target = stops[index];
      const dist = Math.abs(target - proxy.value);
      tween?.kill();
      if (instant) {
        proxy.value = proxy.raw = target;
        return;
      }
      tween = gsap.to(proxy, {
        value: target,
        raw: target,
        duration: reduced ? 0 : Math.min(cfg.maxDuration, Math.max(cfg.minDuration, dist / cfg.speed)),
        // leaving the first screen (Start) moves at a steady pace from the first frame, so there's
        // no slow ease-in before the door lifts; every other step eases in and out
        ease: from === 0 && index === 1 ? 'none' : 'power1.inOut',
      });
    };
    const step = (dir: 1 | -1) => goTo(index + dir);
    proxy.index = index;
    proxy.count = stops.length;
    proxy.go = step;

    // ── touch ──
    let y0 = 0;
    let mode: 'undecided' | 'step' | 'native' = 'native';
    let dir: 1 | -1 = 1;
    const onTouchStart = (e: TouchEvent) => {
      y0 = e.touches[0].clientY;
      mode = 'undecided';
    };
    const onTouchMove = (e: TouchEvent) => {
      if (mode === 'native') return;
      const dy = y0 - e.touches[0].clientY; // > 0: finger moved up = forward
      if (mode === 'undecided') {
        if (Math.abs(dy) < 8) return;
        dir = dy > 0 ? 1 : -1;
        mode = canStep(dir) ? 'step' : 'native';
      }
      if (mode === 'step' && e.cancelable) e.preventDefault();
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (mode !== 'step') return;
      const dy = y0 - (e.changedTouches[0]?.clientY ?? y0);
      if (Math.abs(dy) >= cfg.swipeThreshold && Math.sign(dy) === dir) step(dir);
      mode = 'native';
    };

    // ── wheel / trackpad (touch tablets with keyboards) ──
    let wheelAcc = 0;
    let wheelLockUntil = 0;
    const onWheel = (e: WheelEvent) => {
      const d: 1 | -1 = e.deltaY > 0 ? 1 : -1;
      if (!canStep(d)) return;
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLockUntil) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 40) {
        step(d);
        wheelAcc = 0;
        wheelLockUntil = now + 650;
      }
    };

    // ── keyboard ──
    const onKey = (e: KeyboardEvent) => {
      const fwd = ['ArrowDown', 'PageDown', ' '].includes(e.key);
      const back = ['ArrowUp', 'PageUp'].includes(e.key);
      if (!fwd && !back) return;
      const d: 1 | -1 = fwd ? 1 : -1;
      if (!canStep(d)) return;
      e.preventDefault();
      step(d);
    };

    // ── in-page links into the demo (header / footer nav) ──
    const onLink = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const idx = a ? jumps[a.getAttribute('href') ?? ''] : undefined;
      if (idx === undefined || idx < 0) return;
      e.preventDefault();
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' });
      // a jump cuts straight to the step instead of playing everything in between
      goTo(idx, true);
    };
    document.addEventListener('click', onLink);

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      proxy.go = undefined;
      tween?.kill();
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onLink);
    };
  }, [sectionRef, stops, enabled, jumps]);

  return progress.current;
}
