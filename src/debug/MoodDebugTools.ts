import { MoodConfig, IMoodManager } from '../types';
import { moodStyles } from '../configs/mood-definitions';

/**
 * 🔧 MOOD DEBUG TOOLS
 *
 * Development-only tools for live mood debugging and parameter tweaking.
 * Provides console-accessible functions for real-time mood manipulation.
 *
 * Features:
 * - Live mood switching
 * - Parameter overrides (bloom, lighting, particles)
 * - Temporary mood changes with auto-reset
 * - Enable/disable debugging system
 *
 * Usage in browser console:
 * - window.moodDebug.setMood('Harmonisch')
 * - window.moodDebug.adjustBloom({ strength: 2.0 })
 * - window.moodDebug.tempOverride(customConfig, 5000)
 * - window.moodDebug.enable(true/false)
 */

interface MoodDebugTools {
  enabled: boolean;
  setMood: (moodName: string) => void;
  adjustBloom: (bloomParams: Partial<MoodConfig['bloom']>) => void;
  adjustLighting: (lightParams: {
    ambient?: Partial<MoodConfig['ambient']>;
    keyLight?: Partial<MoodConfig['keyLight']>;
  }) => void;
  adjustParticles: (particleParams: { count?: number; size?: number; opacity?: number }) => void;
  tempOverride: (customConfig: Partial<MoodConfig>, durationMs?: number) => void;
  resetToOriginal: () => void;
  getCurrentMood: () => string;
  listAvailableMoods: () => string[];
  enable: (enabled: boolean) => void;
  help: () => void;
}

class MoodDebugSystem implements MoodDebugTools {
  public enabled = true;
  private moodManager: IMoodManager | null = null;
  private originalMood: string = 'Harmonisch';
  private temporaryOverrideTimeout: number | null = null;

  constructor() {
    // Will be set when initialized from main.ts
  }

  /**
   * Initialize debug system with mood manager reference
   */
  public initialize(moodManager: IMoodManager): void {
    this.moodManager = moodManager;
    this.originalMood = this.getCurrentMood();
  }

  /**
   * Switch to a different mood
   */
  public setMood = (moodName: string): void => {
    if (!this.enabled) {
      console.warn('🔧 MoodDebug is disabled. Enable with window.moodDebug.enable(true)');
      return;
    }

    if (!this.moodManager) {
      console.error('🔧 MoodDebug: MoodManager not initialized');
      return;
    }

    if (!(moodName in moodStyles)) {
      console.error(
        `🔧 MoodDebug: Mood "${moodName}" not found. Available: ${this.listAvailableMoods().join(', ')}`
      );
      return;
    }

    console.log(`🎨 MoodDebug: Switching to mood "${moodName}"`);
    this.moodManager.applyMood(moodName);
    this.originalMood = moodName;
  };

  /**
   * Adjust bloom parameters in real-time
   */
  public adjustBloom = (bloomParams: Partial<MoodConfig['bloom']>): void => {
    if (!this.enabled) return;

    if (!this.moodManager) {
      console.error('🔧 MoodDebug: MoodManager not initialized');
      return;
    }

    console.log('🌟 MoodDebug: Adjusting bloom parameters:', bloomParams);

    // Create temporary mood config with adjusted bloom
    const currentMoodName = this.getCurrentMood();
    const currentConfig = { ...moodStyles[currentMoodName] };
    currentConfig.bloom = { ...currentConfig.bloom, ...bloomParams };

    this.applyTempConfig(currentConfig);
  };

  /**
   * Adjust lighting parameters
   */
  public adjustLighting = (lightParams: {
    ambient?: Partial<MoodConfig['ambient']>;
    keyLight?: Partial<MoodConfig['keyLight']>;
  }): void => {
    if (!this.enabled) return;

    if (!this.moodManager) {
      console.error('🔧 MoodDebug: MoodManager not initialized');
      return;
    }

    console.log('💡 MoodDebug: Adjusting lighting parameters:', lightParams);

    const currentMoodName = this.getCurrentMood();
    const currentConfig = { ...moodStyles[currentMoodName] };

    if (lightParams.ambient) {
      currentConfig.ambient = { ...currentConfig.ambient, ...lightParams.ambient };
    }

    if (lightParams.keyLight) {
      currentConfig.keyLight = { ...currentConfig.keyLight, ...lightParams.keyLight };
    }

    this.applyTempConfig(currentConfig);
  };

