'use client';

import { isoBox } from '@/lib/iso';
import { ramp } from '@/lib/timeline';
import ScrollScene from '../components/ScrollScene';
import { Burst, COM, G, In, On } from '../film/primitives';
import IsoSite, { isoPoint } from './IsoSite';

const S = 2.7;
const SITES: [number, number][] = [
  [0, 0],
  [-58, -30],
  [52, -44],
  [-40, 46],
  [70, 26],
  [-98, 8],
  [22, 74],
];
const HUB: [number, number] = [0, -205];

/*
 * Beat timing (scene units). One even rhythm: each step gets room to land
 * before the next one starts, and the camera pulls back as the network grows.
 */
const T = {
  ship: [0.45, 1.1],
  install: [1.1, 1.6],
  connect: [1.6, 2.2],
  open: [2.2, 2.6],
  grow: [2.7, 3.9],
  lines: 4.25,
  roles: 5.75,
} as const;

/** Camera stops for the art (viewBox centre + width; height follows the 580:440 frame). */
const VIEWS = [
  { t: 0, x: 0, y: -4, w: 250 },
  { t: T.install[1], x: 0, y: -4, w: 250 },
  { t: T.connect[1], x: 0, y: -92, w: 400 },
  { t: T.open[1], x: 0, y: -92, w: 400 },
  { t: T.grow[1] + 0.2, x: 0, y: -42, w: 580 },
];
const ASPECT = 440 / 580;

function viewAt(t: number) {
  let i = 1;
  while (i < VIEWS.length - 1 && t > VIEWS[i].t) i++;
  const a = VIEWS[i - 1];
  const b = VIEWS[i];
  const u = ramp(t, a.t, b.t);
  const e = u * u * (3 - 2 * u);
  const w = Math.exp(Math.log(a.w) + (Math.log(b.w) - Math.log(a.w)) * e);
  const x = a.x + (b.x - a.x) * e;
  const y = a.y + (b.y - a.y) * e;
  const h = w * ASPECT;
  return `${(x - w / 2).toFixed(2)} ${(y - h / 2).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`;
}

function link(i: number) {
  const [x, z] = SITES[i];
  const [sx, sy] = isoPoint(x, 5.5, z, S);
  const [hx, hy] = HUB;
  const my = Math.min(sy, hy) - 30;
  return `M${sx},${sy} Q${(sx + hx) / 2},${my} ${hx},${hy + 16}`;
}

/** When each of the other sites lands, and when its link draws. */
const siteAt = (k: number) => T.grow[0] + 0.1 + k * 0.14;

/**
 * ACT 9 · Why standardization matters. One location becomes several; Jax World
 * stays connected to all of them.
 */
