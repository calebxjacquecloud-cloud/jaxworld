'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { useStepProgress } from '@/hooks/useStepProgress';
import { useWashTimeline } from '@/hooks/useWashTimeline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { INTRO, OUTRO, SCROLL, isTouchLayout } from '@/lib/animationConfig';
import { SWIPE_STOPS } from '@/lib/washStages';
import type { WashScene } from './wash/WashScene';
import VehicleStage from './wash/VehicleStage';
import WashCopy from './wash/WashCopy';
import ScannerOverlay from './wash/ScannerOverlay';
import InspectionOverlay from './wash/InspectionOverlay';
import ConditionPanel from './wash/ConditionPanel';
import WashTimeline from './wash/WashTimeline';
import DetailWindow from './wash/DetailWindow';
import IntroOverlay from './wash/IntroOverlay';
import OutroOverlay from './wash/OutroOverlay';
import Hero from './Hero';

/**
 * The wash demonstration.
 *
 * Desktop: one tall section with a sticky viewport; scrolling scrubs the
 * timeline forward and backward.
 * Touch: the section is one screen tall and plays step by step, one swipe per
 * step (hooks/useStepProgress.ts).
 */
/** Scroll fraction of the desktop section where the outro's "can move" copy is up. */
const MODULAR_ANCHOR_P = (1 + INTRO.length + OUTRO.length * 0.24) / (1 + INTRO.length + OUTRO.length);
/** Phone step for the same moment. */
const MODULAR_STEP = SWIPE_STOPS.findIndex((v) => v >= 1 + OUTRO.length * 0.3);
const STEP_JUMPS = { '#modular': MODULAR_STEP };

export default function WashExperience() {
  const sectionRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<WashScene | null>(null);
  // decided after mount so server and first client render match
  const [stepped, setStepped] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => setStepped(isTouchLayout()), []);

  // Stepped: size the demo to exactly the visible screen below any host inset
  // (e.g. the Claude app pads the page top), so nothing sits off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !stepped) return;
    const fit = () => {
      const docTop = el.getBoundingClientRect().top + window.scrollY;
      el.style.setProperty('--stepped-h', `${Math.max(320, window.innerHeight - docTop)}px`);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [stepped]);

  const scrubbed = useScrollProgress(sectionRef, { scrub: SCROLL.scrub, enabled: !stepped });
  const steps = useStepProgress(sectionRef, SWIPE_STOPS, stepped, STEP_JUMPS);
  // The "meet the bay" intro is desktop-only for now; reduced motion keeps the chapter-by-chapter view.
  const bus = useWashTimeline(sectionRef, stepped ? steps : scrubbed, sceneRef, !stepped && !reducedMotion);

  return (
    <section
      id="wash"
      ref={sectionRef}
      className={`wash${stepped ? ' wash--stepped' : ''}`}
      style={{ '--wash-h': `${SCROLL.washSectionVh}vh` } as React.CSSProperties}
      aria-label="Interactive wash demonstration"
    >
      {/* "Modular" nav target: desktop lands on the outro's "infrastructure that can move" moment */}
      <div id="modular" className="wash__anchor" style={{ '--anchor-p': MODULAR_ANCHOR_P } as React.CSSProperties} aria-hidden="true" />
      <div className="wash__pin">
        <VehicleStage sceneRef={sceneRef} />
        <div className="wash__vignette" aria-hidden="true" />
        <DetailWindow bus={bus} />
        <IntroOverlay bus={bus} />
        <OutroOverlay bus={bus} />
        <ScannerOverlay bus={bus} />
        <InspectionOverlay bus={bus} />
        <ConditionPanel bus={bus} />
        <Hero bus={bus} />
        <WashCopy bus={bus} />
        <WashTimeline bus={bus} />
      </div>
    </section>
  );
}
