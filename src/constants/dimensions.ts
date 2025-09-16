/**
 * Dimension Constants for Agroforst Visualizer
 *
 * Centralized size/dimension values for 3D scene, UI, and landscape.
 * Used for consistent sizing across the application.
 */

// Landscape Dimensions
export const LANDSCAPE_DIMENSIONS = {
  /** Ground/terrain size in world units */
  GROUND_SIZE: {
    width: 1000,
    height: 1000,
  },

  /** Instance counts for vegetation rendering */
  VEGETATION_COUNTS: {
    /** Number of tree instances to render */
    TREES: 180,

    /** Number of plant/crop instances to render */
    PLANTS: 9000,
  },

  /** Coordinate conversion helpers */
  COORDINATE_RANGES: {
    /** World coordinate range (e.g., -500 to +500) */
    WORLD_MIN: -500,
    WORLD_MAX: 500,

    /** Local grid range (e.g., 0 to 1000) */
    GRID_MIN: 0,
    GRID_MAX: 1000,
  },
} as const;

// Particle System Dimensions
export const PARTICLE_COUNTS = {
  /** Large particle system for "Kooperativ" rainbow effect */
  LARGE_SYSTEM: 5000,

  /** Medium particle system for fire effects */
  MEDIUM_SYSTEM: 1000,

  /** Small particle system for smoke/ambient */
  SMALL_SYSTEM: 500,
} as const;

// Light System Dimensions
export const LIGHT_PARAMETERS = {
  /** High intensity for explosion/dramatic effects */
  HIGH_INTENSITY: 1000,

  /** Standard directional light distance */
  STANDARD_DISTANCE: 1000,
} as const;

// Asset System Dimensions
export const ASSET_PARAMETERS = {
  /** Estimated bytes per vertex for memory calculation */
  BYTES_PER_VERTEX: 12,

  /** Fallback size estimate for unknown geometries */
  FALLBACK_SIZE_ESTIMATE: 1000,
} as const;

// PRODUCTION-TODO: Make vegetation counts configurable based on device performance
// PRODUCTION-TODO: Add support for dynamic LOD based on distance
