'use client';

import { useEffect, useRef, useState } from 'react';
import { jumpTo } from '../lib/chapters';
import { MARKS } from '../film/sequence';

const POINTS: { title: string; body: string; to: { unit: number } | { id: string } }[] = [
  {
    title: 'It understands each vehicle',
    body: 'Cameras map the vehicle first. Robots then follow a cleaning plan built for that vehicle, instead of a fixed tunnel program.',
    to: { unit: MARKS.product },
  },
  {
    title: 'Every wash is an inspection',
    body: 'Pre- and post-wash scans separate dirt from damage and build a standardized condition record over time.',
    to: { unit: MARKS.condition },
  },
  {
    title: 'The machine is a product',
    body: 'The complete system is designed to pack into one standard 40-foot container: ordered, installed, connected, operated.',
    to: { unit: MARKS.productize },
  },
  {
    title: 'It is built to repeat',
    body: 'Standardized hardware and deployment make each location repeatable, which is what a franchise model needs.',
    to: { id: 'franchise' },
  },
  {
    title: 'Jax World stays in the loop',
    body: 'Every site runs locally and connects to a central platform for fluids, maintenance, quality, software and vision.',
    to: { id: 'network' },
  },
  {
    title: 'It extends to the whole vehicle',
    body: 'Interior robotics apply the same see-think-act-verify loop to the cabin.',
    to: { id: 'interior' },
  },
  {
    title: 'Autonomous fleets raise the stakes',
    body: 'A driverless vehicle loses its driver as inspector. Vehicle care has to become autonomous too.',
    to: { id: 'autonomy' },
  },
];

/**
 * Fast path for time-constrained readers: the whole thesis on one panel, each
 * point linking into the part of the experience that shows it. The cinematic
 * experience stays the default; this only opens on request.
 */
export default function Overview() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    const show = () => {
      opener.current = document.activeElement;
      setOpen(true);
    };
    window.addEventListener('vx:overview', show);
    return () => window.removeEventListener('vx:overview', show);
  }, []);

  useEffect(() => {
    if (!open) return;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  const go = (to: { unit: number } | { id: string }) => {
    setOpen(false);
    requestAnimationFrame(() => jumpTo(to));
  };

  return (
    <div className={`vx-overview${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <button type="button" className="vx-overview__backdrop" tabIndex={-1} aria-label="Close overview" onClick={() => setOpen(false)} />
      <div className="vx-overview__panel" role="dialog" aria-modal="true" aria-labelledby="vx-overview-title" tabIndex={-1} ref={panel}>
        <div className="vx-overview__head">
          <p className="vx-eyebrow">Investor overview</p>
          <button type="button" className="vx-overview__close" onClick={() => setOpen(false)} aria-label="Close">
            ×
          </button>
        </div>
        <h2 className="vx-h3" id="vx-overview-title">
          The thesis in one minute.
        </h2>
        <p className="vx-body">
          It starts with a car wash. Each point below links to the part of the experience that shows it.
        </p>
        <ol className="vx-overview__list">
          {POINTS.map((p, i) => (
            <li key={p.title}>
              <button type="button" onClick={() => go(p.to)} tabIndex={open ? 0 : -1}>
                <span className="vx-overview__n mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="vx-overview__t">{p.title}</span>
                <span className="vx-overview__b">{p.body}</span>
                <span className="vx-overview__go mono" aria-hidden="true">
                  Show me →
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="vx-overview__foot">
          <button type="button" className="vx-cta-btn" onClick={() => go({ id: 'brief' })} tabIndex={open ? 0 : -1}>
            Request the investor brief
          </button>
          <p className="vx-note mono">Early-stage concept · capabilities are design targets</p>
        </div>
      </div>
    </div>
  );
}
