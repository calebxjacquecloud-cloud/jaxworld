/**
 * Top-down cabin drawing shared by the autonomous-future and interior scenes.
 * viewBox 0 0 200 400, nose up, driver seat on the left.
 */

export const SPOTS = {
  scratch: [184, 226],
  stain: [72, 278],
  trash: [132, 214],
  lost: [142, 318],
  tear: [132, 168],
  dirty: [104, 124],
  wheel: [14, 96],
  warning: [66, 116],
} as const;

export default function Cabin({ driver = false }: { driver?: boolean }) {
  return (
    <g className="vx-cabin">
      <path className="vx-cabin__body" d="M40 30 Q100 0 160 30 L176 90 Q184 200 178 330 Q176 380 150 392 L50 392 Q24 380 22 330 Q16 200 24 90 Z" />
      {/* wheels */}
      {[
        [14, 96],
        [186, 96],
        [14, 318],
        [186, 318],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x - 7} y={y - 24} width={14} height={48} rx={5} className="vx-cabin__wheel" />
      ))}
      {/* glass */}
      <path className="vx-cabin__glass" d="M44 96 Q100 76 156 96 L150 116 Q100 102 50 116 Z" />
      <path className="vx-cabin__glass" d="M50 344 Q100 356 150 344 L154 362 Q100 376 46 362 Z" />
      {/* dash + wheel */}
      <path className="vx-cabin__line" d="M46 124 Q100 112 154 124" />
      <circle cx={70} cy={140} r={13} className="vx-cabin__steer" />
      {/* seats */}
      <rect x={44} y={152} width={48} height={58} rx={10} className="vx-cabin__seat" />
      <rect x={108} y={152} width={48} height={58} rx={10} className="vx-cabin__seat" />
      <rect x={40} y={252} width={120} height={60} rx={12} className="vx-cabin__seat" />
      <line x1={80} y1={256} x2={80} y2={308} className="vx-cabin__line" />
      <line x1={120} y1={256} x2={120} y2={308} className="vx-cabin__line" />
      {/* doors */}
      <path className="vx-cabin__line" d="M22 150 L22 150 M20 232 L26 232 M174 232 L180 232 M22 150 L26 150 M174 150 L178 150" />
      {driver && (
        <g className="vx-cabin__driver">
          <circle cx={68} cy={176} r={14} />
          <path d="M60 196 Q68 186 76 196" />
        </g>
      )}
    </g>
  );
}
