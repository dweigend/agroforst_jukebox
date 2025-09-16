import * as THREE from 'three';
import { MoodConfig, IMoodManager, ISceneManager } from '../types';
import { moodStyles } from '../configs/mood-definitions';
import { moodLogger } from '../utils/Logger';

/**
 * MoodManager - Das Gehirn der Stimmungs-Orchestrierung
 *
 * Zentrale Verantwortlichkeiten:
 * - Lädt und verwaltet alle 7 Stimmungs-Konfigurationen
 * - Koordiniert Stimmungswechsel zwischen allen Managern
 * - Stellt aktuelle Stimmung für Animation Loop bereit
 * - Verwaltet globale Szenen-Eigenschaften (Himmel, Nebel)
 *
 * Architektur-Pattern: Facade + Orchestrator
 * - Versteckt Komplexität der Manager-Koordination
 * - Einheitliche API für alle Stimmungs-Operationen
 * - Loose Coupling zwischen UI und Manager-System
 *
 * Die 7 Stimmungen und ihre Charakteristika:
 * 🌅 Harmonisch: Sonnige, friedliche Landschaft
 * 🎉 Kooperativ: Disco-Party mit 8 Scheinwerfern + Regenbogen
 * 🌫️ Neutral: Ausgewogene, ruhige Darstellung
 * 🌧️ Distanziert: Regnerische, düstere Atmosphäre
 * 🔥 Spannung: Glühende Vegetation mit Lava-Effekten
 * ⚡ Konflikt: Stroboskop-Blitze in dunkler Umgebung
 * 💥 Krieg: Explosionen, Rauch und Feuer-Partikel
 */
export class MoodManager implements IMoodManager {
  // SceneManager Referenz für Manager-Zugriff
  private sceneManager: ISceneManager;

  // Aktuell aktive Stimmungs-Konfiguration (null = keine Stimmung aktiv)
  private currentMood: MoodConfig | null = null;

  /**
   * Initialisiert MoodManager mit SceneManager Referenz
   * @param sceneManager Referenz für Zugriff auf alle Manager
   */
  constructor(sceneManager: ISceneManager) {
    this.sceneManager = sceneManager;
  }

  /**
   * Liefert Liste aller verfügbaren Stimmungsnamen
   * Wird von UIManager verwendet um Buttons dynamisch zu erstellen
   *
   * @returns Array mit allen Stimmungsnamen aus moods.ts
   */
  getMoodNames(): string[] {
    return Object.keys(moodStyles);
  }

  /**
   * Gibt die aktuell aktive Stimmungs-Konfiguration zurück
   * Wird von SceneManager in Animation Loop verwendet
   *
   * @returns Aktuelle MoodConfig oder null wenn keine Stimmung aktiv
   */
  getCurrentMoodConfig(): MoodConfig | null {
    return this.currentMood;
  }

  /**
   * Führt einen kompletten Stimmungswechsel durch
   *
   * Koordinations-Ablauf:
   * 1. Konfiguration aus moods.ts laden
   * 2. Als currentMood speichern (für Animation Loop)
   * 3. Globale Szenen-Eigenschaften setzen (Himmel, Nebel)
   * 4. Alle Manager koordiniert über Änderung informieren
   *
   * Performance-Hinweise:
   * - Manager cleanup alte Ressourcen automatisch
   * - Neue Geometries/Materials werden erstellt
   * - Partikel-Systeme werden neu initialisiert
   * - Kann kurzen Frame-Drop verursachen (normal)
   *
   * @param moodName Name der Stimmung (muss in moodStyles existieren)
   */
  applyMood(moodName: string): void {
    // Konfiguration aus externem Config-File laden
    const config = moodStyles[moodName];
    if (!config) {
      moodLogger.warn(`Mood '${moodName}' not found in moodStyles`);
      return;
    }

    // Als aktuelle Stimmung speichern (für Animation Loop Access)
    this.currentMood = config;

    // SceneManager Komponenten destructuren für bessere Lesbarkeit
    const { scene, lightManager, effectManager, landscapeManager } = this.sceneManager;

    // === GLOBALE SZENEN-EIGENSCHAFTEN SETZEN ===
    // Diese können nicht von einzelnen Managern verwaltet werden

    // Himmel-Farbe (außer bei "Kooperativ" - dort dynamisch in Animation Loop)
    scene.background = new THREE.Color(config.skyColor);

    // Exponentieller Nebel für Tiefenwirkung und Atmosphäre
    // Density steuert Sichtweite: höher = dichter = weniger Sichtweite
    scene.fog = new THREE.FogExp2(config.fog.color, config.fog.density);

    // === MANAGER-KOORDINATION ===
    // Alle Manager über Stimmungswechsel informieren
    // Reihenfolge ist wichtig: vom grundlegendsten zum abhängigsten

    // 1. Beleuchtung (beeinflusst alle Materials)
    lightManager.applyMood(config);

    // 2. Effekte (Partikel + Post-Processing)
    effectManager.applyMood(config);

    // 3. Landschaft (Vegetation-Farben reagieren auf neue Beleuchtung)
    landscapeManager.applyMood(config);

    // UIManager wird separat über Button-Click informiert
    // CameraManager benötigt keine Mood-spezifischen Änderungen
  }
}
