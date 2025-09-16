import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ICameraManager } from '../types';

/**
 * CameraManager - Verwaltet Kamera-Modi und smooth Übergänge
 *
 * Zwei Modi:
 * 1. Auto-Rotation: Kamera rotiert automatisch um die Szene (Standard)
 * 2. Manual Control: OrbitControls für manuelle Maus/Touch-Steuerung
 *
 * Features:
 * - Smooth Toggle zwischen den Modi über UI-Button
 * - Circular Camera Path mit konstanter Höhe und Geschwindigkeit
 * - Target-Point auf Vegetation-Level (Y=20) für optimale Sicht
 * - OrbitControls Damping für träge, natürliche Bewegung
 *
 * Performance-optimiert:
 * - Nur aktive Modi werden in Update-Loop berechnet
 * - Trigonometrische Berechnungen sind minimal (cos/sin pro Frame)
 * - Kamera-Position wird direkt gesetzt (keine Matrix-Operationen)
 */
export class CameraManager implements ICameraManager {
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;

  // Auto-Rotation State
  private isAutoRotating: boolean = true; // Standard: Auto-Modus aktiv

  // Auto-Rotation Parameter
  private radius: number = 250; // Kreis-Radius um Szenen-Zentrum
  private speed: number = 0.1; // Rotations-Geschwindigkeit (rad/s)
  private verticalOffset: number = 50; // Kamera-Höhe über Boden

  /**
   * Initialisiert CameraManager mit bestehender Kamera und OrbitControls
   *
   * @param camera PerspectiveCamera vom SceneManager
   * @param controls OrbitControls für manuelle Steuerung
   */
  constructor(camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.camera = camera;
    this.controls = controls;

    // OrbitControls initial deaktiviert (Auto-Rotation ist Standard)
    this.controls.enabled = !this.isAutoRotating;
  }

  /**
   * Wechselt zwischen Auto-Rotation und manueller Steuerung
   *
   * Toggle-Logic:
   * - Auto → Manual: OrbitControls aktivieren, Target auf Szenen-Zentrum setzen
   * - Manual → Auto: OrbitControls deaktivieren, Kamera übernimmt Auto-Rotation
   *
   * Wird vom UI "Kamera" Button aufgerufen.
   *
   * @returns true wenn Auto-Rotation jetzt aktiv ist, false bei manueller Steuerung
   */
  toggleAutoRotation(): boolean {
    // Toggle zwischen den Modi
    this.isAutoRotating = !this.isAutoRotating;

    // OrbitControls: Aktiv wenn NICHT auto-rotierend
    this.controls.enabled = !this.isAutoRotating;

    // Bei Wechsel zu Manual-Mode: Target auf Szenen-Zentrum setzen
    if (!this.isAutoRotating) {
      this.controls.target.set(0, 0, 0); // Blick-Zentrum
    }

    return this.isAutoRotating;
  }

  /**
   * Update-Loop für Auto-Rotation Kamera-Bewegung
   *
   * Wird 60x pro Sekunde vom SceneManager Animation Loop aufgerufen.
   *
   * Circular Path Calculation:
   * - X/Z Position: Kreis-Mathematik mit cos/sin
   * - Y Position: Konstante Höhe für stabile Sicht
   * - LookAt Target: Vegetation-Höhe (Y=20) für optimale Perspektive
   *
   * Performance-optimiert: Early return wenn Manual-Mode aktiv
   *
   * @param elapsedTime Gesamtzeit seit App-Start (für kontinuierliche Rotation)
   */
  update(elapsedTime: number): void {
    // Early Return: Nur Auto-Rotation Modus animieren
    if (!this.isAutoRotating) return;

    // Circular Path Berechnung: Konstante Geschwindigkeit um Szenen-Zentrum
    const angle = elapsedTime * this.speed; // Aktueller Winkel (Radiant)

    // Kamera-Position: Kreis mit Radius um Ursprung
    this.camera.position.x = Math.cos(angle) * this.radius; // X: Horizontale Kreisbahn
    this.camera.position.z = Math.sin(angle) * this.radius; // Z: Horizontale Kreisbahn
    this.camera.position.y = this.verticalOffset; // Y: Konstante Höhe

    // Look-At Target: Vegetation-Höhe für optimale Sicht auf Bäume/Crops
    this.camera.lookAt(0, 20, 0); // Zielt auf 20 Einheiten über Boden-Level
  }
}
