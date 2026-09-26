/**
 * The Jax World Carwash-O-Matic container livery, drawn on a 2D canvas.
 * Used as the texture of the 3D container's folding wall (components/wash/
 * ShippingContainer.ts) and as the closing brand image below the demo.
 * No Three.js here, so the page can use it without loading the 3D bundle.
 */

export const BODY = '#c8572a';
export const INK = '#1b1d20';
export const CREAM = '#f3ebdd';

/** Vertical corrugation ribs, drawn as light/dark stripes. */
export function ribs(g: CanvasRenderingContext2D, w: number, h: number, pitch: number) {
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
export function drawLivery(c: HTMLCanvasElement) {
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
