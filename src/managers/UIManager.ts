import { IManager, MoodConfig } from '../types';
import { gameEventBus } from '../events/GameEvents';
import { UI_TIMEOUTS } from '../constants/timeouts';

/**
 * 🎯 UI MANAGER
 *
 * Manages the complete UI for the round 1080x1080 display:
 * - FAB (Floating Action Button) for opening music player
 * - Unified popup for music player + plant selection + info
 * - Simple show
 * - Touch-optimized controls
 */
export class UIManager implements IManager {
  // Core UI Elements
  private fab!: HTMLButtonElement;
  private popup: HTMLDivElement | null = null;
  private uiContainer: HTMLElement;
  private isVisible = false;
  private currentMode: 'main' | 'info' = 'main';
  private currentSong: any = null;
  private currentTreeName: string = '';
  private currentPlantName: string = '';
  private autoHideTimeout: number | null = null;
  private isInfoPlaying: boolean = false;

  constructor() {
    this.uiContainer = document.getElementById('ui-container')!;

    this.createFAB();
    this.createPopup();
    this.setupEventListeners();
  }

  // ====================================================================
  // Starbutton auf dem Home-Sreen -> FAB (FLOATING ACTION BUTTON)
  // ====================================================================

  private createFAB(): void {
    this.fab = document.createElement('button');
    this.fab.className = 'fab-agroforst circle agroforst-btn large';
    this.fab.innerHTML = '<i class="material-icons">music_note</i>';
    this.fab.setAttribute('aria-label', 'Audio-Player öffnen');
    this.fab.addEventListener('click', () => this.showPopup());
    this.uiContainer.appendChild(this.fab);
  }

  // ====================================================================
  // POPUP CREATION
  // ====================================================================

  private createPopup(): void {
    this.popup = document.createElement('div') as HTMLDivElement;
    this.popup.className = 'unified-popup round border large-padding';
    this.popup.innerHTML = this.getMainContent();
    if (this.popup) {
      this.uiContainer.appendChild(this.popup);
      this.setupPopupControls();
    }
  }

  private getMainContent(): string {
    return `
      <!-- Header - Centered -->
      <div class="popup-header">
        <h2 class="popup-title" id="popup-title">Agroforst Kombination</h2>
      </div>

      <!-- Tree + Plant Selection -->
      <div class="selection-section">
        <div class="selection-grid">
          <article class="selection-card round border medium-padding" id="tree-card">
            <div class="card-icon">
              <i class="material-icons tree-icon">park</i>
            </div>
            <div class="selection-label" id="tree-label">Baum wählen</div>
          </article>

          <div class="plus-symbol">
            <i class="material-icons">add</i>
          </div>

          <article class="selection-card round border medium-padding" id="plant-card">
            <div class="card-icon">
              <i class="material-icons plant-icon">local_florist</i>
            </div>
            <div class="selection-label" id="plant-label">Pflanze wählen</div>
          </article>
        </div>
      </div>

      <!-- Music Controls -->
      <div class="player-section">
        <div class="control-buttons">
          <button class="circle agroforst-btn large" id="play-btn" aria-label="Abspielen">
            <i class="material-icons">play_arrow</i>
          </button>
          <button class="circle agroforst-btn large" id="pause-btn" aria-label="Pausieren" style="display: none;">
            <i class="material-icons">pause</i>
          </button>
          <button class="circle agroforst-btn large" id="stop-btn" aria-label="Stoppen">
            <i class="material-icons">stop</i>
          </button>
          <button class="circle agroforst-btn large primary" id="info-btn" aria-label="Info anzeigen">
            <i class="material-icons">info</i>
          </button>
        </div>
      </div>

      <!-- Volume Control -->
      <div class="volume-section">
        <div class="volume-container">
          <div class="volume-icon">
            <i class="material-icons">volume_up</i>
          </div>
          <input type="range" class="volume-slider" id="volume-slider" min="0" max="100" value="70" aria-label="Lautstärke">
        </div>
      </div>
    `;
  }

  private getInfoContent(): string {
    const songTitle = this.currentSong?.title || 'Unbekannter Titel';
    const songInfo =
      this.currentSong?.info ||
      'Wähle eine Baum- und Pflanzenkombination um mehr über die Agroforst-Symbiose zu erfahren.';

    return `
      <!-- Info Header -->
      <div class="popup-header">
      <nav>
      <button class="circle transparent" id="back-btn" aria-label="Zurück">
        <i class="material-icons">arrow_back</i>
      </button>
      </nav>
      </div>

      <div class="popup-title" id="popup-title">
        ${songTitle}
      </div>

      <!-- Info Content -->
      <div class="info-section">
        <div class="info-content">
          <div class="info-text" id="info-text">${songInfo}</div>
          <button class="circle agroforst-btn medium primary" id="speech-btn" aria-label="Text vorlesen">
            <i class="material-icons">volume_up</i>
          </button>
        </div>
      </div>
    `;
  }

