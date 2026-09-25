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
concept. The heart of the page is a pinned 3D wash demo driven by scroll
(desktop) or swipes (phone). Below it are supporting sections: how it works,
3D-printer motion analogy, shipping-container packing and deployment, physical
AI thesis, autonomous fleets, interior cleaning (future phase), operations
dashboard mock, call to action, footer disclaimer.

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
| `data/introSequence.ts` | Desktop-only "meet the bay" intro on its own 0–1 timeline, spliced in at `INTRO.at` (lib/animationConfig.ts) while the main timeline holds. Also the tool-head supply lines and the arm park position. |
| `components/wash/IntroOverlay.tsx` / `ToolHead.ts` | Intro rings, leader, callouts and hose tags / the tool-head close-up model (own small scene, rendered in the detail window). |
| `data/washSequence.ts` | The whole choreography as named channels (main view `v*`, detail camera `cam*` + `inset`, vehicle, two robot arms, spray, foam, scan effects) plus the 3D-anchored HTML annotations. `M(t0, t1, {...})` = camera/effect moves; `A()`/`B()` = arm waypoints. |
| `lib/washStages.ts` | 12 chapters with 0–1 ranges, `SWIPE_STOPS` (69 phone steps: key stops plus midpoints), all scroll-timed copy. |
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
