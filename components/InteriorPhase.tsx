import SectionHead, { StatusChip } from './sections/SectionHead';

const NEXT = ['Vacuuming.', 'Surface cleaning.', 'Stain treatment.', 'Cabin inspection.'];

/** ROADMAP: kept short on purpose. Exterior care today, interior care next. */
export default function InteriorPhase() {
  return (
    <section id="roadmap" data-act="5" className="section section--cream roadmap" aria-labelledby="roadmap-title">
      <div className="section__inner">
        <SectionHead id="roadmap-title" eyebrow="Roadmap" title="From autonomous washing to autonomous vehicle care." />
        <ol className="roadmap__steps">
          <li className="roadmap__step">
            <p className="roadmap__when mono">
              Today <StatusChip status="vision" />
            </p>
            <h3 className="roadmap__t">Exterior care</h3>
            <p className="roadmap__d">Scan. Clean. Detail. Verify.</p>
          </li>
          <li className="roadmap__step roadmap__step--next">
            <p className="roadmap__when mono">
              Next <StatusChip status="future" />
            </p>
            <h3 className="roadmap__t">Interior care</h3>
            <p className="roadmap__d">{NEXT.join(' ')}</p>
          </li>
        </ol>
      </div>
    </section>
  );
}
