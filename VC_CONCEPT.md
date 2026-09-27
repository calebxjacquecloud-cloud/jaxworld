# Second concept: the VC / board-advisor narrative (`/vc`)

A second, independent website concept for Jax World / Carwash-O-Matic, written
for venture investors, board candidates, strategic partners and operators. It
lives at **`/vc`** and coexists with the original concept at `/`.

## Isolation from the original concept

- **Nothing in the original site was changed.** The new concept is additive:
  `app/vc/page.tsx`, the `vc/` folder, `preview/vc-entry.tsx`,
  `scripts/build-vc-preview.mjs`, `scripts/check-vc.mjs` and two npm scripts.
- The original's 3D primitives are **imported read-only**, never modified:
  `components/wash/Vehicle.ts`, `RobotArm.ts`, `CameraArray.ts`, `ScanEffects.ts`,
  `SpraySystem.ts`, `FoamLayer.ts`, `Utilities.ts`, `ShippingContainer.ts`,
  plus `lib/timeline.ts`, `lib/domWrite.ts`, `lib/livery.ts`, `lib/iso.ts`,
  `lib/vehicleShape.ts`, `lib/animationConfig.ts`, `data/conditionReport.ts`
  (`MARKS`) and `data/outroSequence.ts` (`UTILITIES`, `PACK_PLAN`).
  If you change one of those files, check both concepts.
- All VC styles are scoped to `.vx` / `vx-` class names, so they cannot leak
  into the original. The root layout (fonts, original CSS) is shared as is.
- `npm run check` (original) still passes unchanged.

## Run, preview, check

```bash
npm run dev                      # http://localhost:3000/vc  (original stays at /)
npm run lint && npm run typecheck && npm run build
npm run preview:vc               # → preview-dist/vc.html (single file for review links)
npm run check:vc                 # desktop pins, fast path, phone widths 320–430px, no errors
VC_FONTS_CSS=path/to/local-fonts.css npm run check:vc   # same checks with the real brand fonts
```

## The story (fewer beats, stronger beats)

Six chapters in the header's progress indicator:
**01 Problem · 02 Machine · 03 Intelligence · 04 Deployment · 05 Network · 06 Future**

| Act | Where | What it proves |
|---|---|---|
| 1 Hook | film 0–1.6 | "Car washes are outdated." Garage opens, the car exits. |
| 2 Structural problem | film 1.6–4.2 | Cars changed; tunnels didn't. Five different vehicles, one fixed program. |
| 3 Inversion | film 4.2–6.95 | The tunnel lifts away; the machine rises around the stopped car. |
| 4–5 Product + wash | film 6.95–16 | SEE → THINK → ACT (rinse, clean, adapt, detail) → VERIFY, with a loop indicator. |
| 6 Condition intelligence | film 16–20.7 | Pre/post-wash wipe: dirt disappears, damage remains. Visit record. Manual-photo inspection vs. automatic. |
| 7 Productization | film 20.7–24.1 | The hidden infrastructure rises and packs into a 40 ft container. |
| 8 Deployment | film 24.1–30 | Airport parking garage lane; open lot where the container unfolds (wings lift, doors become ramps). |
| 9 Franchise | `Franchise.tsx` | One site → ship/install/connect/open → many sites; who does what. |
| 10 Platform | `Platform.tsx`, `Console.tsx` | Data in, improvements out ("Learn once. Improve everywhere."), the operating view. |
| 11 Two intelligences | `TwoIntelligences.tsx` | Machine vs. vehicle intelligence, interior as "next". |
| 12 Why now | `Market.tsx` | Market numbers only after the difference is clear. |
| 13 Physical AI | `Thesis.tsx` | Cameras see. Software decides. Robots act. |
| 14 Autonomous future | `Autonomous.tsx` | Driverless vehicles lose the driver as the inspector. |
| 15 Interior (Phase II) | `Interior.tsx` | Lost item + upholstery damage detected; roadmap today/next. |
| 16 Final scale | `FinalScale.tsx` | Zoom out: vehicle → machine → site → sites → environments → Jax World. |
| CTA | `Brief.tsx` | "Build the future of vehicle care." One dominant action. |

Fast path: **Investor overview** (header, and a chip after the garage opens)
opens a one-minute thesis panel whose points jump into the matching part of the
experience. The cinematic scroll stays the default.

## Architecture

| Path | Role |
|---|---|
| `vc/film/sequence.ts` | The film timeline (Acts 1–8) in scroll "units" (~1 screen each), using the original `TrackBuilder`. Camera, car, tunnel, machine, scan, arm waypoints, deployment channels. |
| `vc/film/FilmScene.ts` | Imperative Three.js orchestrator. Reuses the original machine; poses it per set; pre/post comparison render (scissor split); renders the "manual photos" and pylon views for the inspection beat. |
| `vc/film/RoadSet.ts` | Garage (Jacque on the door), road, the old fixed tunnel, the bay floor, the sensor field. |
| `vc/film/DeploySets.ts` | Airport parking garage lane; open lot with the unfolding container. |
| `vc/film/ProcCar.ts` | Stylised everyday vehicles (sedan, SUV, pickup, compact, van). |
| `vc/film/Film.tsx` | The pinned section and its single rAF loop: damped scroll progress → sample → pose → render → overlays. Idles when nothing moves; pauses off-screen. |
| `vc/film/FilmBeats.tsx` + `primitives.tsx` | All film copy. `<Beat t0 t1>`, `<In at out>`, `<On a b>`, `<Tag at/named>` (3D-pinned labels). |
| `vc/components/ScrollScene.tsx` | Pinned 2D scenes below the film, same `In`/`On` vocabulary plus `data-draw` SVG strokes. |
| `vc/sections/*` | Acts 9–16 and the CTA. |
| `vc/lib/content.ts` | **Facts to confirm before sharing:** market figures + source, contact address. |
| `vc/lib/chapters.ts` | Story-progress state and `jumpTo()`. |

Pacing is tuned in `vc/film/sequence.ts` (film) and each section's `units`.
Scroll length per unit: `--vx-unit` (film) and `--vx-unit2` (2D scenes) in the CSS.

## Before sharing this page

1. **Market source.** `MARKET.source` in `vc/lib/content.ts` is empty, so the
   chart says the citation is pending. The $9.6B (2026) → $12.3B (2031) figures
   were supplied with the brief; add the publisher and report title.
2. **Contact.** `CONTACT.email` is empty, so the CTA explains that the brief is
   shared by introduction (no placeholder addresses). Set a real address to turn
   the buttons into email links.
3. Every capability is framed as a concept, design target or future capability;
   interface data is labelled as illustrative. Keep that framing in new copy.
