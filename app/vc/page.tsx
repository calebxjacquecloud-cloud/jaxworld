import type { Metadata } from 'next';
import VcSite from '@/vc/VcSite';

/**
 * Second, independent concept: the VC / board-advisor narrative.
 * Lives entirely in /vc; the original concept at / is untouched.
 */
export const metadata: Metadata = {
  title: 'Jax World · Autonomous vehicle care',
  description:
    'Jax World and the Carwash-O-Matic: an early-stage concept for vision-guided robotic vehicle care, productized as a standardized, connected system.',
};

export default function Page() {
  return <VcSite />;
}
