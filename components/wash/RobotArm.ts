/**
 * EXTERIOR ROBOT (placeholder geometry)
 * ────────────────────────────────────
 * One exterior cleaning robot = XY floor stage + multi-axis arm + nozzle turret.
 *
 *   J0  X/Z   carriage on a floor-mounted XY stage (the "3D-printer" axes)
 *   J1  yaw   turret
 *   J2  pitch shoulder
 *   J3  pitch elbow
 *   J4/J5     wrist (aims the tool at the target surface)
 *   Tool      4-position nozzle turret: water, foam, rinse, spot treatment
 *
 * Joint angles come from a closed-form two-link IK solve, so the arm always
 * articulates like a rigid industrial arm rather than bending organically.
 *
 * PRODUCTION SWAP: /public/models/robot-arm.glb can replace the meshes. Keep
 * the joint hierarchy (turret → shoulder → elbow, plus a free tool node) and
 * this class keeps driving it unchanged.
 */

import * as THREE from 'three';
import { GANTRY, ROBOT } from '@/lib/animationConfig';
import { roundedSlab } from './Vehicle';

const tmpV = new THREE.Vector3();
const tmpD = new THREE.Vector3();
const tmpW = new THREE.Vector3();

export interface ArmMaterials {
  paint: THREE.Material;
  accent: THREE.Material;
  joint: THREE.Material;
  chrome: THREE.Material;
  rail: THREE.Material;
}

