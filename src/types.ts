import * as THREE from 'three';

/**
 * ====================================================================
 * ZENTRALE TYPE DEFINITIONS FÜR AGROFORST-VISUALIZER
 * ====================================================================
 * 
 * Diese Datei definiert alle TypeScript-Interfaces für:
 * - Mood-Konfiguration (7 verschiedene Stimmungen)
 * - Manager-Contracts (Single Responsibility Interfaces)
 * - JSON-basierte Datenstrukturen (Plants, Songs, Hardware-Mappings)
 * - Performance-kritische Datenstrukturen
 * - Type-sichere Konfiguration-Validierung
 * 
 * Design-Prinzipien:
 * - Interface Segregation: Kleine, fokussierte Interfaces
 * - Type Safety: Verhindert Runtime-Fehler durch falsche Konfiguration
 * - Extensibility: Neue Moods/Manager ohne Breaking Changes
 * - Self-Documenting: Interfaces als lebende Dokumentation
 */

// ====================================================================
// JSON-BASED DATA STRUCTURES (NEW)
// ====================================================================

/**
 * PlantInfo - Unified plant/tree data structure from plants.json
 */
export interface PlantInfo {
  ids: string[];           // Multiple hardware IDs ["0009812134", "T001_PAPPEL", "B001"]
  name: string;            // Display name "Pappel"
  type: 'tree' | 'plant';  // Type classification
  info: string;            // Educational description
  assetPath: string;       // 3D model path
}

/**
 * PlantDatabase - Structure from plants.json
 */
export interface PlantDatabase {
  trees: Record<string, PlantInfo>;    // Key: logical name "pappel"
  plants: Record<string, PlantInfo>;   // Key: logical name "weizen"
}

/**
 * SongInfo - Song data structure from songs.json
 */
export interface SongInfo {
  id: string;        // The key, e.g., "song_001"
  title: string;
  audioUrl: string;
  infoUrl?: string;  // Optional info audio URL
  mood: string;
  tree: string;      // Logical plant name "pappel"
  plant: string;     // Logical plant name "weizen"
  info: string;      // Educational description
}

/**
 * SongDatabase - Structure from songs.json
 */
export interface SongDatabase {
  [songId: string]: SongInfo;  // Key: "song_001"
}

// ====================================================================
// MOOD CONFIGURATION SYSTEM
// ====================================================================

/**
 * MoodConfig - Zentrale Stimmungs-Konfiguration
 * 
 * Definiert eine komplette 3D-Welt-Konfiguration:
 * - Globale Szenen-Eigenschaften (Himmel, Nebel)
 * - Manager-spezifische Konfigurationen
 * - Performance-Parameter (Partikel-Counts, etc.)
 * 
 * Wird verwendet von:
 * - MoodManager für Stimmungs-Orchestrierung
 * - Alle Manager für ihre spezifischen Konfigurationen
 * - Animation Loop für Mood-spezifische Animationen
 */
export interface MoodConfig {
  name: string;
  skyColor: string;
  fog: {
    color: string;
    density: number;
  };
  ambient: {
    color: string;
    intensity: number;
  };
  keyLight: {
    color: string;
    intensity: number;
    position: number[];
  };
  sun: {
    visible: boolean;
    color: string;
  };
  groundColor: string;
  vegetation: VegetationConfig;
  bloom: BloomConfig;
  particles?: ParticleConfig | ParticleConfig[];
  dynamicLights?: DynamicLightConfig[];
  ui: UIConfig;
}

export interface VegetationConfig {
  treeColor: string;
  cropColor: string;
  pulsingColor?: boolean;
  emissiveGlow?: boolean;
  emissiveColor?: string;
}

export interface BloomConfig {
  threshold: number;
  strength: number;
  radius: number;
}

export interface ParticleConfig {
  name?: string;
  count: number;
  material: {
    size: number;
    textureType: 'sparkle' | 'smoke';
    blending: 'additive' | 'normal';
    depthWrite: boolean;
    opacity: number;
    color: string;
  };
  behavior: {
    spawnArea: number[];
    velocity: number[];
    direction: 'up' | 'down';
  };
}

export interface DynamicLightConfig {
  name: string;
  type: 'spot' | 'point';
  color: number;
  intensity: number;
  angle?: number;
  penumbra?: number;
  decay?: number;
  distance?: number;
  position: number[];
}

export interface UIConfig {
  borderColor: string;
  shadowColor: string;
  shadowBlur: string;
}

