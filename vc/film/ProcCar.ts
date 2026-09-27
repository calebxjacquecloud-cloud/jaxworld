/**
 * Everyday vehicles for the VC film: sedan, SUV, pickup, compact, van.
 *
 * The hero bubble-top (components/wash/Vehicle.ts) is the Carwash-O-Matic's
 * showpiece; these simpler, stylised cars show the *range* of shapes a fixed
 * tunnel has to treat identically, and populate the rental garage and the lot.
 *
 * Vehicle space matches the hero car: nose +Z, driver side +X, ground y = 0.
 */

import * as THREE from 'three';
import { roundedSlab } from '@/components/wash/Vehicle';

export type CarKind = 'sedan' | 'suv' | 'pickup' | 'compact' | 'van';

interface Spec {
  length: number;
  width: number;
  /** Top of the lower body. */
  beltY: number;
  /** Roof height. */
  roofY: number;
  /** Cabin start/end along z (fractions of length, 0 = rear, 1 = nose). */
  cabin: [number, number];
  wheelR: number;
  label: string;
}

export const CAR_SPECS: Record<CarKind, Spec> = {
  sedan: { length: 4.8, width: 1.84, beltY: 0.92, roofY: 1.44, cabin: [0.24, 0.66], wheelR: 0.33, label: 'Sedan' },
  suv: { length: 4.9, width: 1.95, beltY: 1.08, roofY: 1.78, cabin: [0.08, 0.7], wheelR: 0.38, label: 'SUV' },
  pickup: { length: 5.6, width: 2.0, beltY: 1.1, roofY: 1.9, cabin: [0.42, 0.72], wheelR: 0.4, label: 'Pickup' },
  compact: { length: 4.0, width: 1.78, beltY: 0.88, roofY: 1.52, cabin: [0.14, 0.7], wheelR: 0.31, label: 'Compact EV' },
  van: { length: 5.3, width: 2.0, beltY: 1.05, roofY: 2.2, cabin: [0.04, 0.84], wheelR: 0.36, label: 'Van' },
};

const geoCache = new Map<string, THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  let g = geoCache.get(key);
  if (!g) geoCache.set(key, (g = make()));
  return g;
}

const shared = {
  glass: new THREE.MeshPhysicalMaterial({ color: '#1d2a33', metalness: 0.2, roughness: 0.08, clearcoat: 1, envMapIntensity: 1.4 }),
  tire: new THREE.MeshStandardMaterial({ color: '#141517', roughness: 0.9 }),
  rim: new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.9, roughness: 0.25 }),
  trim: new THREE.MeshStandardMaterial({ color: '#1a1c1f', roughness: 0.6 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffe9c4', emissiveIntensity: 1.2 }),
  tail: new THREE.MeshStandardMaterial({ color: '#7a130c', emissive: '#ff2a1a', emissiveIntensity: 0.6 }),
};

export class ProcCar {
  readonly root = new THREE.Group();
  readonly spec: Spec;
  private wheels: THREE.Object3D[] = [];
  private paint: THREE.MeshPhysicalMaterial;

  constructor(readonly kind: CarKind, color: string) {
    const s = (this.spec = CAR_SPECS[kind]);
    this.paint = new THREE.MeshPhysicalMaterial({ color, metalness: 0.5, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.15 });
    const L = s.length;
    const W = s.width;
    const clear = s.wheelR * 0.55;
    const add = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(g, m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.root.add(mesh);
      return mesh;
    };

    // lower body
    const bodyH = s.beltY - clear;
    add(cached(`${kind}-body`, () => roundedSlab(W, L, bodyH, 0.34)), this.paint, 0, clear + bodyH / 2, 0);
    // cabin / greenhouse: a slightly narrower, tapered slab
    const c0 = -L / 2 + s.cabin[0] * L;
    const c1 = -L / 2 + s.cabin[1] * L;
    const cl = c1 - c0;
    const ch = s.roofY - s.beltY;
    const cabinGeo = cached(`${kind}-cabin`, () => {
      const g = roundedSlab(W * 0.9, cl, ch, 0.22);
      // taper the top toward the centre so windshields read as raked
      const p = g.getAttribute('position');
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i);
        if (y > 0) {
          p.setX(i, p.getX(i) * 0.9);
          p.setZ(i, p.getZ(i) * (kind === 'van' ? 0.97 : 0.8));
        }
      }
      g.computeVertexNormals();
      return g;
    });
    add(cabinGeo, shared.glass, 0, s.beltY + ch / 2, (c0 + c1) / 2);
    // roof skin in body colour
    add(cached(`${kind}-roof`, () => roundedSlab(W * 0.78, cl * (kind === 'van' ? 0.95 : 0.74), 0.05, 0.18)), this.paint, 0, s.roofY - 0.01, (c0 + c1) / 2);
    if (kind === 'pickup') {
      // open bed: dark floor with low side rails
      add(cached('bed', () => new THREE.BoxGeometry(W * 0.86, 0.04, L * 0.38)), shared.trim, 0, s.beltY - 0.02, -L / 2 + L * 0.2);
    }
    // lamps
    for (const sx of [-1, 1]) {
      add(cached('lamp', () => new THREE.BoxGeometry(0.34, 0.1, 0.04)), shared.lamp, sx * (W / 2 - 0.3), s.beltY - 0.18, L / 2 + 0.005);
      add(cached('tail', () => new THREE.BoxGeometry(0.3, 0.1, 0.04)), shared.tail, sx * (W / 2 - 0.28), s.beltY - 0.16, -L / 2 - 0.005);
    }
    // wheels
    const tireGeo = cached(`tire-${s.wheelR}`, () => new THREE.CylinderGeometry(s.wheelR, s.wheelR, 0.24, 28).rotateZ(Math.PI / 2));
    const rimGeo = cached(`rim-${s.wheelR}`, () => new THREE.CylinderGeometry(s.wheelR * 0.62, s.wheelR * 0.62, 0.25, 20).rotateZ(Math.PI / 2));
    const axle = L * 0.33;
    for (const z of [axle, -axle]) {
      for (const sx of [-1, 1]) {
        const w = new THREE.Group();
        w.position.set(sx * (W / 2 - 0.1), s.wheelR, z);
        const t = new THREE.Mesh(tireGeo, shared.tire);
        t.castShadow = true;
        w.add(t, new THREE.Mesh(rimGeo, shared.rim));
        this.root.add(w);
        this.wheels.push(w);
      }
    }
  }

  /** Place on the ground, heading +Z by default; wheel roll follows distance travelled. */
  place(x: number, z: number, yaw = 0, y = 0) {
    this.root.position.set(x, y, z);
    this.root.rotation.y = yaw;
    const roll = z / this.spec.wheelR;
    for (const w of this.wheels) w.rotation.x = roll;
  }

  /** Tilt nose up/down (for ramps), radians. */
  pitch(a: number) {
    this.root.rotation.x = -a;
  }

  get halfLength() {
    return this.spec.length / 2;
  }

  dispose() {
    this.paint.dispose();
  }
}
