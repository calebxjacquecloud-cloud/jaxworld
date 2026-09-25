'use client';

import { useEffect, useRef } from 'react';
import type { FrameBus } from '@/hooks/useWashTimeline';
import { FOCUS_ARM, FOCUS_PYLON, SUPPLY_LINES } from '@/data/introSequence';
import { clamp01 } from '@/lib/timeline';
import { setFade } from '@/lib/domWrite';
import type { ScreenPoint } from './WashScene';

const PYLONS = 8;
const CAM_R = 26;
const ARM_R = 64;

/** SVG circle that "draws" from start to end: dash offset runs from the full circumference to 0. */
function drawCircle(el: SVGCircleElement | null, x: number, y: number, r: number, draw: number, fade: number) {
  if (!el) return;
  const c = 2 * Math.PI * r;
  el.setAttribute('cx', x.toFixed(1));
  el.setAttribute('cy', y.toFixed(1));
  el.setAttribute('r', String(r));
  el.style.strokeDasharray = `${c.toFixed(1)}`;
  el.style.strokeDashoffset = `${(c * (1 - draw)).toFixed(1)}`;
  el.style.opacity = draw > 0.001 ? String(fade) : '0';
}

/** Straight leader from a ring's edge to the close-up window's top-right corner, drawn start to end. */
function drawLink(el: SVGLineElement | null, from: ScreenPoint, r: number, to: { x: number; y: number }, draw: number) {
  if (!el) return;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const x1 = from.x + (dx / len) * r;
  const y1 = from.y + (dy / len) * r;
  const L = Math.max(1, len - r);
  el.setAttribute('x1', x1.toFixed(1));
  el.setAttribute('y1', y1.toFixed(1));
  el.setAttribute('x2', to.x.toFixed(1));
  el.setAttribute('y2', to.y.toFixed(1));
  el.style.strokeDasharray = `${L.toFixed(1)}`;
  el.style.strokeDashoffset = `${(L * (1 - draw)).toFixed(1)}`;
  el.style.opacity = draw > 0.001 ? '1' : '0';
}

/**
 * Desktop "meet the bay" intro overlays: green rings drawn around the camera
 * pylons and robot arms, leader lines to the close-up window, the callouts
 * beside the window, and numbered tags on the tool head's supply lines.
 */
