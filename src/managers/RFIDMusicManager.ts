import { IRFIDManager, PlantInfo, PlantDatabase, SongInfo, SongDatabase, Song } from '../types';
import { gameEventBus } from '../events/GameEvents';
import { RFID_TIMEOUTS } from '../constants/timeouts';
import { rfidLogger } from '../utils/Logger';

/**
 * 🎯  RFID + MUSIC MANAGER
 *
 * Combines all RFID scanning, plant lookup, song selection, and music logic
 * in ONE simple class. Eliminates service layer complexity.
 *
 * Responsibilities:
 * - RFID hardware input handling
 * - Plant/Tree database lookup (integrated from RFIDService)
 * - Song database lookup (integrated from MusicService)
 * - Selection state management (simplified from ApplicationStateManager)
 * - Music playback coordination
 */
export class RFIDMusicManager implements IRFIDManager {
  // Plant & Song Data (integrated from services)
  private plants: PlantDatabase | null = null;
  private songs: SongDatabase | null = null;
  private plantLookup = new Map<string, { key: string; info: PlantInfo }>();
  private songLookup = new Map<string, SongInfo>();

  // Simple Selection State (replaces complex ApplicationStateManager)
  private selection: { tree: PlantInfo | null; plant: PlantInfo | null } = {
    tree: null,
    plant: null,
  };

  // RFID Input Handling
  private inputBuffer: string = '';
  private inputTimeout: number | null = null;
  private keydownListener: ((event: KeyboardEvent) => void) | null = null;
  private focusInput: HTMLInputElement | null = null;
  private isListening: boolean = false;

  constructor() {
    this.loadData();
    this.setupInputHandler();
    this.setupEventListeners();
    this.setupDevelopmentHelpers();
  }

  // ====================================================================
  // PUBLIC INTERFACE (IRFIDManager)
  // ====================================================================

  startListening(): void {
    if (this.isListening) return;
    this.isListening = true;
    this.ensureInputFocus();
    rfidLogger.info('RFID listening started');
  }

  stopListening(): void {
    this.isListening = false;
    this.clearInputBuffer();
    rfidLogger.info('RFID listening stopped');
  }

  getCurrentGameState(): any {
    return {
      selection: this.selection,
      hasCompleteSelection: !!(this.selection.tree && this.selection.plant),
    };
  }

  dispose(): void {
    this.stopListening();
    this.cleanupInputHandler();
  }

  // ====================================================================
  // CORE RFID + MUSIC LOGIC (Simplified)
  // ====================================================================

  processRFIDInput(rfidId: string): void {
    this.clearInputBuffer();

    if (!this.isValidRFIDFormat(rfidId)) {
      rfidLogger.warn(`Invalid RFID format: ${rfidId}`);
      gameEventBus.emit('ui:show-status', {
        message: 'Ungültiges RFID-Format',
        type: 'error',
      });
      return;
    }

    const plantData = this.findPlantByHardwareId(rfidId);
    if (!plantData) {
      rfidLogger.warn(`Unknown RFID ID: ${rfidId}`);
      gameEventBus.emit('ui:show-status', {
        message: 'Unbekannte RFID-Karte',
        type: 'error',
      });
      return;
    }

    this.handlePlantScanned(plantData.info, plantData.key);
  }

  private handlePlantScanned(plantInfo: PlantInfo, logicalName: string): void {
    rfidLogger.info(`Plant scanned: ${plantInfo.name} (${plantInfo.type})`);

    // Show popup immediately when any card is scanned
    gameEventBus.emit('ui:show-music-player', {});

    if (plantInfo.type === 'tree') {
      this.selection.tree = plantInfo;
      gameEventBus.emit('ui:tree-selected', {
        treeName: plantInfo.name,
        logicalName,
      });
    } else {
      this.selection.plant = plantInfo;
      gameEventBus.emit('ui:plant-selected', {
        plantName: plantInfo.name,
        logicalName,
      });
    }

    if (this.hasCompleteSelection()) {
      this.tryPlaySong();
    }
  }

  private hasCompleteSelection(): boolean {
    return !!(this.selection.tree && this.selection.plant);
  }

