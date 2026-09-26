'use client';

import { useState } from 'react';
import jacque from '@/assets/jacque-sticker.png';

const mascotSrc: string = typeof jacque === 'string' ? jacque : (jacque as { src: string }).src;

// Placeholder contact routing — replace with real addresses or a form endpoint.
const BRIEF_EMAIL = 'brief@jaxworld.example';
const LINKS = [
  { label: 'Partner with Jax World', email: 'partners@jaxworld.example' },
  { label: 'Build with us', email: 'engineering@jaxworld.example' },
  { label: 'Investment inquiries', email: 'investors@jaxworld.example' },
];
const ROLES = ['Investor', 'Site or fleet partner', 'Engineer', 'Other'];

/**
 * THE ASK: one dominant action (request the brief, via a short form that
 * opens an email), three quieter links, and Jacque handing over the key.
 */
export default function CallToAction() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [note, setNote] = useState('');

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const body = [`Name: ${name}`, `Email: ${email}`, `I'm a: ${role}`, '', note].join('\n');
    window.location.href = `mailto:${BRIEF_EMAIL}?subject=${encodeURIComponent('Request: the Jax World brief')}&body=${encodeURIComponent(body)}`;
  };

  return (
    <section id="contact" data-act="5" className="section cta" aria-labelledby="cta-title">
      <div className="section__inner cta__inner">
        {/* plain <img>: the same component renders in the single-file preview build, where next/image isn't available */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cta__jacque" src={mascotSrc} alt="Jacque, the Jax World mascot, handing over a car key" width={612} height={646} loading="lazy" />
        <div className="cta__content">
          <p className="eyebrow cta__eyebrow">Founder stage · building the first prototype</p>
          <h2 className="cta__title" id="cta-title">
            Build the future of vehicle care.
          </h2>
          <button type="button" className="cta__primary" aria-expanded={open} aria-controls="cta-form" onClick={() => setOpen(!open)}>
            Request the Jax World brief
          </button>
          <form id="cta-form" className="cta__form" hidden={!open} onSubmit={send}>
            <label>
              <span>Name</span>
              <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label>
              <span>Email</span>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label>
              <span>I&rsquo;m a</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className="cta__wide">
              <span>Anything we should know? (optional)</span>
              <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
            <button type="submit" className="cta__send">
              Send request
            </button>
            <p className="cta__panel-note">Opens your email app. Placeholder address for this concept site.</p>
          </form>
          <p className="cta__links">
            {LINKS.map((l) => (
              <a key={l.label} href={`mailto:${l.email}?subject=${encodeURIComponent(l.label)}`}>
                {l.label}
              </a>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
