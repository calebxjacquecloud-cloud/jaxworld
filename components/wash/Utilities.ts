/**
 * The equipment that runs the wash but is never on screen during it: water
 * storage, the pressurization system, cleaning-chemistry tubs, controller and
 * network cabinets, and hose reels. It sits in floor pockets on a utility row
 * above the bay (off the top of the frame) and rises for the "pack it up" outro.
 *
 * Every unit's origin is the centre of its footprint on the floor, so the
 * packing code can move it straight into its container slot.
 */

import * as THREE from 'three';
import { UTILITIES, type Utility } from '@/data/outroSequence';
import { SCENE_COLORS } from '@/lib/animationConfig';
import type { ArmMaterials } from './RobotArm';

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(r: number, h: number, mat: THREE.Material, x = 0, y = 0, z = 0, seg = 28): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  return m;
}

function waterTank(m: ArmMaterials): THREE.Group {
  const g = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: '#b9d3dc', metalness: 0.35, roughness: 0.35 });
  g.add(cyl(0.72, 1.85, shell, 0, 0.08));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), shell);
  dome.position.y = 1.93;
  dome.scale.y = 0.3;
  g.add(dome);
  for (const y of [0.35, 1.0, 1.65]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.725, 0.02, 8, 48).rotateX(Math.PI / 2), m.chrome);
    band.position.y = y;
    g.add(band);
  }
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.728, 0.728, 0.22, 28, 1, true), m.accent);
  label.position.y = 1.3;
  g.add(label);
  // sight glass
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 1.4, 0.05),
    new THREE.MeshStandardMaterial({ color: '#4f9be0', emissive: '#4f9be0', emissiveIntensity: 0.4 }),
  );
  glass.position.set(0, 0.95, 0.74);
  g.add(glass);
  g.add(cyl(0.78, 0.08, m.joint));
  return g;
}

function pumpSkid(m: ArmMaterials): THREE.Group {
  const g = new THREE.Group();
  g.add(box(1.2, 0.1, 0.9, m.joint));
  // electric motor + pump head
  const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 24).rotateZ(Math.PI / 2), m.paint);
  motor.position.set(-0.25, 0.34, -0.15);
  motor.castShadow = true;
  g.add(motor);
  const fins = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.3, 24, 1, true).rotateZ(Math.PI / 2), m.joint);
  fins.position.copy(motor.position);
  g.add(fins);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.28), m.chrome);
  head.position.set(0.14, 0.3, -0.15);
  g.add(head);
  // pressure accumulator vessel (the pressurizing tank)
  const vessel = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.55, 8, 20), m.accent);
  vessel.position.set(0.3, 0.6, 0.22);
  vessel.castShadow = true;
  g.add(vessel);
  // gauge
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 20).rotateX(Math.PI / 2), m.chrome);
  gauge.position.set(-0.1, 0.72, 0.2);
  g.add(gauge);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.065, 20), new THREE.MeshStandardMaterial({ color: '#f3ebdd' }));
  face.position.set(-0.1, 0.72, 0.217);
  g.add(face);
  // piping
  const pipe = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([new THREE.Vector3(0.27, 0.35, -0.15), new THREE.Vector3(0.45, 0.4, -0.05), new THREE.Vector3(0.3, 0.32, 0.22)]),
      16,
      0.035,
      10,
    ),
    m.chrome,
  );
  g.add(pipe);
  const riser = cyl(0.03, 0.55, m.chrome, -0.1, 0.1, 0.2, 10);
  g.add(riser);
  return g;
}

function tub(m: ArmMaterials, color: string): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.56, 0.08, 0.56, m.joint));
  const liquid = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0.88 });
  g.add(box(0.5, 0.74, 0.5, liquid, 0, 0.08));
  // cage
  const cage = new THREE.MeshStandardMaterial({ color: '#c9cdd2', metalness: 0.9, roughness: 0.3 });
  for (const [x, z] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) g.add(box(0.025, 0.82, 0.025, cage, x, 0.08, z));
  for (const y of [0.3, 0.6, 0.88]) {
    g.add(box(0.54, 0.02, 0.02, cage, 0, y, 0.26));
    g.add(box(0.54, 0.02, 0.02, cage, 0, y, -0.26));
    g.add(box(0.02, 0.02, 0.54, cage, 0.26, y, 0));
    g.add(box(0.02, 0.02, 0.54, cage, -0.26, y, 0));
  }
  g.add(cyl(0.07, 0.06, m.accent, 0, 0.82));
  return g;
}

