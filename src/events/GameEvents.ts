import { SongSelectionEvent, AudioState, GameState, PlantInfo } from '../types';

/**
 * Event System für lose gekoppelte Manager-Kommunikation
 *
 * Event-Flow: RFIDManager → SongManager → AudioManager → MoodManager
 * Vorteile: Testbarkeit, Erweiterbarkeit, Single Responsibility
 */

// Event Types für Type-Safety
export type GameEventType =
  // RFID Events
  | 'rfid:scan-detected' // A valid RFID card was scanned and identified
  | 'rfid:invalid-input' // Ungültige RFID-ID
  | 'rfid:state-changed' // RFID Game-State Änderung (LEGACY)

  // App State Events (NEW - für RFID Selection System)
  | 'app:state-changed' // App-State Transition (idle ↔ selection ↔ landscape)
  | 'app:idle-entered' // Idle-Modus betreten
  | 'app:selection-entered' // Selection-Modus betreten
  | 'app:landscape-entered' // Landscape-Modus betreten
  | 'app:transition-error' // State-Transition Fehler
  | 'app:emergency-reset' // Notfall-Reset zu Idle

  // Selection Events (NEW - für Pop-Up Pflanzen-Auswahl)
  | 'selection:entered' // Selection-Modus gestartet
  | 'selection:tree-updated' // Baum-Asset in Selection aktualisiert
  | 'selection:plant-updated' // Pflanzen-Asset in Selection aktualisiert
  | 'selection:complete' // Beide Assets gewählt - bereit für Landscape
  | 'selection:timeout' // Selection-Timeout (30s)
  | 'selection:cancelled' // Selection vom User abgebrochen

  // Landscape Events (NEW - für Asset-basierte Landschafts-Generation)
  | 'landscape:generate-from-selection' // Landschaft aus Selection-Result generieren
  | 'landscape:generation-started' // Asset-Loading gestartet
  | 'landscape:generation-completed' // Landschaft erfolgreich generiert
  | 'landscape:generation-failed' // Asset-Loading Fehler

  // Song Events
  | 'song:selected' // Song wurde durch Tree+Plant Kombination ausgewählt
  | 'song:loading' // Song wird geladen
  | 'song:loaded' // Song erfolgreich geladen
  | 'song:error' // Fehler beim Song-Laden

  // Audio Events
  | 'audio:play' // Audio-Wiedergabe gestartet
  | 'audio:pause' // Audio-Wiedergabe pausiert
  | 'audio:stop' // Audio-Wiedergabe gestoppt
  | 'audio:ended' // Song zu Ende gespielt
  | 'audio:progress' // Wiedergabe-Fortschritt Update
  | 'audio:volume-changed' // Lautstärke geändert
  | 'audio:state-changed' // Audio-State Update
  | 'audio:time-update' // Audio Zeit-Update für UI
  | 'audio:toggle-play' // Audio Play/Pause Toggle
  | 'audio:volume-set' // Lautstärke direkt setzen
  | 'audio:play-info' // Info-Audio abspielen
  | 'audio:stop-info' // Info-Audio stoppen
  | 'audio:info-started' // Info-Audio gestarted
  | 'audio:info-ended' // Info-Audio beendet

  // Mood Events
  | 'mood:change' // Mood-Wechsel angefordert
  | 'mood:changed' // Mood erfolgreich gewechselt

  // UI Events
  | 'ui:game-mode-toggle' // Game-Mode ein/aus
  | 'ui:error-show' // Fehler-Nachricht anzeigen
  | 'ui:error-clear' // Fehler-Nachricht löschen
  | 'ui:state-changed' // UI-State Update
  | 'ui:expanded' // UI-Panel erweitert
  | 'ui:collapsed' // UI-Panel eingeklappt
  | 'ui:open-inner-popup' // Inner UI Popup öffnen
  | 'ui:inner-popup-opened' // Inner UI Popup geöffnet
  | 'ui:inner-popup-closed' // Inner UI Popup geschlossen
  | 'ui:show-status' // Status anzeigen
  | 'ui:tree-selected' // Tree selection update
  | 'ui:plant-selected' // Plant selection update
  | 'ui:show-music-player' // Show music player UI
  | 'ui:selection-reset' // Reset selection display
  | 'ui:popup-opened' // Generic popup opened
  | 'ui:popup-closed' // Generic popup closed

  // Plant/Tree Info Events
  | 'plant:info-requested' // Pflanzen-Information angefordert

  // System Events
  | 'system:reset' // Komplettes System zurücksetzen
  | 'system:debug' // Debug-Information

  // RFID Request Events
  | 'rfid:request-current-song'; // Aktuellen Song von RFID anfordern

