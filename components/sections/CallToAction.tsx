'use client';

import { useState } from 'react';
import Starburst from '../Starburst';

// Placeholder contact routing — replace with real addresses or a form endpoint.
const CONTACTS = [
  { id: 'partner', label: 'Partner With Jax World', email: 'partners@jaxworld.example', blurb: 'Sites, fleets, parking operators and hosts.' },
  { id: 'eng', label: 'Robotics & Engineering', email: 'engineering@jaxworld.example', blurb: 'Perception, motion control, fluid systems.' },
  { id: 'invest', label: 'Investment Inquiries', email: 'investors@jaxworld.example', blurb: 'Early-stage conversations.' },
];

export default function CallToAction() {
  const [active, setActive] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const current = CONTACTS.find((c) => c.id === active);

  const copy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section id="contact" className="section cta" aria-labelledby="cta-title">
      <div className="section__inner cta__inner">
        <Starburst className="cta__burst" points={12} />
        <p className="eyebrow cta__eyebrow">Founder stage · building the first prototype</p>
        <h2 className="cta__title" id="cta-title">
          Build the future of vehicle care.
        </h2>
        <p className="cta__lede">
          Jax World is looking for partners, engineers and investors who want to see a real Carwash-O-Matic prototype. Washes can&rsquo;t be booked yet; the system is in development.
        </p>
        <div className="cta__buttons">
          {CONTACTS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cta__btn${active === c.id ? ' is-active' : ''}`}
              aria-expanded={active === c.id}
              aria-controls="cta-panel"
              onClick={() => setActive(active === c.id ? null : c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div id="cta-panel" className="cta__panel" hidden={!current} aria-live="polite">
          {current && (
            <>
              <p className="cta__panel-blurb">{current.blurb}</p>
              <p className="cta__panel-mail">
                <a href={`mailto:${current.email}?subject=${encodeURIComponent(current.label)}`} className="mono">
                  {current.email}
                </a>
                <button type="button" className="cta__copy" onClick={() => copy(current.email)}>
                  {copied ? 'Copied' : 'Copy address'}
                </button>
              </p>
              <p className="cta__panel-note">Placeholder address for this concept site.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
