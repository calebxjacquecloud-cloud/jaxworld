/**
 * PLACEHOLDER VEHICLE — Googie bubble-top custom
 * ──────────────────────────────────────────────
 * A procedural 1950s–60s show car: long low turquoise body lofted from
 * cross-sections (lib/vehicleShape.ts), swept tail fins, an open cockpit under
 * twin acrylic bubble canopies, white interior, whitewall tires with chrome
 * spinner caps, quad headlamps, a chrome grille and bumpers, and a row of
 * rocket tail-lights.
 *
 * It is deliberately unusual. The demo's claim is that the wash plans around
 * whatever geometry the cameras see, and the robot paths are derived from the
 * same shape functions this mesh is built from.
 *
 * PRODUCTION SWAP: replace `createPlaceholderVehicle()` with a loader for
 * /public/models/car.glb (see `lib/assets.ts`). The rest of the scene only
 * depends on the `VehicleRig` interface below, so a production model needs to
 * provide the same pieces:
 *   - paint meshes (for the grime/smudge shader and scan wireframe)
 *   - foam meshes (painted panels plus glass that suds can cling to)
 *   - four wheel nodes (spin), front two with steering pivots
 *   - vehicle space: nose toward +Z, driver side toward +X, ground at y = 0
 */

import * as THREE from 'three';
import { VEHICLE } from '@/lib/animationConfig';
import { BODY, CANOPIES, deck, halfWidth, sectionRight, tub } from '@/lib/vehicleShape';
import { MARKS } from '@/data/conditionReport';
import { NOISE_GLSL } from './shaders';

export interface WheelRig {
  steer: THREE.Object3D;
  spin: THREE.Object3D;
  front: boolean;
}

