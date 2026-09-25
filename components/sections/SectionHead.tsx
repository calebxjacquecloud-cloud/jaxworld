export type DevStatus = 'vision' | 'prototype' | 'future';

const STATUS_LABEL: Record<DevStatus, string> = {
  vision: 'Product vision',
  prototype: 'Prototype concept',
  future: 'Future phase',
};

export function StatusChip({ status }: { status: DevStatus }) {
  return <span className={`status-chip status-chip--${status}`}>{STATUS_LABEL[status]}</span>;
}

export default function SectionHead({
  eyebrow,
  title,
  lede,
  status,
  id,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  status?: DevStatus;
  id?: string;
}) {
  return (
    <header className="section__head">
      <p className="eyebrow">
        {eyebrow}
        {status && <StatusChip status={status} />}
      </p>
      <h2 className="section__title" id={id}>
        {title}
      </h2>
      {lede && <p className="section__lede">{lede}</p>}
    </header>
  );
}
