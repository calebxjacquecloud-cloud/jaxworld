'use client';

import { useEffect, useRef } from 'react';
import { sampleAll, ramp, windowed, type ChannelValues } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import { prefersReducedMotion } from '@/hooks/useReducedMotion';
import { reportFilmChapter } from '../lib/chapters';
import { FILM_CHAPTERS, FILM_TRACKS, FILM_UNITS } from './sequence';
import type { FilmScene, ScreenPoint, Space } from './FilmScene';
import FilmBeats from './FilmBeats';
import LoopIndicator, { LOOP_STEPS } from './LoopIndicator';

interface TagRef {
  el: HTMLElement;
  anchor: [number, number, number] | null;
  named: string | null;
  space: Space;
  a: number;
  b: number;
}
interface BeatRef {
  el: HTMLElement;
  t0: number;
  t1: number;
  ins: { el: HTMLElement; a: number; b: number }[];
  ons: { el: HTMLElement; a: number; b: number }[];
  strikes: { el: HTMLElement; at: number }[];
  tags: TagRef[];
}

const num = (v: string | undefined, d: number) => (v === undefined || v === '' ? d : Number(v));

/** Scroll smoothing: higher = snappier. Weighted, not floaty. */
const DAMPING = 7.5;
/** A jump bigger than this many units (nav link, overview, scrollbar drag) cuts instead of scrubbing. */
const JUMP_UNITS = 2.2;

function collectBeats(root: HTMLElement): BeatRef[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.vx-beat')).map((el) => ({
    el,
    t0: Number(el.dataset.t0),
    t1: Number(el.dataset.t1),
    ins: Array.from(el.querySelectorAll<HTMLElement>('.vx-in')).map((c) => ({ el: c, a: num(c.dataset.in, -99), b: num(c.dataset.out, 999) })),
    ons: Array.from(el.querySelectorAll<HTMLElement>('.vx-on')).map((c) => {
      const [a, b] = (c.dataset.on || '0,0').split(',').map(Number);
      return { el: c, a, b };
    }),
    strikes: Array.from(el.querySelectorAll<HTMLElement>('[data-strike]')).map((c) => ({ el: c, at: Number(c.dataset.strike) })),
    tags: Array.from(el.querySelectorAll<HTMLElement>('.vx-tag')).map((c) => ({
      el: c,
      anchor: c.dataset.anchor ? (c.dataset.anchor.split(',').map(Number) as [number, number, number]) : null,
      named: c.dataset.named || null,
      space: (c.dataset.space as Space) || 'hero',
      a: num(c.dataset.in, -99),
      b: num(c.dataset.out, 999),
    })),
  }));
}

/** Channels that move on their own (spray, pulsing markers, brushes) even when scroll is still. */
function live(s: ChannelValues, t: number) {
  return (
    s.aSpray > 0.01 || s.bSpray > 0.01 || s.marker > 0.01 || s.sweepOn > 0.01 || s.camActive > 0.01 || s.sensors > 0.01 ||
    (t > 2.7 && t < 5.2) || (s.apWash > 0 && s.apWash < 1) || s.lotCams > 0.01 || (s.set > 0.5 && s.set < 1.5)
  );
}

