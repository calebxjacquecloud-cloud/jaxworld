/**
 * The cleaning bay: technical floor, turntable, XY stage rails, the painted
 * guidance lane the car follows in, lighting, and a Googie pylon sign.
 *
 * PRODUCTION SWAP: /public/models/container.glb could replace this whole
 * environment with the container-based bay.
 */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ARRIVAL, GANTRY, SCENE_COLORS } from '@/lib/animationConfig';

const FLOOR = 34; // metres covered by the floor texture
const PX = 2048;

function drawFloor(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = PX;
  c.height = PX;
  const g = c.getContext('2d')!;
  const s = PX / FLOOR;
  const X = (x: number) => (x + FLOOR / 2) * s;
  const Z = (z: number) => (z + FLOOR / 2) * s;

  g.fillStyle = SCENE_COLORS.floor;
  g.fillRect(0, 0, PX, PX);
  // concrete mottling
  for (let i = 0; i < 9000; i++) {
    const a = Math.random() * 0.05;
    g.fillStyle = `rgba(${Math.random() > 0.5 ? '255,255,255' : '0,0,0'},${a})`;
    g.fillRect(Math.random() * PX, Math.random() * PX, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  // grid
  for (let m = -FLOOR / 2; m <= FLOOR / 2; m += 0.5) {
    const major = Math.abs(m % 2) < 1e-6;
    g.strokeStyle = major ? SCENE_COLORS.gridMajor : SCENE_COLORS.gridMinor;
    g.lineWidth = major ? 2 : 1;
    g.beginPath();
    g.moveTo(X(m), 0);
    g.lineTo(X(m), PX);
    g.moveTo(0, Z(m));
    g.lineTo(PX, Z(m));
    g.stroke();
  }
  // bay boundary
  g.strokeStyle = 'rgba(217, 98, 43, 0.85)';
  g.lineWidth = 5;
  g.setLineDash([26, 18]);
  const bx = GANTRY.outerRailX + 0.6;
  const bz = 5.9;
  g.beginPath();
  g.roundRect(X(-bx), Z(-bz), (bx * 2) * s, (bz * 2) * s, 1.4 * s);
  g.stroke();
  g.setLineDash([]);

  // guidance lane: straight run + right-hand turn into the bay
  g.strokeStyle = 'rgba(236, 229, 216, 0.22)';
  g.lineWidth = 0.08 * s;
  const R = ARRIVAL.turnRadius;
  const cx = ARRIVAL.endX - R;
  const cz = ARRIVAL.laneZ + R;
  for (const off of [-1.15, 1.15]) {
    g.beginPath();
    g.moveTo(X(-FLOOR / 2), Z(ARRIVAL.laneZ + off));
    g.lineTo(X(cx), Z(ARRIVAL.laneZ + off));
    g.arc(X(cx), Z(cz), (R - off) * s, -Math.PI / 2, 0, false);
    g.stroke();
  }
  // chevrons along the lane
  g.fillStyle = 'rgba(217, 98, 43, 0.55)';
  for (let x = -15; x < cx - 0.5; x += 2.2) {
    g.save();
    g.translate(X(x), Z(ARRIVAL.laneZ));
    g.beginPath();
    g.moveTo(-0.25 * s, -0.45 * s);
    g.lineTo(0.2 * s, 0);
    g.lineTo(-0.25 * s, 0.45 * s);
    g.lineTo(-0.05 * s, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  // bay number, 1950s service-station style
  g.save();
  g.translate(X(0), Z(5.25));
  g.fillStyle = 'rgba(236, 229, 216, 0.5)';
  g.font = `italic 700 ${0.62 * s}px "Unbounded", "Arial Black", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('BAY 01', 0, 0);
  g.restore();
  // stage labels
  g.fillStyle = 'rgba(63, 224, 232, 0.55)';
  g.font = `500 ${0.13 * s}px "IBM Plex Mono", monospace`;
  g.fillText('XY STAGE A · +X', X(GANTRY.innerRailX + 0.2), Z(GANTRY.zMax + 0.9));
  g.fillText('XY STAGE B · −X', X(-GANTRY.outerRailX + 0.2), Z(GANTRY.zMax + 0.9));
  return c;
}

function drawTurntable(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d')!;
  const m = 512;
  g.clearRect(0, 0, 1024, 1024);
  g.strokeStyle = 'rgba(201, 205, 210, 0.2)';
  g.lineWidth = 6;
  g.beginPath();
  g.arc(m, m, 500, 0, Math.PI * 2);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.arc(m, m, 470, 0, Math.PI * 2);
  g.stroke();
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const long = i % 6 === 0;
    g.strokeStyle = long ? 'rgba(217, 98, 43, 0.55)' : 'rgba(201, 205, 210, 0.16)';
    g.lineWidth = long ? 5 : 2;
    g.beginPath();
    g.moveTo(m + Math.cos(a) * 470, m + Math.sin(a) * 470);
    g.lineTo(m + Math.cos(a) * (long ? 430 : 452), m + Math.sin(a) * (long ? 430 : 452));
    g.stroke();
  }
  return c;
}

export class Bay {
  readonly group = new THREE.Group();
  readonly turntable: THREE.Mesh;
  readonly key: THREE.DirectionalLight;
  private rim: THREE.DirectionalLight;
  private envRT: THREE.WebGLRenderTarget;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, shadows: boolean, materials: { chrome: THREE.Material; accent: THREE.Material; paint: THREE.Material; rail: THREE.Material }) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = this.envRT.texture;
    scene.environmentIntensity = 0.6;
    pmrem.dispose();

    scene.background = new THREE.Color(SCENE_COLORS.background);
    scene.fog = new THREE.Fog(SCENE_COLORS.background, 26, 52);

    const tex = new THREE.CanvasTexture(drawFloor());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(FLOOR, FLOOR).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0.05 }),
    );
    floor.receiveShadow = true;
    this.group.add(floor);
    // extend the ground into the fog
    const apron = new THREE.Mesh(
      new THREE.RingGeometry(FLOOR / 2 - 0.01, 70, 64).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: SCENE_COLORS.floor, roughness: 0.9 }),
    );
    apron.position.y = -0.002;
    this.group.add(apron);

    const ttTex = new THREE.CanvasTexture(drawTurntable());
    ttTex.colorSpace = THREE.SRGBColorSpace;
    this.turntable = new THREE.Mesh(
      new THREE.CircleGeometry(3.05, 96).rotateX(-Math.PI / 2),
      new THREE.MeshStandardMaterial({ map: ttTex, transparent: true, roughness: 0.6, metalness: 0.3, depthWrite: false }),
    );
    this.turntable.position.y = 0.006;
    this.turntable.receiveShadow = true;
    this.group.add(this.turntable);

    // Z rails of both XY stages (flush floor tracks)
    const railLen = GANTRY.zMax - GANTRY.zMin + 1.4;
    const railGeo = new THREE.BoxGeometry(0.1, 0.04, railLen);
    for (const side of [-1, 1]) {
      for (const x of [GANTRY.innerRailX, GANTRY.outerRailX]) {
        const rail = new THREE.Mesh(railGeo, materials.rail);
        rail.position.set(side * x, 0.02, 0);
        rail.receiveShadow = true;
        this.group.add(rail);
        for (const z of [GANTRY.zMin - 0.7, GANTRY.zMax + 0.7]) {
          const stop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.1), materials.accent);
          stop.position.set(side * x, 0.05, z);
          this.group.add(stop);
        }
      }
    }


    // Lights
    this.group.add(new THREE.HemisphereLight('#d9e2ea', '#1a1510', 0.55));
    this.key = new THREE.DirectionalLight('#ffe4c8', 2.3);
    this.key.position.set(7, 13, 9);
    this.key.target.position.set(0, 0, 0);
    this.group.add(this.key, this.key.target);
    if (shadows) {
      this.key.castShadow = true;
      this.key.shadow.mapSize.set(2048, 2048);
      const sc = this.key.shadow.camera;
      sc.left = -9;
      sc.right = 9;
      sc.top = 9;
      sc.bottom = -9;
      sc.near = 1;
      sc.far = 40;
      this.key.shadow.bias = -0.0004;
      this.key.shadow.normalBias = 0.02;
    }
    this.rim = new THREE.DirectionalLight('#9fdcff', 1.1);
    this.rim.position.set(-9, 6, -7);
    this.group.add(this.rim);
    const fill = new THREE.PointLight('#ffb27a', 6, 14, 1.6);
    fill.position.set(-3, 3, 5);
    this.group.add(fill);
  }

  /** Warmer, brighter key light for the final beauty shot. */
  setGlam(v: number) {
    this.key.intensity = 2.3 + 0.9 * v;
    this.rim.intensity = 1.1 + 1.2 * v;
  }

  dispose() {
    this.envRT.dispose();
  }
}
