import { SceneManager } from '../managers/SceneManager';
import { MoodManager } from '../managers/MoodManager';
import { RoundUIManager } from '../managers/RoundUIManager';
import { UIManager } from '../managers/UIManager';
import { RFIDMusicManager } from '../managers/RFIDMusicManager';
import { AudioManager } from '../managers/AudioManager';
import { gameEventBus } from '../events/GameEvents';
import '../styles/round-frame.css';
import '../styles/inner-ui.css';

/**
 * Main Application Entry Point
 *
 * Architecture:
 * - Core 3D System: SceneManager → MoodManager
 * - UI System: RoundUIManager (outer frame) + UIManager (inner popups)
 * - RFID + Music System: RFIDMusicManager (RFID input + plant lookup + song selection)
 * - Audio System: AudioManager (music playback with Howler.js)
 *
 * All managers communicate via GameEventBus for loose coupling.
 */

class App {
  // Core 3D Visualization
  private sceneManager!: SceneManager;
  private moodManager!: MoodManager;

  // UI Management
  private roundUIManager!: RoundUIManager;
  private uiManager!: UIManager;

  // RFID + Music System
  private rfidMusicManager!: RFIDMusicManager;
  private audioManager!: AudioManager;

  constructor() {
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
      throw new Error('Canvas container not found');
    }

    this.initializeCore3DSystem(canvasContainer);
    this.initializeUISystem();
    this.initializeRFIDMusicSystem();
    this.setupApplicationIntegration();

    // Setup development mode (async)
    this.setupDevelopmentMode().then(() => {
      // Start animation loop after complete initialization
      this.startAnimationLoop();
    });
  }

  /**
   * Initialize 3D visualization system
   */
  private initializeCore3DSystem(canvasContainer: HTMLElement): void {
    this.sceneManager = new SceneManager(canvasContainer);
    this.moodManager = new MoodManager(this.sceneManager);

    this.moodManager.applyMood('Harmonisch');
  }

  /**
   * Initialize UI System
   */
  private initializeUISystem(): void {
    this.roundUIManager = new RoundUIManager();
    this.uiManager = new UIManager();
  }

  /**
   * Start animation loop after complete initialization
   */
  private startAnimationLoop(): void {
    this.sceneManager.animate(this.moodManager, this.uiManager);
  }

  /**
   * Initialize RFID + Music System
   */
  private initializeRFIDMusicSystem(): void {
    this.audioManager = new AudioManager();
    this.rfidMusicManager = new RFIDMusicManager();

    this.rfidMusicManager.startListening();
  }

  /**
   * Setup Event Integration
   *
   * Connects manager communication via GameEventBus
   */
  private setupApplicationIntegration(): void {
    // RFID Music → 3D Mood Changes
    gameEventBus.on('mood:change', data => {
      this.moodManager.applyMood(data.moodName);
    });

    // Audio Progress Updates → UI
    gameEventBus.on('audio:progress', () => {
      // Optional: Forward to UI if progress display is needed
    });
  }

  /**
   * Setup Development Mode Functions
   *
   * Exposes global functions for testing in browser console (DEV only)
   */
  private async setupDevelopmentMode(): Promise<void> {
    if (!import.meta.env?.DEV) return;

    // Global App instance for debugging
    (globalThis as unknown as { app: App }).app = this;

    // RFID Development Commands
    (globalThis as unknown as { scanTree: (id?: string) => void }).scanTree = (id = '0009812134') =>
      this.rfidMusicManager.processRFIDInput(id);
    (globalThis as unknown as { scanPlant: (id?: string) => void }).scanPlant = (
      id = '0009806120'
    ) => this.rfidMusicManager.processRFIDInput(id);
    (globalThis as unknown as { testUI: () => void }).testUI = () => this.uiManager.showPopup();

    // Mood Debug Tools (DEV only)
    try {
      const { moodDebugSystem } = await import('../debug/MoodDebugTools');
      moodDebugSystem.initialize(this.moodManager);

      // Attach to global window object
      (globalThis as any).moodDebug = moodDebugSystem;

      console.log('🎨 Mood Debug Tools loaded! Use window.moodDebug.help() for commands');
    } catch (error) {
      console.warn('⚠️ Failed to load mood debug tools:', error);
    }

    console.log('🧪 Dev commands: scanTree(), scanPlant(), testUI(), window.moodDebug.help()');
  }

  /**
   * App shutdown cleanup
   */
  public dispose(): void {
    this.rfidMusicManager?.dispose?.();
    this.audioManager?.dispose?.();
    this.roundUIManager?.dispose?.();
    this.uiManager?.dispose?.();

    gameEventBus.removeAllListenersForAllEvents();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