// Manager interfaces
export interface IManager {
  update?(deltaTime: number, moodConfig?: MoodConfig): void;
  dispose?(): void;
}

export interface ICameraManager extends IManager {
  toggleAutoRotation(): boolean;
}

export interface ILandscapeManager extends IManager {
  applyMood(config: MoodConfig): void;
}

export interface IMoodManager {
  getMoodNames(): string[];
  getCurrentMoodConfig(): MoodConfig | null;
  applyMood(moodName: string): void;
}

export interface ISceneManager {
  scene: THREE.Scene;
  lightManager: IManager & { applyMood(config: MoodConfig): void };
  effectManager: IManager & { applyMood(config: MoodConfig): void };
  landscapeManager: IManager & { applyMood(config: MoodConfig): void };
  cameraManager: IManager;
}

// Particle system type
export interface ParticleSystem {
  points: THREE.Points;
  behavior: ParticleConfig['behavior'];
}

// Light storage type
export interface LightStorage {
  [key: string]: THREE.Light;
}

// ====================================================================
// RFID MUSIC-PLAYER SYSTEM
// ====================================================================

/**
 * Song - Zentrale Song-Definition für RFID Music-Player
 * 
 * Definiert einen Song mit allen Metadaten:
 * - Audio-Eigenschaften (Titel, Artist, URL, Dauer)
 * - RFID-Verknüpfungen (Tree-IDs, Plant-IDs)
 * - Mood-Integration für automatische Visualisierung
 */
export interface Song {
  id: string;                           // Einzigartige Song-ID (z.B. "song_001")
  title: string;                        // Song-Titel
  artist: string;                       // Künstler/Artist Name
  audioUrl: string;                     // Audio-File URL oder lokaler Pfad
  mood: string;                         // Verknüpfung zu MoodConfig (z.B. "Harmonisch")
  info: string;                         // Educational description
  infoUrl?: string;                     // Optional info audio URL
}

/**
 * RFIDMapping - Zuordnung von RFID-IDs zu Baum/Pflanzen-Definitionen
 * 
 * Mappt physische RFID-Karten zu logischen Tree/Plant-Objekten:
 * - RFID-ID als Key (10-stellige Zahl: "0009812134")
 * - Metadaten (Name, Type, verknüpfte Songs)
 * - Type-sichere Unterscheidung zwischen Trees und Plants
 */
export interface RFIDMapping {
  trees: {
    [rfidId: string]: {
      name: string;                     // Benutzerfreundlicher Name (z.B. "Eiche")
      type: 'tree';                     // Type-Marker für Type-Safety
      assetPath: string;                // Pfad zur 3D Asset Datei (z.B. "assets/3d_assets/tree_oak.obj")
      songIds: string[];                // Liste der Song-IDs die verfügbar sind
    }
  };
  plants: {
    [rfidId: string]: {
      name: string;                     // Benutzerfreundlicher Name (z.B. "Farn")
      type: 'plant';                    // Type-Marker für Type-Safety
      assetPath: string;                // Pfad zur 3D Asset Datei (z.B. "assets/3d_assets/wheat.obj")
      songIds: string[];                // Liste der Song-IDs die verfügbar sind
    }
  };
}

/**
 * GameState - State Machine für RFID-Game UI
 * 
 * Definiert die verschiedenen Zustände des RFID-Games:
 * - Standby: Wartet auf erste RFID-Karte (Baum)
 * - TreeSelected: Baum wurde gescannt, wartet auf Pflanze
 * - PlantSelected: Beide Karten gescannt, Song wird geladen
 * - Playing: Song wird abgespielt mit Mood-Visualisierung
 * - Error: Fehler-Zustand bei ungültigen IDs oder Audio-Problemen
 */
export type GameState = 'standby' | 'treeSelected' | 'plantSelected' | 'playing' | 'error';

/**
 * AudioState - Status des Audio-Players
 * 
 * Verwaltet den aktuellen Zustand der Audio-Wiedergabe:
 * - Playback-Status und Zeitinformationen
 * - Volume und Fade-Effekt Status
 * - Loading-State für UI-Feedback
 */
export interface AudioState {
  isPlaying: boolean;                   // Läuft gerade Audio?
  isLoading: boolean;                   // Wird Audio geladen?
  currentTime: number;                  // Aktuelle Wiedergabe-Position (Sekunden)
  duration: number;                     // Gesamtlänge des Songs (Sekunden)
  volume: number;                       // Lautstärke (0.0 - 1.0)
  isMuted: boolean;                     // Stumm geschaltet?
  currentSong: Song | null;             // Aktueller Song oder null
}

