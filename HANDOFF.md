# Handoff: Jax World Carwash-O-Matic concept site

Read this first. It is the context a new session needs to keep working on this
project without re-deriving decisions or breaking things that were fixed.

## Where the code lives

- **Repository:** `calebxjacquecloud-cloud/jaxworld` (GitHub), the site sits at the repo root.
  It was moved here from a folder in the unrelated `workout-app` repo; that copy is no longer maintained.
- **Live site:** https://jaxworld.jxat.ventures (its own Vercel project, deploys from `main`;
  DNS for jxat.ventures is on Squarespace)
- **Review link (Claude artifact):** https://claude.ai/artifact/8gkzc1zuFCko8QiKx8ZGpU
  (single-file build of the same site; republish `preview-dist/index.html` to
  that URL to update it)

## What it is

Investor/demo site for an early-stage autonomous, touchless, robotic car-wash
concept. The story follows the owner's "Revised Website Narrative" and moves
through five acts, shown by the act indicator in the header:

01 PROBLEM · 02 MACHINE · 03 SYSTEM · 04 NETWORK · 05 FUTURE

1. Garage door ("Car washes are outdated.") → road trip, one turn per beat:
   the problem (scrubbing paint) → the old model (same wash for every car) →
   why now (market $9.6B → $12.3B, source line slot in `MARKET_SOURCE`) → the
   opening (touchless + detailing, why not both?).
2. Product reveal ("Introducing the Carwash-O-Matic") → SEE (eyes close-up)
   → THINK (cleaning plan) → MOVE (hands close-up) → CLEAN (tool head, five
   lines) → ADAPT → DETAIL ("Automated detailing, one area at a time") →
   VERIFY → full-screen CONDITION RECORD.
3. "What if a car wash wasn't a building?" → everything packs into the
   container → "One system. One container. Ready to move."
4. Below the demo, only outward: where it goes → the network → physical AI
   thesis → autonomous future → short roadmap → final vision (container
   livery + "Autonomous cleaning for the autonomous age.") → CTA (one primary
   "Request the Jax World brief", Jacque) → collapsed "How it works" reference.

Fast lane after the garage opens: "View the 60-second experience" and "Skip
to overview". Never restart the product explanation after the container.

## Naming (decided by the owner, keep exactly)

- **Jax World** is the business (company, locations, partners, thesis).
- **Carwash-O-Matic** is the technology (the machine/system). Spelled with
  capital O and M and two hyphens. In big display headlines use non-breaking
  hyphens (U+2011) so it never splits across lines.
- Everything is presented as a concept: nothing is deployed, no bookings, no
  guaranteed claims. Keep that honesty in any new copy.

## Run it

```bash
cd jax-carwash-omatic
npm install
npm run dev                # http://localhost:3000
npm run lint && npm run typecheck && npm run build
npm run preview:build      # → preview-dist/index.html (single file for the artifact)
npm run check              # pre-publish safety checks (needs Playwright + Chromium)
```

## Always run before publishing

`npm run preview:build && npm run check`. It verifies three things that have
each broken at least once:

1. **Desktop pin:** the 3D scene stays pinned while scrolling. (Broken once by
   putting `overflow-x` on `<body>`; horizontal clipping must stay on `<html>` only.)
2. **Phone stepping inside an inset host:** the Claude app pads the page top,
   so the demo does not sit at y=0. Swipes must still step, the page must not
   scroll while stepping, and a swipe after the last step must hand back to
   normal page scrolling. The phone demo must exactly fit the visible screen.
3. **Phone width:** nothing wider than 320–430px screens. Note the width check
   runs without Google Fonts; the real display font (Unbounded) is much wider,
   and the original drift bug only showed with real fonts. If the sandbox can
   reach fonts.googleapis.com, also eyeball phone screenshots with fonts loaded.

## Architecture (the parts that matter)

