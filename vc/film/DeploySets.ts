/**
 * Sets 1 and 2 of the VC film: the same Carwash-O-Matic installed in two
 * environments. The machine itself (arms, pylons, sprays) belongs to the
 * FilmScene and is re-posed for each set; these classes hold the environment,
 * the vehicle that uses the lane, and (set 2) the container that unfolds.
 *
 * Both lanes are centred on the world origin with traffic along +Z, so the
 * pylons (which aim at the origin) work unchanged.
 */

import * as THREE from 'three';
import { CONTAINER, SCENE_COLORS } from '@/lib/animationConfig';
import { BODY, drawLivery, ribs } from '@/lib/livery';
import { ProcCar, type CarKind } from './ProcCar';

type Track = <T extends { dispose(): void }>(x: T) => T;

function tex(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

/** Ground with painted parking stalls (size metres square). */
function stallGround(size: number, base: string, line: string, opts: { laneHalf: number; label?: string; label2?: string }): HTMLCanvasElement {
  const PX = 2048;
  const c = document.createElement('canvas');
  c.width = c.height = PX;
  const g = c.getContext('2d')!;
  const s = PX / size;
  const X = (v: number) => (v + size / 2) * s;
  g.fillStyle = base;
  g.fillRect(0, 0, PX, PX);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${Math.random() * 0.045})`;
    g.fillRect(Math.random() * PX, Math.random() * PX, 3, 3);
  }
  g.strokeStyle = line;
  g.lineWidth = 0.12 * s;
  // stall rows either side of the lane
  for (const side of [-1, 1]) {
    for (let z = -size / 2 + 3; z < size / 2 - 3; z += 2.7) {
      const x0 = side * (opts.laneHalf + 3.6);
      const x1 = side * (opts.laneHalf + 3.6 + 5.4);
      g.beginPath();
      g.moveTo(X(x0), X(z));
      g.lineTo(X(x1), X(z));
      g.stroke();
    }
  }
  // lane edges
  g.setLineDash([1.6 * s, 1.1 * s]);
  g.strokeStyle = 'rgba(240,138,75,0.7)';
  for (const x of [-opts.laneHalf, opts.laneHalf]) {
    g.beginPath();
    g.moveTo(X(x), 0);
    g.lineTo(X(x), PX);
    g.stroke();
  }
  g.setLineDash([]);
  g.fillStyle = 'rgba(236,229,216,0.55)';
  g.font = `700 ${0.55 * s}px "Unbounded", "Arial Black", sans-serif`;
  g.textAlign = 'center';
  if (opts.label) {
    g.save();
    g.translate(X(0), X(-11));
    g.fillText(opts.label, 0, 0);
    g.restore();
  }
  if (opts.label2) {
    g.save();
    g.translate(X(0), X(11.5));
    g.fillText(opts.label2, 0, 0);
    g.restore();
  }
  return c;
}

function signCanvas(text: string, sub: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#1b1d20';
  g.fillRect(0, 0, 1024, 256);
  g.fillStyle = '#f2b14a';
  g.fillRect(0, 0, 18, 256);
  g.fillStyle = '#f3ebdd';
  g.font = '700 84px "Unbounded", "Arial Black", sans-serif';
  g.textBaseline = 'middle';
  g.fillText(text, 60, 104);
  g.fillStyle = '#9a9ea4';
  g.font = '500 40px "IBM Plex Mono", monospace';
  g.fillText(sub, 62, 190);
  return c;
}

/** A thin cyan scan plane that sweeps along a vehicle (vehicle-agnostic stand-in for the full scan). */
class LaneScan {
  readonly group = new THREE.Group();
  private fill: THREE.MeshBasicMaterial;
  private edge: THREE.LineBasicMaterial;
  constructor(track: Track) {
    this.fill = track(new THREE.MeshBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    this.edge = track(new THREE.LineBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true, opacity: 0 }));
    const geo = track(new THREE.PlaneGeometry(3, 2.4));
    const m = new THREE.Mesh(geo, this.fill);
    m.position.y = 1.2;
    const e = new THREE.LineSegments(track(new THREE.EdgesGeometry(geo)), this.edge);
    e.position.y = 1.2;
    this.group.add(m, e);
  }
  /** u 0→1 sweeps from +z to −z of a car of half length hl centred at z0. */
  update(u: number, z0: number, hl: number) {
    const on = u > 0.001 && u < 0.999;
    this.group.visible = on;
    if (!on) return;
    this.group.position.z = z0 + hl - u * hl * 2;
    this.fill.opacity = 0.16;
    this.edge.opacity = 0.9;
  }
}

function parkedRow(group: THREE.Group, cars: ProcCar[], spots: [number, number, number][]) {
  const kinds: CarKind[] = ['sedan', 'suv', 'compact', 'sedan', 'van', 'suv', 'compact', 'pickup'];
  const colors = ['#e9e6df', '#b8bdc3', '#2e4057', '#1b1d20', '#e9e6df', '#8c2f23', '#b8bdc3', '#546b52'];
  spots.forEach(([x, z, yaw], i) => {
    const c = new ProcCar(kinds[i % kinds.length], colors[(i * 3) % colors.length]);
    c.place(x, z, yaw);
    group.add(c.root);
    cars.push(c);
  });
}

/* ═══════════ SET 1 · AIRPORT PARKING GARAGE ═══════════ */

export class AirportSet {
  readonly group = new THREE.Group();
  readonly car: ProcCar;
  readonly laneHalf = 2.2;
  /** Pylon floor positions around the lane. */
  readonly pylons: [number, number][] = [
    [-3.7, -4.6], [-3.9, -1.55], [-3.9, 1.55], [-3.7, 4.6],
    [3.7, -4.6], [3.9, -1.55], [3.9, 1.55], [3.7, 4.6],
  ];
  private scan: LaneScan;
  private parked: ProcCar[] = [];
  private disposables: { dispose(): void }[] = [];

  constructor() {
    const track: Track = (x) => (this.disposables.push(x), x);
    const floor = new THREE.Mesh(
      track(new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2)),
      track(new THREE.MeshStandardMaterial({ map: track(tex(stallGround(40, '#55595e', 'rgba(243,235,221,0.7)', { laneHalf: this.laneHalf, label: 'RENTAL RETURN', label2: 'READY LINE' }))), roughness: 0.85 })),
    );
    floor.receiveShadow = true;
    this.group.add(floor);

    // structure: columns, and a ceiling slab cut away over the lane so the view reads as an architectural section
    const concrete = track(new THREE.MeshStandardMaterial({ color: '#8d9095', roughness: 0.9 }));
    const slabMat = track(new THREE.MeshStandardMaterial({ color: '#6f7277', roughness: 0.9 }));
    const H = 3.1;
    const colGeo = track(new THREE.BoxGeometry(0.6, H, 0.6));
    for (const x of [-15, -7.5, 7.5, 15]) {
      for (const z of [-15, -7.5, 0, 7.5, 15]) {
        const c = new THREE.Mesh(colGeo, concrete);
        c.position.set(x, H / 2, z);
        c.castShadow = true;
        c.receiveShadow = true;
        this.group.add(c);
      }
    }
    const slab = (w: number, d: number, x: number, z: number) => {
      const m = new THREE.Mesh(track(new THREE.BoxGeometry(w, 0.3, d)), slabMat);
      m.position.set(x, H + 0.15, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    };
    // back band and side bands only
    slab(40, 11, 0, -14.5);
    slab(11, 29, -14.5, 5.5);
    slab(11, 29, 14.5, 5.5);
    // exposed beam edges at the cut
    const beam = track(new THREE.BoxGeometry(18, 0.55, 0.4));
    for (const z of [-9]) {
      const b = new THREE.Mesh(beam, concrete);
      b.position.set(0, H - 0.1, z);
      b.castShadow = true;
      this.group.add(b);
    }
    // hanging sign over the entry
    const signTex = track(tex(signCanvas('RENTAL RETURN', 'CLEAN · INSPECT · READY')));
    const sign = new THREE.Mesh(
      track(new THREE.PlaneGeometry(3.2, 0.8)),
      track(new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: '#ffffff', emissiveIntensity: 0.45, side: THREE.DoubleSide })),
    );
    sign.position.set(0, H - 0.75, -8.6);
    this.group.add(sign);
    // strip lights under the slab
    const lamp = track(new THREE.MeshStandardMaterial({ color: '#f5fbff', emissive: '#e8f4ff', emissiveIntensity: 1.4 }));
    for (const x of [-12, 12]) {
      for (const z of [-6, 2, 10]) {
        const l = new THREE.Mesh(track(new THREE.BoxGeometry(2.4, 0.06, 0.18)), lamp);
        l.position.set(x, H - 0.04, z);
        this.group.add(l);
      }
    }
    // the lane's rails (short stages along the lane)
    const railMat = track(new THREE.MeshStandardMaterial({ color: '#5d636a', metalness: 0.8, roughness: 0.4 }));
    for (const x of [-2.75, 2.75]) {
      const r = new THREE.Mesh(track(new THREE.BoxGeometry(0.12, 0.05, 9.6)), railMat);
      r.position.set(x, 0.025, 0);
      this.group.add(r);
    }

    // parked rental fleet
    const spots: [number, number, number][] = [];
    for (const side of [-1, 1]) for (let z = -8.8; z <= 9; z += 2.7) spots.push([side * (this.laneHalf + 6.3), z + 1.35, side * Math.PI / 2]);
    parkedRow(this.group, this.parked, spots.filter((_, i) => i % 3 !== 1));

    this.car = new ProcCar('suv', '#e9e6df');
    this.group.add(this.car.root);
    this.scan = new LaneScan(track);
    this.group.add(this.scan.group);
    this.group.visible = false;
  }

  update(visible: boolean, carZ: number, scan: number) {
    this.group.visible = visible;
    if (!visible) return;
    this.car.place(0, carZ, 0);
    this.car.root.visible = Math.abs(carZ) < 17.5;
    this.scan.update(scan, carZ, this.car.halfLength);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.parked.forEach((c) => c.dispose());
    this.car.dispose();
  }
}

/* ═══════════ SET 2 · OPEN PARKING LOT (the container unfolds) ═══════════ */

const L = CONTAINER.length;
const W = CONTAINER.width;
const H = CONTAINER.height;
const T = 0.06;
const FLOOR = 0.16;
/** Wings open to slightly past horizontal (gull-wing). */
const WING_OPEN = 1.86;
/** End doors fold down until they rest on the ground as ramps. */
const RAMP_LEN = H - 0.22;
const RAMP_OPEN = Math.acos(-FLOOR / RAMP_LEN);

export class LotSet {
  readonly group = new THREE.Group();
  readonly car: ProcCar;
  /** Pylon floor positions along the wing edges. */
  readonly pylons: [number, number][] = [
    [-4.25, -4.8], [-4.35, -1.6], [-4.35, 1.6], [-4.25, 4.8],
    [4.25, -4.8], [4.35, -1.6], [4.35, 1.6], [4.25, 4.8],
  ];
  /** Arm rail x (under the wings). */
  readonly armX = 2.75;
  private box = new THREE.Group();
  private wings: THREE.Group[] = [];
  private ramps: THREE.Group[] = [];
  private zoneMat: THREE.LineDashedMaterial;
  private zoneFill: THREE.MeshBasicMaterial;
  private rails: THREE.Mesh[] = [];
  private parked: ProcCar[] = [];
  private livery: THREE.CanvasTexture;
  private liveryTurned!: THREE.CanvasTexture;
  private liveryCanvas: HTMLCanvasElement;
  private disposables: { dispose(): void }[] = [];

  constructor(private onRepaint: () => void) {
    const track: Track = (x) => (this.disposables.push(x), x);
    const ground = new THREE.Mesh(
      track(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2)),
      track(new THREE.MeshStandardMaterial({ map: track(tex(stallGround(60, '#2b2f34', 'rgba(243,235,221,0.6)', { laneHalf: 5.2 }))), roughness: 0.95 })),
    );
    ground.receiveShadow = true;
    this.group.add(ground);

    // light poles and planters
    const pole = track(new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: 0.6, metalness: 0.4 }));
    const glow = track(new THREE.MeshStandardMaterial({ color: '#fff2da', emissive: '#ffd9a0', emissiveIntensity: 1.5 }));
    const green = track(new THREE.MeshStandardMaterial({ color: '#3f5a45', roughness: 0.9 }));
    for (const [x, z] of [[-9, -12], [9, -12], [-9, 12], [9, 12]]) {
      const p = new THREE.Mesh(track(new THREE.CylinderGeometry(0.07, 0.09, 6, 8)), pole);
      p.position.set(x, 3, z);
      p.castShadow = true;
      const h = new THREE.Mesh(track(new THREE.BoxGeometry(1.1, 0.14, 0.4)), glow);
      h.position.set(x - Math.sign(x) * 0.4, 6, z);
      const tree = new THREE.Mesh(track(new THREE.IcosahedronGeometry(1.1, 0)), green);
      tree.position.set(x + Math.sign(x) * 1.6, 1.3, z);
      tree.castShadow = true;
      this.group.add(p, h, tree);
    }
    const spots: [number, number, number][] = [];
    for (const side of [-1, 1]) for (let z = -13; z <= 13; z += 2.7) spots.push([side * 11.5, z + 1.35, side * Math.PI / 2]);
    parkedRow(this.group, this.parked, spots.filter((_, i) => i % 2 === 0));

    // robotic motion zones (appear once the wings are up)
    this.zoneMat = track(new THREE.LineDashedMaterial({ color: SCENE_COLORS.paint, dashSize: 0.4, gapSize: 0.25, transparent: true, opacity: 0 }));
    this.zoneFill = track(new THREE.MeshBasicMaterial({ color: SCENE_COLORS.paint, transparent: true, opacity: 0, depthWrite: false }));
    for (const sx of [-1, 1]) {
      const x0 = sx * (W / 2 + 0.2);
      const x1 = sx * (W / 2 + 2.9);
      const pts = [new THREE.Vector3(x0, 0.02, -5.6), new THREE.Vector3(x1, 0.02, -5.6), new THREE.Vector3(x1, 0.02, 5.6), new THREE.Vector3(x0, 0.02, 5.6), new THREE.Vector3(x0, 0.02, -5.6)];
      const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), this.zoneMat);
      line.computeLineDistances();
      const fill = new THREE.Mesh(track(new THREE.PlaneGeometry(2.7, 11.2).rotateX(-Math.PI / 2)), this.zoneFill);
      fill.position.set((x0 + x1) / 2, 0.015, 0);
      this.group.add(line, fill);
    }
    // arm rails that slide out from the core
    const railMat = track(new THREE.MeshStandardMaterial({ color: '#5d636a', metalness: 0.8, roughness: 0.4 }));
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(track(new THREE.BoxGeometry(0.14, 0.06, 10.4)), railMat);
      r.position.set(sx * this.armX, 0.03, 0);
      r.castShadow = true;
      this.rails.push(r);
      this.group.add(r);
    }

    // ── the container: core (floor, roof, posts), two wings, two end ramps ──
    const plain = document.createElement('canvas');
    plain.width = 1024;
    plain.height = 256;
    const pg = plain.getContext('2d')!;
    pg.fillStyle = BODY;
    pg.fillRect(0, 0, 1024, 256);
    ribs(pg, 1024, 256, 18);
    const body = track(new THREE.MeshStandardMaterial({ map: track(tex(plain)), metalness: 0.35, roughness: 0.55 }));
    const frame = track(new THREE.MeshStandardMaterial({ color: '#9f4320', metalness: 0.45, roughness: 0.5 }));
    const inner = track(new THREE.MeshStandardMaterial({ color: '#d9d4c8', metalness: 0.2, roughness: 0.6 }));
    const deck = track(new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.8, metalness: 0.3 }));
    this.liveryCanvas = document.createElement('canvas');
    this.liveryCanvas.width = 2048;
    this.liveryCanvas.height = 488;
    drawLivery(this.liveryCanvas);
    this.livery = track(tex(this.liveryCanvas));
    const livery = track(new THREE.MeshStandardMaterial({ map: this.livery, metalness: 0.3, roughness: 0.5 }));
    // the −X wing is mostly seen raised (face up, from the +X side): turn its livery so it reads upright there
    const turned = track(this.livery.clone());
    turned.center.set(0.5, 0.5);
    turned.rotation = Math.PI;
    this.liveryTurned = turned;
    const liveryB = track(new THREE.MeshStandardMaterial({ map: turned, metalness: 0.3, roughness: 0.5 }));

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = this.box) => {
      const m = new THREE.Mesh(track(geo), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };
    add(new THREE.BoxGeometry(W, FLOOR, L), deck, 0, FLOOR / 2, 0);
    add(new THREE.BoxGeometry(W, 0.08, L), [body, body, body, inner, body, body], 0, H - 0.04, 0);
    for (const x of [-W / 2 + 0.08, W / 2 - 0.08]) {
      for (const z of [-L / 2 + 0.08, L / 2 - 0.08]) add(new THREE.BoxGeometry(0.16, H, 0.16), frame, x, H / 2, z);
      add(new THREE.BoxGeometry(0.14, 0.16, L), frame, x, H - 0.08, 0);
      add(new THREE.BoxGeometry(0.14, 0.16, L), frame, x, 0.08, 0);
    }
    // lighting strip under the roof (the wash bay's own lights)
    const strip = track(new THREE.MeshStandardMaterial({ color: '#f5fbff', emissive: '#dff6ff', emissiveIntensity: 1.3 }));
    add(new THREE.BoxGeometry(0.3, 0.03, L - 1), strip, 0, H - 0.1, 0);

    // wings: long walls hinged along their top edge, livery on the outside
    for (const sx of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(sx * (W / 2), H - 0.02, 0);
      const mats = sx > 0 ? [livery, inner, frame, frame, frame, frame] : [inner, liveryB, frame, frame, frame, frame];
      add(new THREE.BoxGeometry(T, H - 0.3, L - 0.32), mats, sx * (T / 2), -(H - 0.3) / 2, 0, pivot);
      // wing struts (appear to hold the raised wing)
      this.box.add(pivot);
      this.wings.push(pivot);
    }
    // end doors: hinged along their bottom edge, fold down into ramps
    for (const sz of [-1, 1]) {
      const pivot = new THREE.Group();
      pivot.position.set(0, FLOOR, sz * (L / 2));
      add(new THREE.BoxGeometry(W - 0.12, RAMP_LEN, T), body, 0, RAMP_LEN / 2, sz * (T / 2), pivot);
      // tread stripes on the inside face
      for (let i = 1; i < 6; i++) add(new THREE.BoxGeometry(W - 0.4, 0.04, 0.02), frame, 0, (RAMP_LEN * i) / 6, -sz * 0.02, pivot);
      this.box.add(pivot);
      this.ramps.push(pivot);
    }
    this.group.add(this.box);

    this.car = new ProcCar('sedan', '#e9e6df');
    this.group.add(this.car.root);
    this.group.visible = false;

    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([document.fonts.load('800 60px "Unbounded"'), document.fonts.load('60px "Yellowtail"'), document.fonts.load('500 20px "IBM Plex Mono"')])
        .then(() => {
          drawLivery(this.liveryCanvas);
          this.livery.needsUpdate = true;
          this.liveryTurned.needsUpdate = true;
          this.onRepaint();
        })
        .catch(() => {});
    }
  }

  /** Channel values for the unfold (all 0 → 1). */
  update(visible: boolean, s: Record<string, number>) {
    this.group.visible = visible;
    if (!visible) return;
    const e = (u: number) => u * u * (3 - 2 * u);
    this.box.position.y = s.lotDrop * s.lotDrop * 10;
    this.wings[0].rotation.z = -WING_OPEN * e(s.wingB);
    this.wings[1].rotation.z = WING_OPEN * e(s.wingA);
    this.ramps[0].rotation.x = -RAMP_OPEN * e(s.rampA);
    this.ramps[1].rotation.x = RAMP_OPEN * e(s.rampB);
    const zones = Math.max(0, Math.min(1, (s.wingB - 0.5) * 2));
    this.zoneMat.opacity = zones * 0.9;
    this.zoneFill.opacity = zones * 0.07;
    this.rails.forEach((r, i) => {
      r.visible = s.lotArms > 0.01 || s.wingB > 0.9;
      r.position.x = (i === 0 ? -1 : 1) * (0.7 + (this.armX - 0.7) * e(Math.min(1, s.lotArms * 1.6)));
    });
    // the car drives up the entry ramp (−z end), across the deck, and stops in the middle
    const z = s.lotCarZ;
    const half = L / 2;
    let y = FLOOR;
    if (Math.abs(z) > half) y = Math.max(0, FLOOR * (1 - (Math.abs(z) - half) / (RAMP_LEN * 0.98)));
    const onRamp = Math.abs(z) > half && Math.abs(z) < half + RAMP_LEN;
    this.car.place(0, z, 0, y);
    this.car.pitch(onRamp ? Math.sign(-z) * (FLOOR / RAMP_LEN) : 0);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.parked.forEach((c) => c.dispose());
    this.car.dispose();
  }
}
