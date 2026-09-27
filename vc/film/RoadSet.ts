/**
 * Set 0 of the VC film: the Jax World garage, the road, the old fixed tunnel
 * and the technical floor the Carwash-O-Matic rises from.
 *
 * World layout: the road runs along +Z from the garage (z = GARAGE_Z) to the
 * bay at the origin, so the machine's pylons (which aim at the origin) work
 * unchanged. The tunnel straddles the origin until it lifts away.
 */

import * as THREE from 'three';
import { SCENE_COLORS } from '@/lib/animationConfig';
import jacque from '@/assets/jacque-sticker.png';
import { GARAGE_Z } from './sequence';

const mascotSrc: string = typeof jacque === 'string' ? jacque : (jacque as { src: string }).src;

const INK = '#23201A';
const PAPER = '#EDE3CE';
const DOOR_W = 4.8;
const DOOR_H = 2.7;
const G_W = 7.4;
const G_D = 7.8;
const G_H = 3.7;
const ROAD_HALF = 2.4;
const ROAD_Z0 = GARAGE_Z - 0.2;
const ROAD_Z1 = 48;

function canvasTex(c: HTMLCanvasElement, aniso = 8) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}

function starburst(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = color;
  g.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const long = i % 2 === 0;
    g.lineWidth = r * (long ? 0.14 : 0.1);
    g.beginPath();
    g.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
    g.lineTo(Math.cos(a) * r * (long ? 1 : 0.62), Math.sin(a) * r * (long ? 1 : 0.62));
    g.stroke();
  }
  g.restore();
}

