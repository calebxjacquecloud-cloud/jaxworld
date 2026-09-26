/**
 * Imperative Three.js scene for the wash demo.
 *
 * React never re-renders during scroll: the frame loop samples the timeline
 * and calls `apply(state)`, which only writes transforms and uniforms.
 * This module is dynamically imported so the page shell renders first.
 */

import * as THREE from 'three';
import { QUALITY, ROBOT, VEHICLE, detectQuality } from '@/lib/animationConfig';
import { arrivalPose, type VehiclePose } from '@/lib/vehiclePath';
import { sampleTrack, type ChannelValues } from '@/lib/timeline';
import { WASH_TRACKS } from '@/data/washSequence';
import { createPlaceholderVehicle, type VehicleRig } from './Vehicle';
import { RobotArm, createArmMaterials } from './RobotArm';
import { Spray } from './SpraySystem';
import { FoamLayer } from './FoamLayer';
import { ScanEffects } from './ScanEffects';
import { CameraArray, pylonPositions } from './CameraArray';
import { Bay } from './Bay';
import { ToolHeadScene } from './ToolHead';
import { Utilities } from './Utilities';
import { Prelude } from './Prelude';
import { routeCamAz, routePose } from '@/lib/roadPath';
import { ShippingContainer } from './ShippingContainer';
import { PACK_PLAN, unitProgress } from '@/data/outroSequence';
import { CONTAINER, GANTRY } from '@/lib/animationConfig';

const DEG = Math.PI / 180;
const pylonHome = pylonPositions();
const REF_ASPECT = 16 / 9;

export interface ScreenPoint {
  x: number;
  y: number;
  visible: boolean;
}

/** The detail window, in CSS px from the canvas top-left. `open` is 0 (closed) to 1. */
export interface InsetRect {
  x: number;
  y: number;
  w: number;
  h: number;
  open: number;
}

/** Orbit-camera pose: angles in degrees, positions in metres. */
interface OrbitPose {
  az: number;
  el: number;
  dist: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
}

