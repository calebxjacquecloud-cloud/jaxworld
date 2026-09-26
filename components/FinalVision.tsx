'use client';

import { useEffect, useRef } from 'react';
import { drawLivery } from '@/lib/livery';

/**
 * FINAL VISION: the container livery returns as the closing brand image,
 * with the line that names the whole idea. Leads straight into the CTA.
 */
export default function FinalVision() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const paint = () => drawLivery(c);
    paint();
    // repaint once the brand fonts have loaded
    if (document.fonts) {
      Promise.all([
        document.fonts.load('800 60px "Unbounded"'),
        document.fonts.load('400 60px "Unbounded"'),
        document.fonts.load('60px "Yellowtail"'),
        document.fonts.load('500 20px "IBM Plex Mono"'),
      ])
        .then(paint)
        .catch(() => {});
    }
  }, []);

  return (
    <section id="vision" data-act="5" className="section section--ink vision" aria-labelledby="vision-title">
      <div className="section__inner vision__inner">
        <figure className="vision__container">
          <canvas ref={canvas} width={2048} height={488} role="img" aria-label="Jax World Carwash-O-Matic shipping container livery" />
        </figure>
        <h2 className="vision__title" id="vision-title">
          Autonomous cleaning for the <em>autonomous age.</em>
        </h2>
        <p className="vision__body">Carwash&#8209;O&#8209;Matic is the first step toward a new kind of vehicle-care infrastructure.</p>
      </div>
    </section>
  );
}