export default function IntroOverlay({ bus }: { bus: FrameBus }) {
  const root = useRef<SVGSVGElement>(null);
  const camRings = useRef<(SVGCircleElement | null)[]>([]);
  const armRings = useRef<(SVGCircleElement | null)[]>([]);
  const focusRing = useRef<SVGCircleElement>(null);
  const linkArm = useRef<SVGLineElement>(null);
  const calls = useRef<(HTMLDivElement | null)[]>([]);
  const hoseItems = useRef<(HTMLLIElement | null)[]>([]);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const pt: ScreenPoint = { x: 0, y: 0, visible: false };
    let active = true;
    return bus.add(({ u, state: s, scene }) => {
      const on = u > 0 && u < 1 && !!scene;
      if (!on) {
        if (active) {
          active = false;
          if (root.current) root.current.style.visibility = 'hidden';
          calls.current.forEach((el) => setFade(el, 0));
          tags.current.forEach((el) => setFade(el, 0));
        }
        return;
      }
      if (!active && root.current) root.current.style.visibility = 'visible';
      active = true;
      const sc = scene!;
      const box = sc.inset;
      const corner = { x: box.x + box.w, y: box.y };

      // 1 · camera rings, drawn one after another around the ring of pylons
      const n = Math.min(PYLONS, sc.pylonCount);
      const camFade = 1 - s.ringCamOut;
      for (let i = 0; i < n; i++) {
        sc.projectPylon(i, pt);
        const draw = clamp01((s.ringCam * (n + 2) - i) / 3);
        drawCircle(camRings.current[i], pt.x, pt.y, i === FOCUS_PYLON ? CAM_R + 6 : CAM_R, draw, camFade);
      }
      // the pylon shown in the close-up gets a second, outer ring
      sc.projectPylon(FOCUS_PYLON, pt);
      drawCircle(focusRing.current, pt.x, pt.y, CAM_R + 16, s.focusRing, camFade);

      // 2 · arm rings
      const armFade = 1 - s.ringArmOut;
      for (const i of [0, 1] as const) {
        sc.projectArm(i, pt);
        drawCircle(armRings.current[i], pt.x, pt.y, ARM_R, clamp01(s.ringArm * 1.6 - i * 0.6), armFade);
      }
      sc.projectArm(FOCUS_ARM as 0 | 1, pt);
      drawLink(linkArm.current, pt, ARM_R, corner, s.linkArm);

      // callouts sit to the right of the close-up window, bottom-aligned with it (CSS)
      const cx = box.x + box.w + 24;
      [s.call1, s.call2, s.call3].forEach((o, i) => {
        setFade(calls.current[i], o, `translate3d(${cx}px, ${((1 - o) * 10).toFixed(1)}px, 0)`);
      });

      // 3 · supply lines light up one by one, with numbered tags on the model
      const lit = Math.ceil(s.hoseStep);
      hoseItems.current.forEach((li, i) => li?.classList.toggle('is-on', i < lit));
      hoseItems.current.forEach((li, i) => li?.classList.toggle('is-now', i === lit - 1));
      SUPPLY_LINES.forEach((_, i) => {
        sc.projectTool(i, pt);
        setFade(tags.current[i], pt.visible ? s.call3 : 0, `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`);
      });
    });
  }, [bus]);

  return (
    <div className="intro" aria-hidden="true">
      <svg className="intro__rings" ref={root}>
        {Array.from({ length: PYLONS }, (_, i) => (
          <circle
            key={i}
            className="intro__ring"
            ref={(el) => {
              camRings.current[i] = el;
            }}
          />
        ))}
        {[0, 1].map((i) => (
          <circle
            key={i}
            className="intro__ring intro__ring--arm"
            ref={(el) => {
              armRings.current[i] = el;
            }}
          />
        ))}
        <circle className="intro__ring intro__ring--focus" ref={focusRing} />
        <line className="intro__link" ref={linkArm} />
      </svg>

      {SUPPLY_LINES.map((l, i) => (
        <span
          key={l.id}
          className="intro__tag mono"
          style={{ '--tone': l.color } as React.CSSProperties}
          ref={(el) => {
            tags.current[i] = el;
          }}
        >
          {i + 1}
        </span>
      ))}

      <div
        className="intro__call"
        ref={(el) => {
          calls.current[0] = el;
        }}
      >
        <p className="eyebrow">The eyes · camera pylons ×8</p>
        <h3 className="intro__title">Cameras are the eyes of the AI.</h3>
        <p className="intro__body">They read the car&rsquo;s surface, memorize its geometry and mark the areas that need focused cleaning.</p>
      </div>

      <div
        className="intro__call"
        ref={(el) => {
          calls.current[1] = el;
        }}
      >
        <p className="eyebrow">The hands · robotic arms ×2</p>
        <h3 className="intro__title">The physical motion for the AI model.</h3>
        <p className="intro__body">Each arm rides its own floor stage and carries the nozzle wherever the vision model&rsquo;s cleaning path sends it.</p>
      </div>

      <div
        className="intro__call"
        ref={(el) => {
          calls.current[2] = el;
        }}
      >
        <p className="eyebrow">The tool head</p>
        <h3 className="intro__title">One nozzle. Five supply lines.</h3>
        <ol className="intro__hoses">
          {SUPPLY_LINES.map((l, i) => (
            <li
              key={l.id}
              style={{ '--tone': l.color } as React.CSSProperties}
              ref={(el) => {
                hoseItems.current[i] = el;
              }}
            >
              <span className="intro__swatch mono">{i + 1}</span>
              <span>
                {l.label}
                {'note' in l && <span className="intro__note"> · {l.note}</span>}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
