/**
 * Standalone preview entry: renders the same <Site /> the Next.js app uses,
 * bundled into one HTML file for sharing a review link.
 */
import { createRoot } from 'react-dom/client';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/wash.css';
import '@/styles/sections.css';
import Site from '@/components/Site';

createRoot(document.getElementById('root')!).render(<Site />);
