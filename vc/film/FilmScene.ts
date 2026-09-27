/**
 * Imperative Three.js scene for the VC film (Acts 1–8).
 *
 * The machine is the original concept's machine, imported unchanged: the
 * bubble-top car, both robot arms, the eight camera pylons, the scan effects,
 * sprays, foam, the utility equipment and the 40 ft container. This class only
 * arranges them into a new story: road → old tunnel → inversion → SEE / THINK /
 * ACT / VERIFY → condition check → productization → two deployment sets.
 *
 * React never re-renders during scroll: the frame loop samples the timeline and
 * calls `apply()` + `render()`, which only write transforms and uniforms.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CONTAINER, GANTRY, QUALITY, SCENE_COLORS, VEHICLE, detectQuality } from '@/lib/animationConfig';
import { sampleTrack, type ChannelValues } from '@/lib/timeline';
import { createPlaceholderVehicle, type VehicleRig } from '@/components/wash/Vehicle';
import { RobotArm, createArmMaterials } from '@/components/wash/RobotArm';
import { Spray } from '@/components/wash/SpraySystem';
import { FoamLayer } from '@/components/wash/FoamLayer';
import { ScanEffects } from '@/components/wash/ScanEffects';
import { CameraArray, pylonPositions } from '@/components/wash/CameraArray';
import { Utilities } from '@/components/wash/Utilities';
import { ShippingContainer } from '@/components/wash/ShippingContainer';
import { PACK_PLAN, unitProgress } from '@/data/outroSequence';
import { FILM_TRACKS, PLAN_WINDOW, QUEUE, QUEUE_GAP } from './sequence';
import { RoadSet } from './RoadSet';
import { AirportSet, LotSet } from './DeploySets';
import { ProcCar } from './ProcCar';

const DEG = Math.PI / 180;
const REF_ASPECT = 16 / 9;
const pylonHome = pylonPositions();

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

export type Space = 'hero' | 'world';

export class FilmScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  private photoCam = new THREE.PerspectiveCamera(40, 4 / 3, 0.1, 100);
  readonly quality: 'high' | 'medium' | 'low';
  private width = 1;
  private height = 1;
  private dirty = true;
  private disposed = false;

  private key: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private envRT: THREE.WebGLRenderTarget;

  private road: RoadSet;
  private airport: AirportSet;
  private lot: LotSet;
  private set = 0;

  // hero car and everything that clings to it
  private vehicle: VehicleRig;
  private carRoot = new THREE.Group();
  private foam: FoamLayer;
  private scan: ScanEffects;
  private surface = { grime: 1, dirt: 1, gloss: 0 };
  private cmp = { on: false, x: 1 };

  private queue: ProcCar[] = [];

  // the machine
  private arms: [RobotArm, RobotArm];
  private sprays: [Spray, Spray];
  private pylons: CameraArray;
  private rails = new Map<string, THREE.Group>();
  private utilities: Utilities;
  private container: ShippingContainer;
  private packIndex = new Map<string, number>();

  private tmpA = new THREE.Vector3();
  private tmpO = new THREE.Vector3();
  private tmpP = new THREE.Vector3();
  private hole = new THREE.Vector4();
  private project = new THREE.Vector3();
  private heroPos = new THREE.Vector3();

  /** @param onInvalidate called when late-loading art (fonts, Jacque) needs a fresh frame while the loop is idle. */
  constructor(canvas: HTMLCanvasElement, private onInvalidate: () => void = () => {}) {
    this.quality = detectQuality();
    const q = QUALITY[this.quality];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.dpr));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    // environment + lights (same recipe as the original bay)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    pmrem.dispose();
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.6;
    this.scene.background = new THREE.Color(SCENE_COLORS.background);
    this.scene.fog = new THREE.Fog(SCENE_COLORS.background, 26, 56);
    this.scene.add(new THREE.HemisphereLight('#d9e2ea', '#1a1510', 0.6));
    this.key = new THREE.DirectionalLight('#ffe4c8', 2.3);
    this.key.position.set(7, 13, 9);
    this.scene.add(this.key, this.key.target);
    if (q.shadows) {
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      const sc = this.key.shadow.camera;
      sc.left = -16;
      sc.right = 16;
      sc.top = 16;
      sc.bottom = -16;
      sc.near = 1;
      sc.far = 42;
      this.key.shadow.bias = -0.0004;
      this.key.shadow.normalBias = 0.02;
    }
    this.rim = new THREE.DirectionalLight('#9fdcff', 1.1);
    this.rim.position.set(-9, 6, -7);
    this.scene.add(this.rim);

    const repaint = () => {
      this.dirty = true;
      this.onInvalidate();
    };
    this.road = new RoadSet(repaint);
    this.scene.add(this.road.group);
    this.airport = new AirportSet();
    this.lot = new LotSet(repaint);
    this.scene.add(this.airport.group, this.lot.group);

    // hero car
    this.vehicle = createPlaceholderVehicle();
    this.carRoot.add(this.vehicle.root);
    this.carRoot.add(this.road.sensorField);
    this.scene.add(this.carRoot);
    this.foam = new FoamLayer(this.vehicle.foamMeshes);
    this.scan = new ScanEffects(this.vehicle.scanMeshes, this.vehicle.paintMeshes, this.carRoot, q.cloud);
    this.carRoot.add(this.scan.vehicleSpace);
    this.scene.add(this.scan.world);

    // everyday vehicles for the old tunnel
    for (const qv of QUEUE) {
      const c = new ProcCar(qv.kind, qv.color);
      this.queue.push(c);
      this.scene.add(c.root);
    }

    // the machine
    const mats = createArmMaterials();
    this.pylons = new CameraArray(mats);
    this.scene.add(this.pylons.group);
    this.arms = [new RobotArm(1, mats, 'A'), new RobotArm(-1, mats, 'B')];
    this.sprays = [new Spray(q.splash), new Spray(q.splash)];
    for (let i = 0; i < 2; i++) this.scene.add(this.arms[i].group, this.arms[i].tool, this.sprays[i].group);
    const px = this.renderer.getPixelRatio();
    this.sprays.forEach((s) => s.setPixelRatio(px));
    this.scan.setPixelRatio(px);

    // stage rails (same layout and pack ids as the original bay)
    const railLen = GANTRY.zMax - GANTRY.zMin + 1.4;
    const railGeo = new THREE.BoxGeometry(0.1, 0.04, railLen);
    for (const side of [-1, 1]) {
      for (const x of [GANTRY.innerRailX, GANTRY.outerRailX]) {
        const unit = new THREE.Group();
        const rail = new THREE.Mesh(railGeo, mats.rail);
        rail.position.y = 0.02;
        rail.receiveShadow = true;
        unit.add(rail);
        for (const z of [GANTRY.zMin - 0.7, GANTRY.zMax + 0.7]) {
          const stop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.1), mats.accent);
          stop.position.set(0, 0.05, z);
          unit.add(stop);
        }
        unit.position.set(side * x, 0, 0);
        this.scene.add(unit);
        this.rails.set(`rail-${side > 0 ? 'a' : 'b'}-${x === GANTRY.innerRailX ? 'inner' : 'outer'}`, unit);
      }
    }
    this.utilities = new Utilities(mats);
    this.scene.add(this.utilities.group);
    this.container = new ShippingContainer(mats.chrome, repaint);
    this.scene.add(this.container.group);
    PACK_PLAN.forEach((slot, i) => this.packIndex.set(slot.id, i));

    // the per-vehicle cleaning plan, sampled straight from the choreography
    for (const [id, color] of [['a', '#3fe0e8'], ['b', '#f08a4b']] as const) {
      const pts: THREE.Vector3[] = [];
      for (let t = PLAN_WINDOW[0]; t <= PLAN_WINDOW[1]; t += 0.01) {
        pts.push(new THREE.Vector3(sampleTrack(FILM_TRACKS[id + 'Px'], t), sampleTrack(FILM_TRACKS[id + 'Py'], t) + 0.04, sampleTrack(FILM_TRACKS[id + 'Pz'], t)));
      }
      this.scan.addPlannedPath(pts, color);
    }
  }

  resize(w: number, h: number) {
    this.dirty = true;
    this.width = Math.max(1, w);
    this.height = Math.max(1, h);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
  }

  consumeDirty() {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }

  get portrait() {
    return this.width / this.height < 0.9;
  }

  apply(s: ChannelValues, time: number) {
    if (this.disposed) return;
    const set = (this.set = Math.round(s.set));
    const bay = set === 0;

    // ── sets ──
    this.road.update(s, time, bay);
    this.airport.update(set === 1, s.apCarZ, s.apScan);
    this.lot.update(set === 2, s);

    // ── hero car ──
    const heroZ = s.heroZ + s.exitZ;
    this.carRoot.position.set(0, 0, heroZ);
    this.carRoot.visible = bay && heroZ < 34;
    for (const w of this.vehicle.wheels) w.spin.rotation.x = heroZ / VEHICLE.wheelRadius;
    this.surface.grime = s.grime;
    this.surface.dirt = s.dirt;
    this.surface.gloss = s.gloss;
    this.vehicle.setSurface(s.grime, s.dirt, s.gloss);
    this.vehicle.setHeadlights(s.headlights);
    this.carRoot.updateMatrixWorld(true);
    this.heroPos.set(0, 0, heroZ);
    this.cmp.on = bay && s.cmpOn > 0.5;
    this.cmp.x = s.cmpX;

    const S = VEHICLE.smudge;
    this.hole.set(S.x, S.y, S.z, s.holeR);
    this.foam.update(s.foam, s.drain, this.hole, this.carRoot);
    this.scan.world.visible = bay;
    this.scan.update({
      cloud: s.cloud,
      sweepOn: s.sweepOn,
      sweepZ: s.sweepZ,
      wire: s.wire,
      dims: s.dims,
      marker: s.marker,
      qcScan: s.qcScan,
      envelope: s.envelope,
      paths: s.paths,
      time,
    });

    // ── old tunnel queue: every vehicle rides the same conveyor at the same pace ──
    const queueOn = bay && s.qS < 63.9 && s.tunnelUp < 0.5;
    this.queue.forEach((c, i) => {
      const z = s.qS - i * QUEUE_GAP;
      c.place(0, z, 0);
      c.root.visible = queueOn && z > -40 && z < 42;
    });

    // ── machine ──
    const cx = (1 - s.contIn) * 30;
    if (bay) {
      this.poseBayMachine(s, cx, time);
    } else {
      this.container.update(false, 0, 0, 0, 0);
      this.utilities.rise(0, 0);
      for (const r of this.rails.values()) r.visible = false;
      this.poseLaneMachine(set, s, time);
    }

    // ── key light follows the action ──
    const fx = 0;
    const fz = bay && s.follow > 0.5 ? heroZ : bay && s.contIn > 0.01 ? 4 : 0;
    if (this.key.target.position.z !== fz || this.key.target.position.x !== fx) {
      this.key.target.position.set(fx, 0, fz);
      this.key.position.set(fx + 7, 13, fz + 9);
      this.key.target.updateMatrixWorld();
    }
    this.key.intensity = 2.3 + 0.8 * s.gloss * (bay ? 1 : 0);

    // ── camera ──
    const aspect = this.width / this.height;
    const narrow = aspect < REF_ASPECT ? Math.pow(REF_ASPECT / aspect, 0.9) - 1 : 0;
    const tx = s.tx + (0 - s.tx) * s.follow;
    const tz = s.tz + (heroZ - s.tz) * s.follow;
    const dist = s.dist * (1 + narrow * 0.42);
    const az = s.az * DEG;
    const el = s.el * DEG;
    this.camera.fov = s.fov;
    this.camera.up.set(0, 1, 0);
    this.camera.position.set(tx + dist * Math.cos(el) * Math.sin(az), s.ty + dist * Math.sin(el), tz + dist * Math.cos(el) * Math.cos(az));
    this.camera.lookAt(tx, s.ty, tz);
    const portrait = aspect < 0.9;
    const offX = portrait ? 0 : s.frameX;
    const offY = portrait ? s.frameYP : 0;
    this.camera.setViewOffset(this.width, this.height, -offX * this.width, offY * this.height, this.width, this.height);
    this.camera.updateProjectionMatrix();
    const fog = this.scene.fog as THREE.Fog;
    fog.near = Math.max(26, dist + 8);
    fog.far = fog.near + 34;
  }

  private poseBayMachine(s: ChannelValues, cx: number, time: number) {
    // pylons: home positions around the bay, packed at the end
    this.pylons.units.forEach((g, i) => {
      const home = pylonHome[i];
      const moved = this.packUnit(g, `pylon-${i}`, s.pack, cx, home.x, 0, home.y);
      this.pylons.setFree(i, moved);
    });
    this.pylons.group.visible = s.camRise > 0.001;
    this.pylons.update(s.camRise, s.camActive, s.beams, this.carRoot, time);

    // rails rise out of the floor, then pack
    const railY = -0.12 * (1 - s.rails);
    for (const [id, g] of this.rails) {
      g.visible = s.rails > 0.001;
      const side = id.startsWith('rail-a') ? 1 : -1;
      const x = side * (id.endsWith('inner') ? GANTRY.innerRailX : GANTRY.outerRailX);
      this.packUnit(g, id, s.pack, cx, x, railY, 0);
    }

    // utilities rise for the productization reveal, then pack
    const on = this.utilities.rise(s.util, s.pack);
    const riseY = Utilities.riseY(s.util);
    if (on) for (const [id, g] of this.utilities.units) {
      const home = this.utilities.home.get(id)!;
      this.packUnit(g, id, s.pack, cx, home.x, riseY, home.z);
    }
    this.container.update(s.contIn > 0.001, cx, CONTAINER.z, s.roof, s.wall);

    // arms: emerge from the floor with their stages, run the choreography, then pack
    const up = s.armsUp;
    (['a', 'b'] as const).forEach((id, i) => {
      const arm = this.arms[i];
      const visible = up > 0.01;
      arm.group.visible = visible;
      arm.tool.visible = visible;
      arm.bridge.visible = true;
      this.tmpA.set(s[id + 'Px'], s[id + 'Py'], s[id + 'Pz']);
      this.tmpO.set(s[id + 'Ox'], s[id + 'Oy'], s[id + 'Oz']);
      arm.update(s[id + 'Bx'], s[id + 'Bz'], this.tmpA, this.tmpO, s[id + 'Mode']);
      if (up < 1) {
        arm.shift(0, -(1 - up) * 2.2, 0);
        arm.bridge.position.y = -(1 - up) * 0.12;
      }
      if (s.pack > 0) {
        const bx = s[id + 'Bx'];
        const bz = s[id + 'Bz'];
        const k = unitProgress(s.pack, this.packIndex.get(`arm-${id}`)!);
        if (k > 0) {
          this.packPath(`arm-${id}`, k, cx, bx, 0, bz);
          arm.shift(this.tmpP.x - bx, this.tmpP.y, this.tmpP.z - bz);
        }
        const side = id === 'a' ? 1 : -1;
        const mid = (side * (GANTRY.innerRailX + GANTRY.outerRailX)) / 2;
        const kb = unitProgress(s.pack, this.packIndex.get(`bridge-${id}`)!);
        if (kb > 0) {
          this.packPath(`bridge-${id}`, kb, cx, mid, 0, bz);
          arm.bridge.position.set(this.tmpP.x - mid, this.tmpP.y, this.tmpP.z);
        }
      }
      this.sprays[i].update(arm.nozzle, arm.aim, visible ? s[id + 'Spray'] : 0, s[id + 'Mode'], time);
    });
  }

  /** Airport lane (set 1) and unfolded container (set 2): the same arms and pylons, re-posed. */
  private poseLaneMachine(set: number, s: ChannelValues, time: number) {
    const lane = set === 1 ? this.airport : this.lot;
    const car = lane.car;
    const spec = car.spec;
    const carZ = set === 1 ? s.apCarZ : s.lotCarZ;
    const e = (u: number) => u * u * (3 - 2 * u);
    const deploy = set === 1 ? 1 : e(Math.min(1, s.lotArms));
    const rise = set === 1 ? 1 : s.lotCams;
    const active = set === 1 ? (s.apScan > 0 && s.apScan < 1 ? 1 : 0.3) : s.lotCams;

    this.pylons.group.visible = rise > 0.001;
    this.pylons.units.forEach((g, i) => {
      const [x, z] = lane.pylons[i];
      g.position.set(x, 0, z);
      g.rotation.y = 0;
      this.pylons.setFree(i, false);
    });
    this.pylons.update(rise, active, set === 1 && s.apScan > 0 && s.apScan < 1 ? 0.45 : 0, car.root, time);

    const railX = set === 1 ? 2.75 : 0.7 + (this.lot.armX - 0.7) * deploy;
    const wash = set === 1 ? s.apWash : 0;
    const washing = wash > 0.001 && wash < 0.999;
    (['a', 'b'] as const).forEach((_, i) => {
      const arm = this.arms[i];
      const side = i === 0 ? 1 : -1;
      const visible = set === 1 || s.lotArms > 0.01;
      arm.group.visible = visible;
      arm.tool.visible = visible;
      arm.bridge.visible = false;
      const bx = side * railX;
      if (washing) {
        // nose-to-tail pass over the roof line, then back along the flank
        const hl = spec.length / 2;
        const u = i === 0 ? wash : Math.min(1, wash * 1.05);
        const first = u < 0.5;
        const k = first ? u * 2 : (u - 0.5) * 2;
        const z = carZ + (first ? hl - k * 2 * hl : -hl + k * 2 * hl);
        if (first) {
          this.tmpA.set(side * spec.width * 0.22, spec.roofY, z);
          this.tmpO.set(side * 0.5, 0.72, 0);
        } else {
          this.tmpA.set(side * (spec.width / 2 + 0.01), spec.beltY * 0.7, z);
          this.tmpO.set(side * 0.75, 0.3, 0);
        }
        arm.update(bx, z, this.tmpA, this.tmpO, first ? 0 : 1);
      } else {
        const bz = side * 1.6;
        this.tmpA.set(bx - side * 0.55, 0.95, bz);
        this.tmpO.set(side * 0.15, 1.1, 0);
        arm.update(bx, bz, this.tmpA, this.tmpO, 0);
      }
      if (set === 2 && deploy < 1) arm.shift(0, -(1 - deploy) * 1.4, 0);
      const spray = washing ? Math.min(1, Math.min(wash, 1 - wash) * 12) : 0;
      this.sprays[i].update(arm.nozzle, arm.aim, spray, washing && wash >= 0.5 ? 1 : 0, time);
    });
  }

  private packPath(id: string, k: number, cx: number, x0: number, y0: number, z0: number) {
    const slot = PACK_PLAN[this.packIndex.get(id)!];
    const e = k * k * (3 - 2 * k);
    const tx = cx + slot.x;
    const ty = slot.y ?? 0;
    const tz = CONTAINER.z + slot.z;
    const lift = id.startsWith('rail') || id.startsWith('bridge') ? 2.2 : 3.4;
    this.tmpP.set(x0 + (tx - x0) * e, y0 + (ty - y0) * e + Math.sin(Math.PI * k) * lift, z0 + (tz - z0) * e);
    return ((slot.rotY ?? 0) * DEG) * e;
  }

  private packUnit(obj: THREE.Object3D, id: string, pack: number, cx: number, x0: number, y0: number, z0: number): boolean {
    const k = unitProgress(pack, this.packIndex.get(id)!);
    if (k <= 0) {
      obj.position.set(x0, y0, z0);
      obj.rotation.y = 0;
      return false;
    }
    obj.rotation.y = this.packPath(id, k, cx, x0, y0, z0);
    obj.position.copy(this.tmpP);
    return true;
  }

  render() {
    if (this.disposed) return;
    const r = this.renderer;
    r.render(this.scene, this.camera);
    if (!this.cmp.on || this.cmp.x <= 0.001) return;
    // pre-wash scan on the left of the divider: same frame, the car as it arrived
    const w = Math.round(this.width * this.cmp.x);
    this.vehicle.setSurface(1, 1, 0);
    r.setScissor(0, 0, w, this.height);
    r.setScissorTest(true);
    r.shadowMap.autoUpdate = false;
    r.render(this.scene, this.camera);
    r.shadowMap.autoUpdate = true;
    r.setScissorTest(false);
    this.vehicle.setSurface(this.surface.grime, this.surface.dirt, this.surface.gloss);
  }

  /** Project a point to CSS px on the canvas. Hero space follows the hero car. */
  projectPoint(x: number, y: number, z: number, space: Space, out: ScreenPoint): ScreenPoint {
    this.project.set(x, y, z);
    if (space === 'hero') this.project.applyMatrix4(this.carRoot.matrixWorld);
    this.project.project(this.camera);
    out.visible = this.project.z < 1 && this.project.z > -1 && Math.abs(this.project.x) < 1.1 && Math.abs(this.project.y) < 1.1;
    out.x = (this.project.x * 0.5 + 0.5) * this.width;
    out.y = (-this.project.y * 0.5 + 0.5) * this.height;
    return out;
  }

  /** A queue vehicle's roof, a lane vehicle's roof, or arm A's carriage, in CSS px. */
  projectNamed(name: string, out: ScreenPoint): ScreenPoint {
    const m = /^queue(\d)$/.exec(name);
    if (m) {
      const c = this.queue[Number(m[1])];
      if (!c.root.visible) return ((out.visible = false), out);
      return this.projectPoint(c.root.position.x, c.spec.roofY + 0.5, c.root.position.z, 'world', out);
    }
    if (name === 'laneCar') {
      const c = this.set === 1 ? this.airport.car : this.lot.car;
      return this.projectPoint(c.root.position.x, c.spec.roofY + 0.7, c.root.position.z, 'world', out);
    }
    if (name === 'armA') {
      this.arms[0].carriage.getWorldPosition(this.project);
      return this.projectPoint(this.project.x, 1.4, this.project.z, 'world', out);
    }
    out.visible = false;
    return out;
  }

  /**
   * Render small "photos" of the hero car into data URLs: a set of handheld,
   * inconsistent shots (angles, exposure, distance, coverage) and a set of
   * identical, standardized views from the pylon positions.
   * Everything happens inside one task, so the WebGL canvas can be read without
   * preserveDrawingBuffer. The next frame repaints the real view.
   */
  capturePhotos(): { manual: string[]; standard: string[] } {
    const r = this.renderer;
    const pr = r.getPixelRatio();
    const W = 320;
    const H = 240;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const g = out.getContext('2d')!;
    const cam = this.photoCam;
    const center = new THREE.Vector3(0, 0.7, this.heroPos.z);
    const prevExposure = r.toneMappingExposure;
    // the car alone: no scan overlay, no machine in the shot
    const hidden = [this.scan.vehicleSpace, this.scan.world, this.pylons.group, ...this.arms.map((a) => a.group), ...this.arms.map((a) => a.tool), ...this.sprays.map((x) => x.group)];
    const was = hidden.map((o) => o.visible);
    hidden.forEach((o) => (o.visible = false));
    const shot = (az: number, el: number, dist: number, fov: number, exposure: number, roll: number, look: THREE.Vector3) => {
      cam.fov = fov;
      cam.aspect = W / H;
      cam.position.set(look.x + dist * Math.cos(el * DEG) * Math.sin(az * DEG), look.y + dist * Math.sin(el * DEG), look.z + dist * Math.cos(el * DEG) * Math.cos(az * DEG));
      cam.up.set(Math.sin(roll * DEG), Math.cos(roll * DEG), 0);
      cam.lookAt(look);
      cam.updateProjectionMatrix();
      r.toneMappingExposure = exposure;
      r.setViewport(0, 0, W / pr, H / pr);
      r.setScissor(0, 0, W / pr, H / pr);
      r.setScissorTest(true);
      r.render(this.scene, cam);
      r.setScissorTest(false);
      const src = r.domElement;
      g.drawImage(src, 0, src.height - H, W, H, 0, 0, W, H);
      return out.toDataURL('image/jpeg', 0.82);
    };
    const manual = [
      shot(38, 8, 6.2, 52, 1.35, -4, center),
      shot(160, 22, 4.2, 60, 0.62, 6, new THREE.Vector3(0.6, 0.6, this.heroPos.z - 1.6)),
      shot(95, 4, 2.6, 70, 1.05, -9, new THREE.Vector3(0.9, 0.55, this.heroPos.z + 0.8)),
      shot(-120, 35, 9.5, 40, 0.8, 3, center),
      shot(-20, 12, 3.4, 58, 1.6, 12, new THREE.Vector3(-0.4, 0.6, this.heroPos.z + 2.2)),
      shot(210, 6, 7, 45, 0.5, -2, center),
    ];
    const standard = pylonHome.map((p) => {
      const az = Math.atan2(p.x, p.y) / DEG;
      return shot(az, 24, 6.6, 42, 1.05, 0, center);
    });
    r.toneMappingExposure = prevExposure;
    r.setViewport(0, 0, this.width, this.height);
    hidden.forEach((o, i) => (o.visible = was[i]));
    this.camera.up.set(0, 1, 0);
    this.dirty = true;
    return { manual, standard };
  }

  dispose() {
    this.disposed = true;
    this.vehicle.dispose();
    this.road.dispose();
    this.airport.dispose();
    this.lot.dispose();
    this.container.dispose();
    this.queue.forEach((c) => c.dispose());
    this.envRT.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    this.renderer.dispose();
  }
}
