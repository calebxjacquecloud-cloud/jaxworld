/**
 * Every line of copy in the film, in story order. Times are film units (see
 * sequence.ts). Fewer beats, stronger beats: each one either creates tension,
 * explains the difference, proves the product, or shows it can repeat.
 */

import { VEHICLE } from '@/lib/animationConfig';
import { deck, topY } from '@/lib/vehicleShape';
import { MARKS as CAR_MARKS } from '@/data/conditionReport';
import { UTILITIES } from '@/data/outroSequence';
import { Beat, COM, In, On, Tag } from './primitives';
import { QUEUE } from './sequence';
import { CAR_SPECS } from './ProcCar';

type V3 = [number, number, number];
const S = VEHICLE.smudge;
const scratch: V3 = [
  (CAR_MARKS.scratch.a[0] + CAR_MARKS.scratch.b[0]) / 2 + 0.02,
  (CAR_MARKS.scratch.a[1] + CAR_MARKS.scratch.b[1]) / 2,
  (CAR_MARKS.scratch.a[2] + CAR_MARKS.scratch.b[2]) / 2,
];
const debris: V3 = [CAR_MARKS.debris.x, deck(CAR_MARKS.debris.z) + 0.03, CAR_MARKS.debris.z];
const chip: V3 = [CAR_MARKS.chip.x, topY(CAR_MARKS.chip.x, CAR_MARKS.chip.z) + 0.02, CAR_MARKS.chip.z];
const util = (id: string, y: number): V3 => {
  const u = UTILITIES.find((x) => x.id === id)!;
  return [u.at[0], y, u.at[1]];
};

