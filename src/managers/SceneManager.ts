import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LightManager } from './LightManager';
import { EffectManager } from './EffectManager';
import { LandscapeManager } from './LandscapeManager';
import { CameraManager } from './CameraManager';
import { MoodManager } from './MoodManager';
import { IManager, MoodConfig } from '../types';

/**
 * SceneManager - Der Dirigent der gesamten 3D-Anwendung
 *
 * Verantwortlichkeiten:
 * - Initialisierung aller Three.js Kernkomponenten (Scene, Camera, Renderer)
 * - Koordination aller spezialisierten Manager
 * - Zentrale Animation Loop mit 60 FPS
 * - Window Resize Handling für Responsive Design
 * - Performance-optimierte Render-Pipeline mit Post-Processing
 *
 * Architektur-Pattern: Facade + Coordinator
 * - Stellt einheitliche API für komplexe 3D-Pipeline bereit
 * - Koordiniert Manager ohne deren interne Details zu kennen
 * - Trennt Three.js Setup von Feature-spezifischer Logik
 */
export class SceneManager {
  // HTML Container für das 3D Canvas
  private container: HTMLElement;

  // Three.js Core Components
  public scene!: THREE.Scene;
  private clock!: THREE.Clock;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  // Specialized Managers
  public lightManager!: LightManager;
  public effectManager!: EffectManager;
  public landscapeManager!: LandscapeManager;
  public cameraManager!: CameraManager;