/** Garage door: enamel sectional door, Jacque and the Carwash-O-Matic script. The headline itself is HTML. */
function drawDoor(c: HTMLCanvasElement, mascot: HTMLImageElement | null) {
  const g = c.getContext('2d')!;
  const { width: w, height: h } = c;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) {
    g.fillStyle = `rgba(35,32,26,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    g.fillStyle = 'rgba(35,32,26,0.26)';
    g.fillRect(0, y - 2, w, 4);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, y + 2, w, 2);
  }
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.strokeRect(5, 5, w - 10, h - 10);
  if (mascot && mascot.width) {
    const mh = h * 0.78;
    const mw = (mascot.width / mascot.height) * mh;
    g.drawImage(mascot, w * 0.05, (h - mh) / 2, mw, mh);
  }
  g.save();
  g.translate(w * 0.7, h * 0.52);
  g.rotate(-0.06);
  g.fillStyle = '#B5502F';
  g.font = `${h * 0.135}px "Yellowtail", "Brush Script MT", cursive`;
  g.textAlign = 'center';
  g.fillText('Carwash-O-Matic', 0, 0);
  g.restore();
  g.fillStyle = INK;
  g.textAlign = 'center';
  g.font = `500 ${h * 0.038}px "IBM Plex Mono", monospace`;
  g.fillText('BAY 01  ·  EST. JAX WORLD', w * 0.7, h * 0.66);
}

function drawSign(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!;
  const { width: w, height: h } = c;
  g.fillStyle = INK;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = PAPER;
  g.lineWidth = 6;
  g.strokeRect(10, 10, w - 20, h - 20);
  g.textBaseline = 'middle';
  const big = `800 ${h * 0.42}px "Unbounded", "Arial Black", sans-serif`;
  const small = `400 ${h * 0.2}px "Unbounded", "Arial Black", sans-serif`;
  g.font = big;
  const jw = g.measureText('JAX ').width;
  g.font = small;
  const ww = g.measureText('W O R L D').width;
  const burst = h * 0.75;
  const x0 = (w - (burst + jw + ww)) / 2;
  starburst(g, x0 + burst * 0.4, h / 2, h * 0.3, '#f08a4b');
  g.fillStyle = PAPER;
  g.font = big;
  g.fillText('JAX', x0 + burst, h * 0.52);
  g.font = small;
  g.fillText('W O R L D', x0 + burst + jw, h * 0.54);
}

/** Technical bay floor that fades in with the machine. */
function drawBayFloor(): HTMLCanvasElement {
  const PX = 1024;
  const SIZE = 26;
  const c = document.createElement('canvas');
  c.width = c.height = PX;
  const g = c.getContext('2d')!;
  const s = PX / SIZE;
  const X = (v: number) => (v + SIZE / 2) * s;
  g.fillStyle = SCENE_COLORS.floor;
  g.fillRect(0, 0, PX, PX);
  for (let m = -SIZE / 2; m <= SIZE / 2; m += 0.5) {
    const major = Math.abs(m % 2) < 1e-6;
    g.strokeStyle = major ? SCENE_COLORS.gridMajor : SCENE_COLORS.gridMinor;
    g.lineWidth = major ? 2 : 1;
    g.beginPath();
    g.moveTo(X(m), 0);
    g.lineTo(X(m), PX);
    g.moveTo(0, X(m));
    g.lineTo(PX, X(m));
    g.stroke();
  }
  g.strokeStyle = 'rgba(217, 98, 43, 0.8)';
  g.lineWidth = 4;
  g.setLineDash([22, 16]);
  g.beginPath();
  g.roundRect(X(-10.2), X(-5.9), 20.4 * s, 11.8 * s, 1.2 * s);
  g.stroke();
  g.setLineDash([]);
  // soft edge so the floor melts into the ground
  const grad = g.createRadialGradient(PX / 2, PX / 2, PX * 0.3, PX / 2, PX / 2, PX * 0.5);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(18,20,23,1)');
  g.fillStyle = grad;
  g.fillRect(0, 0, PX, PX);
  return c;
}

function roadTexture(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#26292e';
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    g.fillRect(Math.random() * 256, Math.random() * 512, 2, 2);
  }
  g.fillStyle = 'rgba(236,229,216,0.5)';
  g.fillRect(14, 0, 5, 512);
  g.fillRect(237, 0, 5, 512);
  g.fillStyle = 'rgba(240,138,75,0.55)';
  g.fillRect(126, 0, 4, 220);
  return c;
}

/** Striped "cloth mop" texture for the old tunnel's rotating brushes. */
function brushTexture(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 64;
  const g = c.getContext('2d')!;
  for (let x = 0; x < 256; x += 8) {
    g.fillStyle = (x / 8) % 2 ? '#3d6f9e' : '#2b527a';
    g.fillRect(x, 0, 8, 64);
  }
  return c;
}

export class RoadSet {
  readonly group = new THREE.Group();
  readonly tunnel = new THREE.Group();
  private door = new THREE.Group();
  private doorCanvas: HTMLCanvasElement;
  private doorTex: THREE.CanvasTexture;
  private signCanvas: HTMLCanvasElement;
  private signTex: THREE.CanvasTexture;
  private mascot: HTMLImageElement | null = null;
  private brushes: THREE.Mesh[] = [];
  private topBrush: THREE.Mesh;
  private profileMat: THREE.LineDashedMaterial;
  private tunnelMats: THREE.Material[] = [];
  private bayFloorMat: THREE.MeshStandardMaterial;
  private sensor: THREE.Group;
  private sensorMat: THREE.MeshBasicMaterial;
  private conveyorTex: THREE.CanvasTexture;
  private disposables: { dispose(): void }[] = [];

  constructor(private onRepaint: () => void) {
    const track = <T extends { dispose(): void }>(x: T) => (this.disposables.push(x), x);

    // ── ground + road ──
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2),
      track(new THREE.MeshStandardMaterial({ color: '#16181b', roughness: 0.95 })),
    );
    ground.position.set(0, -0.01, -20);
    ground.receiveShadow = true;
    this.group.add(ground);

    const rt = track(canvasTex(roadTexture()));
    rt.wrapT = THREE.RepeatWrapping;
    rt.repeat.set(1, (ROAD_Z1 - ROAD_Z0) / 9);
    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_HALF * 2, ROAD_Z1 - ROAD_Z0).rotateX(-Math.PI / 2),
      track(new THREE.MeshStandardMaterial({ map: rt, roughness: 0.92 })),
    );
    road.position.set(0, 0.002, (ROAD_Z0 + ROAD_Z1) / 2);
    road.receiveShadow = true;
    this.group.add(road);

    // lamp posts along the road (emissive heads, no extra lights)
    const post = track(new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: 0.6, metalness: 0.4 }));
    const glow = track(new THREE.MeshStandardMaterial({ color: '#fff2da', emissive: '#ffd9a0', emissiveIntensity: 1.6 }));
    const poleGeo = track(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8));
    const headGeo = track(new THREE.BoxGeometry(0.9, 0.12, 0.32));
    for (let z = GARAGE_Z + 8; z < -12; z += 11) {
      // posts on the far (−X) side only: the camera trails on the +X side
      const p = new THREE.Mesh(poleGeo, post);
      p.position.set(-(ROAD_HALF + 1.1), 2.1, z);
      p.castShadow = true;
      const hd = new THREE.Mesh(headGeo, glow);
      hd.position.set(-(ROAD_HALF + 0.75), 4.2, z);
      this.group.add(p, hd);
    }

    // ── garage ──
    this.doorCanvas = document.createElement('canvas');
    this.doorCanvas.width = 1600;
    this.doorCanvas.height = 900;
    drawDoor(this.doorCanvas, null);
    this.doorTex = track(canvasTex(this.doorCanvas));
    this.signCanvas = document.createElement('canvas');
    this.signCanvas.width = 1024;
    this.signCanvas.height = 200;
    drawSign(this.signCanvas);
    this.signTex = track(canvasTex(this.signCanvas));
    this.buildGarage(track);

    // ── old tunnel ──
    this.profileMat = track(new THREE.LineDashedMaterial({ color: SCENE_COLORS.paint, dashSize: 0.22, gapSize: 0.14, transparent: true, opacity: 0 }));
    this.topBrush = this.buildTunnel(track);
    this.group.add(this.tunnel);

    // conveyor strip under the driver-side wheels, with moving rollers
    const cc = document.createElement('canvas');
    cc.width = 32;
    cc.height = 64;
    const cg = cc.getContext('2d')!;
    cg.fillStyle = '#1b1d20';
    cg.fillRect(0, 0, 32, 64);
    cg.fillStyle = '#5d636a';
    cg.fillRect(0, 0, 32, 10);
    this.conveyorTex = track(canvasTex(cc));
    this.conveyorTex.wrapT = THREE.RepeatWrapping;
    this.conveyorTex.repeat.set(1, 60);
    const conveyor = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 20).rotateX(-Math.PI / 2),
      track(new THREE.MeshStandardMaterial({ map: this.conveyorTex, roughness: 0.6, metalness: 0.5 })),
    );
    conveyor.position.set(0.8, 0.012, -1.5);
    this.tunnel.add(conveyor);

    // ── technical floor for the machine ──
    this.bayFloorMat = track(new THREE.MeshStandardMaterial({ map: track(canvasTex(drawBayFloor())), transparent: true, opacity: 0, roughness: 0.8, depthWrite: false }));
    const bf = new THREE.Mesh(new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2), this.bayFloorMat);
    bf.position.y = 0.006;
    bf.receiveShadow = true;
    this.group.add(bf);

    // ── sensor field around the hero car ("more sensor-heavy") ──
    this.sensor = new THREE.Group();
    this.sensorMat = track(new THREE.MeshBasicMaterial({ color: SCENE_COLORS.cyan, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    const cone = track(new THREE.ConeGeometry(1.4, 4.2, 28, 1, true).translate(0, -2.1, 0));
    for (const [x, y, z, rx, ry] of [
      [0, 0.6, 2.8, -Math.PI / 2, 0],
      [0, 0.7, -2.9, Math.PI / 2, 0],
      [1.0, 0.8, 1.6, -Math.PI / 2, Math.PI / 2.4],
      [-1.0, 0.8, 1.6, -Math.PI / 2, -Math.PI / 2.4],
      [1.0, 0.8, -1.8, -Math.PI / 2, Math.PI / 1.6],
      [-1.0, 0.8, -1.8, -Math.PI / 2, -Math.PI / 1.6],
    ] as [number, number, number, number, number][]) {
      const holder = new THREE.Group();
      holder.position.set(x, y, z);
      holder.rotation.y = ry;
      const m = new THREE.Mesh(cone, this.sensorMat);
      m.rotation.x = rx;
      holder.add(m);
      this.sensor.add(holder);
    }
    const ring = new THREE.Mesh(track(new THREE.RingGeometry(3.2, 3.26, 64).rotateX(-Math.PI / 2)), this.sensorMat);
    ring.position.y = 0.03;
    this.sensor.add(ring);

    // Jacque + brand fonts arrive late: repaint the door and sign
    const img = new Image();
    img.decoding = 'async';
    img.src = mascotSrc;
    const fonts =
      typeof document !== 'undefined' && document.fonts
        ? Promise.all([document.fonts.load('800 60px "Unbounded"'), document.fonts.load('60px "Yellowtail"'), document.fonts.load('500 20px "IBM Plex Mono"')]).catch(() => [])
        : Promise.resolve([]);
    img
      .decode()
      .then(() => (this.mascot = img))
      .catch(() => {})
      .finally(() =>
        fonts.then(() => {
          drawDoor(this.doorCanvas, this.mascot);
          this.doorTex.needsUpdate = true;
          drawSign(this.signCanvas);
          this.signTex.needsUpdate = true;
          this.onRepaint();
        }),
      );
  }

  /** The sensor field, to be parented to the hero car. */
  get sensorField() {
    return this.sensor;
  }

  private buildGarage(track: <T extends { dispose(): void }>(x: T) => T) {
    const g = new THREE.Group();
    g.position.set(0, 0, GARAGE_Z);
    // building extends toward −Z; door faces +Z (down the road)
    g.rotation.y = Math.PI;
    this.group.add(g);
    const wall = track(new THREE.MeshStandardMaterial({ color: '#d9c9a8', roughness: 0.85 }));
    const trim = track(new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 }));
    const inside = track(new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.9, side: THREE.BackSide }));
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(track(new THREE.BoxGeometry(w, h, d)), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
    };
    const pier = (G_W - DOOR_W) / 2;
    box(pier, G_H, 0.3, wall, -(DOOR_W / 2 + pier / 2), G_H / 2, 0.15);
    box(pier, G_H, 0.3, wall, DOOR_W / 2 + pier / 2, G_H / 2, 0.15);
    box(DOOR_W, G_H - DOOR_H, 0.3, wall, 0, DOOR_H + (G_H - DOOR_H) / 2, 0.15);
    box(0.3, G_H, G_D, wall, -G_W / 2 + 0.15, G_H / 2, G_D / 2);
    box(0.3, G_H, G_D, wall, G_W / 2 - 0.15, G_H / 2, G_D / 2);
    box(G_W, G_H, 0.3, wall, 0, G_H / 2, G_D - 0.15);
    box(G_W + 0.4, 0.28, G_D + 0.4, trim, 0, G_H + 0.14, G_D / 2);
    const shell = new THREE.Mesh(track(new THREE.BoxGeometry(G_W - 0.9, G_H - 0.25, G_D - 0.9)), inside);
    shell.position.set(0, G_H / 2, G_D / 2);
    g.add(shell);
    box(DOOR_W + 0.3, 0.14, 0.34, trim, 0, DOOR_H + 0.07, 0.15);
    box(0.14, DOOR_H, 0.34, trim, -DOOR_W / 2 - 0.07, DOOR_H / 2, 0.15);
    box(0.14, DOOR_H, 0.34, trim, DOOR_W / 2 + 0.07, DOOR_H / 2, 0.15);
    const lamp = new THREE.PointLight('#ffcf99', 5, 10, 1.6);
    lamp.position.set(0, G_H - 0.5, G_D / 2);
    g.add(lamp);

    const signMat = track(new THREE.MeshStandardMaterial({ map: this.signTex, emissiveMap: this.signTex, emissive: '#ffffff', emissiveIntensity: 0.5 }));
    const sign = new THREE.Mesh(track(new THREE.PlaneGeometry(4.2, 0.82)), signMat);
    sign.rotation.y = Math.PI;
    sign.position.set(0, DOOR_H + (G_H - DOOR_H) / 2 + 0.05, -0.02);
    g.add(sign);

    const face = track(new THREE.MeshStandardMaterial({ map: this.doorTex, emissiveMap: this.doorTex, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.7 }));
    const back = track(new THREE.MeshStandardMaterial({ color: '#8f8574', roughness: 0.8 }));
    const panel = new THREE.Mesh(track(new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.06)), [back, back, back, back, back, face]);
    panel.position.set(0, -DOOR_H / 2, 0);
    panel.castShadow = true;
    this.door.add(panel);
    this.door.position.set(0, DOOR_H, -0.03);
    g.add(this.door);
  }

  private buildTunnel(track: <T extends { dispose(): void }>(x: T) => T): THREE.Mesh {
    const steel = track(new THREE.MeshStandardMaterial({ color: '#7d858e', metalness: 0.6, roughness: 0.45, transparent: true }));
    const panel = track(new THREE.MeshStandardMaterial({ color: '#4a5058', metalness: 0.3, roughness: 0.6, transparent: true }));
    const brushMat = track(new THREE.MeshStandardMaterial({ map: track(canvasTex(brushTexture())), roughness: 0.95, transparent: true }));
    const pipe = track(new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.9, roughness: 0.3, transparent: true }));
    this.tunnelMats.push(steel, panel, brushMat, pipe);
    const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(track(geo), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      this.tunnel.add(mesh);
      return mesh;
    };
    const HW = 2.8;
    const H = 3.5;
    for (const z of [-5.2, -1.8, 1.8, 5.2]) {
      add(new THREE.BoxGeometry(0.28, H, 0.28), steel, HW, H / 2, z);
      add(new THREE.BoxGeometry(0.28, H, 0.28), steel, -HW, H / 2, z);
      add(new THREE.BoxGeometry(HW * 2 + 0.28, 0.32, 0.32), steel, 0, H, z);
    }
    // roof panels and long beams
    add(new THREE.BoxGeometry(HW * 2 + 0.3, 0.06, 10.8), panel, 0, H + 0.2, 0);
    for (const x of [-HW, HW]) add(new THREE.BoxGeometry(0.2, 0.2, 10.8), steel, x, H - 0.05, 0);
    // side "curtains" (half-height panels) so it reads as a tunnel
    for (const x of [-HW - 0.05, HW + 0.05]) add(new THREE.BoxGeometry(0.05, 1.1, 10.4), panel, x, H - 0.75, 0);
    // spray arch at the entrance
    const arch: THREE.Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      arch.push(new THREE.Vector3(Math.cos(a) * 2.1, 0.2 + Math.sin(a) * 2.6, -4.2));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch), 48, 0.05, 8), pipe, 0, 0, 0);
    // vertical side brushes and a top brush
    const bGeo = new THREE.CylinderGeometry(0.5, 0.5, 2.1, 24);
    for (const x of [-1.75, 1.75]) this.brushes.push(add(bGeo.clone(), brushMat, x, 1.12, -1.0));
    const top = add(new THREE.CylinderGeometry(0.42, 0.42, 3.4, 24).rotateZ(Math.PI / 2), brushMat, 0, 2.75, 2.4);
    for (const x of [-1.75, 1.75]) add(new THREE.BoxGeometry(0.12, 0.12, 0.9), steel, x, 2.25, -1.0);

    // the fixed wash program: one profile for every vehicle
    const pts: THREE.Vector3[] = [];
    const w = 1.45;
    const h = 1.85;
    const r = 0.55;
    pts.push(new THREE.Vector3(-w, 0.05, 0), new THREE.Vector3(-w, h - r, 0));
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI - (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector3(-w + r + Math.cos(a) * r, h - r + Math.sin(a) * r, 0));
    }
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI / 2 - (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector3(w - r + Math.cos(a) * r, h - r + Math.sin(a) * r, 0));
    }
    pts.push(new THREE.Vector3(w, 0.05, 0));
    for (const z of [-5.6, 5.6]) {
      const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints(pts)), this.profileMat);
      line.computeLineDistances();
      line.position.z = z;
      this.tunnel.add(line);
    }
    return top;
  }

  update(s: Record<string, number>, time: number, visible: boolean) {
    this.group.visible = visible;
    if (!visible) return;
    this.door.rotation.x = s.door * 1.5;
    const up = s.tunnelUp;
    this.tunnel.visible = up < 0.999;
    this.tunnel.position.y = up * up * 16;
    const fade = 1 - Math.max(0, (up - 0.35) / 0.65);
    for (const m of this.tunnelMats) {
      m.opacity = fade;
      m.depthWrite = fade > 0.99;
    }
    const spin = time * 2.8 * s.brushes;
    for (const b of this.brushes) b.rotation.y = spin;
    this.topBrush.rotation.x = spin;
    this.conveyorTex.offset.y = -time * 0.9 * s.brushes;
    this.profileMat.opacity = s.profile * 0.95;
    this.bayFloorMat.opacity = s.bayFloor;
    this.sensorMat.opacity = s.sensors * (0.16 + 0.05 * Math.sin(time * 4));
    this.sensor.visible = s.sensors > 0.01;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
