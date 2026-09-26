// Pre-publish safety checks for the built preview (preview-dist/index.html).
// Run after `npm run preview:build`:   npm run check
//
//   1. Desktop pin    – the wash scene stays pinned (sticky) while scrolling.
//   2. Phone stepping – inside a host with a top inset (like the Claude app),
//                       swipes step the demo, the page doesn't scroll while
//                       stepping, and a swipe after the last step lets it scroll.
//   3. Phone width    – nothing is wider than the screen at 320–430px.
//
// Needs Playwright with Chromium (local or global install). Exits non-zero on failure.

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
const page = readFileSync(join(root, 'preview-dist/index.html'), 'utf8').replace(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/, '');
const dir = mkdtempSync(join(tmpdir(), 'jax-check-'));
const head = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">';
const desktopFile = join(dir, 'desktop.html');
const insetFile = join(dir, 'inset.html');
writeFileSync(desktopFile, `${head}</head><body style="margin:0">${page}</body></html>`);
// simulate a host that pads the page, like the Claude app on iPhone
writeFileSync(insetFile, `${head}<style>:root{padding-top:47px;padding-bottom:34px}body{margin:0}</style></head><body>${page}</body></html>`);

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
};

// 1 · desktop pin
{
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file://' + desktopFile);
  await p.waitForSelector('.stage[data-status="ready"]', { timeout: 90000 });
  for (const f of [0.25, 0.6]) {
    await p.evaluate((f) => {
      const el = document.getElementById('wash');
      scrollTo(0, el.offsetTop + (el.offsetHeight - innerHeight) * f);
    }, f);
    await p.waitForTimeout(1200);
    const top = await p.evaluate(() => Math.round(document.querySelector('.wash__pin').getBoundingClientRect().top));
    check(`desktop pin at ${f * 100}% scroll`, Math.abs(top) <= 1, `pin top ${top}px`);
  }
  await p.close();
}

// 2 · phone stepping inside an inset host
{
  const p = await browser.newPage({ viewport: { width: 390, height: 780 }, isMobile: true, hasTouch: true });
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto('file://' + insetFile);
  await p.waitForSelector('.stage[data-status="ready"]', { timeout: 90000 });
  await p.waitForTimeout(500);
  const swipe = (dy) =>
    p.evaluate((dy) => {
      const el = document.getElementById('wash');
      const mk = (type, y) => {
        const t = new Touch({ identifier: 1, target: el, clientX: 200, clientY: y });
        return new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], cancelable: true, bubbles: true });
      };
      el.dispatchEvent(mk('touchstart', 500));
      let prevented = false;
      for (let i = 1; i <= 5; i++) {
        const ev = mk('touchmove', 500 - (dy * i) / 5);
        el.dispatchEvent(ev);
        prevented = prevented || ev.defaultPrevented;
      }
      el.dispatchEvent(mk('touchend', 500 - dy));
      return prevented;
    }, dy);
  const fit = await p.evaluate(() => {
    const el = document.getElementById('wash');
    return { stepped: el.classList.contains('wash--stepped'), bottom: Math.round(el.getBoundingClientRect().bottom), vh: innerHeight };
  });
  check('phone uses stepped playback', fit.stepped);
  check('phone demo fits the visible screen', Math.abs(fit.bottom - fit.vh) <= 1, `bottom ${fit.bottom} vs ${fit.vh}`);
  check('swipe forward steps (page held)', await swipe(200));
  await p.waitForTimeout(1500);
  check('page did not scroll while stepping', (await p.evaluate(() => scrollY)) === 0);
  check('swipe back steps', await swipe(-200));
  for (let i = 0; i < 160; i++) {
    await swipe(200);
    await p.waitForTimeout(30);
  }
  check('swipe after the last step lets the page scroll', !(await swipe(200)));
  check('no page errors', errors.length === 0, errors.join(' | '));
  await p.close();
}

// 3 · phone width
for (const w of [320, 360, 375, 390, 430]) {
  const p = await browser.newPage({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true });
  await p.goto('file://' + insetFile);
  await p.waitForSelector('.stage[data-status="ready"]', { timeout: 90000 });
  const over = await p.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || (r.right <= vw + 1 && r.left >= -1)) return;
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
  check(`nothing wider than a ${w}px phone`, over.length === 0, over.slice(0, 4).join(', '));
  await p.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