export class WashScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  /** Main view: rises to a fixed top-down shot of the whole bay. */
  readonly camera = new THREE.PerspectiveCamera(30, 1, 0.1, 140);
  /** Close-ups, rendered into the detail window in the upper right. */
  readonly detailCamera = new THREE.PerspectiveCamera(30, 1, 0.05, 140);
  readonly inset: InsetRect = { x: 0, y: 0, w: 0, h: 0, open: 0 };
  private phone = false;
  /** Detail window placements: upper right (main sequence) and lower left (desktop intro). */
  private rectUR = { x: 0, y: 0, w: 1, h: 1 };
  private rectLL = { x: 0, y: 0, w: 1, h: 1 };
  /** The window is showing the tool-head close-up instead of the bay. */
  private toolView = false;
  private toolStep = 0;
  private tool: ToolHeadScene;
  private utilities: Utilities;
  private prelude: Prelude;
  private container: ShippingContainer;
  /** Pack-plan index by unit id. */
  private packIndex = new Map<string, number>();
  private tmpP = new THREE.Vector3();
  readonly quality: 'high' | 'medium' | 'low';
  private vehicle: VehicleRig;
  private carRoot = new THREE.Group();
  private arms: [RobotArm, RobotArm];
  private sprays: [Spray, Spray];
  private foam: FoamLayer;
  private scan: ScanEffects;
  private pylons: CameraArray;
  private bay: Bay;
  private pose: VehiclePose = { x: 0, z: 0, yaw: 0, steer: 0, roll: 0 };
  private width = 1;
  private height = 1;
  private tmpA = new THREE.Vector3();
  private tmpO = new THREE.Vector3();
  private hole = new THREE.Vector4();
  private project = new THREE.Vector3();
  private orbit: OrbitPose = { az: 0, el: 0, dist: 1, tx: 0, ty: 0, tz: 0, fov: 30 };
  private disposed = false;
  /** Set when the next frame must render even if progress hasn't changed (e.g. after a resize). */
  private dirty = true;

  constructor(canvas: HTMLCanvasElement) {
    this.quality = detectQuality();
    const q = QUALITY[this.quality];
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.dpr));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    const armMats = createArmMaterials();
    this.bay = new Bay(this.renderer, this.scene, q.shadows, armMats);
    this.scene.add(this.bay.group);

    // Vehicle (placeholder; see lib/assets.ts for the production swap)
    this.vehicle = createPlaceholderVehicle();
    this.carRoot.add(this.vehicle.root);
    this.scene.add(this.carRoot);

    this.foam = new FoamLayer(this.vehicle.foamMeshes);
    this.scan = new ScanEffects(this.vehicle.scanMeshes, this.vehicle.paintMeshes, this.carRoot, q.cloud);
    this.carRoot.add(this.scan.vehicleSpace);
    this.scene.add(this.scan.world);

    this.pylons = new CameraArray(armMats);
    this.tool = new ToolHeadScene(this.scene.environment, armMats);
    this.prelude = new Prelude();
    this.scene.add(this.prelude.group);
    this.utilities = new Utilities(armMats);
    this.scene.add(this.utilities.group);
    this.container = new ShippingContainer(armMats.chrome);
    this.scene.add(this.container.group);
    PACK_PLAN.forEach((slot, i) => this.packIndex.set(slot.id, i));
    this.scene.add(this.pylons.group);

    this.arms = [new RobotArm(1, armMats, 'A'), new RobotArm(-1, armMats, 'B')];
    this.sprays = [new Spray(q.splash), new Spray(q.splash)];
    for (let i = 0; i < 2; i++) {
      this.scene.add(this.arms[i].group, this.arms[i].tool, this.sprays[i].group);
    }
    const px = this.renderer.getPixelRatio();
    this.sprays.forEach((s) => s.setPixelRatio(px));
    this.scan.setPixelRatio(px);

    // Planned pre-rinse paths, sampled straight from the choreography.
    for (const [id, color] of [['a', '#3fe0e8'], ['b', '#f08a4b']] as const) {
      const pts: THREE.Vector3[] = [];
      for (let t = 0.252; t <= 0.338; t += 0.0012) {
        pts.push(
          new THREE.Vector3(
            sampleTrack(WASH_TRACKS[id + 'Px'], t),
            sampleTrack(WASH_TRACKS[id + 'Py'], t) + 0.04,
            sampleTrack(WASH_TRACKS[id + 'Pz'], t),
          ),
        );
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
    this.layoutInset();
  }

  /** Detail window size and position: upper right, under the header. */
  private layoutInset() {
    const W = this.width;
    const phone = (this.phone = W <= 760 || W / this.height < 0.9);
    const w = phone ? Math.round(W * 0.44) : Math.round(Math.min(480, Math.max(280, W * 0.28)));
    const h = Math.round(w * (phone ? 0.72 : 0.625));
    const gutter = phone ? 16 : Math.min(56, Math.max(16, W * 0.04));
    this.rectUR = { w, h, x: Math.round(W - gutter - (phone ? 0 : 20) - w), y: phone ? 84 : 90 };
    // lower left (desktop intro): leaves room for its callout to the right
    const lw = Math.round(Math.min(400, Math.max(260, W * 0.25)));
    const lh = Math.round(lw * 0.625);
    this.rectLL = { w: lw, h: lh, x: Math.round(gutter), y: Math.round(this.height - 48 - lh) };
  }

  /** Place a camera on an orbit around its target. */
  private poseOrbit(cam: THREE.PerspectiveCamera, o: OrbitPose) {
    const az = o.az * DEG;
    const el = o.el * DEG;
    cam.fov = o.fov;
    cam.position.set(o.tx + o.dist * Math.cos(el) * Math.sin(az), o.ty + o.dist * Math.sin(el), o.tz + o.dist * Math.cos(el) * Math.cos(az));
    cam.lookAt(o.tx, o.ty, o.tz);
  }

  apply(s: ChannelValues, time: number) {
    if (this.disposed) return;

    // ── vehicle ──
    // prelude: the car follows the street route from the garage; afterwards, the arrival path
    if (s.pOn > 0.5) routePose(s.pDist, this.pose);
    else arrivalPose(s.drive, this.pose);
    this.prelude.update(s.door);
    // keep the sun (and its shadow map) centred on the action: the car during the prelude, the bay after
    this.bay.focus(s.pOn > 0.5 ? this.pose.x : 0, s.pOn > 0.5 ? this.pose.z : 0);
    // outro: the finished car drives straight out of the bay along +z
    this.carRoot.position.set(this.pose.x, 0, this.pose.z + s.exitZ);
    this.carRoot.rotation.y = this.pose.yaw + s.carYaw * DEG;
    this.carRoot.visible = s.exitZ < 28;
    const exitRoll = s.exitZ / VEHICLE.wheelRadius;
    for (const w of this.vehicle.wheels) {
      w.spin.rotation.x = this.pose.roll + exitRoll;
      if (w.front) w.steer.rotation.y = this.pose.steer;
    }
    this.bay.turntable.rotation.y = s.drive >= 1 ? s.carYaw * DEG : 0;
    this.vehicle.setSurface(s.grime, s.dirt, s.gloss);
    this.vehicle.setHeadlights(s.headlights);
    this.bay.setGlam(s.gloss * Math.min(1, Math.max(0, (s.camAz - 5) / 30)));
    this.carRoot.updateMatrixWorld(true);

    // ── surface state ──
    const S = VEHICLE.smudge;
    this.hole.set(S.x, S.y, S.z, s.holeR);
    this.foam.update(s.foam, s.drain, this.hole, this.carRoot);

    // ── outro: container, utilities, tracks and pylons (arms follow their IK below) ──
    const cx = (1 - s.contIn) * 30;
    this.container.update(s.contIn > 0.001, cx, CONTAINER.z, s.roof, s.wall);
    const utilOn = this.utilities.rise(s.util, s.pack);
    const riseY = Utilities.riseY(s.util);
    for (const [id, g] of this.utilities.units) {
      if (!utilOn) continue;
      const home = this.utilities.home.get(id)!;
      this.packUnit(g, id, s.pack, cx, home.x, riseY, home.z, 0);
    }
    for (const [id, g] of this.bay.rails) {
      const side = id.startsWith('rail-a') ? 1 : -1;
      const x = side * (id.endsWith('inner') ? GANTRY.innerRailX : GANTRY.outerRailX);
      this.packUnit(g, id, s.pack, cx, x, 0, 0, 0);
    }
    this.pylons.units.forEach((g, i) => {
      const home = pylonHome[i];
      const moved = this.packUnit(g, `pylon-${i}`, s.pack, cx, home.x, 0, home.y, 0);
      this.pylons.setFree(i, moved);
    });

    // ── computer vision ──
    this.pylons.update(s.camRise, s.camActive, s.beams, this.carRoot, time);
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

    // ── robots + spray ──
    // Arms stay parked out of shot until the scan hands over to them.
    const armsOut = s.drive >= 1;
    (['a', 'b'] as const).forEach((id, i) => {
      this.arms[i].carriage.visible = armsOut;
      this.arms[i].tool.visible = armsOut;
      this.tmpA.set(s[id + 'Px'], s[id + 'Py'], s[id + 'Pz']);
      this.tmpO.set(s[id + 'Ox'], s[id + 'Oy'], s[id + 'Oz']);
      const arm = this.arms[i];
      arm.update(s[id + 'Bx'], s[id + 'Bz'], this.tmpA, this.tmpO, s[id + 'Mode']);
      // outro: the posed arm and its stage bridge each travel into the container
      if (s.pack > 0) {
        const bx = s[id + 'Bx'];
        const bz = s[id + 'Bz'];
        const k = unitProgress(s.pack, this.packIndex.get(`arm-${id}`)!);
        if (k > 0) {
          this.packPath(`arm-${id}`, k, cx, bx, 0, bz, 0);
          arm.shift(this.tmpP.x - bx, this.tmpP.y, this.tmpP.z - bz);
        }
        const side = id === 'a' ? 1 : -1;
        const mid = side * (GANTRY.innerRailX + GANTRY.outerRailX) / 2;
        const kb = unitProgress(s.pack, this.packIndex.get(`bridge-${id}`)!);
        if (kb > 0) {
          this.packPath(`bridge-${id}`, kb, cx, mid, 0, bz, 0);
          arm.bridge.position.set(this.tmpP.x - mid, this.tmpP.y, this.tmpP.z);
        }
      }
      this.sprays[i].update(arm.nozzle, arm.aim, s[id + 'Spray'], s[id + 'Mode'], time);
    });

    // ── main view ──
    const aspect = this.width / this.height;
    const narrow = aspect < REF_ASPECT ? Math.pow(REF_ASPECT / aspect, 0.9) - 1 : 0;
    const o = this.orbit;
    // prelude: the camera rides with the car so its nose stays pointing up the screen
    o.az = s.pFollowAz > 0 ? s.vAz + (routeCamAz(this.pose.yaw) + s.pAzOff - s.vAz) * s.pFollowAz : s.vAz;
    o.el = s.vEl;
    o.dist = s.vDist * (1 + narrow * s.vPortraitK);
    o.tx = s.vTx + (this.pose.x - s.vTx) * s.vFollow;
    o.ty = s.vTy;
    o.tz = s.vTz + (this.pose.z - s.vTz) * s.vFollow;
    o.fov = s.vFov;
    this.poseOrbit(this.camera, o);
    // Frame the subject off-centre to make room for copy (desktop only).
    const portrait = aspect < 0.9;
    const fx = portrait ? 0 : s.vFrameX;
    const fy = portrait ? s.vMobileY + s.vFrameY : s.vFrameY;
    this.camera.setViewOffset(this.width, this.height, -fx * this.width, fy * this.height, this.width, this.height);
    this.camera.updateProjectionMatrix();
    // keep fog behind the floor however high the main view climbs
    const fog = this.scene.fog as THREE.Fog | null;
    if (fog) {
      fog.near = Math.max(26, o.dist + 6);
      fog.far = fog.near + 26;
    }

    // ── detail window ──
    const rect = s.insetLL > 0.5 ? this.rectLL : this.rectUR;
    this.inset.x = rect.x;
    this.inset.y = rect.y;
    this.inset.w = rect.w;
    this.inset.h = rect.h;
    this.inset.open = this.phone && s.insetPhoneOff > 0.5 ? 0 : s.inset;
    this.toolView = s.toolView > 0.5;
    if (this.toolView) this.tool.update(s.toolAz, s.toolEl, s.toolDist, rect.w / rect.h, s.hoseStep);
    else if (this.inset.open > 0.001) {
      this.detailCamera.aspect = rect.w / rect.h;
      o.az = s.camAz;
      o.el = s.camEl;
      o.dist = s.camDist;
      o.tx = s.camTx + (this.pose.x - s.camTx) * s.follow;
      o.ty = s.camTy;
      o.tz = s.camTz + (this.pose.z - s.camTz) * s.follow;
      o.fov = s.fov;
      this.poseOrbit(this.detailCamera, o);
      this.detailCamera.updateProjectionMatrix();
    }
  }

  /**
   * Position along a unit's packing path: lift, travel and settle into its
   * container slot, written to tmpP. Returns the rotation (radians) at that point.
   */
  private packPath(id: string, k: number, cx: number, x0: number, y0: number, z0: number, rot0: number): number {
    const slot = PACK_PLAN[this.packIndex.get(id)!];
    const e = k * k * (3 - 2 * k);
    const tx = cx + slot.x;
    const ty = slot.y ?? 0;
    const tz = CONTAINER.z + slot.z;
    const lift = id.startsWith('rail') || id.startsWith('bridge') ? 2.2 : 3.4;
    this.tmpP.set(x0 + (tx - x0) * e, y0 + (ty - y0) * e + Math.sin(Math.PI * k) * lift, z0 + (tz - z0) * e);
    return rot0 + ((slot.rotY ?? 0) * DEG - rot0) * e;
  }

  /** Place a packable unit for packing progress `pack`; returns true once it has left its home. */
  private packUnit(obj: THREE.Object3D, id: string, pack: number, cx: number, x0: number, y0: number, z0: number, rot0: number): boolean {
    const k = unitProgress(pack, this.packIndex.get(id)!);
    if (k <= 0) {
      obj.position.set(x0, y0, z0);
      obj.rotation.y = rot0;
      return false;
    }
    obj.rotation.y = this.packPath(id, k, cx, x0, y0, z0, rot0);
    obj.position.copy(this.tmpP);
    return true;
  }

  consumeDirty(): boolean {
    const d = this.dirty;
    this.dirty = false;
    return d;
  }

  render() {
    if (this.disposed) return;
    const r = this.renderer;
    r.render(this.scene, this.camera);
    const { x, y, w, h, open } = this.inset;
    if (open <= 0.001) return;
    // The window opens top-down: the viewport is the full window, the scissor reveals `open` of it.
    const shown = Math.max(1, Math.round(h * Math.min(1, open)));
    const glY = this.height - y - h;
    r.setViewport(x, glY, w, h);
    r.setScissor(x, glY + h - shown, w, shown);
    r.setScissorTest(true);
    r.shadowMap.autoUpdate = false; // shadows were just computed for this frame
    if (this.toolView) r.render(this.tool.scene, this.tool.camera);
    else r.render(this.scene, this.detailCamera);
    r.shadowMap.autoUpdate = true;
    r.setScissorTest(false);
    r.setViewport(0, 0, this.width, this.height);
  }

  /** Project a vehicle-space point to CSS pixels in the canvas (main view, or the detail window). */
  projectVehicle(x: number, y: number, z: number, out: ScreenPoint, detail = false): ScreenPoint {
    this.project.set(x, y, z).applyMatrix4(this.carRoot.matrixWorld);
    return detail ? this.projectDetail(this.project, out) : this.projectWorld(this.project, out);
  }

  projectNozzle(i: 0 | 1, out: ScreenPoint, detail = false): ScreenPoint {
    this.project.copy(this.arms[i].nozzle);
    return detail ? this.projectDetail(this.project, out) : this.projectWorld(this.project, out);
  }

  private projectWorld(v: THREE.Vector3, out: ScreenPoint): ScreenPoint {
    v.project(this.camera);
    out.visible = v.z < 1 && v.z > -1;
    out.x = (v.x * 0.5 + 0.5) * this.width;
    out.y = (-v.y * 0.5 + 0.5) * this.height;
    return out;
  }

  /** A world point, in the main view. */
  projectPoint(x: number, y: number, z: number, out: ScreenPoint): ScreenPoint {
    return this.projectWorld(this.project.set(x, y, z), out);
  }

  /** Camera head of pylon i, in the main view. */
  projectPylon(i: number, out: ScreenPoint): ScreenPoint {
    return this.projectWorld(this.pylons.headPosition(i, this.project), out);
  }

  get pylonCount() {
    return this.pylons.count;
  }

  /** Middle of robot arm i (0 = A, 1 = B), in the main view. */
  projectArm(i: 0 | 1, out: ScreenPoint): ScreenPoint {
    this.arms[i].carriage.getWorldPosition(this.project);
    this.project.y = 0.9;
    return this.projectWorld(this.project, out);
  }

  /** Supply-line tag i on the tool-head close-up, in the detail window. */
  projectTool(i: number, out: ScreenPoint): ScreenPoint {
    const r = this.inset;
    this.project.copy(this.tool.anchors[i]).project(this.tool.camera);
    out.x = r.x + (this.project.x * 0.5 + 0.5) * r.w;
    out.y = r.y + (-this.project.y * 0.5 + 0.5) * r.h;
    out.visible = this.toolView && r.open > 0.98 && Math.abs(this.project.x) < 0.95 && Math.abs(this.project.y) < 0.95;
    return out;
  }

  /** Into the detail window; only visible once the window is fully open and the point falls inside it. */
  private projectDetail(v: THREE.Vector3, out: ScreenPoint): ScreenPoint {
    const r = this.inset;
    v.project(this.detailCamera);
    out.x = r.x + (v.x * 0.5 + 0.5) * r.w;
    out.y = r.y + (-v.y * 0.5 + 0.5) * r.h;
    out.visible = r.open > 0.98 && v.z < 1 && v.z > -1 && Math.abs(v.x) < 0.92 && Math.abs(v.y) < 0.92;
    return out;
  }

  nozzleLabel(mode: number): string {
    return ROBOT.nozzles[Math.max(0, Math.min(ROBOT.nozzles.length - 1, Math.round(mode)))].label;
  }

  dispose() {
    this.disposed = true;
    this.vehicle.dispose();
    this.tool.dispose();
    this.prelude.dispose();
    this.container.dispose();
    this.bay.dispose();
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
