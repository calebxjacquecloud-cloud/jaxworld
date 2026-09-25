/**
 * Foam shell: a copy of each painted panel pushed out along its normals and
 * shaded as suds. Three controls drive it:
 *   foam   coverage builds up through noise as the arms pass
 *   drain  height line the suds sit below; lowering it reads as run-off
 *   hole   a locally cleared patch (the targeted FLAG 01 pass)
 */

import * as THREE from 'three';
import { NOISE_GLSL } from './shaders';

export class FoamLayer {
  readonly group = new THREE.Group();
  private mat: THREE.ShaderMaterial;

  constructor(paintMeshes: THREE.Mesh[]) {
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uFoam: { value: 0 },
        uDrain: { value: 2 },
        uHole: { value: new THREE.Vector4(0, 0, 0, 0) },
        uLight: { value: new THREE.Vector3(0.4, 1, 0.5).normalize() },
      },
      vertexShader: /* glsl */ `
        varying vec3 vLocal;
        varying vec3 vN;
        ${NOISE_GLSL}
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          // vehicle-space position (panels may carry their own offset inside the vehicle)
          vLocal = (modelMatrix * vec4(position, 1.0)).xyz;
          vN = normalize(mat3(modelMatrix) * normal);
          float bump = jxNoise(position * 9.0);
          vec3 p = position + normal * (0.018 + 0.035 * bump);
          gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uFoam;
        uniform float uDrain;
        uniform vec4 uHole;
        uniform vec3 uLight;
        uniform mat4 uVehicleInv;
        varying vec3 vLocal;
        varying vec3 vN;
        ${NOISE_GLSL}
        void main() {
          vec3 lp = (uVehicleInv * vec4(vLocal, 1.0)).xyz;
          float n = jxFbm(lp * 3.0) * 0.6 + jxNoise(lp * 16.0) * 0.4;
          float m = smoothstep(0.25, 0.7, n);
          if (m > uFoam * 1.12 - 0.02) discard;
          float edge = (jxFbm(vec3(lp.x * 14.0, lp.y * 2.5, lp.z * 14.0)) - 0.5) * 0.45;
          if (lp.y > uDrain + edge) discard;
          float hd = length((lp - uHole.xyz) / vec3(1.0, 0.8, 1.35));
          if (uHole.w > 0.0 && hd < uHole.w + (n - 0.5) * 0.25) discard;
          float bubbles = jxNoise(lp * 42.0);
          float diff = 0.62 + 0.38 * max(dot(normalize(vN), uLight), 0.0);
          vec3 col = vec3(0.96, 0.93, 0.88) * diff * (0.84 + 0.2 * bubbles);
          col = mix(col, vec3(1.0, 0.86, 0.72), 0.12 * (1.0 - m));
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mat.uniforms.uVehicleInv = { value: new THREE.Matrix4() };

    for (const src of paintMeshes) {
      const shell = new THREE.Mesh(src.geometry, this.mat);
      shell.name = `Foam:${src.name}`;
      // Follow the source panel inside the vehicle rig.
      src.add(shell);
    }
  }

  update(foam: number, drain: number, hole: THREE.Vector4, vehicleRoot: THREE.Object3D) {
    const u = this.mat.uniforms;
    u.uFoam.value = foam;
    u.uDrain.value = drain;
    u.uHole.value.copy(hole);
    u.uVehicleInv.value.copy(vehicleRoot.matrixWorld).invert();
    this.mat.visible = foam > 0.001 && drain > -0.2;
  }
}
