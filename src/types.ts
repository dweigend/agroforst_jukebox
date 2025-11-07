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
  ids: string[]; // Multiple hardware IDs ["0009812134", "T001_PAPPEL", "B001"]
  name: string; // Display name "Pappel"
  type: 'tree' | 'plant'; // Type classification
  info: string; // Educational description
  assetPath: string; // 3D model path
  scale?: {
    // Optional scale configuration for 3D rendering
    min: number; // Minimum scale factor
    max: number; // Maximum scale factor
  };
}

/**
 * PlantDatabase - Structure from plants.json
 */
export interface PlantDatabase {
  trees: Record<string, PlantInfo>; // Key: logical name "pappel"
  plants: Record<string, PlantInfo>; // Key: logical name "weizen"
}

/**
 * SongInfo - Song data structure from songs.json
 */
export interface SongInfo {
  id: string; // The key, e.g., "song_001"
  title: string;
  audioUrl: string;
  infoUrl?: string; // Optional info audio URL
  mood: string;
  tree: string; // Logical plant name "pappel"
  plant: string; // Logical plant name "weizen"
  info: string; // Educational description
}

/**
 * SongDatabase - Structure from songs.json
 */
export interface SongDatabase {
  [songId: string]: SongInfo; // Key: "song_001"
}

// ====================================================================
// MOOD CONFIGURATION SYSTEM
// ====================================================================

/**
 * MoodConfig - Complete mood configuration defining all visual aspects of a scene
 *
 * Each mood creates a unique atmospheric experience through:
 * - Colors (sky, fog, ground, vegetation)
 * - Lighting (ambient, key light, dynamic lights)
 * - Effects (bloom, particles)
 * - UI theming to match the mood
 *
 * Used by MoodManager to orchestrate the entire visual atmosphere
 */
export interface MoodConfig {
  /** Mood identifier name */
  name: string;

  /** Sky/background color (hex string e.g. '#87CEEB') */
  skyColor: string;

  /** Fog effect configuration for depth perception */
  fog: {
    /** Fog color, usually matches skyColor (hex string) */
    color: string;
    /**
     * Fog density (exponential)
     * Range: 0.001-0.01 (0.001=subtle, 0.01=heavy)
     */
    density: number;
  };

  /** Ambient light illuminating all objects equally */
  ambient: {
    /** Light color (hex string, typically white '#ffffff') */
    color: string;
    /**
     * Light intensity
     * Range: 0.0-2.0 (0.6=dim, 1.0=normal, 1.5+=bright)
     */
    intensity: number;
  };

  /** Main directional light source (sun/moon) */
  keyLight: {
    /** Light color (hex string e.g. '#FFDDAA' for warm) */
    color: string;
    /**
     * Light intensity
     * Range: 0-5 (0=off, 2-3=normal, 4-5=very bright)
     */
    intensity: number;
    /**
     * 3D position [x, y, z] in world units
     * Typical: [100, 150, 50] for sun-like positioning
     */
    position: number[];
  };

  /** Sun visualization settings */
  sun: {
    /** Whether sun object is visible in scene */
    visible: boolean;
    /** Sun color (hex string) */
    color: string;
  };

  /** Ground/terrain base color (hex string) */
  groundColor: string;

  /** Vegetation (trees/crops) styling configuration */
  vegetation: VegetationConfig;

  /** Bloom post-processing effect settings */
  bloom: BloomConfig;

  /** Optional particle system(s) for atmospheric effects */
  particles?: ParticleConfig | ParticleConfig[];

  /** Optional dynamic animated lights */
  dynamicLights?: DynamicLightConfig[];

  /** UI theming to match mood atmosphere */
  ui: UIConfig;
}

/**
 * Vegetation styling configuration for trees and plants
 */
export interface VegetationConfig {
  /** Base color for trees (hex string e.g. '#228B22') */
  treeColor: string;

  /** Base color for crops/plants (hex string e.g. '#ADFF2F') */
  cropColor: string;

  /** Enable color pulsing animation synchronized with music */
  pulsingColor?: boolean;

  /** Enable emissive glow effect on vegetation */
  emissiveGlow?: boolean;

  /** Color of the emissive glow (hex string e.g. '#ff4500') */
  emissiveColor?: string;
}

/**
 * Bloom post-processing effect configuration
 * Creates a glow/light bleeding effect for bright areas
 */
export interface BloomConfig {
  /**
   * Brightness threshold for bloom to activate
   * Range: 0.0-1.0 (0=everything glows, 1=only brightest)
   */
  threshold: number;

  /**
   * Bloom intensity/brightness
   * Range: 0.0-3.0 (0=no bloom, 3=very intense)
   */
  strength: number;

  /**
   * Bloom spread/blur radius
   * Range: 0.0-2.0 (0=tight glow, 2=wide spread)
   */
  radius: number;
}

/**
 * Particle system configuration for atmospheric effects
 */
