'use client';

import { useState } from 'react';
import jacque from '@/assets/jacque-sticker.png';
import { useReveal } from '../components/ScrollScene';
import { CONTACT } from '../lib/content';

const mascotSrc: string = typeof jacque === 'string' ? jacque : (jacque as { src: string }).src;

const SECONDARY = ['Partner with Jax World', 'Build with us', 'Investment inquiries'];

const mail = (subject: string) => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;

/**
 * FINAL CTA · built for an investor, board or strategic conversation: one
 * dominant action, three quieter ones, Jacque handing over the key.
 * No placeholder addresses: until CONTACT.email is set, the actions explain
 * that the brief is shared by introduction.
 */
export default function Brief() {
  const ref = useReveal<HTMLElement>();
  const [note, setNote] = useState<string | null>(null);
  const live = CONTACT.email.length > 0;
  const act = (label: string) => (e: React.MouseEvent) => {
    if (live) return;
    e.preventDefault();
    setNote(label);
  };

  return (
    <section id="brief" className="vx-block vx-brief" data-chapter={5} ref={ref} aria-labelledby="vx-brief-title">
      <div className="vx-wrap vx-brief__inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="vx-brief__jacque" src={mascotSrc} alt="Jacque, the Jax World mascot, handing over a car key" width={612} height={646} loading="lazy" />
        <div className="vx-brief__content">
          <p className="vx-eyebrow">Jax World · founder stage</p>
          <h2 className="vx-display vx-brief__title" id="vx-brief-title">
            Build the future of vehicle care.
          </h2>
          <a className="vx-brief__primary" href={live ? mail('Request: the Jax World investor brief') : '#brief'} onClick={act('the investor brief')}>
            Request the investor brief <span aria-hidden="true">→</span>
          </a>
          <ul className="vx-brief__links">
            {SECONDARY.map((l) => (
              <li key={l}>
                <a href={live ? mail(l) : '#brief'} onClick={act(l.toLowerCase())}>
                  {l}
                </a>
              </li>
            ))}
          </ul>
          <p className="vx-brief__note" role="status" aria-live="polite">
            {note ? `Jax World shares ${note === 'the investor brief' ? 'the investor brief' : 'partnership and investment conversations'} by introduction. Ask the person who sent you this page to connect you with the founding team.` : ''}
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="vx-footer">
      <div className="vx-wrap vx-footer__inner">
        <p>
          <strong>Jax World</strong> is the company. <strong>Carwash&#8209;O&#8209;Matic</strong> is its technology.
        </p>
        <p className="vx-footer__fine">
          An early-stage concept. Capabilities, deployment formats and the franchise model are presented as design targets, proposed functionality and intended architecture, not as validated results. Visuals are illustrative; interface data is sample data.
        </p>
        <p className="vx-footer__fine">
          {/* plain link: the page also renders in the single-file preview build, without the Next router */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/">View the original product concept</a>
        </p>
      </div>
    </footer>
  );
}
