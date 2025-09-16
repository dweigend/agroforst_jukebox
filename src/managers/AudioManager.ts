// @ts-expect-error - howler types not available, using any for now
import { Howl, Howler } from 'howler';
import { IAudioManager, Song, AudioState } from '../types';
import { gameEventBus } from '../events/GameEvents';
import { audioLogger } from '../utils/Logger';

export class AudioManager implements IAudioManager {
  private currentSong: Howl | null = null;
  private currentInfoAudio: Howl | null = null;
  private savedMusicVolume: number = 0.7;
  private audioState: AudioState = {
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    currentSong: null,
  };
  private progressUpdateInterval: number | null = null;

  constructor() {
    Howler.volume(this.audioState.volume);
    this.registerEventListeners();
    this.setupDevelopmentHelpers();
  }

  async play(song: Song): Promise<void> {
    if (!song || !song.audioUrl) {
      audioLogger.error('Invalid song data - missing audioUrl', song);
      return;
    }

    this.stop();

    this.audioState = {
      ...this.audioState,
      isLoading: true,
      currentSong: song,
    };
    this.emitAudioStateChanged();

    this.currentSong = new Howl({
      src: [song.audioUrl],
      html5: true,
      onload: () => {
        this.audioState.isLoading = false;
        this.audioState.duration = this.currentSong?.duration() || 0;
        this.emitAudioStateChanged();
        this.currentSong?.play();
        gameEventBus.emit('mood:change', { moodName: song.mood, reason: 'rfid-song' });
      },
      onloaderror: (id: any, err: any) => {
        audioLogger.error('Error loading song', { id, err });
        this.audioState.isLoading = false;
        this.emitAudioStateChanged();
        gameEventBus.emit('song:error', { songId: song.id, error: 'Failed to load audio' });
      },
      onplay: () => {
        this.audioState.isPlaying = true;
        this.startProgressUpdates();
        this.emitAudioStateChanged();
        gameEventBus.emit('audio:play', { songId: song.id, audioUrl: song.audioUrl });
      },
      onpause: () => {
        this.audioState.isPlaying = false;
        this.stopProgressUpdates();
        this.emitAudioStateChanged();
        gameEventBus.emit('audio:pause', { songId: song.id, currentTime: this.getCurrentTime() });
      },
      onstop: () => {
        this.audioState.isPlaying = false;
        this.stopProgressUpdates();
        this.emitAudioStateChanged();
        gameEventBus.emit('audio:stop', { songId: song.id });
      },
      onend: () => {
        this.audioState.isPlaying = false;
        this.stopProgressUpdates();
        this.emitAudioStateChanged();
        gameEventBus.emit('audio:ended', { songId: song.id, duration: this.getDuration() });
        this.currentSong = null;
      },
    });
  }

  pause(): void {
    this.currentSong?.pause();
  }

  resume(): void {
    this.currentSong?.play();
  }

  stop(): void {
    this.currentSong?.stop();
  }

  setVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audioState.volume = clampedVolume;
    this.audioState.isMuted = clampedVolume === 0;
    Howler.volume(clampedVolume);
    this.emitAudioStateChanged();
    gameEventBus.emit('audio:volume-changed', {
      volume: clampedVolume,
      isMuted: this.audioState.isMuted,
    });
  }

  getCurrentTime(): number {
    return this.currentSong?.seek() || 0;
  }

  getDuration(): number {
    return this.currentSong?.duration() || 0;
  }

  getAudioState(): AudioState {
    return {
      ...this.audioState,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
    };
  }

  // ====================================================================
  // INFO AUDIO FUNCTIONALITY
  // ====================================================================

  playInfoAudio(infoUrl: string): void {
    // Stop any existing info audio
    this.stopInfoAudio();

    // Duck background music to 10%
    if (this.currentSong && this.audioState.isPlaying) {
      this.savedMusicVolume = this.audioState.volume;
      this.fadeVolume(this.audioState.volume * 0.1, 500); // Fade to 10% in 500ms
    }

    // Create and play info audio
    this.currentInfoAudio = new Howl({
      src: [infoUrl],
      html5: true,
      volume: 1.0, // Info audio always at full volume
      onplay: () => {
        gameEventBus.emit('audio:info-started', { infoUrl });
      },
      onend: () => {
        this.onInfoAudioComplete();
      },
      onstop: () => {
        this.onInfoAudioComplete();
      },
      onloaderror: (id: any, err: any) => {
        audioLogger.error('Error loading info audio', { id, err, infoUrl });
        this.onInfoAudioComplete();
      },
    });

    this.currentInfoAudio.play();
  }

  stopInfoAudio(): void {
    if (this.currentInfoAudio) {
      this.currentInfoAudio.stop();
      this.currentInfoAudio = null;
    }
  }

  private onInfoAudioComplete(): void {
    this.currentInfoAudio = null;

    // Restore background music volume
    if (this.currentSong && this.audioState.isPlaying) {
      this.fadeVolume(this.savedMusicVolume, 500); // Fade back in 500ms
    }

    gameEventBus.emit('audio:info-ended', {});
  }

  private fadeVolume(targetVolume: number, duration: number): void {
    const startVolume = this.audioState.volume;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Linear fade
      const currentVolume = startVolume + (targetVolume - startVolume) * progress;
      this.setVolume(currentVolume);

      if (progress < 1) {
        requestAnimationFrame(fade);
      }
    };

    requestAnimationFrame(fade);
  }

  dispose(): void {
    this.stop();
    this.stopInfoAudio();
    Howler.unload();
  }

  private startProgressUpdates(): void {
    this.stopProgressUpdates();
    this.progressUpdateInterval = window.setInterval(() => {
      const currentTime = this.getCurrentTime();
      const duration = this.getDuration();
      if (this.audioState.isPlaying && duration > 0) {
        gameEventBus.emit('audio:progress', {
          currentTime,
          duration,
          progress: currentTime / duration,
        });
      }
    }, 100);
  }

  private stopProgressUpdates(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
      this.progressUpdateInterval = null;
    }
  }

  private emitAudioStateChanged(): void {
    gameEventBus.emit('audio:state-changed', this.getAudioState());
  }

  private registerEventListeners(): void {
    gameEventBus.on('song:selected', e => this.play(e.song));
    gameEventBus.on('audio:toggle-play', () => {
      if (this.audioState.isPlaying) {
        this.pause();
      } else if (this.currentSong) {
        this.resume();
      } else {
        gameEventBus.emit('rfid:request-current-song', {});
      }
    });
    gameEventBus.on('audio:volume-set', e => this.setVolume(e.volume));
    // Add audio:stop event listener
    gameEventBus.on('audio:stop', () => {
      this.stop();
      this.stopInfoAudio();
    });
    // Info audio events
    gameEventBus.on('audio:play-info', e => {
      if (e.infoUrl) {
        this.playInfoAudio(e.infoUrl);
      }
    });
    gameEventBus.on('audio:stop-info', () => this.stopInfoAudio());
  }

  private setupDevelopmentHelpers(): void {
    if ((import.meta as any).env?.DEV) {
      (window as any).audioManager = this;
    }
  }
}
