'use client';

import { useRef } from 'react';
import { useSectionScrub } from '@/hooks/useScrollProgress';
import { clamp01 } from '@/lib/timeline';
import SectionHead from './sections/SectionHead';
import Starburst from './Starburst';

const INPUTS = ['Computer vision', 'Robotics', 'Automation', 'Physical infrastructure', 'Recurring consumer demand'];

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
    <section ref={sectionRef} className="section section--cream physical" aria-labelledby="pai-title">
      <div className="section__inner physical__grid">
        <div>
          <SectionHead
            id="pai-title"
            eyebrow="The thesis · physical AI"
            title="AI should move more than pixels."
            lede="Machine learning is creating a great deal of value in software. Jax World's thesis is to point that intelligence at a service people buy again and again in the physical world."
          />
          <div className="physical__body">
            <p>
              Vehicle cleaning is frequent, local and badly served by fixed machines that treat every car the same. It is a good fit for perception plus
              robotics: the models that understand one car&rsquo;s shape can plan the path for the next one, and every wash adds to what the system has seen.
            </p>
            <p>
              The opportunity is the combination. Computer vision alone is a feature, and a car wash alone is a local business. Together, running on modular
              hardware, they become a repeatable physical service that can be monitored and improved from one place.
            </p>
          </div>
        </div>
        <div className="physical__diagram" aria-label="Five inputs combine into one recurring physical-world service">
          <ul className="physical__inputs">
            {INPUTS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <svg className="physical__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {INPUTS.map((t, i) => {
              const y = 10 + i * 20;
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
            <p className="physical__hub-title">A recurring physical-world service</p>
            <p className="physical__hub-sub mono">vision · motion · infrastructure · demand</p>
          </div>
        </div>
      </div>
    </section>
  );
}