  /**
   * Adjust particle parameters
   */
  public adjustParticles = (particleParams: {
    count?: number;
    size?: number;
    opacity?: number;
  }): void => {
    if (!this.enabled) return;

    console.log('✨ MoodDebug: Adjusting particle parameters:', particleParams);

    const currentMoodName = this.getCurrentMood();
    const currentConfig = { ...moodStyles[currentMoodName] };

    if (currentConfig.particles) {
      if (Array.isArray(currentConfig.particles)) {
        // Multiple particle systems - adjust first one
        const particles = [...currentConfig.particles];
        if (particles[0]) {
          if (particleParams.count !== undefined) particles[0].count = particleParams.count;
          if (particleParams.size !== undefined) particles[0].material.size = particleParams.size;
          if (particleParams.opacity !== undefined)
            particles[0].material.opacity = particleParams.opacity;
        }
        currentConfig.particles = particles;
      } else {
        // Single particle system
        const particles = { ...currentConfig.particles };
        if (particleParams.count !== undefined) particles.count = particleParams.count;
        if (particleParams.size !== undefined) particles.material.size = particleParams.size;
        if (particleParams.opacity !== undefined)
          particles.material.opacity = particleParams.opacity;
        currentConfig.particles = particles;
      }
    }

    this.applyTempConfig(currentConfig);
  };

  /**
   * Apply a complete custom mood configuration temporarily
   */
  public tempOverride = (customConfig: Partial<MoodConfig>, durationMs = 5000): void => {
    if (!this.enabled) return;

    if (!this.moodManager) {
      console.error('🔧 MoodDebug: MoodManager not initialized');
      return;
    }

    console.log(`⏱️ MoodDebug: Applying temporary override for ${durationMs}ms`);

    const currentMoodName = this.getCurrentMood();
    const fullConfig = { ...moodStyles[currentMoodName], ...customConfig };

    this.applyTempConfig(fullConfig);

    // Auto-reset after duration
    if (this.temporaryOverrideTimeout) {
      clearTimeout(this.temporaryOverrideTimeout);
    }

    this.temporaryOverrideTimeout = window.setTimeout(() => {
      console.log('🔄 MoodDebug: Temporary override expired, resetting to original');
      this.resetToOriginal();
    }, durationMs);
  };

  /**
   * Reset to original mood configuration
   */
  public resetToOriginal = (): void => {
    if (!this.enabled) return;

    if (this.temporaryOverrideTimeout) {
      clearTimeout(this.temporaryOverrideTimeout);
      this.temporaryOverrideTimeout = null;
    }

    console.log(`🔄 MoodDebug: Resetting to original mood "${this.originalMood}"`);
    this.setMood(this.originalMood);
  };

  /**
   * Get current mood name
   */
  public getCurrentMood = (): string => {
    if (!this.moodManager) return 'Unknown';

    const currentConfig = this.moodManager.getCurrentMoodConfig();
    if (currentConfig && currentConfig.name) {
      return currentConfig.name;
    }

    return this.originalMood;
  };

  /**
   * List all available moods
   */
  public listAvailableMoods = (): string[] => {
    return Object.keys(moodStyles);
  };

  /**
   * Enable or disable debug system
   */
  public enable = (enabled: boolean): void => {
    this.enabled = enabled;
    console.log(`🔧 MoodDebug: ${enabled ? 'Enabled' : 'Disabled'}`);

    if (enabled) {
      this.help();
    }
  };

  /**
   * Show help message with available commands
   */
  public help = (): void => {
    console.log(`
🔧 MOOD DEBUG TOOLS - Available Commands:

Basic Commands:
• window.moodDebug.setMood('Harmonisch')     - Switch mood
• window.moodDebug.getCurrentMood()          - Get current mood
• window.moodDebug.listAvailableMoods()      - List all moods
• window.moodDebug.resetToOriginal()         - Reset to original

Parameter Adjustments:
• window.moodDebug.adjustBloom({ strength: 2.0, threshold: 0.1 })
• window.moodDebug.adjustLighting({
    ambient: { intensity: 1.2 },
    keyLight: { intensity: 4.0 }
  })
• window.moodDebug.adjustParticles({ count: 5000, size: 3.0 })

Advanced:
• window.moodDebug.tempOverride(customConfig, 5000)  - Temporary change
• window.moodDebug.enable(true/false)               - Toggle system
• window.moodDebug.help()                           - Show this help

Available Moods: ${this.listAvailableMoods().join(', ')}
`);
  };

  /**
   * Internal helper to apply configuration
   */
  private applyTempConfig(config: MoodConfig): void {
    if (!this.moodManager) return;

    // Store the config temporarily and apply it
    // Note: This assumes MoodManager has a method to apply custom config
    // We'll call the standard applyMood method with a temp mood
    const tempMoodName = 'DEBUG_TEMP';

    // Temporarily add our config to moodStyles
    (moodStyles as any)[tempMoodName] = config;

    try {
      this.moodManager.applyMood(tempMoodName);
    } finally {
      // Clean up temp mood
      delete (moodStyles as any)[tempMoodName];
    }
  }
}

// Global debug system instance
const moodDebugSystem = new MoodDebugSystem();

export { moodDebugSystem, type MoodDebugTools };
