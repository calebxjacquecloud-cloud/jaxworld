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
const MORE_AT = 2.25;

function link(i: number) {
  const [x, z] = SITES[i];
  const [sx, sy] = isoPoint(x, 5.5, z, S);
  const [hx, hy] = HUB;
  const my = Math.min(sy, hy) - 30;
  return `M${sx},${sy} Q${(sx + hx) / 2},${my} ${hx},${hy + 16}`;
}

/**
 * ACT 9 · Why standardization matters. One location becomes several; Jax World
 * stays connected to all of them.
 */
export default function Franchise() {
  const box = isoBox(-6.1, 0, -1.2, 12.2, 2.9, 2.4, S);
  return (
    <ScrollScene
      id="franchise"
      units={5.6}
      chapter={4}
      label="Franchise model"
      className="vx-split"
      onFrame={(t, root) => {
        const drop = root.querySelector<SVGGElement>('[data-drop]');
        if (drop) drop.style.transform = `translate(0px, ${(-(1 - ramp(t, 0.7, 1.05)) * 140).toFixed(1)}px)`;
      }}
    >
      <div className="vx-split__copy">
        <div className="vx-swap">
          <div className="vx-in vx-stack-gap" data-in={-1} data-out={3.2}>
            <p className="vx-eyebrow">Franchise model · proposed</p>
            <h2 className="vx-h2">One system. Repeated everywhere.</h2>
            <ol className="vx-chain mono">
              <On as="li" a={0.35} b={0.7}>{COM}</On>
              <On as="li" a={0.7} b={1.15}>Ship</On>
              <On as="li" a={1.15} b={1.45}>Install</On>
              <On as="li" a={1.45} b={1.75}>Connect</On>
              <On as="li" a={1.75} b={MORE_AT}>Open</On>
            </ol>
            <In as="p" at={MORE_AT} className="vx-body">
              A standardized unit means each new location can start from the same machine, the same software and the same playbook as the first.
            </In>
          </div>
          <div className="vx-in vx-stack-gap" data-in={3.25} data-out={4.4}>
            <p className="vx-eyebrow">Franchise model · proposed</p>
            <p className="vx-h2 vx-lines">
              <In as="span" at={3.3}>Jax World standardizes the machine.</In>
              <In as="span" at={3.55}>Franchisees scale the locations.</In>
              <In as="span" at={3.8} className="vx-accent">Jax World connects and improves the network.</In>
            </p>
          </div>
          <div className="vx-in vx-stack-gap" data-in={4.45}>
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
        <svg viewBox="-290 -262 580 440" className="vx-iso">
          {/* links to Jax World */}
          {SITES.map((_, i) => (
            <path
              key={i}
              d={link(i)}
              pathLength={1}
              className="vx-link"
              data-draw={i === 0 ? '1.45,1.75' : `${MORE_AT + 0.2 + i * 0.1},${MORE_AT + 0.5 + i * 0.1}`}
            />
          ))}
          {/* the first site: empty pad → container arrives → it deploys → connects → opens */}
          <G at={-1}>
            <polygon className="vx-iso-pad vx-iso-pad--empty" points={isoBox(-11, 0, -8, 22, 0, 16, S).top} />
          </G>
          <G at={0.62} out={1.25}>
            <g data-drop>
              <polygon className="vx-iso-left" points={box.left} />
              <polygon className="vx-iso-right" points={box.right} />
              <polygon className="vx-iso-top vx-iso-top--closed" points={box.top} />
            </g>
          </G>
          <G at={1.15}>
            <IsoSite x={0} z={0} s={S} />
          </G>
          <G at={1.6}>
            <circle cx={isoPoint(0, 5.5, 0, S)[0]} cy={isoPoint(0, 5.5, 0, S)[1]} r={3.4} className="vx-iso-beacon is-lit" />
          </G>
          <G at={1.8}>
            <g transform={`translate(${isoPoint(0, 0, 9, S).join(',')})`}>
              <rect x={-18} y={4} width={36} height={14} rx={3} className="vx-open" />
              <text x={0} y={14.2} className="vx-open__t">
                OPEN
              </text>
            </g>
          </G>
          {/* the network grows */}
          {SITES.slice(1).map(([x, z], k) => (
            <G key={k} at={MORE_AT + k * 0.1}>
              <IsoSite x={x} z={z} s={S} lit />
            </G>
          ))}
          <G at={1.35}>
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
