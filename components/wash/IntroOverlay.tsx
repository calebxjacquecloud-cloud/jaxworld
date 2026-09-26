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
 * "Meet the machine" overlays: green rings drawn around the camera pylons
 * (SEE) and robot arms (MOVE), a leader to the close-up window, and the
 * callouts beside it. Also the numbered tags on the tool head's supply lines,
 * shown whenever the close-up window shows the tool head (CLEAN).
 */
export default function IntroOverlay({ bus }: { bus: FrameBus }) {
  const root = useRef<SVGSVGElement>(null);
  const camRings = useRef<(SVGCircleElement | null)[]>([]);
  const armRings = useRef<(SVGCircleElement | null)[]>([]);
  const focusRing = useRef<SVGCircleElement>(null);
  const linkArm = useRef<SVGLineElement>(null);
  const calls = useRef<(HTMLDivElement | null)[]>([]);
  const tags = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const pt: ScreenPoint = { x: 0, y: 0, visible: false };
    const phone = window.matchMedia('(max-width: 760px), (max-aspect-ratio: 9/10)');
    let active = true;
    return bus.add(({ u, state: s, scene }) => {
      // CLEAN: numbered tags on the tool head's supply lines, whenever the window shows it
      if (scene && s.toolView > 0.5) {
        SUPPLY_LINES.forEach((_, i) => {
          scene.projectTool(i, pt);
          setFade(tags.current[i], pt.visible ? 1 : 0, `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0)`);
        });
      } else tags.current.forEach((el) => setFade(el, 0));

      const on = u > 0 && u < 1 && !!scene;
      if (!on) {
        if (active) {
          active = false;
          if (root.current) root.current.style.visibility = 'hidden';
          calls.current.forEach((el) => setFade(el, 0));
        }
        return;
      }
      if (!active && root.current) root.current.style.visibility = 'visible';
      active = true;
      const sc = scene!;
      const box = sc.inset;
      const corner = { x: box.x + box.w, y: box.y };

      // SEE · camera rings, drawn one after another around the ring of pylons
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

      // MOVE · arm rings
      const armFade = 1 - s.ringArmOut;
      for (const i of [0, 1] as const) {
        sc.projectArm(i, pt);
        drawCircle(armRings.current[i], pt.x, pt.y, ARM_R, clamp01(s.ringArm * 1.6 - i * 0.6), armFade);
      }
      sc.projectArm(FOCUS_ARM as 0 | 1, pt);
      drawLink(linkArm.current, pt, phone.matches ? 0 : ARM_R, corner, phone.matches ? 0 : s.linkArm);

      // callouts: right of the lower-left close-up (desktop), or across the bottom (phones, via CSS)
      const cx = phone.matches ? 0 : box.x + box.w + 24;
      [s.call1, s.call2].forEach((o, i) => {
        setFade(calls.current[i], o, `translate3d(${cx}px, ${((1 - o) * 10).toFixed(1)}px, 0)`);
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
        <p className="eyebrow">01 · See</p>
        <h3 className="intro__title">The eyes.</h3>
        <p className="intro__body">Eight cameras map the vehicle before cleaning begins.</p>
        <ul className="intro__list">
          <li>Body geometry</li>
          <li>Wheels</li>
          <li>Sensitive areas</li>
          <li>Existing marks</li>
          <li>Areas that need extra attention</li>
        </ul>
      </div>

      <div
        className="intro__call"
        ref={(el) => {
          calls.current[1] = el;
        }}
      >
        <p className="eyebrow">03 · Move</p>
        <h3 className="intro__title">The hands.</h3>
        <p className="intro__body">Two robotic arms, each riding its own floor track. The machine moves around the car.</p>
      </div>
    </div>
  );
}