export interface ParticleConfig {
  /** Optional name identifier for the particle system */
  name?: string;

  /** Total number of particles (performance: keep below 5000) */
  count: number;

  material: {
    /**
     * Particle size in pixels
     * Single value or [min, max] for random variation
     */
    size: number | [number, number];

    /**
     * Particle texture type
     * - 'sparkle': Glowing points, stars
     * - 'smoke': Soft, cloudy particles
     */
    textureType: 'sparkle' | 'smoke';

    /**
     * Blending mode
     * - 'additive': Bright, glowing effect (fire, sparks)
     * - 'normal': Standard transparency (smoke, dust)
     */
    blending: 'additive' | 'normal';

    /** Whether particles write to depth buffer (false=always visible) */
    depthWrite: boolean;

    /**
     * Particle transparency (0=invisible, 1=opaque)
     * Single value or [min, max] for variation
     */
    opacity: number | [number, number];

    /**
     * Particle color(s)
     * Single hex string or array for random colors
     * Special: 'rainbow' for animated colors
     */
    color: string | string[];
  };

  behavior: {
    /**
     * Spawn volume [width, height, depth] in world units
     * Particles spawn randomly within this box
     */
    spawnArea: number[];

    /**
     * Movement velocity [x, y, z] units per second
     * Can be array or [min, max] arrays for variation
     */
    velocity: number[] | [number[], number[]];

    /** Primary movement direction */
    direction: 'up' | 'down';
  };
}

/**
 * Light animation mode types for different visual effects
 */
export type LightAnimationMode = 'static' | 'strobe' | 'disco' | 'explosion' | 'pulse' | 'flash';

/**
 * Animation parameters for different light modes
 */
export interface LightAnimationParams {
  /** Strobe effect parameters */
  strobe?: {
    /** Chance per frame to trigger strobe (0.0-1.0) */
    triggerChance: number;
    /** Maximum intensity during strobe flash */
    maxIntensity: number;
    /** Fade speed back to base intensity (0.0-1.0) */
    fadeSpeed: number;
    /** Colors to alternate between during strobe */
    colors?: number[];
  };

  /** Disco ball rotation effect parameters */
  disco?: {
    /** Rotation speeds [clockwise, counterclockwise] */
    rotationSpeed: [number, number];
    /** Orbital radius around center point */
    radius: number;
    /** Whether light target should follow position */
    targetMovement: boolean;
    /** Height offset from base position */
    heightOffset?: number;
  };

  /** Explosion flash effect parameters */
  explosion?: {
    /** Chance per frame to trigger explosion (0.0-1.0) */
    triggerChance: number;
    /** Whether to randomize explosion position */
    randomPosition: boolean;
    /** Position variation range [x, y, z] */
    positionRange: [number, number, number];
    /** Explosion intensity multiplier */
    intensityMultiplier: number;
    /** Fade speed after explosion */
    fadeSpeed: number;
  };

  /** Pulse/breathing effect parameters */
  pulse?: {
    /** Pulse frequency (cycles per second) */
    frequency: number;
    /** Intensity range [min, max] as multipliers */
    intensityRange: [number, number];
    /** Phase offset for multiple pulse lights */
    phaseOffset?: number;
  };

  /** Quick flash effect parameters */
  flash?: {
    /** Flash duration in milliseconds */
    duration: number;
    /** Flash intensity multiplier */
    intensityMultiplier: number;
    /** Minimum time between flashes */
    cooldown: number;
  };
}

/**
 * Light animation configuration
 */
export interface LightAnimationConfig {
  /** Animation mode type */
  mode: LightAnimationMode;

  /** Mode-specific parameters */
  params: LightAnimationParams;

  /** Whether animation is enabled */
  enabled?: boolean;
}

/**
 * Dynamic light configuration for animated/special lighting effects
 */
export interface DynamicLightConfig {
  /** Unique identifier for the light */
  name: string;

  /**
   * Light type
   * - 'spot': Directional cone light (stage lights)
   * - 'point': Omnidirectional light (bulbs, explosions)
   */
  type: 'spot' | 'point';

  /**
   * Light color (hex number e.g. 0xff0000)
   * Array for animated color changes
   */
  color: number | number[];

  /**
   * Light intensity/brightness
   * Range: 0-500 (typical: 50-200)
   * [min, max] for pulsing/breathing effects
   */
  intensity: number | [number, number];

  /**
   * [SPOT ONLY] Cone angle in radians
   * Math.PI/6 = 30°, Math.PI/4 = 45°, Math.PI/3 = 60°
   */
  angle?: number;

  /**
   * [SPOT ONLY] Edge softness (0=hard edge, 1=soft fade)
   * Range: 0.0-1.0
   */
  penumbra?: number;

  /**
   * Light falloff rate over distance
   * Range: 1.0-3.0 (1=slow, 3=fast falloff)
   */
  decay?: number;