export default function FilmBeats() {
  return (
    <>
      {/* ───────── ACT 1 · THE HOOK ───────── */}
      <Beat t0={-1} t1={0.72} place="hero" className="vx-beat--nofadein">
        <h1 className="vx-display vx-hero__title">
          Car washes <br />
          are outdated.
        </h1>
        <p className="vx-hero__cue mono">
          Scroll to open <span aria-hidden="true">↓</span>
        </p>
      </Beat>

      {/* ───────── ACT 2 · THE STRUCTURAL PROBLEM ───────── */}
      <Beat t0={1.62} t1={2.85}>
        <h2 className="vx-h2">The car wash hasn&rsquo;t changed with the car.</h2>
        <ul className="vx-ticks">
          <In as="li" at={1.9}>More valuable</In>
          <In as="li" at={2.02}>More complex</In>
          <In as="li" at={2.14}>More sensor&#8209;heavy</In>
          <In as="li" at={2.26}>Increasingly autonomous</In>
        </ul>
        <In as="p" at={2.45} className="vx-body">
          Yet most automated washes still run every vehicle through the same fixed process.
        </In>
      </Beat>

      <Beat
        t0={2.95}
        t1={4.22}
        place="top"
        layer={
          <>
            {QUEUE.map((q, i) => (
              <Tag key={q.kind} named={`queue${i}`} space="world" tone="cream">
                {CAR_SPECS[q.kind].label} <em>· standard program</em>
              </Tag>
            ))}
            <Tag at={[0, 2.25, -5.6]} space="world" tone="orange" from={3.15}>
              Fixed wash profile
            </Tag>
          </>
        }
      >
        <h2 className="vx-h2 vx-stack">
          <In as="span" at={3.0}>Different vehicle.</In>
          <In as="span" at={3.22}>Same machine.</In>
          <In as="span" at={3.44} className="vx-accent">Same path.</In>
        </h2>
        <In as="p" at={3.66} className="vx-body">
          A conventional tunnel doesn&rsquo;t understand the individual vehicle before it decides how to clean it.
        </In>
      </Beat>

      {/* ───────── ACT 3 · THE INVERSION ───────── */}
      <Beat t0={4.28} t1={6.28}>
        <p className="vx-eyebrow">The architectural inversion</p>
        <h2 className="vx-h2 vx-invert">
          <In as="span" at={4.3} className="vx-invert__old">
            <span className="vx-strike" data-strike="5.2">Move the car through the machine.</span>
          </In>
          <In as="span" at={5.55} className="vx-invert__new">
            Move the machine around the car.
          </In>
        </h2>
      </Beat>

      <Beat t0={6.3} t1={6.95} place="center">
        <p className="vx-display vx-trio">
          <In as="span" at={6.34}>See it.</In>
          <In as="span" at={6.48}>Understand it.</In>
          <In as="span" at={6.62} className="vx-accent">Clean it accordingly.</In>
        </p>
      </Beat>

      {/* ───────── ACT 4 · THE PRODUCT ───────── */}
      <Beat t0={6.98} t1={7.76}>
        <p className="vx-eyebrow">Introducing</p>
        <p className="vx-wordmark">{COM}</p>
        <In as="h2" at={7.12} className="vx-h3">A car wash that understands the vehicle first.</In>
        <In as="p" at={7.3} className="vx-note mono">Early-stage concept · capabilities shown are design targets</In>
      </Beat>

      <Beat
        t0={7.8}
        t1={9.02}
        layer={
          <>
            <Tag at={[0.95, topY(0.9, 2.0) + 0.05, 2.0]} from={8.6}>Body geometry</Tag>
            <Tag at={[VEHICLE.trackHalf + 0.2, 0.36, VEHICLE.frontAxleZ]} from={8.66}>Wheels</Tag>
            <Tag at={[0, topY(0, 0.3) + 0.02, 0.3]} from={8.72} tone="cream">Sensitive surface · canopy</Tag>
            <Tag at={chip} from={8.78} tone="cream">Existing mark · stone chip</Tag>
            <Tag at={[S.x + 0.02, S.y, S.z]} from={8.7} tone="orange">Needs attention · road film</Tag>
          </>
        }
      >
        <p className="vx-eyebrow"><span className="vx-step">01</span> See</p>
        <h2 className="vx-h2">See the vehicle before touching the vehicle.</h2>
        <In as="p" at={8.1} className="vx-body">
          Camera pylons rise around the car and map it: its shape, its wheels, its sensitive surfaces and its current condition.
        </In>
      </Beat>

      <Beat
        t0={9.04}
        t1={10.12}
        layer={
          <>
            <Tag at={[0, topY(0, -0.8) + 0.02, -0.8]} from={9.55} tone="cream">Avoid · acrylic canopy</Tag>
            <Tag at={[S.x + 0.02, S.y, S.z]} from={9.62} tone="orange">Extra attention · driver door</Tag>
          </>
        }
      >
        <p className="vx-eyebrow"><span className="vx-step">02</span> Think</p>
        <h2 className="vx-h2">Every vehicle gets its own cleaning plan.</h2>
        <ul className="vx-plan">
          <In as="li" at={9.2}><span>Where to move</span></In>
          <In as="li" at={9.3}><span>Where to spray</span></In>
          <In as="li" at={9.4}><span>Which treatment to use</span></In>
          <In as="li" at={9.5}><span>What to avoid</span></In>
          <In as="li" at={9.6}><span>What needs extra attention</span></In>
        </ul>
      </Beat>

      <Beat t0={10.15} t1={11.0}>
        <p className="vx-eyebrow"><span className="vx-step">03</span> Act</p>
        <h2 className="vx-h2">The car stays still. The robots adapt around it.</h2>
        <In at={10.42} className="vx-versus">
          <div>
            <span className="mono">Traditional tunnel</span>
            <span>Vehicle moves through fixed machinery</span>
          </div>
          <div className="is-us">
            <span className="mono">{COM}</span>
            <span>Machinery adapts to the vehicle</span>
          </div>
        </In>
      </Beat>

      {/* ───────── ACT 5 · THE WASH ───────── */}
      <Beat t0={11.02} t1={12.0} className="vx-beat--compact">
        <p className="vx-eyebrow">Act · Rinse</p>
        <h3 className="vx-h3">Follow the surface.</h3>
        <p className="vx-body">The arm traces the scanned geometry, not a preset profile.</p>
      </Beat>

      <Beat t0={12.0} t1={13.1} className="vx-beat--compact">
        <p className="vx-eyebrow">Act · Clean</p>
        <h3 className="vx-h3">One robot. Multiple treatments.</h3>
        <ul className="vx-treat">
          <On a={11.9} b={12.12}><i style={{ background: '#4f9be0' }} />Water</On>
          <On a={12.12} b={12.88}><i style={{ background: '#f6e7d2' }} />Body wash</On>
          <On a={12.88} b={12.97}><i style={{ background: '#9b7bff' }} />Tire treatment</On>
          <On a={12.97} b={13.04}><i style={{ background: '#f2b14a' }} />Wax</On>
          <On a={13.04} b={13.2}><i style={{ background: '#bfeef2' }} />Spot&#8209;free finish</On>
        </ul>
      </Beat>

      <Beat t0={13.1} t1={14.1} className="vx-beat--compact" layer={<Tag at={[S.x + 0.03, S.y + 0.2, S.z]} from={13.45} tone="orange">Flag 01 · targeted treatment</Tag>}>
        <p className="vx-eyebrow">Act · Adapt</p>
        <h3 className="vx-h3">Not every car needs the same wash.</h3>
        <p className="vx-body">The scan flagged road film on the driver door. The arm slows, closes in and treats that area only.</p>
      </Beat>

      <Beat
        t0={14.1}
        t1={15.18}
        className="vx-beat--compact"
        layer={<Tag at={[-(VEHICLE.trackHalf + 0.2), 0.7, VEHICLE.frontAxleZ]} from={14.36} until={14.8}>Wheel · tire treatment</Tag>}
      >
        <p className="vx-eyebrow">Act · Detail</p>
        <h3 className="vx-h3">Precision where the vehicle needs it.</h3>
        <p className="vx-body">Wheel-specific cleaning. Stubborn spots. Localized treatment.</p>
        <In as="p" at={14.45} className="vx-badge mono">Automated detailing</In>
      </Beat>

      <Beat t0={15.2} t1={16.02}>
        <p className="vx-eyebrow"><span className="vx-step">04</span> Verify</p>
        <h2 className="vx-h2">Then it looks again.</h2>
        <In as="p" at={15.4} className="vx-body">A post-wash scan checks the result instead of assuming it.</In>
      </Beat>

      {/* ───────── ACT 6 · CONDITION INTELLIGENCE ───────── */}
      <Beat
        t0={16.05}
        t1={17.38}
        layer={
          <>
            <Tag at={scratch} from={16.4} until={17.02} tone="cream">Mark?</Tag>
            <Tag at={debris} from={16.44} until={17.02} tone="cream">Mark?</Tag>
            <Tag at={[S.x + 0.02, S.y, S.z]} from={16.48} until={17.02} tone="cream">Mark?</Tag>
            <Tag at={scratch} from={17.04} tone="orange">Scratch · remains</Tag>
            <Tag at={debris} from={17.08} tone="green">Debris · washed away</Tag>
            <Tag at={[S.x + 0.02, S.y, S.z]} from={17.12} tone="green">Road film · washed away</Tag>
          </>
        }
      >
        <p className="vx-eyebrow">Condition intelligence</p>
        <div className="vx-swap">
          <In as="h2" at={16.05} out={16.98} className="vx-h2">Every clean creates a condition check.</In>
          <In as="h2" at={17.02} className="vx-h2">
            Dirt disappears. <span className="vx-accent">Damage remains.</span>
          </In>
        </div>
        <ol className="vx-pipe mono">
          <On as="li" a={16.1} b={16.55}>Before cleaning</On>
          <On as="li" a={16.55} b={17.0}>After cleaning</On>
          <On as="li" a={17.0} b={17.5}>Compare</On>
        </ol>
      </Beat>

      <Beat t0={17.4} t1={18.42} layer={<Tag at={scratch} tone="orange">New · added to record</Tag>}>
        <h2 className="vx-h2">A running condition record for every vehicle.</h2>
        <ol className="vx-record">
          <In as="li" at={17.52}><b className="mono">Visit 01</b><span>No changes</span></In>
          <In as="li" at={17.64}><b className="mono">Visit 02</b><span>Known wheel mark</span></In>
          <In as="li" at={17.76}><b className="mono">Visit 03</b><span>No changes</span></In>
          <In as="li" at={17.9} className="is-alert"><b className="mono">Visit 04</b><span>New scratch detected · driver rear quarter</span></In>
        </ol>
      </Beat>

      <Beat
        t0={18.45}
        t1={19.32}
        place="center"
        className="vx-beat--wide"
        layer={
          <div className="vx-collage" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <In key={i} at={18.55 + i * 0.05} className={`vx-photo vx-photo--m${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img data-photo={`m${i}`} alt="" />
              </In>
            ))}
          </div>
        }
      >
        <p className="vx-eyebrow">Today · rental and shared fleets</p>
        <h2 className="vx-h2">Manual vehicle inspection isn&rsquo;t standardized.</h2>
        <p className="vx-body">
          Rental owners already document condition before and after use. But handheld photos vary in angle, lighting, distance and coverage.
        </p>
      </Beat>

      <Beat
        t0={19.32}
        t1={19.98}
        place="center"
        className="vx-beat--wide"
        layer={
          <In at={19.44} className="vx-grid8" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img data-photo={`s${i}`} alt="" />
                <figcaption className="mono">CAM {String(i + 1).padStart(2, '0')}</figcaption>
              </figure>
            ))}
          </In>
        }
      >
        <h2 className="vx-h2">What if the inspection happened automatically every time the vehicle was cleaned?</h2>
        <ol className="vx-flow mono">
          {['Return', 'Clean', 'Inspect', 'Record', 'Ready'].map((w, i) => (
            <In key={w} as="li" at={19.56 + i * 0.06}>{w}</In>
          ))}
        </ol>
      </Beat>

      <Beat t0={20.0} t1={20.66} place="center">
        <p className="vx-h2 vx-pair">
          <In as="span" at={20.02}>Cleaning creates the opportunity to inspect.</In>
          <In as="span" at={20.2} className="vx-accent">Inspection creates the opportunity to understand the asset.</In>
        </p>
      </Beat>

      {/* ───────── ACT 7 · PRODUCTIZATION ───────── */}
      <Beat
        t0={20.85}
        t1={21.68}
        place="top"
        layer={
          <>
            <Tag named="armA" space="world" from={21.3} tone="cream">Robotics</Tag>
            <Tag at={[-9.6, 0.1, 3.2]} space="world" from={21.33} tone="cream">Tracks</Tag>
            <Tag at={[-3.1, 2.6, -4.3]} space="world" from={21.36} tone="cyan">Cameras</Tag>
            <Tag at={util('rack', 2.2)} space="world" from={21.39} tone="cream">Controls &amp; compute</Tag>
            <Tag at={util('water', 2.3)} space="world" from={21.42} tone="cream">Water</Tag>
            <Tag at={util('tub-wash', 1.1)} space="world" from={21.45} tone="cream">Chemistry</Tag>
            <Tag at={util('cabinet', 1.6)} space="world" from={21.48} tone="cream">Monitoring</Tag>
          </>
        }
      >
        <p className="vx-eyebrow">Productization</p>
        <h3 className="vx-h3">The system behind the wash.</h3>
      </Beat>

      <Beat t0={21.72} t1={23.02}>
        <h2 className="vx-h2">This car wash can be productized.</h2>
        <In as="p" at={21.95} className="vx-body">
          Every component is designed to pack into one standard 40&#8209;foot container.
        </In>
      </Beat>

      <Beat t0={23.05} t1={24.18}>
        <h2 className="vx-h2">A complete car wash. Shipped as a system.</h2>
        <ol className="vx-verbs">
          <In as="li" at={23.45}>Order it.</In>
          <In as="li" at={23.57}>Install it.</In>
          <In as="li" at={23.69}>Connect it.</In>
          <In as="li" at={23.81}>Operate it.</In>
        </ol>
        <In as="p" at={23.9} className="vx-note mono">Intended architecture · site requirements to be validated</In>
      </Beat>

      {/* ───────── ACT 8 · DEPLOYMENT ───────── */}
      <Beat t0={24.12} t1={24.44} place="center">
        <h2 className="vx-h2 vx-center">One system. Different environments.</h2>
      </Beat>

      <Beat
        t0={24.6}
        t1={26.42}
        layer={
          <>
            <Tag named="laneCar" space="world" tone="cream" until={25.36}>Returned</Tag>
            <Tag named="laneCar" space="world" tone="cyan" from={25.36} until={25.76}>Cleaning</Tag>
            <Tag named="laneCar" space="world" tone="cyan" from={25.76} until={26.06}>Inspecting</Tag>
            <Tag named="laneCar" space="world" tone="cream" from={26.06} until={26.14}>Recorded</Tag>
            <Tag named="laneCar" space="world" tone="green" from={26.14}>Ready for the next renter</Tag>
          </>
        }
      >
        <p className="vx-eyebrow">Environment 01</p>
        <h2 className="vx-h2">Airport parking garages</h2>
        <p className="vx-body">A compact wash and inspection lane inside the existing covered structure.</p>
        <ol className="vx-flow vx-flow--tight mono">
          <On as="li" a={25.36} b={25.76}>Clean</On>
          <On as="li" a={25.76} b={26.06}>Inspect</On>
          <On as="li" a={26.06} b={26.14}>Record</On>
          <On as="li" a={26.14} b={27}>Return to service</On>
        </ol>
      </Beat>

      <Beat t0={26.62} t1={29.02}>
        <p className="vx-eyebrow">Environment 02</p>
        <h2 className="vx-h2">Open parking lots</h2>
        <ol className="vx-steps">
          <On a={26.62} b={27.08}>Container placed</On>
          <On a={27.08} b={27.66}>Side walls lift into canopies</On>
          <On a={27.66} b={28.15}>End doors fold into ramps</On>
          <On a={28.15} b={28.42}>Arms deploy into the motion zones</On>
          <On a={28.42} b={28.56}>Cameras rise</On>
          <On a={28.56} b={29.2}>Vehicle drives in</On>
        </ol>
        <In as="p" at={28.62} className="vx-h3 vx-accent">The container becomes the wash environment.</In>
      </Beat>

      <Beat t0={29.05} t1={30.5} place="center">
        <p className="vx-display vx-trio vx-trio--sm">
          <In as="span" at={29.1}>Standardized system.</In>
          <In as="span" at={29.24}>Flexible deployment.</In>
          <In as="span" at={29.38} className="vx-accent">Repeatable rollout.</In>
        </p>
      </Beat>
    </>
  );
}