function rack(m: ArmMaterials, h: number, leds: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: '#23272c', metalness: 0.45, roughness: 0.5 });
  g.add(box(0.6, h, 0.6, body));
  g.add(box(0.61, 0.08, 0.61, m.accent, 0, h - 0.18));
  const led = new THREE.MeshStandardMaterial({ color: SCENE_COLORS.cyan, emissive: SCENE_COLORS.cyan, emissiveIntensity: 1.2 });
  for (let i = 0; i < leds; i++) {
    const d = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.01), led);
    d.position.set(-0.2 + (i % 3) * 0.06, h - 0.35 - Math.floor(i / 3) * 0.14, 0.305);
    g.add(d);
  }
  for (let i = 0; i < 6; i++) g.add(box(0.44, 0.012, 0.005, m.joint, 0.02, 0.2 + i * 0.08, 0.303));
  return g;
}

function reel(m: ArmMaterials, color: string): THREE.Group {
  const g = new THREE.Group();
  g.add(box(0.7, 0.06, 0.5, m.joint));
  for (const x of [-0.3, 0.3]) {
    const side = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 32).rotateZ(Math.PI / 2), m.paint);
    side.position.set(x, 0.46, 0);
    side.castShadow = true;
    g.add(side);
    g.add(box(0.05, 0.46, 0.08, m.joint, x, 0.02, 0));
  }
  const hoseMat = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  for (let i = 0; i < 5; i++) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.045, 10, 36).rotateY(Math.PI / 2), hoseMat);
    coil.position.set(-0.22 + i * 0.11, 0.46, 0);
    g.add(coil);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.66, 12).rotateZ(Math.PI / 2), m.chrome);
  hub.position.y = 0.46;
  g.add(hub);
  return g;
}

function build(u: Utility, m: ArmMaterials): THREE.Group {
  switch (u.kind) {
    case 'water':
      return waterTank(m);
    case 'pump':
      return pumpSkid(m);
    case 'tub':
      return tub(m, u.color ?? '#f6e7d2');
    case 'rack':
      return rack(m, 2.0, 12);
    case 'cabinet': {
      const g = rack(m, 1.3, 6);
      const mast = cyl(0.012, 0.4, m.chrome, 0.2, 1.3, -0.2, 8);
      g.add(mast);
      return g;
    }
    case 'reel':
      return reel(m, u.color ?? '#4f9be0');
  }
}

export class Utilities {
  readonly group = new THREE.Group();
  /** Packable units by id; origin = footprint centre on the floor. */
  readonly units = new Map<string, THREE.Group>();
  /** Where each unit starts (on the utility row). */
  readonly home = new Map<string, THREE.Vector3>();
  private pockets: THREE.Mesh;

  constructor(m: ArmMaterials) {
    const pocketMat = new THREE.MeshBasicMaterial({ color: '#0c0e10', transparent: true, opacity: 0 });
    const pocketGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    this.pockets = new THREE.Mesh(pocketGeo, pocketMat);
    // one long pocket strip under the whole utility row
    const xs = UTILITIES.map((u) => u.at[0]);
    const x0 = Math.min(...xs) - 1;
    const x1 = Math.max(...xs) + 0.8;
    this.pockets.scale.set(x1 - x0, 1, 2.2);
    this.pockets.position.set((x0 + x1) / 2, 0.004, UTILITIES[0].at[1]);
    this.group.add(this.pockets);
    for (const u of UTILITIES) {
      const g = build(u, m);
      g.position.set(u.at[0], 0, u.at[1]);
      g.visible = false;
      this.units.set(u.id, g);
      this.home.set(u.id, new THREE.Vector3(u.at[0], 0, u.at[1]));
      this.group.add(g);
    }
  }

  /** Rise from the floor pockets (0 = hidden below the floor, 1 = standing on it). */
  rise(v: number, pack: number) {
    const on = v > 0.001;
    // the pockets close once their equipment has been loaded (utilities pack in the first half)
    const closed = Math.min(1, Math.max(0, (pack - 0.55) / 0.12));
    (this.pockets.material as THREE.MeshBasicMaterial).opacity = Math.min(1, v * 3) * 0.7 * (1 - closed);
    this.pockets.visible = on && closed < 1;
    for (const g of this.units.values()) g.visible = on;
    return on;
  }

  /** Floor height of units still in their pockets for rise value v. */
  static riseY(v: number): number {
    return -2.3 * (1 - v);
  }
}