  /**
   * [POINT ONLY] Maximum light range in world units
   * Light fades to 0 at this distance
   */
  distance?: number;

  /**
   * 3D position [x, y, z] in world coordinates
   * - x: left(-) / right(+)
   * - y: down(-) / up(+)
   * - z: back(-) / front(+)
   * Can be [min, max] arrays for animated movement
   */
  position: number[] | [number[], number[]];

  /**
   * Optional animation configuration for dynamic light behavior
   * If not specified, light will be static
   */
  animation?: LightAnimationConfig;
}

/**
 * UI styling configuration for mood-based UI theming
 */
export interface UIConfig {
  /** Border color for UI elements (hex or 'rainbow' for animation) */
  borderColor: string;

  /** Shadow/glow color for UI elements (hex or 'rainbow') */
  shadowColor: string;

  /** Shadow blur radius in pixels (as string e.g. '30') */
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
  id: string; // Einzigartige Song-ID (z.B. "song_001")
  title: string; // Song-Titel
  artist: string; // Künstler/Artist Name
  audioUrl: string; // Audio-File URL oder lokaler Pfad
  mood: string; // Verknüpfung zu MoodConfig (z.B. "Harmonisch")
  info: string; // Educational description
  infoUrl?: string; // Optional info audio URL
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
      name: string; // Benutzerfreundlicher Name (z.B. "Eiche")
      type: 'tree'; // Type-Marker für Type-Safety
      assetPath: string; // Pfad zur 3D Asset Datei (z.B. "assets/3d_assets/tree_oak.obj")
      songIds: string[]; // Liste der Song-IDs die verfügbar sind
    };
  };
  plants: {
    [rfidId: string]: {
      name: string; // Benutzerfreundlicher Name (z.B. "Farn")
      type: 'plant'; // Type-Marker für Type-Safety
      assetPath: string; // Pfad zur 3D Asset Datei (z.B. "assets/3d_assets/wheat.obj")
      songIds: string[]; // Liste der Song-IDs die verfügbar sind
    };
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
  isPlaying: boolean; // Läuft gerade Audio?
  isLoading: boolean; // Wird Audio geladen?
  currentTime: number; // Aktuelle Wiedergabe-Position (Sekunden)
  duration: number; // Gesamtlänge des Songs (Sekunden)
  volume: number; // Lautstärke (0.0 - 1.0)
  isMuted: boolean; // Stumm geschaltet?
  currentSong: Song | null; // Aktueller Song oder null
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
  rfidId: string; // Gescannte 10-stellige RFID-ID
  type: 'tree' | 'plant'; // Erkannter Type basierend auf Mapping
  name: string; // Benutzerfreundlicher Name
  timestamp: number; // Event-Zeitstempel
  isValid: boolean; // Gültige ID in Mapping gefunden?
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
  song: Song; // Ausgewählter Song mit allen Metadaten
  treeId: string; // Auslösende Tree-RFID-ID
  treeName: string; // Tree-Name für UI-Anzeige
  plantId: string; // Auslösende Plant-RFID-ID
  plantName: string; // Plant-Name für UI-Anzeige
  mood: string; // Mood-Name für Visualisierung
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
  forced?: boolean; // Notfall-Transition ohne Validierung
}

/**
 * SelectionUpdateEvent - Event-Daten für Asset-Updates in Selection Mode
 */
export interface SelectionUpdateEvent {
  assetName: string; // 3D-Asset Filename (z.B. "tree_oak.obj")
  displayName: string; // Benutzerfreundlicher Name (z.B. "Linde")
  type: 'tree' | 'plant'; // Asset-Typ
}

/**
 * SelectionCompleteEvent - Event-Daten wenn Selection vollständig
 */
export interface SelectionCompleteEvent {
  treeAsset: string; // Gewähltes Baum-Asset
  plantAsset: string; // Gewähltes Pflanzen-Asset
  treeName: string; // Baum-Name für UI
  plantName: string; // Pflanzen-Name für UI
  combination: string; // Kombination-Key für Song-Lookup
}

/**
 * LandscapeGenerationEvent - Event-Daten für Landschafts-Generierung
 */
export interface LandscapeGenerationEvent {
  treeAsset: string; // 3D-Asset für Bäume
  plantAsset: string; // 3D-Asset für Pflanzen
  treeName: string; // Display-Name
  plantName: string; // Display-Name
  treeCount: number; // Anzahl Baum-Instanzen (default: 150)
  plantCount: number; // Anzahl Pflanzen-Instanzen (default: 10000)
}

/**
 * AssetLoadingEvent - Event-Daten für Asset-Loading Status
 */
export interface AssetLoadingEvent {
  assetName: string; // Name des Assets
  progress: number; // Loading-Progress 0-100
  status: 'loading' | 'completed' | 'failed';
  error?: string; // Fehler-Message bei Failure
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
