// Bundles the VC concept (/vc) into a single self-contained HTML file
// (preview-dist/vc.html) for sharing a review link without a Next.js server.
// Same approach as scripts/build-preview.mjs, separate output.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'preview-dist');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [resolve(root, 'preview/vc-entry.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  alias: { '@': root },
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.png': 'dataurl' },
  outfile: resolve(out, 'vc-bundle.js'),
  logLevel: 'error',
});

const js = readFileSync(resolve(out, 'vc-bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(resolve(out, 'vc-bundle.css'), 'utf8');
const fonts =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400;500;600&family=Unbounded:wght@400;500;600;700;800&family=Yellowtail&display=swap';

const html = `<title>Jax World · Autonomous vehicle care</title>
<meta name="description" content="Jax World and the Carwash-O-Matic: an early-stage concept for vision-guided robotic vehicle care, productized as a standardized, connected system.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}
:root{color-scheme:dark}
html{overflow-x:hidden;overflow-anchor:none}
body{margin:0;background:#121417}
</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(resolve(out, 'vc.html'), html);
console.log(`preview-dist/vc.html  ${(html.length / 1024).toFixed(0)} KB`);
