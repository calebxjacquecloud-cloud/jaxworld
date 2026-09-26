/**
 * 40 ft high-cube shipping container for the "pack it up" outro.
 *
 * It arrives with its roof off and its long wall (the +z side) folded down
 * flat, so the camera can watch the equipment go in. Closing lowers the roof
 * and folds the wall up; that wall's outside face carries the Jax World
 * Carwash-O-Matic livery.
 *
 * Origin: centre of the footprint on the floor. Length runs along x, the
 * cargo doors are at +x.
 */

import * as THREE from 'three';
import { CONTAINER } from '@/lib/animationConfig';

const L = CONTAINER.length;
const W = CONTAINER.width;
const H = CONTAINER.height;
const BODY = '#c8572a';
const INK = '#1b1d20';
const CREAM = '#f3ebdd';
const T = 0.05; // wall thickness

/** Vertical corrugation ribs, drawn as light/dark stripes. */
function ribs(g: CanvasRenderingContext2D, w: number, h: number, pitch: number) {
  for (let x = 0; x < w; x += pitch) {
    const grad = g.createLinearGradient(x, 0, x + pitch, 0);
    grad.addColorStop(0, 'rgba(255,255,255,0.10)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.16)');
    grad.addColorStop(1, 'rgba(0,0,0,0.02)');
    g.fillStyle = grad;
    g.fillRect(x, 0, pitch, h);
  }
}

function plainTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = BODY;
  g.fillRect(0, 0, c.width, c.height);
  ribs(g, c.width, c.height, 18);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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
  g.fillStyle = color;
  g.beginPath();
  g.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** The livery: charcoal band with the Jax World mark and the Carwash-O-Matic script. */
function drawLivery(c: HTMLCanvasElement) {
  const g = c.getContext('2d')!;
  const w = c.width;
  const h = c.height;
  g.fillStyle = BODY;
  g.fillRect(0, 0, w, h);
  ribs(g, w, h, w / 96);
  // band
  const bandY = h * 0.25;
  const bandH = h * 0.5;
  g.fillStyle = INK;
  g.fillRect(0, bandY, w, bandH);
  g.fillStyle = 'rgba(243,235,221,0.9)';
  g.fillRect(0, bandY - h * 0.018, w, h * 0.012);
  g.fillRect(0, bandY + bandH + h * 0.006, w, h * 0.012);
  // mark
  const cy = bandY + bandH / 2;
  starburst(g, w * 0.14, cy, bandH * 0.36, '#f08a4b');
  g.fillStyle = CREAM;
  g.textBaseline = 'middle';
  g.font = `800 ${bandH * 0.36}px "Unbounded", "Arial Black", sans-serif`;
  g.fillText('JAX', w * 0.2, cy - bandH * 0.08);
  const jw = g.measureText('JAX ').width;
  g.font = `400 ${bandH * 0.15}px "Unbounded", "Arial Black", sans-serif`;
  const spaced = 'W O R L D';
  g.fillText(spaced, w * 0.2 + jw, cy - bandH * 0.02);
  g.fillStyle = '#f08a4b';
  g.font = `${bandH * 0.42}px "Yellowtail", "Brush Script MT", cursive`;
  g.save();
  g.translate(w * 0.5, cy + bandH * 0.03);
  g.rotate(-0.05);
  g.fillText('Carwash-O-Matic', 0, 0);
  g.restore();
  g.fillStyle = CREAM;
  g.font = `500 ${bandH * 0.075}px "IBM Plex Mono", monospace`;
  g.fillText('AUTONOMOUS · TOUCHLESS · ROBOTIC CAR WASH', w * 0.2, cy + bandH * 0.3);
  // container markings
  g.fillStyle = 'rgba(243,235,221,0.85)';
  g.font = `600 ${h * 0.055}px "IBM Plex Mono", monospace`;
  g.fillText('JXWU 400127 3', w * 0.83, h * 0.1);
  g.font = `500 ${h * 0.04}px "IBM Plex Mono", monospace`;
  g.fillText("45G1 · 40' HIGH CUBE", w * 0.83, h * 0.16);
  g.fillText('BAY 01 · MODULAR WASH SYSTEM', w * 0.02, h * 0.9);
}

export class ShippingContainer {
  readonly group = new THREE.Group();
  private roof = new THREE.Group();
  /** Hinged at the floor along the +z edge; rotation.x = π/2 lies it flat, 0 closes it. */
  private wall = new THREE.Group();
  private livery: THREE.CanvasTexture;
  private liveryCanvas: HTMLCanvasElement;