  private tryPlaySong(): void {
    if (!this.selection.tree || !this.selection.plant) return;

    const treeKey = this.getLogicalName(this.selection.tree);
    const plantKey = this.getLogicalName(this.selection.plant);

    if (!treeKey || !plantKey) {
      rfidLogger.error('Cannot find logical names for selection');
      return;
    }

    const songInfo = this.findSong(treeKey, plantKey);
    if (!songInfo) {
      rfidLogger.warn(`No song found for: ${treeKey} + ${plantKey}`);
      gameEventBus.emit('ui:show-status', {
        message: 'Keine Musik für diese Kombination gefunden',
        type: 'warning',
      });
      return;
    }

    this.playSong(songInfo);
    this.generateLandscape();
  }

  private generateLandscape(): void {
    if (!this.selection.tree || !this.selection.plant) return;

    // Emit landscape generation event with complete plant info including scale
    gameEventBus.emit('landscape:generate-from-selection', {
      treeAsset: this.selection.tree.assetPath,
      plantAsset: this.selection.plant.assetPath,
      treeName: this.selection.tree.name,
      plantName: this.selection.plant.name,
      treeInfo: this.selection.tree, // Complete PlantInfo for scale data
      plantInfo: this.selection.plant, // Complete PlantInfo for scale data
    });

    rfidLogger.info(
      `Landscape generation triggered: ${this.selection.tree.assetPath} + ${this.selection.plant.assetPath}`
    );
  }

  private playSong(songInfo: SongInfo): void {
    const song: Song = {
      id: songInfo.id,
      title: songInfo.title,
      artist: 'Agroforst Harmonien',
      audioUrl: songInfo.audioUrl,
      mood: songInfo.mood,
      info: songInfo.info,
      infoUrl: songInfo.infoUrl,
    };

    rfidLogger.info(`Playing song: ${song.title} (${song.mood})`);

    gameEventBus.emit('song:selected', {
      song,
      treeId: this.selection.tree!.ids[0] || '',
      plantId: this.selection.plant!.ids[0] || '',
      treeName: this.selection.tree!.name,
      plantName: this.selection.plant!.name,
      mood: song.mood,
    });

    gameEventBus.emit('mood:change', {
      moodName: song.mood,
      reason: 'rfid-song',
    });

    gameEventBus.emit('ui:show-music-player', {});
  }

  resetSelection(): void {
    this.selection = { tree: null, plant: null };
    // Event emission removed to prevent recursion - this method only resets internal state
  }

  // ====================================================================
  // DATA LOADING (Integrated from Services)
  // ====================================================================

  private async loadData(): Promise<void> {
    await Promise.all([this.loadPlantDatabase(), this.loadSongDatabase()]);
    this.buildLookupMaps();
  }

  private async loadPlantDatabase(): Promise<void> {
    try {
      const plantsModule = await import('../data/plants.json');
      this.plants = plantsModule.default as PlantDatabase;
      rfidLogger.info('Plant database loaded');
    } catch (error) {
      rfidLogger.error('Failed to load plant database:', error);
    }
  }

  private async loadSongDatabase(): Promise<void> {
    try {
      const songsModule = await import('../data/songs.json');
      const rawSongData = songsModule.default as Record<string, any>;
      const songData: SongDatabase = {};

      // Inject the ID from the key into the song object itself
      for (const id in rawSongData) {
        if (Object.prototype.hasOwnProperty.call(rawSongData, id)) {
          songData[id] = {
            ...rawSongData[id],
            id: id,
          };
        }
      }

      this.songs = songData;
      rfidLogger.info('Song database loaded');
    } catch (error) {
      rfidLogger.error('Failed to load song database:', error);
    }
  }

  private buildLookupMaps(): void {
    if (!this.plants || !this.songs) return;

    this.plantLookup.clear();
    this.songLookup.clear();

    Object.entries(this.plants.trees).forEach(([key, plantInfo]) => {
      plantInfo.ids.forEach(id => {
        this.plantLookup.set(id, { key, info: plantInfo });
      });
    });

    Object.entries(this.plants.plants).forEach(([key, plantInfo]) => {
      plantInfo.ids.forEach(id => {
        this.plantLookup.set(id, { key, info: plantInfo });
      });
    });

    Object.values(this.songs).forEach(song => {
      const combinationKey = `${song.tree}_${song.plant}`;
      this.songLookup.set(combinationKey, song);
    });

    rfidLogger.info(
      `Lookup maps built: ${this.plantLookup.size} plants, ${this.songLookup.size} songs`
    );
  }