| Path | Role |
|---|---|
| `components/WashExperience.tsx` | Wires the demo. Picks desktop scrub vs touch stepping after mount (`isTouchLayout()`), sizes the phone demo to the visible screen. |
| `hooks/useScrollProgress.ts` | Desktop: GSAP ScrollTrigger scrub → progress 0–1 in a ref. |
| `hooks/useStepProgress.ts` | Touch: one swipe (or wheel notch / arrow key) = one step; GSAP tweens progress to the next stop at a steady pace. Engages when the page is scrolled no further than the demo's top edge. |
| `hooks/useWashTimeline.ts` | The only animation loop: samples all channels at the current progress, poses the 3D scene, updates overlays. Skips frames when nothing moves. |
| `data/preludeSequence.ts` / `lib/roadPath.ts` / `components/wash/Prelude.ts` | Garage + road-trip prelude before the wash (every device): its 0–1 timeline and the four turn statements / the street route (rounded right-angle corners, ends exactly at the arrival path's drive 0.3) / garage (door with Jacque + teaser, canvas-drawn), streets and cross streets. Mascot art: `assets/jacque-sticker.png` (from the brand kit PPTX). |
| `data/outroSequence.ts` | "Pack it up" outro on its own 0–1 track after the main timeline (every device): car drives out, hidden utilities rise, container slides in, `PACK_PLAN` loads every unit into its slot, roof + wall close, livery shot. Also the outro copy and the packing checklist groups (`PACK_LIST`). |
| `components/wash/Utilities.ts` / `ShippingContainer.ts` / `OutroOverlay.tsx` | Utility-row equipment models / the 40 ft container with folding wall and canvas-drawn livery / the packing checklist (rows slide in as a group lifts, green check when it lands). |
| `data/introSequence.ts` | "Meet the machine" close-ups (SEE eyes, MOVE hands) on one 0–1 timeline, played in two splices (`INTRO.splices` in lib/animationConfig.ts) while the main timeline holds; every device. Also the tool-head supply lines and the arm park position. |
| `components/wash/IntroOverlay.tsx` / `ToolHead.ts` | Intro rings, leader, callouts and hose tags / the tool-head close-up model (own small scene, rendered in the detail window). |
| `data/washSequence.ts` | The whole choreography as named channels (main view `v*`, detail camera `cam*` + `inset`, vehicle, two robot arms, spray, foam, scan effects) plus the 3D-anchored HTML annotations. `M(t0, t1, {...})` = camera/effect moves; `A()`/`B()` = arm waypoints. |
| `lib/washStages.ts` | 12 chapters with 0–1 ranges, `SWIPE_STOPS` (phone steps: one per beat), all scroll-timed copy. |
| `data/conditionReport.ts` | Condition-check story: visit 7 vs visit 6 record, five findings, recheck list, wear history. |
| `lib/vehicleShape.ts` | Shape functions for the bubble-top car. Robot aim points are computed from these, so the paths follow the car's geometry. |
| `components/wash/*.ts` | Imperative Three.js: `WashScene` (orchestrator; renders the main view, then the close-up into the detail window with a scissor rect), `Vehicle` (procedural car), `RobotArm` (closed-form IK), `SpraySystem`, `FoamLayer`, `ScanEffects`, `CameraArray`, `Bay`. |
| `components/wash/*.tsx` | Overlays driven per frame from the timeline: copy cards, annotations, condition panel, post-wash recheck, desktop progress rail (a line only, no labels). |
| `lib/domWrite.ts` | `setFade()`: cached DOM writes; use it for any new per-frame overlay. |
| `lib/animationConfig.ts` | Tuning constants: scroll length, scrub, phone step speed/durations, vehicle dimensions. |
| `styles/*.css` | `tokens.css` (palette, fonts, panel tokens), `base.css`, `wash.css` (demo), `sections.css`. |

## Conventions that avoid regressions

- Never animate through React state during scroll; write to refs/DOM via the frame bus.
- Don't put `overflow` on `<body>` (breaks `position: sticky` pinning).
- Anything positioned from the top of the pinned scene uses `var(--header-bottom)` / `var(--safe-top)`.
- On touch devices backdrop blur is off (expensive over WebGL); panels use `--panel-bg`.
- Phone and desktop layouts differ on purpose; check both.
- The owner prefers one change at a time: make it, run the checks, screenshot, publish, then the next.

## Visual identity

1950s Googie meets modern robotics. Cream and charcoal sections, burnt orange
accent (`#d9622b`), cyan only for scan/sensing, chrome neutrals, red only for
status. Fonts: Unbounded (display), Yellowtail (script logo), Instrument Sans
(body), IBM Plex Mono (technical labels). The demo car is a turquoise
bubble-top custom with tail fins, chosen to show the cameras adapt to any
geometry.

## Recent changes (latest first)

- Phones: product reveal is a bottom panel (no longer over the car) with a headline sized to fit the wide Unbounded face; market stats, condition record and small-screen titles tightened so nothing runs off at 320–430px. Verified with the real brand fonts loaded locally (the sandbox can't reach Google Fonts, and the fallback font is much narrower).
- Phones: Start responds instantly. The first stop sits at the end of the prelude's opening hold (u 0.078), the Start step plays at a linear pace, and the garage door lifts with an ease-out.
- Phones: the wash is one Next per beat (`BEAT_STOPS` in lib/washStages.ts: 22 steps in all). Each tap plays the whole move and pauses with that beat's panel (and close-up window) up. Top-down view pulled back on portrait screens (`vPortraitK` 0.56) so the parked arms stay in frame. Step playback speed 0.026, max 6.5 s per step.
- Phones: Start drives straight out of the garage to "The problem"; each Next takes one corner and shows the next statement (prelude stops `[0, 0.37, 0.54, 0.71, 0.88]` in `SWIPE_STOPS`). The fast lane (60-second / Skip) is desktop-only.
- Phones only: on-screen step controls (`components/wash/StepControls.tsx`): Start on the garage screen, then ← Back / Next → with a step counter, Continue ↓ on the last step. Swipes still work. Bottom-anchored phone panels sit above the bar via `--ctl-h` on `.wash--stepped`; the garage door says "Press Start" on touch layouts.
- Rebuilt to the revised narrative (see "What it is"). New: act indicator (`components/ActIndicator.tsx`, `lib/acts.ts`), fast lane (`components/wash/FastLane.tsx`), full-screen vehicle record (`components/wash/VehicleRecord.tsx`), final vision (`components/FinalVision.tsx`, livery in `lib/livery.ts`), collapsed reference (`components/HowItWorks.tsx`). SEE/MOVE close-ups now on phones; tool head moved into CLEAN. Header hidden until the garage opens. Nav/skip jumps cut straight to the target instead of scrubbing through. Placeholder emails still in `components/sections/CallToAction.tsx`.
- Prelude before the wash: garage door with Jacque and "Car washes are outdated." → door swings up, car pulls out, view rises to top-down and rides with the car (car fixed on screen, streets turn beneath it) → four turns, one statement each (market $9.6B→$12.3B, 20-year stall, damage, touchless + detailing) → hands off into the existing opening shot. Scroll order is now prelude → wash → (desktop intro) → outro; see `mapProgress`.
- Outro: removed the floating equipment labels; the view stays zoomed out on the objects and a "14 · Pack up" checklist fills in one item at a time, each getting a green check as it lands in the container.
- 3D "pack it up" ending after the finale (desktop and phones): car drives out; water storage, pressurization skid, 4 chemistry tubs, control/compute + network cabinets and hose reels rise from a utility row; a 40 ft container slides in; rails, stage bridges, utilities, 8 pylons and both arms pack in one by one; roof lowers, long wall folds up to show the Jax World Carwash-O-Matic livery. Replaced the old illustrated "Modular" section (removed); the Modular nav link jumps into the ending (desktop anchor inside the wash section, phones jump to that step). Scroll mapping lives in `hooks/useWashTimeline.ts` (`mapProgress`).
- Desktop intro after the pylons rise: green rings draw around the 8 cameras → lower-left close-up of one camera + "eyes of the AI" callout; rings move to the 2 arms → whole-arm close-up; window wipes to a new tool-head model (1 nozzle, 5 supply lines: high-pressure water, body wash, tire clean & shine, hot wax, spot-free) with numbered tags and a list that lights up line by line. Arms now park at ±5.7 m so both are in frame. Phones and reduced motion skip the intro (not built for mobile yet).
- Two-camera layout: the main view climbs to a high top-down shot during arrival (car + all eight camera pylons + arm stages in frame) and never moves after that. Close-ups (driver side, front wheel, rear wheel, Flag 01, finish) play in a detail window in the upper right (`components/wash/DetailWindow.tsx` draws its frame and caption). Copy for scenes 06–08 moved to the left so it doesn't collide with the window. On phones the window stays closed for the finish, where the checklist sits.
- Removed the phase title box and the rail's chapter labels; the desktop rail is a line only.
- Slowed the demo: desktop scroll length 1500vh → 3200vh, scrub 0.7 → 1.4 s; phone steps 35 → 69 with slower playback.
- Removed the scroll cue, the "Concept · early stage" pill and the bottom telemetry bar; phone demo sized to the visible screen.
- Removed the hero sub-paragraph.
- Fixed pinning (overflow moved to `<html>`), sideways drift on phones, and touch stepping inside the Claude app's inset.
- Rebuilt phone playback as a step controller (replaced a stack of scroll/snap patches).
- Added the condition check (recheck list, owner notifications, wear record), the phase title and finer phone steps.

## Open items noticed but not yet requested

- Desktop, real fonts: the hero headline is large enough that "Precision-cleaned." overlaps the car's tail fin on the opening screen.
- Contact buttons use placeholder addresses at `jaxworld.example`.
- All 3D is procedural placeholder art; `lib/assets.ts` and `public/models/README.md` describe swapping in GLB models.
