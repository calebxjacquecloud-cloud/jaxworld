/**
 * Fixed camera pylons around the bay. They sit on the floor, away from the
 * spray, and rise for the pre-wash and post-wash scans. Pylon count comes from
 * CAMERA_ARRAY.count; positions are spread across front and rear arcs so the
 * side XY stages stay clear.
 *
 * PRODUCTION SWAP: /public/models/camera.glb can replace the pylon head.
 */

import * as THREE from 'three';
import { CAMERA_ARRAY, SCENE_COLORS, VEHICLE } from '@/lib/animationConfig';

export function pylonPositions(count = CAMERA_ARRAY.count): THREE.Vector2[] {
  const out: THREE.Vector2[] = [];
  const perArc = [Math.ceil(count / 2), Math.floor(count / 2)];
  const half = THREE.MathUtils.degToRad(CAMERA_ARRAY.arcHalfAngle);
  perArc.forEach((n, arc) => {
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1);
      const a = -half + u * half * 2 + (arc === 1 ? Math.PI : 0);
      out.push(new THREE.Vector2(Math.sin(a) * CAMERA_ARRAY.radiusX, Math.cos(a) * CAMERA_ARRAY.radiusZ));
    }
  });
  return out;
}

const corners = (() => {
  const L = VEHICLE.length / 2;
  const W = VEHICLE.width / 2;
  return [
    new THREE.Vector3(W, 1.2, L),
    new THREE.Vector3(-W, 1.2, L),
    new THREE.Vector3(W, 0.4, -L),
    new THREE.Vector3(-W, 0.4, -L),
    new THREE.Vector3(0, 1.45, 0),
  ];
})();

const tmp = new THREE.Vector3();
const tmpH = new THREE.Vector3();

export class CameraArray {
  readonly group = new THREE.Group();
  /** One group per pylon (base, mast, head), origin on the floor at the pylon, so it can be packed as a unit. */
  readonly units: THREE.Group[] = [];
  private pylons: { unit: THREE.Group; mast: THREE.Mesh; head: THREE.Group; lens: THREE.MeshStandardMaterial; pos: THREE.Vector2 }[] = [];
  /** Pylons being packed stop aiming at the bay. */
  private free: boolean[] = [];
  private beams: THREE.LineSegments;
  private beamMat = new THREE.LineBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });

  constructor(materials: { paint: THREE.Material; chrome: THREE.Material; joint: THREE.Material; accent: THREE.Material }) {
    const mastGeo = new THREE.CylinderGeometry(0.05, 0.07, 1, 12).translate(0, 0.5, 0);
    const baseGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.04, 32);
    const podGeo = new THREE.CapsuleGeometry(0.13, 0.32, 6, 16).rotateX(Math.PI / 2);
    const lensGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.06, 24).rotateX(Math.PI / 2);
    const collarGeo = new THREE.TorusGeometry(0.1, 0.018, 8, 24);
    const finGeo = new THREE.BoxGeometry(0.02, 0.2, 0.26);

    for (const p of pylonPositions()) {
      const unit = new THREE.Group();
      unit.position.set(p.x, 0, p.y);
      this.group.add(unit);
      const base = new THREE.Mesh(baseGeo, materials.joint);
      base.position.set(0, 0.025, 0);
      base.receiveShadow = true;
      unit.add(base);
      const mast = new THREE.Mesh(mastGeo, materials.chrome);
      mast.position.set(0, 0.04, 0);
      mast.castShadow = true;
      unit.add(mast);

      const head = new THREE.Group();
      head.position.set(0, 0.2, 0);
      const pod = new THREE.Mesh(podGeo, materials.paint);
      pod.castShadow = true;
      head.add(pod);
      const lensMat = new THREE.MeshStandardMaterial({ color: '#0b1a1c', emissive: SCENE_COLORS.cyan, emissiveIntensity: 0, metalness: 0.5, roughness: 0.2 });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.z = 0.3;
      head.add(lens);
      const collar = new THREE.Mesh(collarGeo, materials.accent);
      collar.position.z = 0.28;
      head.add(collar);
      const fin = new THREE.Mesh(finGeo, materials.chrome);
      fin.position.set(0, 0.17, -0.12);
      head.add(fin);
      unit.add(head);
      this.units.push(unit);
      this.free.push(false);
      this.pylons.push({ unit, mast, head, lens: lensMat, pos: p });
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pylons.length * corners.length * 6), 3));
    this.beams = new THREE.LineSegments(g, this.beamMat);
    this.beams.frustumCulled = false;
    this.group.add(this.beams);
  }

  /** World position of pylon i's camera head. */
  headPosition(i: number, out: THREE.Vector3): THREE.Vector3 {
    return this.pylons[i].head.getWorldPosition(out);
  }

  /** Mark pylon i as being packed (it stops aiming at the bay and faces along its unit). */
  setFree(i: number, free: boolean) {
    this.free[i] = free;
  }

  get count() {
    return this.pylons.length;
  }

  update(rise: number, active: number, beams: number, vehicleRoot: THREE.Object3D, time: number) {
    const h = CAMERA_ARRAY.mastHeight * rise;
    const n = this.pylons.length;
    const pos = this.beams.geometry.getAttribute('position') as THREE.BufferAttribute;
    let k = 0;
    this.pylons.forEach((p, i) => {
      p.mast.scale.y = Math.max(0.001, h);
      p.mast.visible = rise > 0.01;
      // Heads sit in floor pockets until the pylons rise.
      p.head.visible = rise > 0.01;
      p.head.position.y = -0.25 + Math.min(1, rise * 6) * 0.45 + h;
      if (this.free[i]) p.head.rotation.set(0, 0, 0);
      else {
        p.unit.updateMatrixWorld();
        p.head.lookAt(0, 0.6, 0);
      }
      // staggered power-up around the ring
      const stagger = THREE.MathUtils.clamp(active * (n + 2) - i, 0, 1);
      p.lens.emissiveIntensity = stagger * (1.6 + 0.5 * Math.sin(time * 5 + i));
      p.head.getWorldPosition(tmpH);
      for (const c of corners) {
        pos.setXYZ(k++, tmpH.x, tmpH.y, tmpH.z);
        tmp.copy(c).applyMatrix4(vehicleRoot.matrixWorld);
        pos.setXYZ(k++, tmp.x, tmp.y, tmp.z);
      }
    });
    pos.needsUpdate = true;
    this.beamMat.opacity = beams * 0.28;
    this.beams.visible = beams > 0.01;
  }
}