  // ====================================================================
  // LOOKUP FUNCTIONS (Integrated from Services)
  // ====================================================================

  private findPlantByHardwareId(id: string): { key: string; info: PlantInfo } | null {
    return this.plantLookup.get(id) || null;
  }

  private getLogicalName(plantInfo: PlantInfo): string | null {
    for (const [, data] of this.plantLookup.entries()) {
      if (data.info === plantInfo) {
        return data.key;
      }
    }
    return null;
  }

  private findSong(treeKey: string, plantKey: string): SongInfo | undefined {
    const combinationKey = `${treeKey}_${plantKey}`;
    let song = this.songLookup.get(combinationKey);

    if (!song) {
      const reverseKey = `${plantKey}_${treeKey}`;
      song = this.songLookup.get(reverseKey);
    }

    if (!song && this.songs) {
      song = Object.values(this.songs).find(s => s.tree === treeKey);
    }

    return song;
  }

  private isValidRFIDFormat(id: string): boolean {
    return /^\d{10}$/.test(id);
  }

  // ====================================================================
  // RFID INPUT HANDLING
  // ====================================================================

  private setupInputHandler(): void {
    this.createFocusInput();
    this.keydownListener = this.handleKeyboardInput.bind(this);
    document.addEventListener('keydown', this.keydownListener);
    document.addEventListener('click', () => this.ensureInputFocus());
  }

  private createFocusInput(): void {
    this.focusInput = document.createElement('input');
    this.focusInput.type = 'text';
    this.focusInput.style.position = 'absolute';
    this.focusInput.style.left = '-9999px';
    this.focusInput.style.opacity = '0';
    this.focusInput.id = 'rfid-input-capture';
    document.body.appendChild(this.focusInput);
  }

  private ensureInputFocus(): void {
    if (this.focusInput && this.isListening) {
      setTimeout(() => this.focusInput?.focus(), 10);
    }
  }

  private handleKeyboardInput(event: KeyboardEvent): void {
    if (!this.isListening || event.ctrlKey || event.altKey || event.metaKey) return;

    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.inputBuffer.length > 0) {
        this.processRFIDInput(this.inputBuffer.trim());
      }
    } else if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.addToInputBuffer(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.inputBuffer = this.inputBuffer.slice(0, -1);
    }
  }

  private addToInputBuffer(char: string): void {
    this.inputBuffer += char;
    if (this.inputTimeout) clearTimeout(this.inputTimeout);
    this.inputTimeout = window.setTimeout(() => {
      if (this.inputBuffer.length >= 10) {
        this.processRFIDInput(this.inputBuffer.trim());
      }
    }, RFID_TIMEOUTS.INPUT_TIMEOUT);
  }

  private clearInputBuffer(): void {
    this.inputBuffer = '';
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }
  }

  private cleanupInputHandler(): void {
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
    if (this.focusInput) {
      document.body.removeChild(this.focusInput);
      this.focusInput = null;
    }
  }

  // ====================================================================
  // EVENT LISTENERS & DEVELOPMENT
  // ====================================================================

  private setupEventListeners(): void {
    gameEventBus.on('system:reset', () => this.resetSelection());
    // Listen to UI selection reset (from Stop button)
    gameEventBus.on('ui:selection-reset', () => this.resetSelection());
  }

  private setupDevelopmentHelpers(): void {
    if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
      (window as any).rfidMusicManager = this;
      (window as any).scanId = (id: string) => {
        rfidLogger.devCommand('scanId', `Scanning ID: ${id}`);
        this.processRFIDInput(id);
      };
      (window as any).scanTree = () => this.processRFIDInput('0009806867');
      (window as any).scanPlant = () => this.processRFIDInput('0009861234');
    }
  }
}
