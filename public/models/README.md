# Production models

Drop production GLB files here. The wash demo currently renders procedural
placeholders; see `lib/assets.ts` for the swap switch and each placeholder
module for the node layout its replacement needs.

| File            | Replaces                          | Notes |
|-----------------|-----------------------------------|-------|
| `car.glb`       | `components/wash/Vehicle.ts`      | Nose +Z, driver side +X, ground at y=0, metres. Name paint meshes `Paint_*`, wheels `Wheel_FL/FR/RL/RR`. |
| `robot-arm.glb` | `components/wash/RobotArm.ts`     | Nodes `Turret`, `Shoulder`, `Elbow`, `Tool`; link lengths must match `ROBOT` in `lib/animationConfig.ts`. |
| `camera.glb`    | `components/wash/CameraArray.ts`  | Pylon head, lens facing +Z. |
| `container.glb` | `components/wash/Bay.ts`, modular section | 40 ft high-cube container, metres. |