// Event Data Mapping für Type-Safety
export interface GameEventDataMap {
  // RFID Events
  'rfid:scan-detected': { plantInfo: PlantInfo };
  'rfid:invalid-input': { rfidId: string; reason: string };
  'rfid:state-changed': { state: GameState; previousState: GameState };

  // Song Events
  'song:selected': SongSelectionEvent;
  'song:loading': { songId: string };
  'song:loaded': { songId: string; duration: number };
  'song:error': { songId: string; error: string };

  // Audio Events
  'audio:play': { songId: string; audioUrl: string };
  'audio:pause': { songId: string; currentTime: number };
  'audio:stop': { songId: string };
  'audio:ended': { songId: string; duration: number };
  'audio:progress': { currentTime: number; duration: number; progress: number };
  'audio:volume-changed': { volume: number; isMuted: boolean };
  'audio:state-changed': AudioState;
  'audio:time-update': { currentTime: number; duration: number; progress: number };
  'audio:toggle-play': { songId?: string };
  'audio:volume-set': { volume: number };
  'audio:play-info': { infoUrl: string };
  'audio:stop-info': Record<string, never>;
  'audio:info-started': { infoUrl: string };
  'audio:info-ended': Record<string, never>;

  // Mood Events
  'mood:change': { moodName: string; reason: 'rfid-song' | 'manual' };
  'mood:changed': { moodName: string; previousMood: string };

  // App State Events (NEW - für RFID Selection System)
  'app:state-changed': { newState: string; previousState: string; timestamp: number };
  'app:idle-entered': { timestamp: number };
  'app:selection-entered': { timestamp: number };
  'app:landscape-entered': { timestamp: number };
  'app:transition-error': { error: string; fromState: string; toState: string };
  'app:emergency-reset': { reason: string };

  // Selection Events (NEW - für Pop-Up Pflanzen-Auswahl)
  'selection:entered': { timestamp: number };
  'selection:tree-updated': {
    treeName: string;
    rfidId: string;
    assetFileName: string;
    timestamp: number;
  };
  'selection:plant-updated': {
    plantName: string;
    rfidId: string;
    assetFileName: string;
    timestamp: number;
  };
  'selection:complete': {
    treeAsset: string;
    plantAsset: string;
    treeName: string;
    plantName: string;
    combination: string;
  };
  'selection:timeout': { reason: string };
  'selection:cancelled': { reason: string };

  // Landscape Events (NEW - für Asset-basierte Landschafts-Generation)
  'landscape:generate-from-selection': {
    treeAsset: string;
    plantAsset: string;
    treeName: string;
    plantName: string;
    treeInfo: PlantInfo;   // Complete plant info for scale configuration
    plantInfo: PlantInfo;  // Complete plant info for scale configuration
  };
  'landscape:generation-started': {
    treeAsset: string;
    plantAsset: string;
    treeName: string;
    plantName: string;
    treeCount: number;
    plantCount: number;
  };
  'landscape:generation-completed': {
    treeAsset: string;
    plantAsset: string;
    treeName: string;
    plantName: string;
    success: boolean;
    fallback?: boolean;
  };
  'landscape:generation-failed': { treeAsset: string; plantAsset: string; error: string };

