'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { clamp01 } from '@/lib/timeline';
import SectionHead from './sections/SectionHead';
import Starburst from './Starburst';

const INPUTS = ['Cameras see', 'Software decides', 'Robots act'];

export default function PhysicalAI() {
  const sectionRef = useRef<HTMLElement>(null);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const hub = useRef<HTMLDivElement>(null);

  useSectionScrub(sectionRef, (p) => {
    lines.current.forEach((l, i) => {
      if (!l) return;
      const u = clamp01((p - 0.15 - i * 0.06) / 0.25);
      l.style.strokeDashoffset = String(1 - u);
    });
    if (hub.current) hub.current.classList.toggle('is-on', p > 0.6);
  });

  return (
    <section id="thesis" data-act="5" ref={sectionRef} className="section section--cream physical" aria-labelledby="pai-title">
      <div className="section__inner physical__grid">
        <div>
          <SectionHead
            id="pai-title"
            eyebrow="The thesis · physical AI"
            title="AI should move more than pixels."
          />
          <div className="physical__body">
            <p className="physical__trio">
              Cameras see.
              <br />
              Software decides.
              <br />
              Robots act.
            </p>
            <p>The same intelligence that understands the physical world can operate inside it.</p>
          </div>
        </div>
        <div className="physical__diagram" aria-label="See, decide, act: one physical AI loop">
          <ul className="physical__inputs">
            {INPUTS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <svg className="physical__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {INPUTS.map((t, i) => {
              const y = 17 + i * 33;
              return (
                <path
                  key={t}
                  ref={(el) => {
                    lines.current[i] = el;
                  }}
                  d={`M0 ${y} C 50 ${y}, 50 50, 100 50`}
                  pathLength={1}
                  vectorEffect="non-scaling-stroke"
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                />
              );
            })}
          </svg>
          <div className="physical__hub" ref={hub}>
            <Starburst className="physical__burst" points={10} />
            <p className="physical__hub-title">Physical AI</p>
            <p className="physical__hub-sub mono">see · decide · act</p>
          </div>
        </div>
      </div>
    </section>
  );
}