  // ====================================================================
  // EVENT LISTENERS
  // ====================================================================

  private setupEventListeners(): void {
    // Plant selection updates
    gameEventBus.on('ui:tree-selected', data => this.updateTreeDisplay(data.treeName));
    gameEventBus.on('ui:plant-selected', data => this.updatePlantDisplay(data.plantName));

    // Audio events
    gameEventBus.on('audio:play', () => this.updatePlayButton(true));
    gameEventBus.on('audio:pause', () => this.updatePlayButton(false));
    gameEventBus.on('audio:ended', () => this.updatePlayButton(false));

    // Song selection
    gameEventBus.on('song:selected', event => this.updateSongDisplay(event));

    // Show music player
    gameEventBus.on('ui:show-music-player', () => this.showPopup());

    // Selection reset
    gameEventBus.on('ui:selection-reset', () => this.resetDisplay());

    // Status messages
    gameEventBus.on('ui:show-status', data => this.showStatus(data.message, data.type || 'info'));

    // Info audio events
    gameEventBus.on('audio:info-started', () => {
      this.isInfoPlaying = true;
      this.updateInfoButtonIcon(true);
    });

    gameEventBus.on('audio:info-ended', () => {
      this.isInfoPlaying = false;
      this.updateInfoButtonIcon(false);
    });
  }

  private setupPopupControls(): void {
    if (!this.popup) return;

    this.setupMainModeControls();

    // Click outside to close
    document.addEventListener('click', e => {
      if (
        this.isVisible &&
        this.popup &&
        !this.popup.contains(e.target as Node) &&
        !this.fab.contains(e.target as Node)
      ) {
        this.hidePopup();
      }
    });
  }

  private setupMainModeControls(): void {
    if (!this.popup) return;

    // Music controls
    const playBtn = this.popup.querySelector('#play-btn');
    const pauseBtn = this.popup.querySelector('#pause-btn');
    const stopBtn = this.popup.querySelector('#stop-btn');
    const infoBtn = this.popup.querySelector('#info-btn');

    playBtn?.addEventListener('click', () => gameEventBus.emit('audio:toggle-play', {}));
    pauseBtn?.addEventListener('click', () => gameEventBus.emit('audio:toggle-play', {}));
    stopBtn?.addEventListener('click', () => {
      gameEventBus.emit('audio:stop', { songId: 'system-stop' });
      gameEventBus.emit('ui:selection-reset', {});
    });
    infoBtn?.addEventListener('click', e => {
      e.stopPropagation();
      this.switchToInfoMode();
    });

    // Volume slider
    const volumeSlider = this.popup.querySelector('#volume-slider');
    if (volumeSlider) this.setupVolumeSlider(volumeSlider as HTMLElement);
  }

  private setupInfoModeControls(): void {
    if (!this.popup) return;

    // Back button
    const backBtn = this.popup.querySelector('#back-btn');
    backBtn?.addEventListener('click', e => {
      e.stopPropagation();
      this.switchToMainMode();
    });

    // Info audio button
    const speechBtn = this.popup.querySelector('#speech-btn');
    speechBtn?.addEventListener('click', () => this.toggleInfoAudio());
  }

  // ====================================================================
  // POPUP VISIBILITY
  // ====================================================================

  showPopup(): void {
    if (this.isVisible) return;

    this.isVisible = true;
    this.fab.style.display = 'none';

    if (this.popup) {
      this.popup.classList.add('active');
    }

    // Start auto-hide timer
    this.startAutoHideTimer();

    gameEventBus.emit('ui:popup-opened', {});
  }

  private hidePopup(): void {
    if (!this.isVisible) return;

    this.isVisible = false;
    this.fab.style.display = 'flex';

    // Clear auto-hide timer
    this.clearAutoHideTimer();

    if (this.popup) {
      this.popup.classList.remove('active');
    }

    if (this.currentMode === 'info') {
      this.switchToMainMode();
    }
    gameEventBus.emit('ui:popup-closed', {});
  }

  // ====================================================================
  // DISPLAY UPDATES
  // ====================================================================

