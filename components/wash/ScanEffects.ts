/**
 * 3D side of the computer-vision story: point cloud, sweep plane, wireframe
 * mesh, dimension lines, wheel rings, the FLAG 01 marker, the post-wash
 * inspection slice and the planned robot paths. All vehicle-space pieces are
 * parented to the vehicle so they rotate with it on the turntable.
 */

import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { SCENE_COLORS, VEHICLE } from '@/lib/animationConfig';

const CYAN = new THREE.Color(SCENE_COLORS.cyan);
const ORANGE = new THREE.Color(SCENE_COLORS.paint);

function lineMat(color: THREE.Color, opacity = 1) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
}

function meshArea(geo: THREE.BufferGeometry): number {
  const pos = geo.getAttribute('position');
  const idx = geo.getIndex();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let area = 0;
  const count = idx ? idx.count : pos.count;
  for (let i = 0; i < count; i += 3) {
    const i0 = idx ? idx.getX(i) : i;
    const i1 = idx ? idx.getX(i + 1) : i + 1;
    const i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    area += b.sub(a).cross(c.sub(a)).length() / 2;
  }
  return area;
}

export class ScanEffects {
  readonly vehicleSpace = new THREE.Group();
  readonly world = new THREE.Group();
  private cloudMat: THREE.ShaderMaterial;
  private wire: THREE.LineSegments[] = [];
  private wireMat = lineMat(CYAN, 0);
  private sweep: THREE.Mesh;
  private sweepMat: THREE.ShaderMaterial;
  private sweepEdgeMat = lineMat(CYAN, 0);
  private dims: THREE.LineSegments;
  private dimsMat = lineMat(CYAN, 0);
  private wheelRings: THREE.Mesh;
  private ringMat = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  private marker = new THREE.Group();
  private markerMat = new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, depthTest: false });
  private slice: THREE.Group;
  private sliceMat = lineMat(CYAN, 0);
  private sliceFill = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
  private envelopeMat = lineMat(ORANGE, 0);
  private pathMats: THREE.LineBasicMaterial[] = [];

  constructor(scanMeshes: THREE.Mesh[], paintMeshes: THREE.Mesh[], vehicleRoot: THREE.Object3D, cloudCount: number) {
    vehicleRoot.updateMatrixWorld(true);
    const rootInv = vehicleRoot.matrixWorld.clone().invert();

    // ── point cloud ──
    const areas = scanMeshes.map((m) => meshArea(m.geometry));
    const total = areas.reduce((s, a) => s + a, 0);
    const positions = new Float32Array(cloudCount * 3);
    const tmp = new THREE.Vector3();
    let k = 0;
    scanMeshes.forEach((mesh, i) => {
      const n = i === scanMeshes.length - 1 ? cloudCount - k : Math.round((areas[i] / total) * cloudCount);
      if (n <= 0) return;
      const sampler = new MeshSurfaceSampler(mesh).build();
      const toVehicle = rootInv.clone().multiply(mesh.matrixWorld);
      for (let j = 0; j < n && k < cloudCount; j++, k++) {
        sampler.sample(tmp);
        tmp.applyMatrix4(toVehicle);
        positions.set([tmp.x, tmp.y, tmp.z], k * 3);
      }
    });
    const cloudGeo = new THREE.BufferGeometry();
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions.slice(0, k * 3), 3));
    this.cloudMat = new THREE.ShaderMaterial({
      uniforms: { uSweep: { value: 3 }, uOpacity: { value: 0 }, uColor: { value: CYAN.clone() }, uPx: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uSweep;
        uniform float uPx;
        varying float vA;
        void main() {
          float d = position.z - uSweep;
          vA = step(0.0, d) * (0.45 + 0.55 * exp(-d * 5.0));
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uPx * (1.6 + 2.4 * exp(-max(d, 0.0) * 8.0));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vA;
        void main() {
          if (vA <= 0.0) discard;
          gl_FragColor = vec4(uColor, vA * uOpacity);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const cloud = new THREE.Points(cloudGeo, this.cloudMat);
    cloud.frustumCulled = false;
    this.vehicleSpace.add(cloud);

    // ── wireframe mesh (forms after the sweep) ──
    for (const m of paintMeshes.concat(scanMeshes.filter((s) => s.name === 'Glass'))) {
      const edges = new THREE.EdgesGeometry(m.geometry, 28);
      const seg = new THREE.LineSegments(edges, this.wireMat);
      seg.matrixAutoUpdate = false;
      seg.matrix.copy(rootInv.clone().multiply(m.matrixWorld));
      this.vehicleSpace.add(seg);
      this.wire.push(seg);
    }

    // ── sweep plane ──
    this.sweepMat = new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0 }, uColor: { value: CYAN.clone() } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: /* glsl */ `
        uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv;
        void main(){
          float edge = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
          float lines = 0.55 + 0.45 * step(0.5, fract(vUv.y * 24.0));
          gl_FragColor = vec4(uColor, uOpacity * 0.32 * edge * lines);
        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    this.sweep = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.9), this.sweepMat);
    this.sweep.position.y = 0.95;
    const sweepEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(3.0, 1.9)), this.sweepEdgeMat);
    this.sweep.add(sweepEdge);
    this.vehicleSpace.add(this.sweep);

    // ── dimension lines on the floor ──
    const L = VEHICLE.length / 2;
    const Wd = VEHICLE.width / 2;
    const y = 0.02;
    const dx = -Wd - 0.5;
    const dz = L + 0.45;
    const pts = [
      // length
      dx, y, -L, dx, y, L,
      dx - 0.12, y, -L, dx + 0.12, y, -L,
      dx - 0.12, y, L, dx + 0.12, y, L,
      -Wd - 0.05, y, -L, dx - 0.05, y, -L,
      -Wd - 0.05, y, L, dx - 0.05, y, L,
      // width
      -Wd, y, dz, Wd, y, dz,
      -Wd, y, dz - 0.12, -Wd, y, dz + 0.12,
      Wd, y, dz - 0.12, Wd, y, dz + 0.12,
    ];
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.dims = new THREE.LineSegments(dg, this.dimsMat);
    this.vehicleSpace.add(this.dims);

    const ringGeo = new THREE.RingGeometry(0.44, 0.47, 48).rotateX(-Math.PI / 2);
    const rings = new THREE.Group();
    for (const [x, z] of [
      [VEHICLE.trackHalf, VEHICLE.frontAxleZ],
      [-VEHICLE.trackHalf, VEHICLE.frontAxleZ],
      [VEHICLE.trackHalf, VEHICLE.rearAxleZ],
      [-VEHICLE.trackHalf, VEHICLE.rearAxleZ],
    ]) {
      const r = new THREE.Mesh(ringGeo, this.ringMat);
      r.position.set(x, 0.02, z);
      rings.add(r);
    }
    this.wheelRings = rings as unknown as THREE.Mesh;
    this.vehicleSpace.add(rings);

    // ── FLAG 01 marker on the driver-side rear door ──
    const S = VEHICLE.smudge;
    const ring1 = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.325, 48), this.markerMat);
    const ring2 = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.41, 48, 1, 0, Math.PI * 1.5), this.markerMat);
    const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.008), this.markerMat);
    const cross2 = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.9), this.markerMat);
    this.marker.add(ring1, ring2, cross, cross2);
    this.marker.position.set(S.x + 0.06, S.y, S.z);
    this.marker.rotation.y = Math.PI / 2;
    this.marker.renderOrder = 10;
    this.vehicleSpace.add(this.marker);

    // ── post-wash inspection slice ──
    this.slice = new THREE.Group();
    const rect = new THREE.Shape();
    const rw = Wd + 0.25;
    const rl = L + 0.25;
    const rr = 0.35;
    rect.moveTo(-rw + rr, -rl);
    rect.lineTo(rw - rr, -rl);
    rect.quadraticCurveTo(rw, -rl, rw, -rl + rr);
    rect.lineTo(rw, rl - rr);
    rect.quadraticCurveTo(rw, rl, rw - rr, rl);
    rect.lineTo(-rw + rr, rl);
    rect.quadraticCurveTo(-rw, rl, -rw, rl - rr);
    rect.lineTo(-rw, -rl + rr);
    rect.quadraticCurveTo(-rw, -rl, -rw + rr, -rl);
    const outline = new THREE.BufferGeometry().setFromPoints(rect.getPoints(12).map((p) => new THREE.Vector3(p.x, 0, p.y)));
    this.slice.add(new THREE.LineLoop(outline, this.sliceMat));
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(rect, 12).rotateX(Math.PI / 2), this.sliceFill);
    this.slice.add(fill);
    this.vehicleSpace.add(this.slice);

    // ── safety envelope on the bay floor (world space) ──
    const env = new THREE.Shape();
    const ew = 1.75;
    const el = 3.4;
    const er = 0.6;
    env.moveTo(-ew + er, -el);
    env.lineTo(ew - er, -el);
    env.quadraticCurveTo(ew, -el, ew, -el + er);
    env.lineTo(ew, el - er);
    env.quadraticCurveTo(ew, el, ew - er, el);
    env.lineTo(-ew + er, el);
    env.quadraticCurveTo(-ew, el, -ew, el - er);
    env.lineTo(-ew, -el + er);
    env.quadraticCurveTo(-ew, -el, -ew + er, -el);
    const envPts = env.getPoints(16).map((p) => new THREE.Vector3(p.x, 0.025, p.y));
    const envGeo = new THREE.BufferGeometry().setFromPoints(envPts);
    const envLine = new THREE.LineLoop(envGeo, this.envelopeMat);
    envLine.computeLineDistances();
    this.world.add(envLine);
  }

  /** Planned nozzle paths (sampled from the choreography) drawn as polylines. */
  addPlannedPath(points: THREE.Vector3[], color: string) {
    const mat = lineMat(new THREE.Color(color), 0);
    const g = new THREE.BufferGeometry().setFromPoints(points);
    this.world.add(new THREE.Line(g, mat));
    // drop lines from path to floor every few points, like a CAM preview
    const drops: THREE.Vector3[] = [];
    points.forEach((p, i) => {
      if (i % 6 === 0) drops.push(p.clone(), new THREE.Vector3(p.x, 0.02, p.z));
    });
    const dg = new THREE.BufferGeometry().setFromPoints(drops);
    const dm = lineMat(new THREE.Color(color), 0);
    this.world.add(new THREE.LineSegments(dg, dm));
    this.pathMats.push(mat, dm);
  }

  setPixelRatio(px: number) {
    this.cloudMat.uniforms.uPx.value = px;
  }

  update(s: {
    cloud: number;
    sweepOn: number;
    sweepZ: number;
    wire: number;
    dims: number;
    marker: number;
    qcScan: number;
    envelope: number;
    paths: number;
    time: number;
  }) {
    this.cloudMat.uniforms.uSweep.value = s.sweepZ;
    // visible from the moment the sweep starts until the cloud fades out
    this.cloudMat.uniforms.uOpacity.value = s.sweepOn > 0.01 || s.cloud > 0.01 ? Math.max(s.sweepOn, s.cloud) : 0;

    this.sweep.visible = s.sweepOn > 0.01;
    this.sweep.position.z = s.sweepZ;
    this.sweepMat.uniforms.uOpacity.value = s.sweepOn;
    this.sweepEdgeMat.opacity = s.sweepOn * 0.9;

    this.wireMat.opacity = s.wire * 0.5;
    this.wire.forEach((w) => (w.visible = s.wire > 0.01));
    this.dimsMat.opacity = s.dims * 0.9;
    this.dims.visible = s.dims > 0.01;
    this.ringMat.opacity = s.dims * 0.8;
    this.wheelRings.visible = s.dims > 0.01;

    // marker: 0 hidden, 1 flagged (orange, pulsing), 2 cleared (cyan)
    const mOn = Math.min(1, s.marker);
    const cleared = Math.max(0, s.marker - 1);
    this.marker.visible = mOn > 0.01;
    this.markerMat.opacity = mOn * (0.7 + 0.3 * Math.sin(s.time * 6));
    this.markerMat.color.copy(ORANGE).lerp(CYAN, cleared);
    this.marker.rotation.x = s.time * 0.6;
    this.marker.scale.setScalar(0.8 + 0.2 * mOn);

    const qcOn = s.qcScan > 0.001 && s.qcScan < 0.999;
    this.slice.visible = qcOn;
    this.slice.position.y = 1.62 - s.qcScan * 1.55;
    this.sliceMat.opacity = 0.9;
    this.sliceFill.opacity = 0.08;

    this.envelopeMat.opacity = s.envelope * 0.75;
    this.pathMats.forEach((m) => (m.opacity = s.paths * 0.85));
  }
}
