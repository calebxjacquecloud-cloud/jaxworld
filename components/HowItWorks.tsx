'use client';

import { ScrollTrigger } from 'gsap/ScrollTrigger';
import WashRecap from './sections/WashRecap';
import MotionAnalogy from './sections/MotionAnalogy';

/**
 * Collapsed reference: the step-by-step explanation, the motion-system
 * analogy and the development-status key. Kept out of the story's path so the
 * page never restarts the product explanation after the container.
 */
export default function HowItWorks() {
  return (
    <section id="how" data-act="5" className="how" aria-label="How it works, reference">
      <details className="how__details" onToggle={() => ScrollTrigger.refresh()}>
        <summary className="how__summary">
          <span className="mono">Reference</span> How it works · development status
        </summary>
        <WashRecap />
        <MotionAnalogy />
      </details>
    </section>
  );
}