  private updateTreeDisplay(treeName: string): void {
    if (!this.popup) return;

    const treeLabel = this.popup.querySelector('#tree-label') as HTMLElement;
    const treeCard = this.popup.querySelector('#tree-card') as HTMLElement;

    if (treeLabel) treeLabel.textContent = treeName;
    if (treeCard) treeCard.classList.add('selected');
  }

  private updatePlantDisplay(plantName: string): void {
    if (!this.popup) return;

    const plantLabel = this.popup.querySelector('#plant-label') as HTMLElement;
    const plantCard = this.popup.querySelector('#plant-card') as HTMLElement;

    if (plantLabel) plantLabel.textContent = plantName;
    if (plantCard) plantCard.classList.add('selected');
  }

  private updateSongDisplay(event: any): void {
    this.currentSong = event.song;
    this.currentTreeName = event.treeName || '';
    this.currentPlantName = event.plantName || '';

    if (!this.popup) return;

    const titleEl = this.popup.querySelector('#popup-title') as HTMLElement;
    const infoTextEl = this.popup.querySelector('#info-text') as HTMLElement;

    if (titleEl) titleEl.textContent = event.song.title || 'Unbekannter Titel';
    if (infoTextEl && event.song.info) infoTextEl.textContent = event.song.info;
  }

  private updatePlayButton(isPlaying: boolean): void {
    if (!this.popup) return;

    const playBtn = this.popup.querySelector('#play-btn') as HTMLElement;
    const pauseBtn = this.popup.querySelector('#pause-btn') as HTMLElement;

    // Add null checks to prevent errors
    if (!playBtn || !pauseBtn) return;

    if (isPlaying) {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
    } else {
      playBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
    }
  }

  private resetDisplay(): void {
    if (!this.popup) return;

    const treeLabel = this.popup.querySelector('#tree-label') as HTMLElement;
    const plantLabel = this.popup.querySelector('#plant-label') as HTMLElement;
    const treeCard = this.popup.querySelector('#tree-card') as HTMLElement;
    const plantCard = this.popup.querySelector('#plant-card') as HTMLElement;
    const titleEl = this.popup.querySelector('#popup-title') as HTMLElement;

    if (treeLabel) treeLabel.textContent = 'Baum wählen';
    if (plantLabel) plantLabel.textContent = 'Pflanze wählen';
    if (treeCard) treeCard.classList.remove('selected');
    if (plantCard) plantCard.classList.remove('selected');
    if (titleEl) titleEl.textContent = 'Agroforst Kombination';
  }

  // ====================================================================
  // INFO PANEL & AUDIO
  // ====================================================================

  private switchToInfoMode(): void {
    if (!this.popup) return;

    // Show default info if no song is loaded
    if (!this.currentSong) {
      this.currentSong = {
        title: 'Agroforst Information',
        info: 'Wähle eine Baum- und Pflanzenkombination um mehr über die Agroforst-Symbiose zu erfahren.',
      };
    }

    this.currentMode = 'info';
    this.popup.innerHTML = this.getInfoContent();
    this.setupInfoModeControls();
  }

  private switchToMainMode(): void {
    if (!this.popup) return;

    this.currentMode = 'main';
    this.popup.innerHTML = this.getMainContent();
    this.setupMainModeControls();
    this.restoreMainModeState();

    // Stop info audio if playing
    if (this.isInfoPlaying) {
      gameEventBus.emit('audio:stop-info', {});
      this.isInfoPlaying = false;
    }
  }

  private restoreMainModeState(): void {
    if (!this.popup) return;

    // Restore tree/plant selections
    const treeLabel = this.popup.querySelector('#tree-label') as HTMLElement;
    const plantLabel = this.popup.querySelector('#plant-label') as HTMLElement;
    const treeCard = this.popup.querySelector('#tree-card') as HTMLElement;
    const plantCard = this.popup.querySelector('#plant-card') as HTMLElement;

    if (this.currentSong) {
      if (treeLabel) treeLabel.textContent = this.currentTreeName || 'Baum wählen';
      if (plantLabel) plantLabel.textContent = this.currentPlantName || 'Pflanze wählen';
      if (treeCard && this.currentTreeName) treeCard.classList.add('selected');
      if (plantCard && this.currentPlantName) plantCard.classList.add('selected');

      const titleEl = this.popup.querySelector('#popup-title') as HTMLElement;
      if (titleEl) titleEl.textContent = this.currentSong.title || 'Agroforst Kombination';
    }

    // Restore volume icon state
    const volumeSlider = this.popup.querySelector('#volume-slider') as HTMLInputElement;
    if (volumeSlider) {
      const volumePercent = parseInt(volumeSlider.value);
      this.updateVolumeIcon(volumePercent);
    }
  }

