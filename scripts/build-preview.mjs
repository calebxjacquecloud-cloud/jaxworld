// Bundles the site into a single self-contained HTML file (preview-dist/index.html)
// for sharing a review link without a Next.js server.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'preview-dist');
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [resolve(root, 'preview/entry.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  alias: { '@': root },
  define: { 'process.env.NODE_ENV': '"production"' },
  // brand art is inlined so the single-file preview needs no asset server
  loader: { '.png': 'dataurl' },
  outfile: resolve(out, 'bundle.js'),
  logLevel: 'error',
});

const js = readFileSync(resolve(out, 'bundle.js'), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(resolve(out, 'bundle.css'), 'utf8');
const fonts =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&family=Unbounded:wght@400;500;600;700;800&family=Yellowtail&display=swap';

const html = `<title>Jax World Carwash-O-Matic</title>
<meta name="description" content="Early-stage concept: autonomous, touchless, computer-vision-guided robotic car washing in modular container infrastructure.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fonts}">
<style>${css}
:root{color-scheme:dark}
</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync(resolve(out, 'index.html'), html);
console.log(`preview-dist/index.html  ${(html.length / 1024).toFixed(0)} KB`);
