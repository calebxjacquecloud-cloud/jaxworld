// Pre-publish safety checks for the VC concept preview (preview-dist/vc.html).
// Run after `npm run preview:vc`:   npm run check:vc
//
//   1. Desktop pins  – the film and every pinned 2D scene stay stuck while scrolling.
//   2. Fast path     – the investor overview opens and its links land on the right part.
//   3. Phone width   – nothing wider than the screen at 320–430px, at several points.
//   4. No errors     – no page errors on desktop or phone (inside an inset host too).
//
// Needs Playwright with Chromium (local or global install). Exits non-zero on failure.
// The checks run without Google Fonts, whose display face (Unbounded) is much wider
// than the fallback. To check with the real fonts, download them and point
// VC_FONTS_CSS at a stylesheet of local @font-face rules.

import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const globalRoot = execSync('npm root -g').toString().trim();
    return createRequire(join(globalRoot, 'noop.js'))('playwright');
  }
}

const { chromium } = await loadPlaywright();
const page = readFileSync(join(root, 'preview-dist/vc.html'), 'utf8').replace(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/, '');
const dir = mkdtempSync(join(tmpdir(), 'jax-vc-check-'));
const fontsCss = process.env.VC_FONTS_CSS ? `<style>${readFileSync(process.env.VC_FONTS_CSS, 'utf8')}</style>` : '';
if (fontsCss) console.log('Using local brand fonts from', process.env.VC_FONTS_CSS);
const head = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${fontsCss}`;
const plainFile = join(dir, 'plain.html');
const insetFile = join(dir, 'inset.html');
writeFileSync(plainFile, `${head}</head><body>${page}</body></html>`);
writeFileSync(insetFile, `${head}<style>:root{padding-top:47px;padding-bottom:34px}</style></head><body>${page}</body></html>`);

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};
const scrollInto = (p, sel, f) =>
  p.evaluate(
    ([sel, f]) => {
      const el = document.querySelector(sel);
      scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * f);
    },
    [sel, f],
  );

// 1 + 2 · desktop
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('file://' + plainFile);
  await p.waitForSelector('#film[data-status="ready"]', { timeout: 120000 });
  for (const f of [0.25, 0.6, 0.95]) {
    await scrollInto(p, '#film', f);
    await p.waitForTimeout(900);
    const top = await p.evaluate(() => Math.round(document.querySelector('.vx-film__pin').getBoundingClientRect().top));
    check(`desktop film pinned at ${f * 100}%`, Math.abs(top) <= 1, `pin top ${top}px`);
  }
  const scenes = await p.evaluate(() => document.querySelectorAll('.vx-scene').length);
  for (let i = 0; i < scenes; i++) {
    await p.evaluate((i) => {
      const el = document.querySelectorAll('.vx-scene')[i];
      scrollTo(0, el.getBoundingClientRect().top + scrollY + (el.offsetHeight - innerHeight) * 0.5);
    }, i);
    await p.waitForTimeout(500);
    const r = await p.evaluate((i) => {
      const el = document.querySelectorAll('.vx-scene')[i];
      return { top: Math.round(el.querySelector('.vx-scene__pin').getBoundingClientRect().top), id: el.id || el.getAttribute('aria-label') };
    }, i);
    check(`desktop scene "${r.id}" pinned`, Math.abs(r.top) <= 1, `pin top ${r.top}px`);
  }
  // fast path: overview opens and jumps
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
  await p.evaluate(() => window.dispatchEvent(new Event('vx:overview')));
  await p.waitForTimeout(700);
  check('investor overview opens', await p.evaluate(() => document.querySelector('.vx-overview')?.classList.contains('is-open')));
  await p.click('.vx-overview__list li:nth-child(4) button');
  await p.waitForTimeout(900);
  const landed = await p.evaluate(() => {
    const r = document.getElementById('franchise').getBoundingClientRect();
    return r.top <= 2 && r.bottom > innerHeight;
  });
  check('overview link lands on the franchise section', landed);
  check('desktop: no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await p.close();
}

// 3 + 4 · phones (inside an inset host, like the Claude app)
const points = [
  ['#film', 0],
  ['#film', 0.55],
  ['#franchise', 0.9],
  ['#network', 0.8],
  ['.vx-console-block', 0],
  ['#future', 0],
  ['#interior', 0.8],
  ['#brief', 0],
];
for (const w of [320, 360, 375, 390, 430]) {
  const p = await browser.newPage({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('file://' + insetFile);
  await p.waitForSelector('#film[data-status="ready"]', { timeout: 120000 });
  const over = new Set();
  for (const [sel, f] of points) {
    await scrollInto(p, sel, f);
    await p.waitForTimeout(350);
    const found = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const out = [];
      document.querySelectorAll('.vx *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.opacity === '0') return;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(a).overflowX)) {
            const ar = a.getBoundingClientRect();
            if (ar.right <= vw + 1 && ar.left >= -1) return;
          }
        }
        out.push(`${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}`);
      });
      return out;
    });
    found.forEach((x) => over.add(x));
  }
  const pageW = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(`nothing wider than a ${w}px phone`, over.size === 0 && pageW <= 0, [...over].slice(0, 4).join(', '));
  check(`${w}px phone: no page errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
  await p.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
