# Jax World Carwash-O-Matic — concept site

Investor/demo website for an early-stage autonomous, touchless robotic car-wash
concept. The core of the page is one pinned, scroll-scrubbed 3D scene: scrolling
drives the car through the machine, scrolling up runs it backwards.

## Run

```bash
npm install
npm run dev            # http://localhost:3000
npm run lint && npm run typecheck && npm run build
npm run preview:build  # single-file review build → preview-dist/index.html
npm run check          # pre-publish safety checks (desktop pin, phone stepping, phone width)
```

## Deploy

The site is its own Vercel project (framework preset: Next.js, root directory: the repo root, no
environment variables). Pushing to `main` deploys to production at https://jaxworld.jxat.ventures.

The subdomain is a CNAME record in Squarespace DNS for `jxat.ventures`: host `jaxworld`,
pointing at the value Vercel shows under Project → Settings → Domains.

## How it's put together

| Path | Role |
|---|---|
| `lib/timeline.ts` | Keyframe engine: `TrackBuilder` (move/key), easing, allocation-free sampling |
| `data/washSequence.ts` | The whole choreography as named channels (vehicle, camera, arms, spray, foam, scan, QC) plus projected HTML annotations |
| `lib/washStages.ts` | The 12 chapters, their 0–1 ranges, reduced-motion hold frames, scroll copy |
| `lib/animationConfig.ts` | Dimensions and tuning constants (vehicle, gantry, robot links, camera pylons, quality tiers) |
| `hooks/useScrollProgress.ts` | Desktop: GSAP ScrollTrigger scrub → normalized progress in a ref (no React re-renders) |
| `hooks/useStepProgress.ts` | Touch: one swipe = one step; the timeline tweens to the next stop and stops (`SWIPE_STOPS` in `lib/washStages.ts`) |
| `hooks/useWashTimeline.ts` | The single rAF loop: sample channels → pose 3D scene → update overlays; idles when nothing moves |
| `components/wash/*` | Imperative Three.js pieces: `WashScene`, `Vehicle`, `RobotArm` (closed-form IK), `SpraySystem`, `FoamLayer`, `ScanEffects`, `CameraArray`, `Bay`; plus the React overlays |
| `components/*.tsx`, `components/sections/*` | Supporting sections (motion analogy, modular container, deployment, physical AI, autonomous future, interior phase, ops platform, CTA) |

Tuning pacing: edit the `M(t0, t1, {...})` camera/effect moves and the `A()/B()`
arm waypoints in `data/washSequence.ts`. Stage boundaries live in `lib/washStages.ts`.

## Placeholder assets

All 3D is procedural. `lib/assets.ts` holds the swap switch and paths for
`/public/models/car.glb`, `robot-arm.glb`, `camera.glb` and `container.glb`;
see `public/models/README.md` for the node layout each replacement needs.

## Accessibility & performance

- `prefers-reduced-motion`: the wash steps through chapters as discrete states;
  scrubbed SVG sections show their finished state.
- Three.js loads lazily after the shell renders; the loop pauses off-screen;
  pixel ratio, shadows, splash particles and point-cloud density scale by device tier.
- Portrait screens get their own framing and bottom copy cards.
