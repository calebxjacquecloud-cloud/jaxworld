/** Atomic-age starburst used as a small brand ornament. */
export default function Starburst({ className, points = 8 }: { className?: string; points?: number }) {
  const rays = [];
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 48 : 26;
    rays.push(
      <line key={i} x1={50} y1={50} x2={(50 + Math.cos(a) * r).toFixed(2)} y2={(50 + Math.sin(a) * r).toFixed(2)} strokeWidth={i % 2 === 0 ? 4 : 3} strokeLinecap="round" />,
    );
  }
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden="true" stroke="currentColor" fill="currentColor">
      {rays}
      <circle cx="50" cy="50" r="7" />
    </svg>
  );
}