export function createArmMaterials(): ArmMaterials {
  return {
    paint: new THREE.MeshStandardMaterial({ color: ROBOT.paint, metalness: 0.15, roughness: 0.42 }),
    accent: new THREE.MeshStandardMaterial({ color: ROBOT.accent, metalness: 0.3, roughness: 0.38 }),
    joint: new THREE.MeshStandardMaterial({ color: '#23272c', metalness: 0.5, roughness: 0.45 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#dfe2e6', metalness: 1, roughness: 0.16 }),
    rail: new THREE.MeshStandardMaterial({ color: '#5d636a', metalness: 0.8, roughness: 0.4 }),
  };
}

export class RobotArm {
  readonly group = new THREE.Group();
  readonly bridge = new THREE.Group();
  readonly carriage = new THREE.Group();
  readonly turret = new THREE.Group();
  readonly shoulder = new THREE.Group();
  readonly elbow = new THREE.Group();
  readonly tool = new THREE.Group();
  readonly turretHead = new THREE.Group();
  /** World-space nozzle tip (read by spray and annotations). */
  readonly nozzle = new THREE.Vector3();
  /** World-space aim point. */
  readonly aim = new THREE.Vector3();
  private yaw = 0;
  private readonly side: 1 | -1;

  constructor(side: 1 | -1, m: ArmMaterials, label: string) {
    this.side = side;
    this.group.name = `Robot ${label}`;

    // ── XY stage bridge (X axis), rides the Z rails on this side ──
    const inner = side * GANTRY.innerRailX;
    const outer = side * GANTRY.outerRailX;
    const span = Math.abs(outer - inner);
    const beam = new THREE.Mesh(roundedSlab(span + 0.3, 0.24, 0.04, 0.06), m.joint);
    beam.position.set((inner + outer) / 2, 0.035, 0);
    beam.receiveShadow = true;
    this.bridge.add(beam);
    for (const x of [inner, outer]) {
      const truck = new THREE.Mesh(roundedSlab(0.26, 0.4, 0.07, 0.05), m.accent);
      truck.position.set(x, 0.05, 0);
      this.bridge.add(truck);
    }
    const lead = new THREE.Mesh(new THREE.BoxGeometry(span, 0.012, 0.03), m.chrome);
    lead.position.set((inner + outer) / 2, 0.066, 0);
    this.bridge.add(lead);
    this.group.add(this.bridge);

    // ── carriage + turret ──
    const plate = new THREE.Mesh(roundedSlab(0.82, 0.82, 0.1, 0.18), m.paint);
    plate.position.y = 0.1;
    plate.castShadow = true;
    this.carriage.add(plate);
    const skirt = new THREE.Mesh(roundedSlab(0.86, 0.86, 0.03, 0.2), m.accent);
    skirt.position.y = 0.05;
    this.carriage.add(skirt);
    this.group.add(this.carriage);

    this.turret.position.y = 0.15;
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.33, 0.42, 32), m.paint);
    drum.position.y = 0.21;
    drum.castShadow = true;
    this.turret.add(drum);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.018, 8, 40), m.chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.36;
    this.turret.add(ring);
    // Googie fin on the back of the turret
    const finShape = new THREE.Shape();
    finShape.moveTo(0, 0);
    finShape.quadraticCurveTo(-0.34, 0.1, -0.42, 0.52);
    finShape.lineTo(-0.1, 0.2);
    finShape.lineTo(0, 0);
    const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, { depth: 0.03, bevelEnabled: false }), m.chrome);
    fin.position.set(-0.2, 0.2, -0.015);
    this.turret.add(fin);
    this.carriage.add(this.turret);

    // ── shoulder (J2) ──
    this.shoulder.position.y = ROBOT.shoulderHeight - 0.15;
    this.turret.add(this.shoulder);
    const sj = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.36, 28).rotateX(Math.PI / 2), m.joint);
    this.shoulder.add(sj);
    const sCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.38, 20).rotateX(Math.PI / 2), m.accent);
    this.shoulder.add(sCap);
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, ROBOT.upperArm - 0.26, 6, 16).rotateZ(Math.PI / 2), m.paint);
    upper.position.x = ROBOT.upperArm / 2;
    upper.castShadow = true;
    this.shoulder.add(upper);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.137, 0.137, 0.12, 20).rotateZ(Math.PI / 2), m.accent);
    band.position.x = ROBOT.upperArm * 0.55;
    this.shoulder.add(band);
    const hose1 = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, ROBOT.upperArm * 0.9, 8).rotateZ(Math.PI / 2), m.joint);
    hose1.position.set(ROBOT.upperArm / 2, 0.17, 0.06);
    this.shoulder.add(hose1);

    // ── elbow (J3) ──
    this.elbow.position.x = ROBOT.upperArm;
    this.shoulder.add(this.elbow);
    const ej = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 24).rotateX(Math.PI / 2), m.joint);
    this.elbow.add(ej);
    const eCap = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 16).rotateX(Math.PI / 2), m.chrome);
    this.elbow.add(eCap);
    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, ROBOT.foreArm - 0.2, 6, 16).rotateZ(Math.PI / 2), m.paint);
    fore.position.x = ROBOT.foreArm / 2;
    fore.castShadow = true;
    this.elbow.add(fore);
    const hose2 = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, ROBOT.foreArm * 0.9, 8).rotateZ(Math.PI / 2), m.joint);
    hose2.position.set(ROBOT.foreArm / 2, 0.13, 0.05);
    this.elbow.add(hose2);

    // ── tool: wrist + nozzle turret (world-space node) ──
    const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 14), m.joint);
    this.tool.add(wrist);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, ROBOT.tool * 0.7, 16).rotateX(Math.PI / 2), m.chrome);
    body.position.z = ROBOT.tool * 0.35;
    this.tool.add(body);
    this.turretHead.position.z = ROBOT.tool * 0.78;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.06, 24).rotateX(Math.PI / 2), m.accent);
    this.turretHead.add(disc);
    ROBOT.nozzles.forEach((n, i) => {
      const a = (i / ROBOT.nozzles.length) * Math.PI * 2;
      const tip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.026, 0.09, 10).rotateX(Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: n.color, emissive: n.color, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3 }),
      );
      tip.position.set(Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0.06);
      this.turretHead.add(tip);
    });
    this.tool.add(this.turretHead);

    this.group.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).castShadow = true;
    });
  }

  /** Solve IK and pose every joint for this frame. */
  update(bx: number, bz: number, aim: THREE.Vector3, off: THREE.Vector3, mode: number) {
    this.bridge.position.z = bz;
    this.carriage.position.set(bx, 0, bz);
    this.aim.copy(aim);

    // Desired nozzle and wrist positions.
    const nozzle = tmpV.copy(aim).add(off);
    const dir = tmpD.copy(aim).sub(nozzle).normalize();
    const wx = nozzle.x - dir.x * ROBOT.tool;
    const wy = nozzle.y - dir.y * ROBOT.tool;
    const wz = nozzle.z - dir.z * ROBOT.tool;

    const sy = ROBOT.shoulderHeight;
    const dx = wx - bx;
    const dz = wz - bz;
    const r = Math.hypot(dx, dz);
    if (r > 0.04) this.yaw = Math.atan2(-dz, dx);
    this.turret.rotation.y = this.yaw;

    const h = wy - sy;
    const L1 = ROBOT.upperArm;
    const L2 = ROBOT.foreArm;
    const D = Math.min(L1 + L2 - 1e-3, Math.max(Math.abs(L1 - L2) + 1e-3, Math.hypot(r, h)));
    const alpha = Math.atan2(h, r);
    const beta = Math.acos(THREE.MathUtils.clamp((L1 * L1 + D * D - L2 * L2) / (2 * L1 * D), -1, 1));
    const gamma = Math.acos(THREE.MathUtils.clamp((L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2), -1, 1));
    this.shoulder.rotation.z = alpha + beta;
    this.elbow.rotation.z = -(Math.PI - gamma);

    // Actual wrist from forward kinematics (handles unreachable targets).
    this.elbow.updateWorldMatrix(true, false);
    const wrist = tmpW.set(L2, 0, 0).applyMatrix4(this.elbow.matrixWorld);
    this.tool.position.copy(wrist);
    this.tool.lookAt(aim);
    this.tool.updateMatrixWorld();
    this.nozzle.set(0, 0, ROBOT.tool * 0.86).applyMatrix4(this.tool.matrixWorld);

    // Turret indexes to the active nozzle.
    this.turretHead.rotation.z = -mode * (Math.PI / 2) * this.side;
  }
}