/**
 * RFIDInputEvent - Event-Daten für RFID-Eingaben
 * 
 * Strukturiert die Daten die vom RFIDManager an andere Manager gesendet werden:
 * - Gescannte RFID-ID mit Validation
 * - Type-Information (Tree vs Plant)
 * - Timestamp für Debugging/Logging
 */
export interface RFIDInputEvent {
  rfidId: string;                       // Gescannte 10-stellige RFID-ID
  type: 'tree' | 'plant';               // Erkannter Type basierend auf Mapping
  name: string;                         // Benutzerfreundlicher Name
  timestamp: number;                    // Event-Zeitstempel
  isValid: boolean;                     // Gültige ID in Mapping gefunden?
}

/**
 * SongSelectionEvent - Event-Daten für Song-Auswahl
 * 
 * Strukturiert die Daten wenn ein Song durch Tree+Plant Kombination ausgewählt wurde:
 * - Vollständige Song-Informationen
 * - Auslösende Tree/Plant Kombination für UI-Anzeige
 * - Mood-Information für automatische Visualisierung
 */
export interface SongSelectionEvent {
  song: Song;                           // Ausgewählter Song mit allen Metadaten
  treeId: string;                       // Auslösende Tree-RFID-ID
  treeName: string;                     // Tree-Name für UI-Anzeige
  plantId: string;                      // Auslösende Plant-RFID-ID
  plantName: string;                    // Plant-Name für UI-Anzeige
  mood: string;                         // Mood-Name für Visualisierung
}

/**
 * ====================================================================
 * NEW EVENT TYPES FÜR RFID SELECTION SYSTEM  
 * ====================================================================
 */

/**
 * AppStateChangeEvent - Event-Daten für App-State Transitions
 */
export interface AppStateChangeEvent {
  from: 'idle' | 'selection' | 'landscape' | 'transitioning' | null;
  to: 'idle' | 'selection' | 'landscape' | 'transitioning';
  data?: any;
  forced?: boolean;                     // Notfall-Transition ohne Validierung
}

/**
 * SelectionUpdateEvent - Event-Daten für Asset-Updates in Selection Mode
 */
export interface SelectionUpdateEvent {
  assetName: string;                    // 3D-Asset Filename (z.B. "tree_oak.obj")
  displayName: string;                  // Benutzerfreundlicher Name (z.B. "Linde")
  type: 'tree' | 'plant';              // Asset-Typ
}

/**
 * SelectionCompleteEvent - Event-Daten wenn Selection vollständig
 */
export interface SelectionCompleteEvent {
  treeAsset: string;                    // Gewähltes Baum-Asset
  plantAsset: string;                   // Gewähltes Pflanzen-Asset  
  treeName: string;                     // Baum-Name für UI
  plantName: string;                    // Pflanzen-Name für UI
  combination: string;                  // Kombination-Key für Song-Lookup
}

/**
 * LandscapeGenerationEvent - Event-Daten für Landschafts-Generierung
 */
export interface LandscapeGenerationEvent {
  treeAsset: string;                    // 3D-Asset für Bäume
  plantAsset: string;                   // 3D-Asset für Pflanzen
  treeName: string;                     // Display-Name
  plantName: string;                    // Display-Name
  treeCount: number;                    // Anzahl Baum-Instanzen (default: 150)
  plantCount: number;                   // Anzahl Pflanzen-Instanzen (default: 10000)
}

/**
 * AssetLoadingEvent - Event-Daten für Asset-Loading Status  
 */
export interface AssetLoadingEvent {
  assetName: string;                    // Name des Assets
  progress: number;                     // Loading-Progress 0-100
  status: 'loading' | 'completed' | 'failed';
  error?: string;                       // Fehler-Message bei Failure
}


// Manager interfaces für neue RFID-System Manager
export interface IAudioManager extends IManager {
  play(song: Song): Promise<void>;
  pause(): void;
  stop(): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getAudioState(): AudioState;
}

export interface IRFIDManager extends IManager {
  startListening(): void;
  stopListening(): void;
  getCurrentGameState(): GameState;
}

export interface ISongManager extends IManager {
  findSongByIds(treeId: string, plantId: string): Song | null;
  getAllSongs(): Song[];
  getSongsByMood(mood: string): Song[];
  resetSelection(): void;
  getCurrentSelection(): { treeId: string | null; plantId: string | null };
}

