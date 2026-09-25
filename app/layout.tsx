import type { Metadata, Viewport } from 'next';
import '@/styles/tokens.css';
import '@/styles/base.css';
import '@/styles/wash.css';
import '@/styles/sections.css';

export const metadata: Metadata = {
  title: 'Jax World Carwash-O-Matic',
  description:
    'An early-stage concept for autonomous, touchless, computer-vision-guided robotic car washing in modular shipping-container infrastructure.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#131518',
};

const FONTS =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&family=Unbounded:wght@400;500;600;700;800&family=Yellowtail&display=swap';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
