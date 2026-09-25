import SectionHead, { StatusChip } from './SectionHead';

const STEPS = [
  {
    k: 'Scan',
    t: 'Scan first.',
    d: 'Fixed camera pylons around the bay capture the vehicle before anything moves: length, width, wheel positions, fins, canopies and other protrusions, sensitive zones, and visible contamination. The same pass is a condition check: scratches, chips and faults such as a dead headlamp are compared with the car’s last post-wash record, and anything new or uncertain goes on a recheck list.',
  },
  {
    k: 'Plan',
    t: 'Plan the path.',
    d: 'The geometry becomes a vehicle-specific cleaning profile. Each arm gets its own path with a held standoff distance, slow zones around sensitive parts, and extra passes where contamination was found.',
  },
  {
    k: 'Rinse',
    t: 'Clean with precision.',
    d: 'Two exterior arms ride floor-mounted XY stages on either side of the car. High-pressure water loosens road film; interchangeable nozzles then switch to foam, spot treatment and spot-free rinse.',
  },
  {
    k: 'Target',
    t: 'Every vehicle is different.',
    d: 'Areas flagged in the first scan are revisited on purpose. The FLAG 01 smudge in the demo gets a targeted pass rather than a longer wash for the whole car.',
  },
  {
    k: 'Inspect',
    t: 'Inspect again.',
    d: 'The same cameras work through the recheck list. Marks that were only dirt are cleared, real damage is confirmed and the owner is notified. Visit after visit, this builds a wear-and-tear record for the car, useful to owners, fleets and rental hosts alike.',
  },
];

export default function WashRecap() {
  return (
    <section className="section section--cream recap" aria-labelledby="recap-title">
      <div className="section__inner">
        <SectionHead
          id="recap-title"
          eyebrow="How the wash is designed to work"
          status="vision"
          title="Scan. Plan. Clean. Inspect."
          lede="Conventional automatic washes move volume through a fixed machine. The Carwash-O-Matic is designed around the opposite idea: understand the vehicle first, then move the machine around it, with no brushes or cloth touching the paint."
        />
        <ol className="recap__steps">
          {STEPS.map((s, i) => (
            <li key={s.k} className="recap__step">
              <span className="recap__num mono">{String(i + 1).padStart(2, '0')}</span>
              <p className="recap__k mono">{s.k}</p>
              <h3 className="recap__t">{s.t}</h3>
              <p className="recap__d">{s.d}</p>
            </li>
          ))}
        </ol>

        <aside className="status-key" aria-label="Development status key">
          <p className="status-key__title mono">Development status · read this page with these labels</p>
          <dl className="status-key__grid">
            <div>
              <dt>
                <StatusChip status="vision" />
              </dt>
              <dd>The target system: what Jax World is designing the Carwash-O-Matic to become. Shown throughout the demo above.</dd>
            </div>
            <div>
              <dt>
                <StatusChip status="prototype" />
              </dt>
              <dd>What a first test cell is meant to prove: vision-guided paths and touchless cleaning on real vehicles.</dd>
            </div>
            <div>
              <dt>
                <StatusChip status="future" />
              </dt>
              <dd>Later phases, including interior cleaning and a multi-site network. Not yet in development.</dd>
            </div>
          </dl>
          <p className="status-key__note">
            No Carwash-O-Matic system is deployed today, and the visuals on this page are illustrations of the proposed architecture. Design goals such as reduced wear are
            intentions, not tested claims.
          </p>
        </aside>
      </div>
    </section>
  );
}
