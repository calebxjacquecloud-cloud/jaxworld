/**
 * Asset registry.
 *
 * Every 3D element in the wash demo is currently a procedural placeholder so
 * the experience works without production art. When real models exist, drop
 * them into /public/models and flip USE_PRODUCTION_MODELS. Each placeholder
 * module documents the node layout its replacement has to provide.
 *
 *   car.glb        → components/wash/Vehicle.ts     (VehicleRig)
 *   robot-arm.glb  → components/wash/RobotArm.ts    (turret/shoulder/elbow/tool)
 *   camera.glb     → components/wash/CameraArray.ts (pylon head)
 *   container.glb  → components/wash/Bay.ts and the modular-system section
 */

export const USE_PRODUCTION_MODELS = false;

export const MODEL_PATHS = {
  car: '/models/car.glb',
  robotArm: '/models/robot-arm.glb',
  camera: '/models/camera.glb',
  container: '/models/container.glb',
} as const;

/** Warm the HTTP cache for a model shortly before it is needed. */
export function preloadModel(path: string) {
  if (!USE_PRODUCTION_MODELS || typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  link.href = path;
  document.head.appendChild(link);
}
