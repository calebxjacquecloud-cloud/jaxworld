'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { sampleAll, type ChannelValues } from '@/lib/timeline';
import { discreteProgress } from '@/lib/washStages';
import { WASH_TRACKS } from '@/data/washSequence';
import { INTRO_ONLY_CHANNELS, INTRO_TRACKS } from '@/data/introSequence';
import { OUTRO_ONLY_CHANNELS, OUTRO_TRACKS } from '@/data/outroSequence';
import { INTRO, OUTRO } from '@/lib/animationConfig';
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
  /** Outro ("pack it up") progress: 0 until the wash ends, then 0→1. */
  o: number;
  state: ChannelValues;
  scene: WashScene | null;
  time: number;
}

export type FrameFn = (ctx: FrameContext) => void;

export interface FrameBus {
  add(fn: FrameFn): () => void;
}

/**
 * Where the scroll is: main timeline `t`, desktop intro `u`, outro `o`.
 *
 * Desktop (scrub): progress 0–1 covers main + intro + outro, so it is
 * stretched to that combined length and the intro spliced in at INTRO.at.
 * Touch (stepped): progress already runs 0 → 1 + OUTRO.length (see SWIPE_STOPS).
 * Reduced motion (desktop): each chapter snaps to its hold frame; the outro
 * snaps to its final frame.
 */
function mapProgress(v: number, stepped: boolean, intro: boolean, discrete: boolean, out: { t: number; u: number; o: number }) {
  const L = OUTRO.length;
  let E: number;
  out.u = 0;
  if (stepped) E = v;
  else {
    const D = intro ? INTRO.length : 0;
    E = v * (1 + D + L);
    if (intro) {
      if (E >= INTRO.at && E < INTRO.at + D) {
        out.t = INTRO.at;
        out.u = (E - INTRO.at) / D;
        out.o = 0;
        return out;
      }
      if (E >= INTRO.at + D) {
        E -= D;
        out.u = 1;
      }
    }
  }
  if (E <= 1) {
    out.t = discrete ? discreteProgress(Math.max(0, E)) : Math.max(0, E);
    out.o = 0;
  } else {
    out.t = 1;
    out.o = discrete ? 1 : Math.min(1, (E - 1) / L);
  }
  return out;
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
    const ctx: FrameContext = { t: 0, p: 0, u: 0, o: 0, state, scene: null, time: 0 };
    const split = { t: 0, u: 0, o: 0 };
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

      const discrete = reduced && !progress.stepped;
      const p = discrete ? progress.raw : progress.value;
      const scene = sceneRef.current;
      const moved = Math.abs(p - lastP) > 1e-6;
      const sceneChanged = scene !== lastScene;
      // idle: same progress, nothing animating by itself, nothing resized → skip the frame
      if (!moved && !sceneChanged && !hasLiveEffects(state) && !scene?.consumeDirty()) return;
      lastP = p;
      lastScene = scene;

      mapProgress(p, !!progress.stepped, intro, discrete, split);
      sampleAll(WASH_TRACKS, split.t, state);
      if (split.u > 0 && split.u < 1) sampleAll(INTRO_TRACKS, split.u, state);
      else for (const k of INTRO_ONLY_CHANNELS) state[k] = 0;
      if (split.o > 0) sampleAll(OUTRO_TRACKS, split.o, state);
      else for (const k of OUTRO_ONLY_CHANNELS) state[k] = 0;
      ctx.t = split.t;
      ctx.p = progress.stepped ? p / (1 + OUTRO.length) : p;
      ctx.u = split.u;
      ctx.o = split.o;
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