export interface VehicleRig {
  root: THREE.Group;
  /** Painted panels: receive grime and the smudge, and form the scan wireframe. */
  paintMeshes: THREE.Mesh[];
  /** Surfaces the foam shell covers (paint + canopies). */
  foamMeshes: THREE.Mesh[];
  /** Everything solid, for point-cloud sampling. */
  scanMeshes: THREE.Mesh[];
  wheels: WheelRig[];
  setSurface(grime: number, dirt: number, gloss: number): void;
  setHeadlights(v: number): void;
  dispose(): void;
}

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Rounded slab (x width, z length) of given thickness, centred at the origin. */
export function roundedSlab(w: number, l: number, t: number, r: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(roundedRectShape(w, l, r), {
    depth: t,
    bevelEnabled: true,
    bevelThickness: Math.min(0.02, t / 3),
    bevelSize: Math.min(0.02, r / 2),
    bevelSegments: 2,
    curveSegments: 10,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -t / 2, 0);
  return g;
}

/** Loft the body from cross-sections along Z, with end caps. */
function loftBody(stations = 110): THREE.BufferGeometry {
  const zs: number[] = [];
  for (let i = 0; i <= stations; i++) {
    // cluster stations toward the ends where the shape changes fastest
    const u = i / stations;
    const e = 0.5 - 0.5 * Math.cos(u * Math.PI);
    const k = 0.55 * u + 0.45 * e;
    zs.push(BODY.rearZ + (BODY.frontZ - BODY.rearZ) * k);
  }
  const positions: number[] = [];
  let ring = 0;
  for (const z of zs) {
    const right = sectionRight(z);
    // ring: bottom centre → right side → top centre → left side (mirrored)
    const pts: [number, number][] = [...right];
    for (let i = right.length - 2; i >= 1; i--) pts.push([-right[i][0], right[i][1]]);
    ring = pts.length;
    for (const [x, y] of pts) positions.push(x, y, z);
  }
  const index: number[] = [];
  for (let s = 0; s < zs.length - 1; s++) {
    for (let i = 0; i < ring; i++) {
      const a = s * ring + i;
      const b = s * ring + ((i + 1) % ring);
      const c = (s + 1) * ring + i;
      const d = (s + 1) * ring + ((i + 1) % ring);
      index.push(a, c, b, b, c, d);
    }
  }
  // end caps (fan to the section centroid)
  for (const [s, flip] of [
    [0, true],
    [zs.length - 1, false],
  ] as [number, boolean][]) {
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < ring; i++) {
      cx += positions[(s * ring + i) * 3];
      cy += positions[(s * ring + i) * 3 + 1];
    }
    const center = positions.length / 3;
    positions.push(cx / ring, cy / ring, zs[s]);
    for (let i = 0; i < ring; i++) {
      const a = s * ring + i;
      const b = s * ring + ((i + 1) % ring);
      if (flip) index.push(center, b, a);
      else index.push(center, a, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  // Winding sanity check: the driver-side flank normal must point outward (+X).
  const mid = Math.floor(zs.length / 2) * ring + 4;
  if (g.getAttribute('normal').getX(mid) < 0) {
    const idx = g.getIndex()!;
    for (let i = 0; i < idx.count; i += 3) {
      const t = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, t);
    }
    g.computeVertexNormals();
  }
  return g;
}

/** Surface shader: general road film, the FLAG 01 smudge, and gloss after rinse. */
function patchPaint(mat: THREE.MeshPhysicalMaterial) {
  const uniforms = {
    uGrime: { value: 1 },
    uDirt: { value: 1 },
    uGrimeColor: { value: new THREE.Color(VEHICLE.grimeColor) },
    uSmudge: { value: new THREE.Vector4(VEHICLE.smudge.x, VEHICLE.smudge.y, VEHICLE.smudge.z, VEHICLE.smudge.radius) },
    // condition marks from data/conditionReport.ts
    uScratchA: { value: new THREE.Vector3(...MARKS.scratch.a) },
    uScratchB: { value: new THREE.Vector3(...MARKS.scratch.b) },
    uScratchW: { value: MARKS.scratch.width },
    uChip: { value: new THREE.Vector4(MARKS.chip.x, deck(MARKS.chip.z) + 0.05, MARKS.chip.z, MARKS.chip.radius) },
    uDebris: { value: new THREE.Vector4(MARKS.debris.x, deck(MARKS.debris.z), MARKS.debris.z, MARKS.debris.radius) },
    uDebrisAmt: { value: 1 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vJxLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvJxLocal = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vJxLocal;
uniform float uGrime;
uniform float uDirt;
uniform vec3 uGrimeColor;
uniform vec4 uSmudge;
uniform vec3 uScratchA;
uniform vec3 uScratchB;
uniform float uScratchW;
uniform vec4 uChip;
uniform vec4 uDebris;
uniform float uDebrisAmt;
${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float jxN = jxFbm(vJxLocal * 3.2);
float jxLow = 1.0 - smoothstep(0.25, 0.85, vJxLocal.y);
float jxGrime = clamp(uGrime * (0.16 + 0.55 * jxLow) * (0.55 + 0.9 * jxN), 0.0, 0.8);
diffuseColor.rgb = mix(diffuseColor.rgb, uGrimeColor, jxGrime);
vec3 jxD = (vJxLocal - uSmudge.xyz) / vec3(1.2, 0.72, 1.55);
float jxR = length(jxD) / uSmudge.w + (jxFbm(vJxLocal * 11.0) - 0.5) * 0.7;
float jxSm = (1.0 - smoothstep(0.45, 1.0, jxR)) * uDirt;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.075, 0.062, 0.045), jxSm * 0.94);
// new scratch: bright primer line along the driver rear quarter
vec3 jxPa = vJxLocal - uScratchA;
vec3 jxBa = uScratchB - uScratchA;
float jxH = clamp(dot(jxPa, jxBa) / dot(jxBa, jxBa), 0.0, 1.0);
float jxScr = 1.0 - smoothstep(uScratchW * 0.45, uScratchW, length(jxPa - jxBa * jxH));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.88, 0.87), jxScr * 0.95);
// known stone chip on the hood (projected from above)
float jxCd = length(vJxLocal.xz - uChip.xz);
float jxChip = (1.0 - smoothstep(uChip.w * 0.55, uChip.w, jxCd)) * step(uChip.y - 0.12, vJxLocal.y);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.82, 0.8, 0.74), jxChip);
// road debris on the rear deck: a dark streak that washes off
vec2 jxDd = (vJxLocal.xz - uDebris.xz) / vec2(0.35, 1.0);
float jxDeb = (1.0 - smoothstep(uDebris.w * 0.35, uDebris.w, length(jxDd) + (jxFbm(vJxLocal * 18.0) - 0.5) * 0.05))
  * step(uDebris.y - 0.1, vJxLocal.y) * uDebrisAmt;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.1, 0.085, 0.07), jxDeb * 0.9);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.82, clamp(jxGrime * 1.3 + jxSm, 0.0, 1.0));`,
      );
  };
  mat.customProgramCacheKey = () => 'jx-paint';
  return uniforms;
}

/** Whitewall tire: black tread and inner wall, white outer sidewall band. Axis +X = outer face. */
function tireGeometries() {
  const v = (r: number, y: number) => new THREE.Vector2(r, y);
  const black = new THREE.LatheGeometry(
    [v(0.2, -0.11), v(0.26, -0.125), v(0.33, -0.12), v(0.355, -0.085), v(0.363, 0), v(0.355, 0.085), v(0.33, 0.118), v(0.318, 0.124)],
    48,
  );
  const white = new THREE.LatheGeometry([v(0.318, 0.1245), v(0.27, 0.131), v(0.225, 0.127), v(0.2, 0.112)], 48);
  for (const g of [black, white]) g.rotateZ(-Math.PI / 2);
  return { black, white };
}

export function createPlaceholderVehicle(): VehicleRig {
  const root = new THREE.Group();
  root.name = 'Vehicle';
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => {
    disposables.push(x);
    return x;
  };

  const paint = track(
    new THREE.MeshPhysicalMaterial({
      color: VEHICLE.bodyColor,
      metalness: 0.45,
      roughness: 0.32,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
      envMapIntensity: 0.9,
    }),
  );
  const paintUniforms = patchPaint(paint);
  const acrylic = track(
    new THREE.MeshPhysicalMaterial({
      color: '#eafcff',
      metalness: 0,
      roughness: 0.03,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      transparent: true,
      opacity: 0.2,
      envMapIntensity: 1.8,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  const chrome = track(new THREE.MeshStandardMaterial({ color: '#e3e6ea', metalness: 1, roughness: 0.12 }));
  const trim = track(new THREE.MeshStandardMaterial({ color: '#15181b', metalness: 0.3, roughness: 0.6 }));
  const vinyl = track(new THREE.MeshStandardMaterial({ color: '#efe9df', metalness: 0, roughness: 0.55 }));
  const tireBlack = track(new THREE.MeshStandardMaterial({ color: '#111214', roughness: 0.9, side: THREE.DoubleSide }));
  const tireWhite = track(new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.7, side: THREE.DoubleSide }));
  const headMat = track(new THREE.MeshStandardMaterial({ color: '#fff6e3', emissive: '#ffe9c4', emissiveIntensity: 2.2 }));
  // one headlamp is out: dark, slightly smoky lens (flagged by the condition scan)
  const deadLamp = track(new THREE.MeshStandardMaterial({ color: '#5b5a55', emissive: '#000000', roughness: 0.35, metalness: 0.2 }));
  const rocketMat = track(new THREE.MeshPhysicalMaterial({ color: '#b3160d', emissive: '#ff2a1a', emissiveIntensity: 0.9, roughness: 0.2, clearcoat: 1 }));
  const pleat = track(new THREE.MeshStandardMaterial({ color: '#cfc6b8', roughness: 0.6 }));
  const plateMat = track(new THREE.MeshStandardMaterial({ color: '#e9dfb8', roughness: 0.6 }));

  const paintMeshes: THREE.Mesh[] = [];
  const foamMeshes: THREE.Mesh[] = [];
  const scanMeshes: THREE.Mesh[] = [];
  const add = (
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    opts: { paint?: boolean; foam?: boolean; scan?: boolean; shadow?: boolean; parent?: THREE.Object3D } = {},
  ) => {
    track(geo);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = opts.shadow !== false;
    m.receiveShadow = true;
    (opts.parent ?? root).add(m);
    if (opts.paint) paintMeshes.push(m);
    if (opts.paint || opts.foam) foamMeshes.push(m);
    if (opts.scan !== false) scanMeshes.push(m);
    return m;
  };

  // ── body shell ──
  add(loftBody(), paint, { paint: true }).name = 'Body';

  // ── cockpit: floor, seats, dash, steering wheel ──
  const floorY = deck(0) - tub(0) + 0.02;
  const seat = (z: number, w: number) => {
    const base = add(roundedSlab(w, 0.5, 0.16, 0.12), vinyl, { scan: false });
    base.position.set(0, floorY + 0.12, z);
    const back = add(roundedSlab(w, 0.14, 0.42, 0.06), vinyl, { scan: false });
    back.position.set(0, floorY + 0.36, z - 0.28);
    back.rotation.x = -0.16;
    // pleats
    for (let i = -2; i <= 2; i++) {
      const p = add(new THREE.BoxGeometry(0.01, 0.3, 0.02), pleat, { scan: false, shadow: false });
      p.position.set(i * (w / 6), floorY + 0.38, z - 0.2);
      p.rotation.x = -0.16;
    }
  };
  seat(0.28, 1.34);
  seat(-0.86, 1.28);
  const dash = add(roundedSlab(1.5, 0.22, 0.14, 0.08), paint, { scan: false });
  dash.position.set(0, deck(0.8) - 0.04, 0.84);
  const wheelRing = add(new THREE.TorusGeometry(0.17, 0.016, 10, 40), chrome, { scan: false });
  wheelRing.position.set(0.38, deck(0.7) + 0.02, 0.66);
  wheelRing.rotation.x = -0.9;
  const column = add(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), chrome, { scan: false });
  column.position.set(0.38, deck(0.7) - 0.08, 0.74);
  column.rotation.x = 0.7;

  // ── twin bubble canopies with chrome rims, split by a chrome spine ──
  CANOPIES.forEach((c, i) => {
    const g = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    g.scale(c.rx, c.ry, c.rz);
    const dome = add(g, acrylic, { foam: true, shadow: false });
    dome.name = 'Glass';
    dome.position.set(0, deck(c.z) - 0.01, c.z);
    dome.renderOrder = 5;
    const rimGeo = new THREE.TorusGeometry(1, 0.018, 8, 64).rotateX(Math.PI / 2);
    rimGeo.scale(c.rx, 1, c.rz);
    const rim = add(rimGeo, chrome, { scan: false });
    rim.position.set(0, deck(c.z) + 0.005, c.z);
    if (i === 0) {
      // windshield wiper-style chrome spine along the front canopy (as on the reference car)
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI;
        pts.push(new THREE.Vector3(0.12, deck(c.z) + Math.sin(a) * c.ry * 1.01, c.z + Math.cos(a) * c.rz * 1.01));
      }
      add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.012, 6, false), chrome, { scan: false });
    }
  });

  // ── chrome side spears, fin caps ──
  for (const sx of [-1, 1]) {
    const spear: THREE.Vector3[] = [];
    for (let z = -2.55; z <= 2.3; z += 0.1) spear.push(new THREE.Vector3(sx * (halfWidth(z) + 0.005), 0.66 - (z > 1.6 ? (z - 1.6) * 0.06 : 0), z));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spear), 80, 0.014, 6, false), chrome, { scan: false });
    const finCap: THREE.Vector3[] = [];
    for (let z = -2.82; z <= -0.9; z += 0.08) {
      const h = Math.max(0, (-0.9 - z) / 1.92);
      finCap.push(new THREE.Vector3(sx * (halfWidth(z) - 0.02), deck(z) + 0.24 * Math.pow(h, 1.25) + 0.005, z));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(finCap), 40, 0.012, 6, false), chrome, { scan: false });

    // quad headlamps in chrome pods
    for (const [x, z] of [
      [0.52, 2.72],
      [0.74, 2.64],
    ]) {
      const pod = add(new THREE.CylinderGeometry(0.1, 0.11, 0.14, 24).rotateX(Math.PI / 2), chrome, { scan: false });
      pod.position.set(sx * x, 0.55, z);
      const out = Math.abs(sx * x - MARKS.lampOut.x) < 0.01;
      const lens = add(new THREE.CircleGeometry(0.085, 24), out ? deadLamp : headMat, { scan: false, shadow: false });
      lens.position.set(sx * x, 0.55, z + 0.071);
      const ring = add(new THREE.TorusGeometry(0.09, 0.012, 8, 24), chrome, { scan: false });
      ring.position.set(sx * x, 0.55, z + 0.072);
    }
    // door handle
    const handle = add(new THREE.BoxGeometry(0.03, 0.025, 0.18), chrome, { scan: false });
    handle.position.set(sx * 1.01, 0.74, 0.55);
  }

  // ── grille between the headlamps ──
  const grille = add(roundedSlab(0.66, 0.2, 0.05, 0.05), trim);
  grille.rotation.x = Math.PI / 2;
  grille.position.set(0, 0.52, 2.74);
  for (let i = 0; i < 5; i++) {
    const bar = add(new THREE.BoxGeometry(0.62, 0.012, 0.02), chrome, { scan: false });
    bar.position.set(0, 0.44 + i * 0.04, 2.78);
  }
  for (let i = -6; i <= 6; i++) {
    const v = add(new THREE.BoxGeometry(0.008, 0.18, 0.018), chrome, { scan: false, shadow: false });
    v.position.set(i * 0.05, 0.52, 2.78);
  }

  // ── wraparound bumpers ──
  const bumper = (z: number, dir: 1 | -1, y: number) => {
    const pts = [
      new THREE.Vector3(-0.98, y, z - dir * 0.45),
      new THREE.Vector3(-0.9, y, z - dir * 0.06),
      new THREE.Vector3(0, y, z + dir * 0.06),
      new THREE.Vector3(0.9, y, z - dir * 0.06),
      new THREE.Vector3(0.98, y, z - dir * 0.45),
    ];
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.055, 12, false), chrome, { scan: false });
  };
  bumper(2.8, 1, 0.38);
  bumper(-2.82, -1, 0.4);
  const ornament = add(new THREE.ConeGeometry(0.03, 0.28, 10).rotateX(Math.PI / 2), chrome, { scan: false });
  ornament.position.set(0, deck(2.3) + 0.05, 2.3);

  // ── rear: rocket tail-lights, centre lamp, plate ──
  for (let i = 0; i < 12; i++) {
    const x = -0.82 + (i / 11) * 1.64;
    if (Math.abs(x) < 0.12) continue;
    const r = add(new THREE.ConeGeometry(0.035, 0.2, 14).rotateX(-Math.PI / 2), rocketMat, { scan: false });
    r.position.set(x, 0.56 + (i % 2) * 0.05, -2.9);
    const base = add(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12).rotateX(Math.PI / 2), chrome, { scan: false });
    base.position.set(x, 0.56 + (i % 2) * 0.05, -2.8);
  }
  const lamp = add(new THREE.SphereGeometry(0.09, 20, 14), chrome, { scan: false });
  lamp.position.set(0, 0.6, -2.82);
  const plate = add(new THREE.BoxGeometry(0.3, 0.15, 0.01), plateMat, { scan: false });
  plate.position.set(0, 0.47, -2.83);

  // ── whitewall wheels with chrome spinner caps ──
  const wheels: WheelRig[] = [];
  const tires = tireGeometries();
  track(tires.black);
  track(tires.white);
  const capGeo = track(new THREE.CylinderGeometry(0.19, 0.2, 0.03, 40).rotateZ(Math.PI / 2));
  const domeGeo = track(new THREE.SphereGeometry(0.09, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2).rotateZ(-Math.PI / 2));
  const ringGeo = track(new THREE.TorusGeometry(1, 0.008, 6, 40).rotateY(Math.PI / 2));
  const bladeGeo = track(new THREE.BoxGeometry(0.02, 0.2, 0.025));
  for (const [x, z, front] of [
    [VEHICLE.trackHalf, VEHICLE.frontAxleZ, true],
    [-VEHICLE.trackHalf, VEHICLE.frontAxleZ, true],
    [VEHICLE.trackHalf, VEHICLE.rearAxleZ, false],
    [-VEHICLE.trackHalf, VEHICLE.rearAxleZ, false],
  ] as [number, number, boolean][]) {
    const steer = new THREE.Group();
    steer.position.set(x, VEHICLE.wheelRadius, z);
    const spin = new THREE.Group();
    // mirror left wheels so the whitewall and cap face outward
    if (x < 0) spin.scale.x = -1;
    steer.add(spin);
    root.add(steer);
    const tb = new THREE.Mesh(tires.black, tireBlack);
    tb.castShadow = true;
    spin.add(tb);
    scanMeshes.push(tb);
    spin.add(new THREE.Mesh(tires.white, tireWhite));
    const cap = new THREE.Mesh(capGeo, chrome);
    cap.position.x = 0.1;
    spin.add(cap);
    for (const r of [0.16, 0.12]) {
      const ring = new THREE.Mesh(ringGeo, chrome);
      ring.scale.setScalar(r);
      ring.position.x = 0.118;
      spin.add(ring);
    }
    const dome = new THREE.Mesh(domeGeo, chrome);
    dome.position.x = 0.115;
    spin.add(dome);
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(bladeGeo, chrome);
      b.position.x = 0.125;
      b.rotation.x = (i / 3) * Math.PI;
      spin.add(b);
    }
    wheels.push({ steer, spin, front });
  }

  return {
    root,
    paintMeshes,
    foamMeshes,
    scanMeshes,
    wheels,
    setSurface(grime, dirt, gloss) {
      paintUniforms.uGrime.value = grime;
      paintUniforms.uDirt.value = dirt;
      // debris rinses off with the rest of the road film
      paintUniforms.uDebrisAmt.value = Math.min(1, grime * 1.6);
      paint.clearcoat = 0.35 + 0.65 * gloss * (1 - grime * 0.6);
      paint.roughness = 0.36 - 0.14 * gloss;
      paint.envMapIntensity = 0.8 + 0.6 * gloss;
    },
    setHeadlights(v) {
      headMat.emissiveIntensity = 0.3 + 2.2 * v;
      rocketMat.emissiveIntensity = 0.4 + 0.8 * v;
    },
    dispose() {
      disposables.forEach((d) => d.dispose());
    },
  };
}
