import SectionHead, { StatusChip } from './sections/SectionHead';

const CAPS = [
  { t: 'Vacuuming', d: 'Seats, footwells and cargo areas.' },
  { t: 'Surface cleaning', d: 'Dash, console, door cards and touchscreens.' },
  { t: 'Targeted stain treatment', d: 'Spot work on spills found by the cabin scan.' },
  { t: 'Cabin inspection', d: 'Left-behind items, damage and condition records.' },
];

export default function InteriorPhase() {
  return (
    <section className="section section--cream interior" aria-labelledby="interior-title">
      <div className="section__inner">
        <SectionHead
          id="interior-title"
          eyebrow="Roadmap"
          status="future"
          title="Phase II — autonomous interior cleaning."
          lede="The long-term architecture leaves room for two interior robots alongside the two exterior arms. Interior cleaning is an unsolved robotics problem, and it is presented here as future product development, not a working capability."
        />
        <div className="interior__grid">
          <figure className="interior__art">
            <svg viewBox="0 0 560 300" role="img" aria-label="Cutaway vehicle with dashed outlines of future interior robots">
              <defs>
                <pattern id="cut" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="8" stroke="#c9bca3" strokeWidth="2" />
                </pattern>
              </defs>
              <path d="M40 210 L52 170 Q60 150 96 146 L170 138 Q210 88 262 80 L360 76 Q410 78 440 118 L468 140 Q510 146 516 176 L520 210 Z" fill="url(#cut)" stroke="#1d1b18" strokeWidth="2" />
              <path d="M186 138 Q220 98 264 92 L352 90 Q392 92 418 128 L426 140 Z" fill="#f3ebdd" stroke="#1d1b18" strokeWidth="1.5" />
              {/* seats */}
              <path d="M300 186 L300 128 Q300 118 312 118 L320 118 Q328 120 326 132 L318 180 Z" fill="#8a9098" />
              <path d="M392 186 L394 126 Q396 116 406 118 L412 120 Q418 124 416 134 L406 186 Z" fill="#8a9098" />
              <rect x="290" y="178" width="60" height="12" rx="5" fill="#8a9098" />
              <rect x="382" y="178" width="56" height="12" rx="5" fill="#8a9098" />
              <circle cx="246" cy="138" r="13" fill="none" stroke="#1d1b18" strokeWidth="3" />
              <circle cx="128" cy="212" r="34" fill="#1d1b18" />
              <circle cx="430" cy="212" r="34" fill="#1d1b18" />
              <circle cx="128" cy="212" r="16" fill="#c9cdd2" />
              <circle cx="430" cy="212" r="16" fill="#c9cdd2" />
              {/* future interior arms */}
              <g fill="none" stroke="#d9622b" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round">
                <path d="M270 290 L270 250 L312 214 L344 160" />
                <path d="M470 290 L470 250 L440 214 L410 164" />
              </g>
              <circle cx="344" cy="160" r="7" fill="#d9622b" />
              <circle cx="410" cy="164" r="7" fill="#d9622b" />
              <text x="262" y="296" className="interior__tag" textAnchor="end">
                interior robot C · future
              </text>
              <text x="552" y="296" className="interior__tag" textAnchor="end">
                interior robot D · future
              </text>
            </svg>
          </figure>
          <div className="interior__side">
            <ul className="interior__caps">
              {CAPS.map((c) => (
                <li key={c.t}>
                  <p className="interior__cap-t">
                    {c.t} <span className="interior__future mono">Future development</span>
                  </p>
                  <p className="interior__cap-d">{c.d}</p>
                </li>
              ))}
            </ul>
            <div className="interior__arch" aria-label="Robot architecture by phase">
              <p className="mono interior__arch-title">Robot architecture</p>
              <div className="interior__slots">
                <div className="slot slot--on">
                  <span>Exterior A</span>
                  <StatusChip status="vision" />
                </div>
                <div className="slot slot--on">
                  <span>Exterior B</span>
                  <StatusChip status="vision" />
                </div>
                <div className="slot">
                  <span>Interior C</span>
                  <StatusChip status="future" />
                </div>
                <div className="slot">
                  <span>Interior D</span>
                  <StatusChip status="future" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
