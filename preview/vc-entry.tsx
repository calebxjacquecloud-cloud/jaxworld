/**
 * Standalone preview entry for the VC concept: renders the same <VcSite />
 * the /vc route uses, bundled into one HTML file for sharing a review link.
 */
import { createRoot } from 'react-dom/client';
import VcSite from '@/vc/VcSite';

createRoot(document.getElementById('root')!).render(<VcSite />);
