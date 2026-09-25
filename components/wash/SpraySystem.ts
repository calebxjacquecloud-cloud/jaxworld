/**
 * Nozzle output for one arm: a shaded jet from nozzle to aim point, plus an
 * impact splash. Mode changes the look: tight high-pressure water, a thick
 * slow foam stream, a fine rinse fan, or a narrow spot-treatment jet.
 */

import * as THREE from 'three';
import { ROBOT } from '@/lib/animationConfig';
import { NOISE_GLSL } from './shaders';

const MODE_STYLE = [
  { width: 0.14, speed: 11, opacity: 1.6, splash: 1 },
  { width: 0.24, speed: 4, opacity: 1.5, splash: 0.8 },
  { width: 0.28, speed: 9, opacity: 1.2, splash: 1.1 },
  { width: 0.08, speed: 7, opacity: 1.6, splash: 0.6 },
];

const up = new THREE.Vector3(0, 1, 0);
const dir = new THREE.Vector3();
const t1 = new THREE.Vector3();
const t2 = new THREE.Vector3();

export class Spray {
  readonly group = new THREE.Group();
  private jet: THREE.Mesh;
  private jetMat: THREE.ShaderMaterial;
  private splash: THREE.Points;
  private splashMat: THREE.ShaderMaterial;
  private colors = ROBOT.nozzles.map((n) => new THREE.Color(n.color));

  constructor(splashCount: number) {
    const jetGeo = new THREE.CylinderGeometry(1, 0.1, 1, 20, 6, true).translate(0, 0.5, 0);
    this.jetMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color() }, uOpacity: { value: 0 }, uSpeed: { value: 10 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vFacing;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vec3 n = normalize(normalMatrix * normal);
          vFacing = abs(dot(n, normalize(-mv.xyz)));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uSpeed;
        varying vec2 vUv;
        varying float vFacing;
        ${NOISE_GLSL}
        void main() {
          float along = vUv.y; // 0 at nozzle, 1 at impact
          float streak = jxNoise(vec3(vUv.x * 18.0, along * 7.0 - uTime * uSpeed, 0.0));
          float core = pow(vFacing, 1.2);
          float a = uOpacity * core * (0.35 + 0.75 * streak);
          a *= smoothstep(0.0, 0.06, along) * (1.0 - 0.45 * along);
          gl_FragColor = vec4(uColor * (1.0 + 0.6 * streak) + 0.25 * core, min(a, 1.0));
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    this.jet = new THREE.Mesh(jetGeo, this.jetMat);
    this.jet.frustumCulled = false;
    this.group.add(this.jet);

    const seeds = new Float32Array(splashCount * 4);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(splashCount * 3), 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
    this.splashMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uImpact: { value: new THREE.Vector3() },
        uNormal: { value: new THREE.Vector3() },
        uT1: { value: new THREE.Vector3() },
        uT2: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Color() },
        uOpacity: { value: 0 },
        uScale: { value: 1 },
        uPx: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute vec4 aSeed;
        uniform float uTime;
        uniform vec3 uImpact, uNormal, uT1, uT2;
        uniform float uScale, uPx;
        varying float vLife;
        void main() {
          float t = fract(uTime * (1.3 + aSeed.x * 0.9) + aSeed.y);
          vec3 v = uNormal * (0.25 + aSeed.z * 0.6) + uT1 * (aSeed.w - 0.5) * 1.7 + uT2 * (aSeed.x - 0.5) * 1.7;
          vec3 p = uImpact + v * t * 0.55 * uScale + vec3(0.0, -1.0, 0.0) * t * t * 0.45;
          vLife = 1.0 - t;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uPx * (0.018 + 0.03 * aSeed.z) * (0.4 + vLife) * 600.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying float vLife;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, uOpacity * vLife * (1.0 - d * 2.0));
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.splash = new THREE.Points(g, this.splashMat);
    this.splash.frustumCulled = false;
    this.group.add(this.splash);
  }

  setPixelRatio(px: number) {
    this.splashMat.uniforms.uPx.value = px;
  }

  update(nozzle: THREE.Vector3, aim: THREE.Vector3, intensity: number, mode: number, time: number) {
    const on = intensity > 0.01;
    this.group.visible = on;
    if (!on) return;
    const m = Math.max(0, Math.min(ROBOT.nozzles.length - 1, Math.round(mode)));
    const style = MODE_STYLE[m];
    dir.copy(aim).sub(nozzle);
    const len = dir.length();
    dir.normalize();
    this.jet.position.copy(nozzle);
    this.jet.quaternion.setFromUnitVectors(up, dir);
    // Fan grows with intensity so the jet "opens" as the valve opens.
    const w = style.width * (0.4 + 0.6 * intensity);
    this.jet.scale.set(w, len * (0.35 + 0.65 * Math.min(1, intensity * 1.4)), w);
    this.jetMat.uniforms.uTime.value = time;
    this.jetMat.uniforms.uSpeed.value = style.speed;
    this.jetMat.uniforms.uOpacity.value = style.opacity * intensity;
    this.jetMat.uniforms.uColor.value.copy(this.colors[m]);

    const u = this.splashMat.uniforms;
    u.uTime.value = time;
    u.uImpact.value.copy(aim);
    u.uNormal.value.copy(dir).negate();
    t1.crossVectors(dir, up);
    if (t1.lengthSq() < 1e-4) t1.set(1, 0, 0);
    t1.normalize();
    t2.crossVectors(dir, t1).normalize();
    u.uT1.value.copy(t1);
    u.uT2.value.copy(t2);
    u.uColor.value.copy(this.colors[m]);
    u.uOpacity.value = 0.8 * intensity * style.splash;
    u.uScale.value = style.splash;
  }
}
