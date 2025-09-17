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
 * 🎯 SIMPLIFIED APPLICATION ARCHITECTURE
 *
 * ULTRATHINK REFACTORED:
 * - Core 3D System: SceneManager → MoodManager
 * - Outer UI System: RoundUIManager (round frame only)
 * - Inner UI System: UIManager (simplified popup without auto-hide complexity)
 * - RFID + Music System: RFIDMusicManager (all-in-one: RFID input + plant lookup + song selection)
 * - Audio System: AudioManager (music playback)
 *
 * MASSIVE SIMPLIFICATION: 6 files → 5 files, complex state machine → simple logic
 */

class App {
  // Core 3D Visualization System
  private sceneManager!: SceneManager;
  private moodManager!: MoodManager;

  // UI Management System (SIMPLIFIED)
  private roundUIManager!: RoundUIManager; // Outer UI (frame)
  private uiManager!: UIManager; // Inner UI (simplified popup)

  // RFID + Music System (ALL-IN-ONE)
  private rfidMusicManager!: RFIDMusicManager; // Replaces RFIDManager + Services + ApplicationStateManager
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
    this.setupDevelopmentMode();

    // Start animation loop after complete initialization
    this.startAnimationLoop();
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
   * Initialize UI System (SIMPLIFIED)
   */
  private initializeUISystem(): void {
    this.roundUIManager = new RoundUIManager(); // Outer UI (frame)
    this.uiManager = new UIManager(); // Inner UI (simple popup)
  }

  /**
   * Start animation loop after complete initialization
   */
  private startAnimationLoop(): void {
    this.sceneManager.animate(this.moodManager, this.uiManager);
  }

  /**
   * Initialize RFID + Music System (ALL-IN-ONE)
   */
  private initializeRFIDMusicSystem(): void {
    this.audioManager = new AudioManager();
    this.rfidMusicManager = new RFIDMusicManager(); // Replaces 3 classes with 1!

    this.rfidMusicManager.startListening();
  }

  /**
   * Setup Event Integration (SIMPLIFIED)
   */
  private setupApplicationIntegration(): void {
    // RFID Music → 3D Mood Changes
    gameEventBus.on('mood:change', data => {
      this.moodManager.applyMood(data.moodName);
    });

    // Audio Progress Updates → UI (if needed)
    gameEventBus.on('audio:progress', () => {
      // Optional: Forward to UI if progress display is needed
    });
  }

  /**
   * Setup Development Mode Functions (SIMPLIFIED)
   */
  private setupDevelopmentMode(): void {
    if (!import.meta.env?.DEV) return;

    // Global App instance for debugging
    (globalThis as unknown as { app: App }).app = this;

    // RFID Development Commands (SIMPLIFIED)
    (globalThis as unknown as { scanTree: (id?: string) => void }).scanTree = (id = '0009812134') =>
      this.rfidMusicManager.processRFIDInput(id);
    (globalThis as unknown as { scanPlant: (id?: string) => void }).scanPlant = (
      id = '0009806120'
    ) => this.rfidMusicManager.processRFIDInput(id);
    (globalThis as unknown as { testUI: () => void }).testUI = () => this.uiManager.showPopup();

    console.log('🧪 Dev commands: scanTree(), scanPlant(), testUI()');
  }

  /**
   * App shutdown cleanup (SIMPLIFIED)
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
