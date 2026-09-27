/**
 * Overlay primitives for the film. They only render static markup with data
 * attributes; the frame loop (Film.tsx) reads those once and drives opacity,
 * state classes and 3D-anchored positions directly, without React re-renders.
 *
 *   <Beat t0 t1>   a block of copy, faded in over [t0, t1] (film units)
 *   <In at out?>   a child that appears at `at` (and leaves at `out`)
 *   <On a b>       a child that is "current" between a and b, "done" after b
 *   <Tag at|named> a label pinned to a point in the 3D scene
 */

import type { ReactNode } from 'react';
import type { Space } from './FilmScene';

export type Place = 'left' | 'right' | 'center' | 'top' | 'hero';

/**
 * The beat element covers the whole pinned screen; its copy sits in `inner`
 * (placed by CSS), and `layer` holds full-screen extras such as 3D-pinned tags.
 */
export function Beat({
  t0,
  t1,
  place = 'left',
  className = '',
  children,
  layer,
}: {
  t0: number;
  t1: number;
  place?: Place;
  className?: string;
  children?: ReactNode;
  layer?: ReactNode;
}) {
  return (
    <div className={`vx-beat vx-beat--${place} ${className}`} data-t0={t0} data-t1={t1}>
      {layer && <div className="vx-beat__layer">{layer}</div>}
      {children && <div className="vx-beat__inner">{children}</div>}
    </div>
  );
}

type Tagish = 'div' | 'p' | 'span' | 'li' | 'h2' | 'h3';

export function In({ at, out, as: As = 'div', className = '', children }: { at: number; out?: number; as?: Tagish; className?: string; children: ReactNode }) {
  return (
    <As className={`vx-in ${className}`} data-in={at} data-out={out}>
      {children}
    </As>
  );
}

export function On({ a, b, as: As = 'li', className = '', children }: { a: number; b: number; as?: Tagish; className?: string; children: ReactNode }) {
  return (
    <As className={`vx-on ${className}`} data-on={`${a},${b}`}>
      {children}
    </As>
  );
}

export function Tag({
  at,
  named,
  space = 'hero',
  from,
  until,
  tone = 'cyan',
  children,
}: {
  at?: [number, number, number];
  named?: string;
  space?: Space;
  from?: number;
  until?: number;
  tone?: 'cyan' | 'orange' | 'cream' | 'green';
  children: ReactNode;
}) {
  return (
    <span
      className={`vx-tag vx-tag--${tone}`}
      data-anchor={at ? at.join(',') : undefined}
      data-named={named}
      data-space={space}
      data-in={from}
      data-out={until}
    >
      <span className="vx-tag__dot" aria-hidden="true" />
      <span className="vx-tag__text">{children}</span>
    </span>
  );
}

/** Non-breaking hyphens keep the product name on one line in display type. */
export const COM = 'Carwash‑O‑Matic';

/** SVG group that appears at `at` (and leaves at `out`). */
export function G({ at, out, className = '', children, ...rest }: { at: number; out?: number; className?: string; children: ReactNode } & React.SVGProps<SVGGElement>) {
  return (
    <g className={`vx-in ${className}`} data-in={at} data-out={out} {...rest}>
      {children}
    </g>
  );
}

/** The Jax World starburst as an SVG group (for use inside other SVG art). */
export function Burst({ r = 10, className = '' }: { r?: number; className?: string }) {
  const rays = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const len = i % 2 === 0 ? r : r * 0.55;
    rays.push(<line key={i} x1={0} y1={0} x2={+(Math.cos(a) * len).toFixed(2)} y2={+(Math.sin(a) * len).toFixed(2)} />);
  }
  return <g className={`vx-burst ${className}`}>{rays}</g>;
}