  private toggleInfoAudio(): void {
    if (this.isInfoPlaying) {
      // Stop info audio
      gameEventBus.emit('audio:stop-info', {});
      this.isInfoPlaying = false;
      this.updateInfoButtonIcon(false);
    } else if (this.currentSong?.infoUrl) {
      // Play info audio
      gameEventBus.emit('audio:play-info', { infoUrl: this.currentSong.infoUrl });
      this.isInfoPlaying = true;
      this.updateInfoButtonIcon(true);
    }
  }

  private updateInfoButtonIcon(isPlaying: boolean): void {
    const speechIcon = this.popup?.querySelector('#speech-btn i') as HTMLElement;
    if (speechIcon) {
      speechIcon.textContent = isPlaying ? 'stop' : 'volume_up';
    }
  }

  // ====================================================================
  // VOLUME CONTROL
  // ====================================================================

  private setupVolumeSlider(slider: HTMLElement): void {
    const rangeInput = slider as HTMLInputElement;

    if (rangeInput) {
      // Set initial volume
      rangeInput.value = '70';
      this.updateVolumeIcon(70);

      // Handle input changes
      rangeInput.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const volumePercent = parseInt(target.value);
        const volume = volumePercent / 100;

        // Update icon based on volume level
        this.updateVolumeIcon(volumePercent);

        // Emit volume change event
        gameEventBus.emit('audio:volume-set', { volume });
      });

      // Handle touch for better mobile experience
      rangeInput.addEventListener('touchmove', (e: TouchEvent) => {
        e.preventDefault(); // Prevent scrolling while dragging
      });
    }
  }

  private updateVolumeIcon(volumePercent: number): void {
    if (!this.popup) return;

    const volumeIcon = this.popup.querySelector('.volume-icon i') as HTMLElement;
    if (!volumeIcon) return;

    // Change icon based on volume level
    if (volumePercent === 0) {
      volumeIcon.textContent = 'volume_off';
    } else if (volumePercent < 50) {
      volumeIcon.textContent = 'volume_down';
    } else {
      volumeIcon.textContent = 'volume_up';
    }
  }

  // ====================================================================
  // STATUS MESSAGES
  // ====================================================================

  private showStatus(message: string, type: string): void {
    // Simple status implementation - could be a toast or temporary message
    console.log(`[UI Status ${type.toUpperCase()}]:`, message);

    // Optional: Create temporary status element
    const status = document.createElement('div');
    status.className = `status-message status-${type}`;
    status.textContent = message;
    status.style.position = 'fixed';
    status.style.top = '20px';
    status.style.left = '50%';
    status.style.transform = 'translateX(-50%)';
    status.style.padding = '10px 20px';
    status.style.borderRadius = '20px';
    status.style.background =
      type === 'error' ? '#ff4444' : type === 'warning' ? '#ffaa00' : '#44ff44';
    status.style.color = 'white';
    status.style.zIndex = '10000';

    document.body.appendChild(status);

    setTimeout(() => {
      if (status.parentNode) {
        status.parentNode.removeChild(status);
      }
    }, 3000);
  }

  // ====================================================================
  // MANAGER INTERFACE
  // ====================================================================

  update(_elapsedTime: number, moodConfig?: MoodConfig): void {
    if (moodConfig?.ui?.borderColor) {
      if (this.popup) {
        this.popup.style.setProperty('--primary-color', moodConfig.ui.borderColor);
      }
      if (this.fab) {
        this.fab.style.setProperty('--primary', moodConfig.ui.borderColor);
      }
    }
  }

  // ====================================================================
  // AUTO-HIDE TIMER
  // ====================================================================

  private startAutoHideTimer(): void {
    this.clearAutoHideTimer();
    this.autoHideTimeout = window.setTimeout(() => {
      this.hidePopup();
    }, UI_TIMEOUTS.RFID_DISPLAY_DURATION);
  }

  private clearAutoHideTimer(): void {
    if (this.autoHideTimeout) {
      clearTimeout(this.autoHideTimeout);
      this.autoHideTimeout = null;
    }
  }

  dispose(): void {
    // Stop info audio if playing
    if (this.isInfoPlaying) {
      gameEventBus.emit('audio:stop-info', {});
    }
    this.clearAutoHideTimer();

    if (this.fab) {
      this.fab.remove();
    }

    if (this.popup) {
      this.popup.remove();
    }
  }
}