  // UI Events
  'ui:game-mode-toggle': { enabled: boolean };
  'ui:error-show': { message: string; type: 'error' | 'warning' | 'info' };
  'ui:error-clear': Record<string, never>;
  'ui:state-changed': { gameState: GameState };
  'ui:expanded': Record<string, never>;
  'ui:collapsed': Record<string, never>;
  'ui:open-inner-popup': { mode: 'main' | 'info' };
  'ui:inner-popup-opened': { mode: 'main' | 'info' };
  'ui:inner-popup-closed': Record<string, never>;
  'ui:show-status': { message: string; type?: 'info' | 'success' | 'warning' | 'error' };
  'ui:tree-selected': { treeName: string; logicalName: string };
  'ui:plant-selected': { plantName: string; logicalName: string };
  'ui:show-music-player': Record<string, never>;
  'ui:selection-reset': Record<string, never>;
  'ui:popup-opened': Record<string, never>;
  'ui:popup-closed': Record<string, never>;

  // Plant/Tree Info Events
  'plant:info-requested': Record<string, never>;

  // System Events
  'system:reset': { reason: string };
  'system:debug': { component: string; data: unknown };

  // RFID Request Events
  'rfid:request-current-song': Record<string, never>;
}

// Event-Listener Function Type
export type GameEventListener<T extends GameEventType> = (data: GameEventDataMap[T]) => void;

// Event-Listener Registration
export interface EventListenerRegistration<T extends GameEventType> {
  event: T;
  listener: GameEventListener<T>;
  once?: boolean; // Nur einmal ausführen?
}

// GameEventBus - Observer Pattern für Manager-Kommunikation
class GameEventBus {
  private listeners = new Map<GameEventType, Set<GameEventListener<GameEventType>>>();
  private onceListeners = new Map<GameEventType, Set<GameEventListener<GameEventType>>>();
  private debugEnabled = false;

  // High-frequency events die nicht geloggt werden sollen (erweitert)
  private silentEvents: Set<GameEventType> = new Set([
    'audio:progress',
    'audio:time-update',
    'audio:state-changed',
    'ui:state-changed',
    'system:debug',
    'audio:volume-changed', // Volume slider drag events
  ]);

  // Event-Listener registrieren
  on<T extends GameEventType>(
    event: T,
    listener: GameEventListener<T>,
    once: boolean = false
  ): void {
    const listenerMap = once ? this.onceListeners : this.listeners;

    if (!listenerMap.has(event)) {
      listenerMap.set(event, new Set());
    }

    listenerMap.get(event)!.add(listener as GameEventListener<GameEventType>);

    if (this.debugEnabled) {
      console.log(`[GameEvents] Registered listener for '${String(event)}'`);
    }
  }

  // Event-Listener einmalig registrieren
  once<T extends GameEventType>(event: T, listener: GameEventListener<T>): void {
    this.on(event, listener, true);
  }

  // Event-Listener entfernen
  off<T extends GameEventType>(event: T, listener: GameEventListener<T>): void {
    this.listeners.get(event)?.delete(listener as GameEventListener<GameEventType>);
    this.onceListeners.get(event)?.delete(listener as GameEventListener<GameEventType>);

    if (this.debugEnabled) {
      console.log(`[GameEvents] Removed listener for '${String(event)}'`);
    }
  }

  // Event emittieren an alle Listener
  emit<T extends GameEventType>(event: T, data: GameEventDataMap[T]): void {
    // Nur loggen wenn Debug aktiviert UND Event nicht in Silent-Liste
    if (this.debugEnabled && !this.silentEvents.has(event)) {
      console.log(`[GameEvents] Emitting '${String(event)}'`, data);
    }

    this.executeListeners(this.listeners.get(event), data, event);
    this.executeOnceListeners(this.onceListeners.get(event), data, event);
  }

