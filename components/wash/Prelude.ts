/**
 * Prelude set: the Jax World garage (with Jacque and the teaser printed on
 * its door) and the streets the car drives before it reaches the bay.
 *
 * Streets are simple ribbons on a grid ground: asphalt, dashed edge lines and
 * a cross street at every corner, so each turn reads as an intersection. The
 * last street runs straight into the arrival lane painted on the bay floor.
 */

import * as THREE from 'three';
import { CORNERS, GARAGE, routePoints } from '@/lib/roadPath';
import { SCENE_COLORS } from '@/lib/animationConfig';
import jacque from '@/assets/jacque-sticker.png';

const ROAD_W = 4.6;
const LINE_OFF = 1.85;
const STUB = 16;
const DOOR_W = 4.8;
const DOOR_H = 2.7;
const G_W = 7.4;
const G_D = 7.8;
const G_H = 3.7;
const INK = '#23201A';
const PAPER = '#EDE3CE';
const RUST = '#B5502F';
const DENIM = '#3E5266';

const mascotSrc: string = typeof jacque === 'string' ? jacque : (jacque as { src: string }).src;

type P2 = { x: number; z: number };

/** Flat ribbon along a polyline (y = height), width w. */
function ribbon(pts: P2[], w: number, y: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    const nx = -dz / l;
    const nz = dx / l;
    const p = pts[i];
    pos.push(p.x + (nx * w) / 2, y, p.z + (nz * w) / 2, p.x - (nx * w) / 2, y, p.z - (nz * w) / 2);
    if (i > 0) {
      const k = i * 2;
      idx.push(k - 2, k - 1, k, k - 1, k + 1, k);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Dashed line marks offset sideways from a polyline. */
function dashes(pts: P2[], offset: number, dash: number, gap: number, w: number, y: number): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  // resample the polyline by distance, offset each point sideways
  const off: P2[] = [];
  const dist: number[] = [];
  let d = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1;
    off.push({ x: pts[i].x + (-dz / l) * offset, z: pts[i].z + (dx / l) * offset });
    if (i > 0) d += Math.hypot(off[i].x - off[i - 1].x, off[i].z - off[i - 1].z);
    dist.push(d);
  }
  const at = (s: number): P2 => {
    let i = 1;
    while (i < dist.length - 1 && dist[i] < s) i++;
    const f = (s - dist[i - 1]) / Math.max(1e-6, dist[i] - dist[i - 1]);
    return { x: off[i - 1].x + (off[i].x - off[i - 1].x) * f, z: off[i - 1].z + (off[i].z - off[i - 1].z) * f };
  };
  for (let s = 0; s + dash <= d; s += dash + gap) {
    const seg: P2[] = [];
    for (let t = 0; t <= 4; t++) seg.push(at(s + (dash * t) / 4));
    out.push(ribbon(seg, w, y));
  }
  return out;
}

function gridTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = SCENE_COLORS.floor;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i <= 8; i++) {
    const major = i % 4 === 0;
    g.strokeStyle = major ? SCENE_COLORS.gridMajor : SCENE_COLORS.gridMinor;
    g.lineWidth = major ? 3 : 1.5;
    const p = (i / 8) * 512;
    g.beginPath();
    g.moveTo(p, 0);
    g.lineTo(p, 512);
    g.moveTo(0, p);
    g.lineTo(512, p);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Set `font` at the largest size ≤ `size` whose text fits in `maxW`. */
function fit(g: CanvasRenderingContext2D, text: string, maxW: number, size: number, font: (px: number) => string) {
  let px = size;
  g.font = font(px);
  while (px > 8 && g.measureText(text).width > maxW) {
    px *= 0.94;
    g.font = font(px);
  }
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

/** The garage door: aged-paper sectional door with Jacque and the teaser. */
function drawDoor(c: HTMLCanvasElement, mascot: HTMLImageElement | null) {
  const g = c.getContext('2d')!;
  const w = c.width;
  const h = c.height;
  g.fillStyle = PAPER;
  g.fillRect(0, 0, w, h);
  // aged speckle
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(35,32,26,${Math.random() * 0.05})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  // four door sections
  for (let i = 1; i < 4; i++) {
    const y = (h / 4) * i;
    g.fillStyle = 'rgba(35,32,26,0.28)';
    g.fillRect(0, y - 2, w, 4);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(0, y + 2, w, 2);
  }
  // frame
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.strokeRect(5, 5, w - 10, h - 10);

  // Jacque, on the left
  if (mascot && mascot.width) {
    const mh = h * 0.9;
    const mw = (mascot.width / mascot.height) * mh;
    g.drawImage(mascot, w * 0.04, h * 0.05, mw, mh);
  }

  // teaser, on the right
  const x = w * 0.43;
  const col = w * 0.53;
  const display = (px: number) => `800 ${px}px "Unbounded", "Arial Black", sans-serif`;
  g.textBaseline = 'alphabetic';
  g.fillStyle = RUST;
  fit(g, 'JAX WORLD · EST. 1993', col, h * 0.045, (px) => `500 ${px}px "IBM Plex Mono", monospace`);
  g.fillText('JAX WORLD · EST. 1993', x, h * 0.2);
  g.fillStyle = INK;
  fit(g, 'CAR WASHES', col, h * 0.135, display);
  g.fillText('CAR WASHES', x, h * 0.38);
  g.fillText('ARE', x, h * 0.53);
  g.fillStyle = RUST;
  g.fillText('OUTDATED.', x, h * 0.68);
  g.fillStyle = DENIM;
  fit(g, 'We’re reinventing the car wash.', col, h * 0.1, (px) => `${px}px "Yellowtail", "Brush Script MT", cursive`);
  g.fillText('We’re reinventing the car wash.', x, h * 0.82);
  g.fillStyle = INK;
  fit(g, 'SCROLL TO OPEN  ↓', col, h * 0.038, (px) => `500 ${px}px "IBM Plex Mono", monospace`);
  g.fillText('SCROLL TO OPEN  ↓', x, h * 0.93);
}

function drawSign(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!;
  const w = c.width;
  const h = c.height;
  g.fillStyle = INK;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = PAPER;
  g.lineWidth = 6;
  g.strokeRect(10, 10, w - 20, h - 20);
  starburst(g, h * 0.55, h / 2, h * 0.3, '#f08a4b');
  g.fillStyle = PAPER;
  g.textBaseline = 'middle';
  g.font = `800 ${h * 0.42}px "Unbounded", "Arial Black", sans-serif`;
  g.fillText('JAX', h * 1.0, h * 0.52);
  const jw = g.measureText('JAX ').width;
  g.font = `400 ${h * 0.2}px "Unbounded", "Arial Black", sans-serif`;
  g.fillText('W O R L D', h * 1.0 + jw, h * 0.54);
  g.fillStyle = '#f08a4b';
  fit(g, 'Carwash-O-Matic', w * 0.44, h * 0.44, (px) => `${px}px "Yellowtail", "Brush Script MT", cursive`);
  g.fillText('Carwash-O-Matic', w * 0.53, h * 0.54);
}

export class Prelude {
  readonly group = new THREE.Group();
  /** Garage door pivot (top edge); rotation.x swings it up and out. */
  private door = new THREE.Group();
  private doorCanvas!: HTMLCanvasElement;
  private doorTex!: THREE.CanvasTexture;
  private signCanvas!: HTMLCanvasElement;
  private signTex!: THREE.CanvasTexture;
  private mascot: HTMLImageElement | null = null;
  private owned: THREE.Material[] = [];

  constructor() {
    // ribbons are built without caring about winding, so draw both faces
    const asphalt = new THREE.MeshStandardMaterial({ color: '#2a2e33', roughness: 0.95, metalness: 0, side: THREE.DoubleSide });
    const paint = new THREE.MeshBasicMaterial({ color: '#ece5d8', transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide });
    const kerb = new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: 0.9, side: THREE.DoubleSide });
    this.owned.push(asphalt, paint, kerb);

    // ground under the whole prelude area
    const gt = gridTexture();
    gt.repeat.set(88 / 8, 76 / 8);
    const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: 0.85 });
    this.owned.push(groundMat);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(88, 76).rotateX(-Math.PI / 2), groundMat);
    ground.position.set(-52, -0.004, -26);
    ground.receiveShadow = true;
    this.group.add(ground);

    // the route (from the garage door to the bay floor's edge)
    const route = routePoints()
      .filter((p) => p.z <= GARAGE.doorZ + 0.2 || p.x !== GARAGE.x)
      .filter((p) => !(p.x > -16.9));
    const streets: P2[][] = [route];
    // a cross street at every corner, so each turn reads as an intersection
    const way: P2[] = [{ x: GARAGE.x, z: GARAGE.doorZ }, ...CORNERS.map(([x, z]) => ({ x, z })), { x: -16.9, z: CORNERS[CORNERS.length - 1][1] }];
    for (let i = 1; i < way.length - 1; i++) {
      const c = way[i];
      const a = way[i - 1];
      const b = way[i + 1];
      const la = Math.hypot(c.x - a.x, c.z - a.z);
      const lb = Math.hypot(b.x - c.x, b.z - c.z);
      const ax = (c.x - a.x) / la;
      const az = (c.z - a.z) / la;
      const bx = (b.x - c.x) / lb;
      const bz = (b.z - c.z) / lb;
      streets.push([c, { x: c.x + ax * STUB, z: c.z + az * STUB }]);
      streets.push([{ x: c.x - bx * STUB, z: c.z - bz * STUB }, c]);
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_W, ROAD_W).rotateX(-Math.PI / 2), asphalt);
      patch.position.set(c.x, 0.006, c.z);
      patch.receiveShadow = true;
      this.group.add(patch);
    }
    for (const s of streets) {
      const road = new THREE.Mesh(ribbon(s, ROAD_W, 0.006), asphalt);
      road.receiveShadow = true;
      this.group.add(road);
      const edge = new THREE.Mesh(ribbon(s, ROAD_W + 0.5, 0.003), kerb);
      this.group.add(edge);
      for (const side of [-1, 1]) for (const d of dashes(s, side * LINE_OFF, 2, 2.2, 0.14, 0.012)) this.group.add(new THREE.Mesh(d, paint));
    }

    this.buildGarage();

    // repaint the door and sign once Jacque and the brand fonts are ready
    const img = new Image();
    img.decoding = 'async';
    img.src = mascotSrc;
    const fonts =
      typeof document !== 'undefined' && document.fonts
        ? Promise.all([
            document.fonts.load('800 60px "Unbounded"'),
            document.fonts.load('400 60px "Unbounded"'),
            document.fonts.load('60px "Yellowtail"'),
            document.fonts.load('500 20px "IBM Plex Mono"'),
          ]).catch(() => [])
        : Promise.resolve([]);
    img
      .decode()
      .then(() => {
        this.mascot = img;
      })
      .catch(() => {})
      .finally(() => fonts.then(() => this.repaint()));
  }

  private repaint() {
    drawDoor(this.doorCanvas, this.mascot);
    this.doorTex.needsUpdate = true;
    drawSign(this.signCanvas);
    this.signTex.needsUpdate = true;
  }

  private buildGarage() {
    const g = new THREE.Group();
    g.position.set(GARAGE.x, 0, GARAGE.doorZ);
    this.group.add(g);
    const wall = new THREE.MeshStandardMaterial({ color: '#d9c9a8', roughness: 0.85 });
    const trim = new THREE.MeshStandardMaterial({ color: INK, roughness: 0.6 });
    const inside = new THREE.MeshStandardMaterial({ color: '#15171a', roughness: 0.9, side: THREE.BackSide });
    this.owned.push(wall, trim, inside);
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    };
    // local space: door plane at z = 0, building extends toward +z
    const pier = (G_W - DOOR_W) / 2;
    box(pier, G_H, 0.3, wall, -(DOOR_W / 2 + pier / 2), G_H / 2, 0.15);
    box(pier, G_H, 0.3, wall, DOOR_W / 2 + pier / 2, G_H / 2, 0.15);
    box(DOOR_W, G_H - DOOR_H, 0.3, wall, 0, DOOR_H + (G_H - DOOR_H) / 2, 0.15);
    box(0.3, G_H, G_D, wall, -G_W / 2 + 0.15, G_H / 2, G_D / 2);
    box(0.3, G_H, G_D, wall, G_W / 2 - 0.15, G_H / 2, G_D / 2);
    box(G_W, G_H, 0.3, wall, 0, G_H / 2, G_D - 0.15);
    box(G_W + 0.4, 0.28, G_D + 0.4, trim, 0, G_H + 0.14, G_D / 2);
    // dark interior shell so the car sits in shadow until the door opens
    // inset from the walls' inner faces so the two never share a plane (z-fighting)
    const shell = new THREE.Mesh(new THREE.BoxGeometry(G_W - 0.9, G_H - 0.25, G_D - 0.9), inside);
    shell.position.set(0, G_H / 2, G_D / 2);
    g.add(shell);
    // door frame trim
    box(DOOR_W + 0.3, 0.14, 0.34, trim, 0, DOOR_H + 0.07, 0.15);
    box(0.14, DOOR_H, 0.34, trim, -DOOR_W / 2 - 0.07, DOOR_H / 2, 0.15);
    box(0.14, DOOR_H, 0.34, trim, DOOR_W / 2 + 0.07, DOOR_H / 2, 0.15);
    // warm work light inside
    const lamp = new THREE.PointLight('#ffcf99', 4, 9, 1.6);
    lamp.position.set(0, G_H - 0.5, G_D / 2);
    g.add(lamp);

    // sign above the door
    this.signCanvas = document.createElement('canvas');
    this.signCanvas.width = 1024;
    this.signCanvas.height = 200;
    drawSign(this.signCanvas);
    this.signTex = new THREE.CanvasTexture(this.signCanvas);
    this.signTex.colorSpace = THREE.SRGBColorSpace;
    const signMat = new THREE.MeshStandardMaterial({ map: this.signTex, emissiveMap: this.signTex, emissive: '#ffffff', emissiveIntensity: 0.5 });
    this.owned.push(signMat);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.82), signMat);
    sign.rotation.y = Math.PI;
    sign.position.set(0, DOOR_H + (G_H - DOOR_H) / 2 + 0.05, -0.02);
    g.add(sign);

    // the door: hinged along its top edge, faces −z (out toward the street)
    this.doorCanvas = document.createElement('canvas');
    this.doorCanvas.width = 1600;
    this.doorCanvas.height = 900;
    drawDoor(this.doorCanvas, null);
    this.doorTex = new THREE.CanvasTexture(this.doorCanvas);
    this.doorTex.colorSpace = THREE.SRGBColorSpace;
    this.doorTex.anisotropy = 8;
    const face = new THREE.MeshStandardMaterial({
      map: this.doorTex,
      emissiveMap: this.doorTex,
      emissive: '#ffffff',
      emissiveIntensity: 0.55,
      roughness: 0.7,
    });
    const back = new THREE.MeshStandardMaterial({ color: '#8f8574', roughness: 0.8 });
    this.owned.push(face, back);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.06), [back, back, back, back, back, face]);
    panel.position.set(0, -DOOR_H / 2, 0);
    panel.castShadow = true;
    this.door.add(panel);
    this.door.position.set(0, DOOR_H, -0.03);
    g.add(this.door);
  }

  /** 0 = closed, 1 = swung up and out of the way. */
  update(door: number) {
    this.door.rotation.x = door * 1.5;
  }

  dispose() {
    this.doorTex.dispose();
    this.signTex.dispose();
    this.owned.forEach((m) => m.dispose());
  }
}
