/** Small GLSL helpers shared by the vehicle surface, foam and spray shaders. */

export const NOISE_GLSL = /* glsl */ `
float jxHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float jxNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(jxHash(i + vec3(0, 0, 0)), jxHash(i + vec3(1, 0, 0)), f.x),
        mix(jxHash(i + vec3(0, 1, 0)), jxHash(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(jxHash(i + vec3(0, 0, 1)), jxHash(i + vec3(1, 0, 1)), f.x),
        mix(jxHash(i + vec3(0, 1, 1)), jxHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float jxFbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * jxNoise(p);
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    a *= 0.5;
  }
  return v;
}
`;
