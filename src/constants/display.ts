/**
 * Display and 3D Scene Constants
 *
 * Centralized configuration for consistent dimensions and settings
 * across the application.
 */

// 3D Camera Configuration
export const CAMERA_CONFIG = {
  FOV: 45, // Field of view in degrees
  ASPECT_RATIO: 1.0, // 1:1 for round display
  NEAR_PLANE: 0.1,
  FAR_PLANE: 2000, // Far enough for large landscape
} as const;

// 3D Camera Position
export const CAMERA_POSITION = {
  X: 0,
  Y: 50,
  Z: 200,
} as const;

// Display Dimensions (Round Display)
export const DISPLAY = {
  SIZE: 1080, // 1080x1080 round touchscreen
  RADIUS: 540, // Half of size
} as const;
