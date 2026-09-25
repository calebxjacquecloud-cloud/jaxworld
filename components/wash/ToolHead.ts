/**
 * Close-up model of the end of a robot arm, shown only in the detail window
 * during the desktop intro: forearm, wrist, a supply manifold and ONE nozzle,
 * fed by one large high-pressure water line and four smaller supply lines.
 *
 * It lives in its own small scene (sharing the bay's environment lighting) so
 * the arms in the main demo are left exactly as they are.
 */

import * as THREE from 'three';
import { ROBOT, SCENE_COLORS } from '@/lib/animationConfig';
import type { ArmMaterials } from './RobotArm';
import { SUPPLY_LINES } from '@/data/introSequence';


const DEG = Math.PI / 180;
const TARGET = new THREE.Vector3(-0.1, -0.03, 0);

export class ToolHeadScene {
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 1.6, 0.02, 40);
  /** Where each supply line's tag is pinned (world space of this scene). */
  readonly anchors: THREE.Vector3[] = [];
  private hoseMats: THREE.MeshStandardMaterial[] = [];
  private root = new THREE.Group();

  constructor(env: THREE.Texture | null, m: ArmMaterials) {
    this.scene.background = new THREE.Color(SCENE_COLORS.background);
    this.scene.environment = env;
    this.scene.environmentIntensity = 0.7;
    const key = new THREE.DirectionalLight('#fff3e2', 2.2);
    key.position.set(1.5, 2.5, 2);
    const rim = new THREE.DirectionalLight('#9fe8ff', 1.1);
    rim.position.set(-2, 1, -1.5);
    this.scene.add(key, rim, new THREE.HemisphereLight('#d8dde3', '#15181b', 0.5));
    this.scene.add(this.root);

    // Subtle floor grid far below, for depth.
    const grid = new THREE.GridHelper(12, 48, SCENE_COLORS.gridMajor, SCENE_COLORS.gridMinor);
    grid.position.y = -0.9;
    this.scene.add(grid);

    // ── forearm (comes in from the left) ──
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 1.1, 6, 20).rotateZ(Math.PI / 2), m.paint);
    fore.position.set(-0.95, 0, 0);
    this.root.add(fore);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.106, 0.106, 0.09, 24).rotateZ(Math.PI / 2), m.accent);
    band.position.set(-0.62, 0, 0);
    this.root.add(band);

    // ── wrist ──
    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 28).rotateX(Math.PI / 2), m.joint);
    wrist.position.set(-0.3, 0, 0);
    this.root.add(wrist);
    const wristCap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.28, 20).rotateX(Math.PI / 2), m.accent);
    wristCap.position.copy(wrist.position);
    this.root.add(wristCap);
    const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.1, 24).rotateZ(Math.PI / 2), m.chrome);
    flange.position.set(-0.14, 0, 0);
    this.root.add(flange);

    // ── manifold: every supply line feeds this block, one nozzle leaves it ──
    const block = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.22), m.paint);
    block.position.set(0.0, 0, 0);
    this.root.add(block);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.245, 0.035, 0.225), m.accent);
    stripe.position.set(0.0, -0.05, 0);
    this.root.add(stripe);
    const valveGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.03, 10).rotateX(Math.PI / 2);
    for (let i = 0; i < 4; i++) {
      const v = new THREE.Mesh(valveGeo, m.chrome);
      v.position.set(-0.07 + i * 0.047, 0.04, 0.118);
      this.root.add(v);
    }

    // ── the one nozzle (angled down toward the car) ──
    const nozzle = new THREE.Group();
    nozzle.position.set(0.12, -0.02, 0);
    nozzle.rotation.z = -28 * DEG;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 24).rotateZ(Math.PI / 2), m.chrome);
    collar.position.x = 0.025;
    nozzle.add(collar);
    const lance = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.036, 0.26, 20).rotateZ(Math.PI / 2), m.chrome);
    lance.position.x = 0.18;
    nozzle.add(lance);
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.016, 0.04, 16).rotateZ(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: ROBOT.accent, metalness: 0.3, roughness: 0.35 }),
    );
    tip.position.x = 0.33;
    nozzle.add(tip);
    this.root.add(nozzle);

    // ── supply lines: into the top/back of the manifold, bundled back along the forearm ──
    const ports: THREE.Vector3[] = [
      new THREE.Vector3(0.0, 0.1, -0.02), // large water line: top centre
      new THREE.Vector3(-0.08, 0.1, 0.075),
      new THREE.Vector3(-0.03, 0.1, 0.085),
      new THREE.Vector3(0.03, 0.1, 0.085),
      new THREE.Vector3(0.08, 0.1, 0.075),
    ];
    SUPPLY_LINES.forEach((line, i) => {
      const p = ports[i];
      const big = i === 0;
      const lane = big ? 0 : (i - 2.5) * 0.045;
      const lift = big ? 0.2 : 0.15 + i * 0.012;
      const curve = new THREE.CatmullRomCurve3([
        p.clone(),
        new THREE.Vector3(p.x, p.y + 0.07, p.z),
        new THREE.Vector3(p.x - 0.1, lift, p.z * 0.6 + lane * 0.4),
        new THREE.Vector3(-0.45, lift + 0.01, lane),
        new THREE.Vector3(-0.9, lift - 0.02, lane * 0.9),
        new THREE.Vector3(-1.5, lift - 0.06, lane * 0.8),
      ]);
      const mat = new THREE.MeshStandardMaterial({
        color: line.color,
        roughness: big ? 0.55 : 0.4,
        metalness: big ? 0.2 : 0.1,
        emissive: line.color,
        emissiveIntensity: 0,
      });
      this.hoseMats.push(mat);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, line.radius, big ? 16 : 10, false), mat);
      this.root.add(tube);
      // fitting where the line meets the manifold
      const fit = new THREE.Mesh(new THREE.CylinderGeometry(line.radius * 1.35, line.radius * 1.35, 0.03, 16), m.chrome);
      fit.position.copy(p).add(new THREE.Vector3(0, 0.01, 0));
      this.root.add(fit);
      // tags staggered along the bundle so they don't stack
      this.anchors.push(curve.getPoint(big ? 0.62 : 0.26 + i * 0.1));
    });
    // bundle clamps around the lines on the forearm
    for (const x of [-0.55, -1.0]) {
      const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 32).rotateY(Math.PI / 2), m.chrome);
      clamp.position.set(x, 0.1, 0);
      clamp.scale.set(1, 1.05, 1.25);
      this.root.add(clamp);
    }
  }

  /** Orbit the close-up camera and highlight the supply line being called out (1–5, 0 = none). */
  update(az: number, el: number, dist: number, aspect: number, step: number) {
    const a = az * DEG;
    const e = el * DEG;
    const target = TARGET;
    this.camera.position.set(
      target.x + dist * Math.cos(e) * Math.sin(a),
      target.y + dist * Math.sin(e),
      target.z + dist * Math.cos(e) * Math.cos(a),
    );
    this.camera.lookAt(target);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    const active = Math.ceil(step) - 1;
    this.hoseMats.forEach((mat, i) => {
      mat.emissiveIntensity = i === active ? 0.55 : 0.04;
    });
  }

  dispose() {
    this.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
    });
    this.hoseMats.forEach((m) => m.dispose());
  }
}
