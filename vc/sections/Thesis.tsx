'use client';

import ScrollScene from '../components/ScrollScene';
import { In } from '../film/primitives';

function Eye() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M4 24 Q24 6 44 24 Q24 42 4 24 Z" />
      <circle cx="24" cy="24" r="7" />
      <circle cx="24" cy="24" r="2.5" className="fill" />
    </svg>
  );
}
function Plan() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="10" cy="12" r="4" />
      <circle cx="38" cy="12" r="4" />
      <circle cx="24" cy="36" r="4" />
      <path d="M14 12 H34 M12 15 L22 33 M36 15 L26 33" />
    </svg>
  );
}
function Arm() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 42 H22 M15 42 V34 L28 18 L40 22" />
      <circle cx="15" cy="34" r="3" />
      <circle cx="28" cy="18" r="3" />
      <path d="M40 22 L44 18 M40 22 L44 26" />
    </svg>
  );
}

/** ACT 13 · The physical-AI thesis, stated only after it has been shown. */
export default function Thesis() {
  return (
    <ScrollScene units={3.4} chapter={5} tone="ink" label="Physical AI" className="vx-center-scene">
      <div className="vx-thesis">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={2.3}>
            <h2 className="vx-display vx-big">
              AI should move <br />
              more than pixels.
            </h2>
            <ol className="vx-see">
              <In as="li" at={0.9}>
                <Eye />
                <span>Cameras see.</span>
              </In>
              <In as="li" at={1.15}>
                <Plan />
                <span>Software decides.</span>
              </In>
              <In as="li" at={1.4}>
                <Arm />
                <span>Robots act.</span>
              </In>
            </ol>
          </div>
          <p className="vx-in vx-display vx-big vx-lines" data-in={2.35}>
            <In as="span" at={2.4}>See locally.</In>
            <In as="span" at={2.6}>Learn centrally.</In>
            <In as="span" at={2.8} className="vx-accent">Improve everywhere.</In>
          </p>
        </div>
      </div>
    </ScrollScene>
  );
}