export default function Film() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fastRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const section = sectionRef.current!;
    const pin = pinRef.current!;
    const canvas = canvasRef.current!;
    const beats = collectBeats(pin);
    const loopItems = Array.from(loopRef.current?.querySelectorAll<HTMLElement>('[data-loop]') ?? []);
    const loopSubs = Array.from(loopRef.current?.querySelectorAll<HTMLElement>('.vx-on') ?? []).map((el) => {
      const [a, b] = (el.dataset.on || '0,0').split(',').map(Number);
      return { el, a, b };
    });
    const reduced = prefersReducedMotion();
    const state: ChannelValues = {};
    const pt: ScreenPoint = { x: 0, y: 0, visible: false };
    let scene: FilmScene | null = null;
    let disposed = false;
    let raf = 0;
    let visible = true;
    let value = -1;
    let lastT = -1;
    let lastNow = performance.now();
    let captured = false;
    const start = performance.now();

    // three.js loads after the shell has painted
    import('./FilmScene')
      .then(({ FilmScene }) => {
        if (disposed) return;
        try {
          scene = new FilmScene(canvas, () => kick());
          const r = pin.getBoundingClientRect();
          scene.resize(r.width, r.height);
          section.dataset.status = 'ready';
        } catch {
          section.dataset.status = 'error';
        }
        kick();
      })
      .catch(() => (section.dataset.status = 'error'));

    const ro = new ResizeObserver(() => {
      const r = pin.getBoundingClientRect();
      scene?.resize(r.width, r.height);
      kick();
    });
    ro.observe(pin);

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) reportFilmChapter(null);
      kick();
    });
    io.observe(section);

    const onScroll = () => kick();
    window.addEventListener('scroll', onScroll, { passive: true });

    function kick() {
      if (!raf && visible && !disposed) raf = requestAnimationFrame(frame);
    }

    function target() {
      const r = section.getBoundingClientRect();
      const span = r.height - pin.offsetHeight;
      return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    }

    function frame(now: number) {
      raf = 0;
      if (!visible || disposed) return;
      const dt = Math.min(0.1, (now - lastNow) / 1000);
      lastNow = now;
      const goal = target();
      if (value < 0 || reduced || Math.abs(goal - value) * FILM_UNITS > JUMP_UNITS) value = goal;
      else value += (goal - value) * (1 - Math.exp(-dt * DAMPING));
      if (Math.abs(goal - value) < 1e-5) value = goal;
      const t = value * FILM_UNITS;
      const moving = value !== goal;
      const changed = Math.abs(t - lastT) > 1e-5;

      if (changed || live(state, t) || scene?.consumeDirty()) {
        sampleAll(FILM_TRACKS, t, state);
        const time = (now - start) / 1000;
        if (scene) {
          scene.apply(state, time);
          if (!captured && t > 17.2) {
            captured = true;
            const shots = scene.capturePhotos();
            pin.querySelectorAll<HTMLImageElement>('img[data-photo]').forEach((img) => {
              const id = img.dataset.photo!;
              img.src = id[0] === 'm' ? shots.manual[Number(id.slice(1))] : shots.standard[Number(id.slice(1))];
            });
            scene.apply(state, time);
          }
          scene.render();
        }
        writeOverlays(t);
        lastT = t;
      }
      if (moving || live(state, t)) raf = requestAnimationFrame(frame);
    }

    function writeOverlays(t: number) {
      const w = pin.clientWidth;
      for (const b of beats) {
        const o = b.el.classList.contains('vx-beat--nofadein') ? (t <= b.t1 ? Math.min(1, (b.t1 - t) / 0.16) : 0) : windowed(t, b.t0, b.t1, 0.14);
        setFade(b.el, o);
        if (o <= 0) continue;
        for (const c of b.ins) {
          const v = ramp(t, c.a, c.a + 0.1) * (1 - ramp(t, c.b - 0.06, c.b));
          setFade(c.el, v, `translate3d(0, ${((1 - v) * 12).toFixed(1)}px, 0)`);
        }
        for (const c of b.ons) {
          c.el.classList.toggle('is-on', t >= c.a && t < c.b);
          c.el.classList.toggle('is-done', t >= c.b);
        }
        for (const s of b.strikes) s.el.classList.toggle('is-on', t >= s.at);
        for (const g of b.tags) {
          const v = ramp(t, g.a, g.a + 0.08) * (1 - ramp(t, g.b - 0.05, g.b));
          if (v <= 0 || !scene) {
            setFade(g.el, 0);
            continue;
          }
          if (g.anchor) scene.projectPoint(g.anchor[0], g.anchor[1], g.anchor[2], g.space, pt);
          else if (g.named) scene.projectNamed(g.named, pt);
          else pt.visible = false;
          setFade(g.el, pt.visible ? v : 0, `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`);
        }
      }
      // SEE → THINK → ACT → VERIFY
      const loopOn = windowed(t, 7.25, 16.02, 0.2);
      setFade(loopRef.current, loopOn);
      if (loopOn > 0)
        loopItems.forEach((el) => {
          const [a, b] = LOOP_STEPS[Number(el.dataset.loop)].range;
          el.classList.toggle('is-on', t >= a && t < b);
          el.classList.toggle('is-done', t >= b);
        });
      if (loopOn > 0)
        for (const c of loopSubs) {
          c.el.classList.toggle('is-on', t >= c.a && t < c.b);
          c.el.classList.toggle('is-done', t >= c.b);
        }
      // pre/post-wash comparison divider
      const cmp = state.cmpOn > 0.5 && state.set < 0.5;
      setFade(dividerRef.current, cmp ? windowed(t, 16.3, 17.3, 0.1) : 0, `translate3d(${(state.cmpX * w).toFixed(1)}px, 0, 0)`);
      dividerRef.current?.classList.toggle('is-done', state.cmpX < 0.02);
      setFade(scrimRef.current, windowed(t, 18.4, 20.7, 0.14) * 0.9);
      setFade(veilRef.current, state.veil);
      setFade(fastRef.current, windowed(t, 0.95, 6.9, 0.2));
      if (railRef.current) railRef.current.style.transform = `scaleX(${value.toFixed(4)})`;
      pin.classList.toggle('is-garage', t < 0.72);

      // story-progress indicator
      if (t < 0.72) reportFilmChapter({ index: -1, frac: 0 });
      else {
        let i = FILM_CHAPTERS.length - 1;
        while (i > 0 && t < FILM_CHAPTERS[i].at) i--;
        const a = FILM_CHAPTERS[i].at;
        const b = i + 1 < FILM_CHAPTERS.length ? FILM_CHAPTERS[i + 1].at : FILM_UNITS;
        reportFilmChapter({ index: FILM_CHAPTERS[i].chapter, frac: Math.min(1, (t - a) / (b - a)) });
      }
    }

    raf = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      reportFilmChapter(null);
      scene?.dispose();
    };
  }, []);

  return (
    <section
      id="film"
      ref={sectionRef}
      className="vx-film"
      data-units={FILM_UNITS}
      data-status="loading"
      data-chapter-film
      style={{ '--vx-film-units': FILM_UNITS } as React.CSSProperties}
      aria-label="The Carwash-O-Matic story, told by scrolling"
    >
      <div className="vx-film__pin is-garage" ref={pinRef}>
        <canvas className="vx-film__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="vx-film__vignette" aria-hidden="true" />
        <div className="vx-film__scrim" ref={scrimRef} aria-hidden="true" />
        <div className="vx-divider" ref={dividerRef} aria-hidden="true">
          <span className="vx-divider__l mono">Pre-wash scan</span>
          <span className="vx-divider__r mono">Post-wash scan</span>
        </div>
        <FilmBeats />
        <LoopIndicator ref={loopRef} />
        <button type="button" className="vx-fast" ref={fastRef} onClick={() => window.dispatchEvent(new Event('vx:overview'))}>
          Investor overview <span aria-hidden="true">→</span>
        </button>
        <div className="vx-film__veil" ref={veilRef} aria-hidden="true" />
        <div className="vx-film__rail" aria-hidden="true">
          <div ref={railRef} />
        </div>
      </div>
    </section>
  );
}