  /**
   * Initialisiert den SceneManager mit einem HTML Container
   * @param container HTML Element das das 3D Canvas aufnehmen soll
   */
  constructor(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  /**
   * Initialisiert alle Three.js Komponenten und Manager
   *
   * Setup-Reihenfolge ist wichtig:
   * 1. Three.js Core (Scene, Clock, Camera, Renderer)
   * 2. Renderer-Konfiguration (Shadows, ToneMapping, etc.)
   * 3. Manager-Initialisierung (mit Abhängigkeiten)
   * 4. Controls & Event Listener
   */
  private init(): void {
    // === THREE.JS CORE SETUP ===

    // 3D Szene - Container für alle Objekte, Lichter, etc.
    this.scene = new THREE.Scene();

    // High-Precision Timer für smooth Animationen (WebGL-optimiert)
    this.clock = new THREE.Clock();

    // === KAMERA KONFIGURATION ===
    // PerspectiveCamera simuliert menschliche Sicht
    this.camera = new THREE.PerspectiveCamera(
      75, // Field of View (75° = natürlicher Betrachtungswinkel)
      this.container.clientWidth / this.container.clientHeight, // Aspect Ratio
      0.1, // Near Plane (sehr nah für Details)
      2000 // Far Plane (weit genug für große Landschaft)
    );
    // Initiale Kamera-Position: leicht erhöht, mit Abstand zur Szene
    this.camera.position.set(0, 50, 200);

    // === WEBGL RENDERER SETUP ===
    this.renderer = new THREE.WebGLRenderer({
      antialias: true, // Glättet gezackte Kanten (performance vs quality tradeoff)
    });

    // Renderer-Größe an Container anpassen
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Pixel Ratio für High-DPI Displays (Retina, 4K, etc.)
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // === SCHATTEN-SYSTEM AKTIVIEREN ===
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Weiche Schatten

    // === TONE MAPPING FÜR REALISTISCHE BELEUCHTUNG ===
    // ACES Filmic: Verhindert "Überbelichtung" bei hellen Bloom-Effekten
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1; // Leicht überbelichtet für warme Atmosphäre

    // Canvas in HTML Container einbetten
    this.container.appendChild(this.renderer.domElement);

    // === SPEZIALISIERTE MANAGER INITIALISIEREN ===
    // Reihenfolge: Vom grundlegendsten zum abhängigsten

    // LightManager: Basis-Beleuchtung (Ambient, Directional, Sun)
    this.lightManager = new LightManager(this.scene);

    // EffectManager: Partikel + Post-Processing (benötigt Scene, Camera, Renderer)
    this.effectManager = new EffectManager(this.scene, this.camera, this.renderer);

    // LandscapeManager: Terrain + Vegetation (benötigt nur Scene)
    this.landscapeManager = new LandscapeManager(this.scene);

    // === KAMERA-STEUERUNG SETUP ===
    // OrbitControls: Manuelle Maus/Touch Steuerung
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // Sanfte, träge Bewegung
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Verhindert "Unter-den-Boden-schauen"

    // CameraManager: Wechsel zwischen Auto-Rotation und manueller Steuerung
    this.cameraManager = new CameraManager(this.camera, this.controls);

    // === RESPONSIVE DESIGN ===
    // Event Listener für Window Resize (wichtig für Mobile/Tablet)
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * Responsive Design Handler - passt 3D Szene an Fenster-Größenänderungen an
   *
   * Kritisch für:
   * - Mobile/Tablet Rotation
   * - Desktop Window Resize
   * - Multi-Monitor Setups
   *
   * Muss synchronisiert werden:
   * - Camera Aspect Ratio
   * - Renderer Size
   * - Post-Processing Composer Size
   */
  private onWindowResize(): void {
    // Kamera Aspect Ratio aktualisieren (verhindert Verzerrung)
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix(); // Matrix neu berechnen

    // WebGL Renderer Größe anpassen
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

    // Post-Processing Pipeline (EffectComposer) ebenfalls anpassen
    // Wichtig für UnrealBloom und andere Screen-Space Effekte
    this.effectManager.composer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  /**
   * Zentrale Animation Loop - Das Herzstück der 3D-Anwendung
   *
   * Läuft mit 60 FPS (requestAnimationFrame) und koordiniert:
   * - Zeit-Management (deltaTime für frame-unabhängige Animation)
   * - Manager Updates in optimaler Reihenfolge
   * - Spezielle Mood-spezifische Animationen
   * - Final Render durch Post-Processing Pipeline
   *
   * Performance-kritisch: Jede Millisekunde zählt hier!
   *
   * @param moodManager Liefert aktuelle Stimmungs-Konfiguration
   * @param uiManager Für Border-Animationen und Button-States
   */
  animate(moodManager: MoodManager, uiManager: IManager): void {
    // Rekursiver Aufruf für nächsten Frame (60 FPS)
    requestAnimationFrame(() => this.animate(moodManager, uiManager));

    // Zeit-Management und Mood-Config abrufen
    const { deltaTime, elapsedTime, currentMoodConfig } = this.getAnimationTimingData(moodManager);

    // Nur animieren wenn eine Stimmung aktiv ist
    if (currentMoodConfig) {
      this.updateAllManagers(deltaTime, elapsedTime, currentMoodConfig, uiManager);
      this.applySpecialMoodAnimations(elapsedTime, currentMoodConfig);
    }

    // Final render durch Post-Processing Pipeline
    this.effectManager.composer.render();
  }

  /**
   * Sammelt Zeit-Daten für Animation Loop
   * Single Responsibility: Zeit-Management isolieren
   */
  private getAnimationTimingData(moodManager: MoodManager) {
    const deltaTime = this.clock.getDelta(); // Zeit seit letztem Frame (für Geschwindigkeit)
    const elapsedTime = this.clock.getElapsedTime(); // Gesamte Zeit seit Start (für Zyklen)
    const currentMoodConfig = moodManager.getCurrentMoodConfig();

    return { deltaTime, elapsedTime, currentMoodConfig };
  }

  /**
   * Aktualisiert alle Manager in optimaler Reihenfolge
   * Single Responsibility: Manager-Koordination isolieren
   */
  private updateAllManagers(
    deltaTime: number,
    elapsedTime: number,
    currentMoodConfig: MoodConfig,
    uiManager: IManager
  ): void {
    // Reihenfolge ist optimiert für Abhängigkeiten und Performance

    // 1. Kamera-Position updaten (beeinflusst Culling und LOD)
    this.cameraManager.update(elapsedTime);

    // 2. OrbitControls updaten (für Damping-Effekt)
    this.controls.update();

    // 3. Lichter animieren (beeinflusst Schatten und Materials)
    this.lightManager.update(elapsedTime, currentMoodConfig);

    // 4. Partikel bewegen (frame-abhängig, daher deltaTime)
    this.effectManager.update(deltaTime);

    // 5. Vegetation animieren (Farben, Emissive)
    this.landscapeManager.update(elapsedTime, currentMoodConfig);

    // 6. UI Border-Animationen (Rainbow-Effekt)
    uiManager.update?.(elapsedTime, currentMoodConfig);
  }

  /**
   * Wendet spezielle Mood-Animationen an
   * Single Responsibility: Mood-spezifische Szenen-Manipulationen isolieren
   */
  private applySpecialMoodAnimations(elapsedTime: number, currentMoodConfig: MoodConfig): void {
    // "Kooperativ" Modus: Regenbogen-Himmel Animation
    if (currentMoodConfig.name === 'Kooperativ') {
      const hue = (elapsedTime * 0.05) % 1; // Langsamer Farbzyklus (20s pro Umlauf)
      this.scene.background = new THREE.Color().setHSL(hue, 0.5, 0.1);
    }

    // PRODUCTION-TODO: Add more special mood animations here
    // PRODUCTION-TODO: Consider extracting to dedicated MoodAnimationManager
  }
}