  constructor(chrome: THREE.Material) {
    const plain = plainTexture();
    const body = new THREE.MeshStandardMaterial({ map: plain, metalness: 0.35, roughness: 0.55 });
    const inner = new THREE.MeshStandardMaterial({ color: '#a8492a', metalness: 0.2, roughness: 0.7 });
    const frame = new THREE.MeshStandardMaterial({ color: '#9f4320', metalness: 0.45, roughness: 0.5 });
    const floor = new THREE.MeshStandardMaterial({ color: '#3a2d24', roughness: 0.85 });

    const add = (geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, parent: THREE.Object3D = this.group) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    // floor, back long wall, closed end, door end
    add(new THREE.BoxGeometry(L, 0.16, W), floor, 0, 0.08, 0);
    add(new THREE.BoxGeometry(L, H, T), [body, body, body, body, inner, body], 0, H / 2, -W / 2 + T / 2);
    add(new THREE.BoxGeometry(T, H, W), body, -L / 2 + T / 2, H / 2, 0);
    // cargo doors (+x end): two leaves with locking bars
    add(new THREE.BoxGeometry(T, H - 0.1, W - 0.1), body, L / 2 - T / 2, H / 2, 0);
    for (const z of [-0.8, -0.35, 0.35, 0.8]) add(new THREE.CylinderGeometry(0.02, 0.02, H - 0.3, 8), chrome, L / 2 + 0.03, H / 2, z);
    add(new THREE.BoxGeometry(0.01, H - 0.2, 0.02), frame, L / 2 + 0.005, H / 2, 0);
    // corner posts, bottom and top rails, corner castings
    for (const x of [-L / 2 + 0.08, L / 2 - 0.08]) {
      for (const z of [-W / 2 + 0.08, W / 2 - 0.08]) {
        add(new THREE.BoxGeometry(0.16, H, 0.16), frame, x, H / 2, z);
        for (const y of [0.09, H - 0.09]) add(new THREE.BoxGeometry(0.2, 0.18, 0.2), frame, x, y, z);
      }
    }
    for (const z of [-W / 2 + 0.06, W / 2 - 0.06]) add(new THREE.BoxGeometry(L, 0.16, 0.12), frame, 0, 0.08, z);
    add(new THREE.BoxGeometry(L, 0.14, 0.12), frame, 0, H - 0.07, -W / 2 + 0.06);

    // roof (lowered on at the end); its own front top rail rides with it
    add(new THREE.BoxGeometry(L, 0.06, W), body, 0, 0, 0, this.roof);
    add(new THREE.BoxGeometry(L, 0.14, 0.12), frame, 0, -0.04, W / 2 - 0.06, this.roof);
    this.roof.visible = false;
    this.group.add(this.roof);

    // folding long wall with the livery on its outside face
    this.liveryCanvas = document.createElement('canvas');
    this.liveryCanvas.width = 2048;
    this.liveryCanvas.height = 488;
    drawLivery(this.liveryCanvas);
    this.livery = new THREE.CanvasTexture(this.liveryCanvas);
    this.livery.colorSpace = THREE.SRGBColorSpace;
    this.livery.anisotropy = 8;
    const outside = new THREE.MeshStandardMaterial({ map: this.livery, metalness: 0.3, roughness: 0.5 });
    const wh = H - 0.16 - 0.14;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(L - 0.32, wh, T), [frame, frame, frame, frame, outside, inner]);
    panel.position.set(0, wh / 2, -T / 2);
    panel.castShadow = true;
    panel.receiveShadow = true;
    this.wall.add(panel);
    this.wall.position.set(0, 0.16, W / 2);
    this.group.add(this.wall);

    // repaint once the brand fonts are ready (the page loads them from Google Fonts)
    if (typeof document !== 'undefined' && document.fonts) {
      Promise.all([
        document.fonts.load('800 60px "Unbounded"'),
        document.fonts.load('400 60px "Unbounded"'),
        document.fonts.load('60px "Yellowtail"'),
        document.fonts.load('500 20px "IBM Plex Mono"'),
      ])
        .then(() => {
          drawLivery(this.liveryCanvas);
          this.livery.needsUpdate = true;
        })
        .catch(() => {});
    }
    this.group.visible = false;
  }

  /**
   * @param x      container centre x (slides in from the right)
   * @param roof   0 = off (hidden above), 1 = on
   * @param wall   0 = folded flat, 1 = closed
   */
  update(visible: boolean, x: number, z: number, roof: number, wall: number) {
    this.group.visible = visible;
    if (!visible) return;
    this.group.position.set(x, 0, z);
    this.roof.visible = roof > 0.001;
    this.roof.position.set(0, H - 0.03 + (1 - roof) * 4.5, 0);
    this.wall.rotation.x = (1 - wall) * (Math.PI / 2);
  }

  dispose() {
    this.livery.dispose();
  }
}