  // Normale Listener ausführen
  private executeListeners<T extends GameEventType>(
    listeners: Set<GameEventListener<GameEventType>> | undefined,
    data: GameEventDataMap[T],
    event: T
  ): void {
    if (!listeners) return;

    listeners.forEach(listener => {
      try {
        (listener as GameEventListener<T>)(data);
      } catch (error) {
        console.error(`[GameEvents] Error in listener for '${event}':`, error);
      }
    });
  }

  // Einmalige Listener ausführen und cleanup
  private executeOnceListeners<T extends GameEventType>(
    listeners: Set<GameEventListener<GameEventType>> | undefined,
    data: GameEventDataMap[T],
    event: T
  ): void {
    if (!listeners) return;

    listeners.forEach(listener => {
      try {
        (listener as GameEventListener<T>)(data);
      } catch (error) {
        console.error(`[GameEvents] Error in once-listener for '${event}':`, error);
      }
    });

    listeners.clear();
  }

  // Alle Listener für ein Event entfernen
  removeAllListeners(event: GameEventType): void {
    this.listeners.delete(event);
    this.onceListeners.delete(event);

    if (this.debugEnabled) {
      console.log(`[GameEvents] Removed all listeners for '${String(event)}'`);
    }
  }

  // Alle Listener komplett löschen
  removeAllListenersForAllEvents(): void {
    this.listeners.clear();
    this.onceListeners.clear();

    if (this.debugEnabled) {
      console.log('[GameEvents] Removed all listeners for all events');
    }
  }

  // Debug-Modus ein/ausschalten
  setDebugMode(enabled: boolean): void {
    this.debugEnabled = enabled;
  }

  // Event-Statistics für Debugging
  getEventStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};

    this.listeners.forEach((listeners, event) => {
      stats[event] = listeners.size;
    });

    this.onceListeners.forEach((listeners, event) => {
      stats[event + ' (once)'] = listeners.size;
    });

    return stats;
  }

  // Promise-basiertes Warten auf Event (für Tests)
  waitForEvent<T extends GameEventType>(
    event: T,
    timeout: number = 5000
  ): Promise<GameEventDataMap[T]> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Timeout waiting for event '${event}' after ${timeout}ms`));
      }, timeout);

      const listener: GameEventListener<T> = data => {
        clearTimeout(timeoutId);
        this.off(event, listener);
        resolve(data);
      };

      this.once(event, listener);
    });
  }
}

// Singleton EventBus für alle Manager
export const gameEventBus = new GameEventBus();

// Development Setup - Debug mode now DISABLED by default for clean console
if ((import.meta as { env?: { DEV?: boolean } }).env?.DEV) {
  gameEventBus.setDebugMode(false); // ✅ FIXED: No more console flooding
  if (typeof window !== 'undefined') {
    (window as any).gameEventBus = gameEventBus;
    // Enable debug manually via console: gameEventBus.setDebugMode(true)
    console.log('🔧 GameEvents debug disabled by default. Enable: gameEventBus.setDebugMode(true)');
  }
}

// Manager-spezifische Event-Listener Registrierung
export function registerManagerEvents(
  managerName: string,
  registrations: EventListenerRegistration<GameEventType>[]
): void {
  registrations.forEach(({ event, listener, once = false }) => {
    gameEventBus.on(event, listener, once);
  });
}

// Manager-Cleanup (placeholder)
export function cleanupManagerEvents(_managerName: string): void {
  // Manager müssen ihre Listener selbst cleanup-en
  return;
}

// Event-Chain Debugging
export function debugEventChain(_chainName: string, events: GameEventType[]): void {
  events.forEach((event, _index) => {
    gameEventBus.once(event, (_data: unknown) => {
      console.log(`[GameEvents] Event '${String(event)}' fired in chain`);
    });
  });
}
