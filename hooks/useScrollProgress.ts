'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './useReducedMotion';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export interface ProgressRef {
  /** Progress shown by the scene, 0–1 (scrubbed on desktop, tweened per step on touch). */
  value: number;
  /** Raw scroll progress, 0–1 (used for reduced-motion chapter mapping). */
  raw: number;
  /** True for stepped touch playback, which handles reduced motion itself. */
  stepped?: boolean;
}

/**
 * Maps the scroll position across `sectionRef` to a normalized 0–1 progress.
 * GSAP scrub smooths it, and scrolling up plays it backwards. The value lives
 * in a ref, so reading it every frame never re-renders React.
 */
export function useScrollProgress(
  sectionRef: RefObject<HTMLElement>,
  opts: { scrub?: number; start?: string; end?: string; enabled?: boolean } = {},
): ProgressRef {
  const progress = useRef<ProgressRef>({ value: 0, raw: 0 });
  const { scrub = 0.7, start = 'top top', end = 'bottom bottom', enabled = true } = opts;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !enabled) return;
    const reduced = prefersReducedMotion();
    const proxy = progress.current;
    const tween = gsap.to(proxy, {
      value: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start,
        end,
        scrub: reduced ? true : scrub,
        onUpdate: (self) => {
          proxy.raw = self.progress;
        },
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [sectionRef, scrub, start, end, enabled]);

  return progress.current;
}

/**
 * Scrubbed progress for a supporting section, delivered to a callback that
 * writes straight to the DOM/SVG. Reduced-motion visitors get the finished
 * state immediately.
 */
export function useSectionScrub(
  sectionRef: RefObject<HTMLElement>,
  onProgress: (p: number) => void,
  opts: { start?: string; end?: string; scrub?: number } = {},
) {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  const { start = 'top 75%', end = 'bottom 60%', scrub = 1.2 } = opts;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      cb.current(1);
      return;
    }
    const proxy = { p: 0 };
    cb.current(0);
    const tween = gsap.to(proxy, {
      p: 1,
      ease: 'none',
      scrollTrigger: { trigger: el, start, end, scrub },
      onUpdate: () => cb.current(proxy.p),
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [sectionRef, start, end, scrub]);
}