export default function Franchise() {
  const box = isoBox(-6.1, 0, -1.2, 12.2, 2.9, 2.4, S);
  return (
    <ScrollScene
      id="franchise"
      units={7}
      chapter={4}
      label="Franchise model"
      className="vx-split"
      onFrame={(t, root) => {
        root.querySelector('svg.vx-iso')?.setAttribute('viewBox', viewAt(t));
        // units lower into place (eased), instead of popping in
        root.querySelectorAll<SVGGElement>('[data-drop]').forEach((g) => {
          const [a, b, d] = (g.dataset.drop || '0,1,0').split(',').map(Number);
          const u = 1 - ramp(t, a, b);
          g.style.transform = `translate(0px, ${(-(u * u) * d).toFixed(1)}px)`;
        });
      }}
    >
      <div className="vx-split__copy">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={T.lines - 0.05}>
            <p className="vx-eyebrow">Franchise model · proposed</p>
            <h2 className="vx-h2">One system. Repeated everywhere.</h2>
            <ol className="vx-chain mono">
              <On as="li" a={0.1} b={T.ship[0]}>{COM}</On>
              <On as="li" a={T.ship[0]} b={T.install[0]}>Ship</On>
              <On as="li" a={T.install[0]} b={T.connect[0]}>Install</On>
              <On as="li" a={T.connect[0]} b={T.open[0]}>Connect</On>
              <On as="li" a={T.open[0]} b={T.grow[0]}>Open</On>
            </ol>
            <In as="p" at={T.grow[0]} className="vx-body">
              A standardized unit means each new location can start from the same machine, the same software and the same playbook as the first.
            </In>
          </div>
          <div className="vx-in vx-stack-gap" data-in={T.lines} data-out={T.roles - 0.05}>
            <p className="vx-eyebrow">Franchise model · proposed</p>
            <p className="vx-h2 vx-lines">
              <In as="span" at={T.lines}>Jax World standardizes the machine.</In>
              <In as="span" at={T.lines + 0.4}>Franchisees scale the locations.</In>
              <In as="span" at={T.lines + 0.8} className="vx-accent">Jax World connects and improves the network.</In>
            </p>
          </div>
          <div className="vx-in vx-stack-gap" data-in={T.roles}>
            <p className="vx-eyebrow">Franchise model · proposed</p>
            <p className="vx-h3">Who does what</p>
            <div className="vx-roles">
              <div>
                <p className="mono">Jax World provides</p>
                <ul>
                  <li>Standardized {COM} hardware</li>
                  <li>Operating software</li>
                  <li>Central monitoring</li>
                  <li>System updates</li>
                  <li>Operational intelligence</li>
                  <li>Technical standards</li>
                </ul>
              </div>
              <div>
                <p className="mono">The franchise operator runs</p>
                <ul>
                  <li>The site</li>
                  <li>The local business</li>
                  <li>Customers and partners</li>
                  <li>Day-to-day operations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="vx-split__art" aria-hidden="true">
        <svg viewBox={viewAt(0)} className="vx-iso">
          {/* links to Jax World */}
          {SITES.map((_, i) => (
            <path
              key={i}
              d={link(i)}
              pathLength={1}
              className="vx-link"
              data-draw={i === 0 ? `${T.connect[0] + 0.15},${T.connect[1]}` : `${siteAt(i - 1) + 0.25},${siteAt(i - 1) + 0.7}`}
            />
          ))}
          {/* the first site: empty pad → container lowers in → it deploys → connects → opens */}
          <G at={-1}>
            <polygon className="vx-iso-pad vx-iso-pad--empty" points={isoBox(-11, 0, -8, 22, 0, 16, S).top} />
          </G>
          <G at={T.ship[0] - 0.12} out={T.install[0] + 0.3}>
            <g data-drop={`${T.ship[0]},${T.ship[1]},150`}>
              <polygon className="vx-iso-left" points={box.left} />
              <polygon className="vx-iso-right" points={box.right} />
              <polygon className="vx-iso-top vx-iso-top--closed" points={box.top} />
            </g>
          </G>
          <G at={T.install[0] + 0.05}>
            <IsoSite x={0} z={0} s={S} />
          </G>
          <G at={T.connect[1] - 0.05}>
            <circle cx={isoPoint(0, 5.5, 0, S)[0]} cy={isoPoint(0, 5.5, 0, S)[1]} r={3.4} className="vx-iso-beacon is-lit" />
          </G>
          <G at={T.open[0]}>
            <g transform={`translate(${isoPoint(0, 0, 9, S).join(',')})`}>
              <rect x={-18} y={4} width={36} height={14} rx={3} className="vx-open" />
              <text x={0} y={14.2} className="vx-open__t">
                OPEN
              </text>
            </g>
          </G>
          {/* the network grows: each site lowers in, then connects */}
          {SITES.slice(1).map(([x, z], k) => (
            <G key={k} at={siteAt(k)}>
              <g data-drop={`${siteAt(k)},${siteAt(k) + 0.35},60`}>
                <IsoSite x={x} z={z} s={S} lit />
              </g>
            </G>
          ))}
          <G at={T.connect[0]}>
            <g transform={`translate(${HUB[0]},${HUB[1]})`}>
              <circle r={17} className="vx-hub" />
              <Burst r={11} />
              <text y={-28} className="vx-hub__t">
                JAX WORLD
              </text>
            </g>
          </G>
        </svg>
      </div>
    </ScrollScene>
  );
}
