/**
 * Timeout Constants for Agroforst Visualizer
 *
 * Centralized timeout values to improve maintainability
 * and prevent magic numbers scattered throughout codebase.
 */

// UI Timeouts
export const UI_TIMEOUTS = {
  /** Auto-hide delay for audio panel (10 seconds) */
  AUTO_HIDE_DELAY: 10000,

  /** Error message display duration (5 seconds) */
  ERROR_MESSAGE_DISPLAY: 5000,

  /** Selection mode auto-transition delay (1 second) */
  SELECTION_TRANSITION: 1000,

  /** RFID interface display duration (15 seconds - longer for better UX) */
  RFID_DISPLAY_DURATION: 15000,

  /** Delay before showing music player after song selection (2 seconds) */
  MUSIC_PLAYER_SHOW_DELAY: 2000,
} as const;

// RFID System Timeouts
export const RFID_TIMEOUTS = {
  /** Time between characters before input is considered complete */
  INPUT_TIMEOUT: 500,

  /** Selection timeout - user must select tree + plant within this time */
  SELECTION_TIMEOUT: 30000, // 30 seconds
} as const;

// Audio System Timeouts
export const AUDIO_TIMEOUTS = {
  /** Fade in/out duration for smooth audio transitions */
  FADE_DURATION: 1000, // 1 second
} as const;

// Asset Loading Timeouts
export const ASSET_TIMEOUTS = {
  /** Maximum time to wait for 3D asset loading */
  LOADING_TIMEOUT: 10000, // 10 seconds

  /** Default timeout for network requests */
  DEFAULT_NETWORK_TIMEOUT: 5000, // 5 seconds
} as const;
