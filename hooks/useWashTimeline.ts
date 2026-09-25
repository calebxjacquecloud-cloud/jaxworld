'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { sampleAll, type ChannelValues } from '@/lib/timeline';
import { discreteProgress } from '@/lib/washStages';
import { WASH_TRACKS } from '@/data/washSequence';
import { INTRO_ONLY_CHANNELS, INTRO_TRACKS, splitProgress } from '@/data/introSequence';
import { INTRO } from '@/lib/animationConfig';
import type { WashScene } from '@/components/wash/WashScene';
import type { ProgressRef } from './useScrollProgress';
import { prefersReducedMotion } from './useReducedMotion';

export interface FrameContext {
  /** Main timeline position shown (0–1). Holds still while the intro plays. */
  t: number;
  /** Overall progress through the section (0–1), intro included. */
  p: number;
  /** Intro progress: 0 before it, 1 after it (always 0 when the intro is off). */
  u: number;
  state: ChannelValues;
  scene: WashScene | null;
  time: number;
}

export type FrameFn = (ctx: FrameContext) => void;

export interface FrameBus {
  add(fn: FrameFn): () => void;
}

/** Channels that animate on their own (spray, pulsing markers, scan sweep) even when progress is still. */
function hasLiveEffects(s: ChannelValues): boolean {
  return s.aSpray > 0.01 || s.bSpray > 0.01 || s.marker > 0.01 || s.sweepOn > 0.01 || s.camActive > 0.01;
}

/**
 * The single animation loop for the wash demo. Each frame it samples every
 * timeline channel at the current progress, poses the 3D scene and hands the
 * same state to the HTML overlays. It pauses when the section is off screen,
 * and skips work entirely when nothing is moving.
 */
export function useWashTimeline(
  sectionRef: RefObject<HTMLElement>,
  progress: ProgressRef,
  sceneRef: RefObject<WashScene | null>,
  /** Play the desktop "meet the bay" intro (data/introSequence.ts). */
  intro: boolean,
): FrameBus {
  const listeners = useRef(new Set<FrameFn>());
  const bus = useRef<FrameBus>({
    add(fn) {
      listeners.current.add(fn);
      return () => listeners.current.delete(fn);
    },
  });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const state: ChannelValues = {};
    const ctx: FrameContext = { t: 0, p: 0, u: 0, state, scene: null, time: 0 };
    const split = { t: 0, u: 0 };
    const start = performance.now();
    const reduced = prefersReducedMotion();
    let visible = true;
    let raf = 0;
    let lastP = -1;
    let lastScene: WashScene | null = null;

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(el);

    function frame(now: number) {
      raf = 0;
      if (!visible) return;
      raf = requestAnimationFrame(frame);

      const p = reduced && !progress.stepped ? discreteProgress(progress.raw) : progress.value;
      const scene = sceneRef.current;
      const moved = Math.abs(p - lastP) > 1e-6;
      const sceneChanged = scene !== lastScene;
      // idle: same progress, nothing animating by itself, nothing resized → skip the frame
      if (!moved && !sceneChanged && !hasLiveEffects(state) && !scene?.consumeDirty()) return;
      lastP = p;
      lastScene = scene;

      if (intro) splitProgress(p, INTRO.at, INTRO.length, split);
      else {
        split.t = p;
        split.u = 0;
      }
      sampleAll(WASH_TRACKS, split.t, state);
      if (split.u > 0 && split.u < 1) sampleAll(INTRO_TRACKS, split.u, state);
      else for (const k of INTRO_ONLY_CHANNELS) state[k] = 0;
      ctx.t = split.t;
      ctx.p = p;
      ctx.u = split.u;
      ctx.time = (now - start) / 1000;
      ctx.scene = scene;
      if (scene) {
        scene.apply(state, ctx.time);
        scene.render();
      }
      listeners.current.forEach((fn) => fn(ctx));
    }
    raf = requestAnimationFrame(frame);

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sectionRef, progress, sceneRef, intro]);

  return bus.current;
}
