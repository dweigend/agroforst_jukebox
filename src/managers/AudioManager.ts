// @ts-expect-error - howler types not available, using any for now
import { Howl, Howler } from 'howler';
import { IAudioManager, Song, AudioState } from '../types';
import { gameEventBus } from '../events/GameEvents';
import { audioLogger } from '../utils/Logger';

export enum AudioChannel {
  MASTER = 'master',
  MUSIC = 'music',
  VOICE = 'voice',
  SFX = 'sfx'
}

export class AudioManager implements IAudioManager {
  private currentSong: Howl | null = null;
  private currentInfoAudio: Howl | null = null;

  // Channel-based volume system
  private channels = new Map<string, number>([
    [AudioChannel.MASTER, 0.7],
    [AudioChannel.MUSIC, 1.0],
    [AudioChannel.VOICE, 1.0],
    [AudioChannel.SFX, 1.0]
  ]);

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
    // Set initial master volume from channel system
    this.audioState.volume = this.channels.get(AudioChannel.MASTER)!;
    Howler.volume(this.audioState.volume);
    this.registerEventListeners();
    this.setupDevelopmentHelpers();
  }

  // ====================================================================
  // CHANNEL-BASED VOLUME SYSTEM
  // ====================================================================

  private calculateVolume(channel: string): number {
    const masterVolume = this.channels.get(AudioChannel.MASTER) || 0.7;
    const channelVolume = this.channels.get(channel) || 1.0;
    return masterVolume * channelVolume;
  }

  setChannelVolume(channel: string, volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.channels.set(channel, clampedVolume);

    // Update master volume state if master channel changed
    if (channel === AudioChannel.MASTER) {
      this.audioState.volume = clampedVolume;
      this.audioState.isMuted = clampedVolume === 0;
      Howler.volume(clampedVolume); // Keep Howler master in sync
      this.emitAudioStateChanged();
      gameEventBus.emit('audio:volume-changed', {
        volume: clampedVolume,
        isMuted: this.audioState.isMuted,
        channel: channel,
      });
    }

    // Update volumes of active audio instances
    this.updateActiveAudioVolumes();
  }

  getChannelVolume(channel: string): number {
    return this.channels.get(channel) || 1.0;
  }

  private updateActiveAudioVolumes(): void {
    if (this.currentSong) {
      this.currentSong.volume(this.calculateVolume(AudioChannel.MUSIC));
    }
    if (this.currentInfoAudio) {
      this.currentInfoAudio.volume(this.calculateVolume(AudioChannel.VOICE));
    }
  }

  private createAudio(src: string, channel: string, callbacks: any = {}): Howl {
    return new Howl({
      src: [src],
      html5: true,
      volume: this.calculateVolume(channel),
      ...callbacks
    });
  }

  // ====================================================================
  // AUDIO PLAYBACK (UI-Compatible API)
  // ====================================================================

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

    this.currentSong = this.createAudio(song.audioUrl, AudioChannel.MUSIC, {
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

    // Duck background music to 10% using channel system
    if (this.currentSong && this.audioState.isPlaying) {
      this.setChannelVolume(AudioChannel.MUSIC, 0.1);
    }

    // Create and play info audio in voice channel
    this.currentInfoAudio = this.createAudio(infoUrl, AudioChannel.VOICE, {
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

    // Restore background music volume using channel system
    if (this.currentSong && this.audioState.isPlaying) {
      this.setChannelVolume(AudioChannel.MUSIC, 1.0);
    }

    gameEventBus.emit('audio:info-ended', {});
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
    gameEventBus.on('audio:volume-set', e => this.setChannelVolume(AudioChannel.MASTER, e.volume));
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
