import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { MoodConfig, IManager, ParticleSystem } from '../types';

/**
 * EffectManager - Verwaltet Partikel-Systeme und Post-Processing-Effekte
 *
 * Zwei Haupt-Funktionen:
 * 1. Partikel-Systeme: Bis zu 5.000 Partikel pro Stimmung (Regen, Feuer, Disco)
 * 2. Post-Processing: UnrealBloom für cinematic Glow-Effekte
 *
 * Performance-Features:
 * - Canvas-generierte Texturen (keine externe Files)
 * - Buffer-Geometrie für 60 FPS bei tausenden Partikeln
 * - Optimierte Update-Loop mit deltaTime-basierter Animation
 * - Intelligente Partikel-Recycling (Wrap-around statt Deletion)
 *
 * Partikel-Typen:
 * - "sparkle": Glitzer-Effekt mit radialem Gradient (Disco, Magie)
 * - "smoke": Weiche Rauch-Textur (Feuer, Explosionen)
 *
 * Spezial-Features:
 * - Rainbow-Partikel: Jedes Partikel hat eigene HSL-Farbe
 * - Adaptive Blending: Additive für Leuchten, Normal für Materialien
 * - Configurable Spawn-Areas und Bewegungs-Richtungen
 */
export class EffectManager implements IManager {
  private scene: THREE.Scene;
  private particleSystems: ParticleSystem[] = [];
  public composer: EffectComposer;
  private bloomPass: UnrealBloomPass;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
    this.scene = scene;

    // === POST-PROCESSING PIPELINE SETUP ===
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera)); // Standard-Rendering (Pass 1)

    // UnrealBloom: Professional-grade Glow-Effekte (Pass 2)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight), // Screen Resolution
      1.5, // Strength: Standard-Intensität für subtile Effekte
      0.4, // Radius: Blur-Radius der Glow-Effekte
      0.85 // Threshold: Brightness-Schwelle für Bloom-Trigger
    );
    this.composer.addPass(this.bloomPass);
  }

  private getRandomSize(size: number | [number, number]): number {
    return Array.isArray(size) ? size[0] + Math.random() * (size[1] - size[0]) : size;
  }

  private getRandomOpacity(opacity: number | [number, number]): number {
    return Array.isArray(opacity)
      ? opacity[0] + Math.random() * (opacity[1] - opacity[0])
      : opacity;
  }

  private getRandomColor(color: string | string[]): string {
    return Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color;
  }

  private createParticleTexture(type: 'sparkle' | 'smoke' = 'sparkle'): THREE.CanvasTexture {
    // HTML5 Canvas für prozedurelle Textur-Generierung
    const canvas = document.createElement('canvas');
    canvas.width = 128; // 128x128 = Balance zwischen Qualität und Memory
    canvas.height = 128;
    const context = canvas.getContext('2d')!;

    // Radial-Gradient: Von Zentrum (64,64) nach außen
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);

    if (type === 'sparkle') {
      // Sparkle: Harter heller Kern mit schnellem Fade-out (für Glitzer-Effekte)
      gradient.addColorStop(0, 'rgba(255,255,255,1)'); // Zentrum: 100% weiß
      gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)'); // 20%: Noch hell
      gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)'); // 40%: Schneller Fall
      gradient.addColorStop(1, 'rgba(255,255,255,0)'); // Rand: Transparent
    } else {
      // Smoke: Weicher gleichmäßiger Gradient (für Rauch/Nebel)
      gradient.addColorStop(0, 'rgba(255,255,255,0.8)'); // Zentrum: 80% weiß
      gradient.addColorStop(1, 'rgba(255,255,255,0)'); // Rand: Transparent
    }

    // Gradient auf Canvas zeichnen und als Three.js Textur zurückgeben
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Wendet stimmungsspezifische Effekt-Konfiguration an
   *
   * Zwei-Phasen-Setup:
   * 1. Partikel-Systeme: Cleanup + Neuaufbau aller Partikel-Systeme
   * 2. Bloom-Parameter: UnrealBloom Pass-Konfiguration anpassen
   *
   * Unterstützt bis zu 2 Partikel-Systeme gleichzeitig:
   * - "Krieg": Rauch-System (3000) + Feuer-System (1000)
   * - "Kooperativ": Rainbow-Disco-System (5000)
   * - "Distanziert": Regen-System (3000)
   *
   * Performance-kritisch: Cleanup verhindert Memory Leaks!
   *
   * @param config Mood-Konfiguration mit Partikel- und Bloom-Parametern
   */
  applyMood(config: MoodConfig): void {
    // === PARTIKEL-CLEANUP ===
    // Alte Partikel-Systeme entfernen (wichtig für Memory-Management)
    this.clearParticleSystems();

    // === NEUE PARTIKEL-SYSTEME ERSTELLEN ===
    if (config.particles) {
      // Handle sowohl einzelne als auch Array-Konfigurationen
      const particleConfigs = Array.isArray(config.particles)
        ? config.particles
        : [config.particles];

      particleConfigs.forEach(pConfig => {
        const { count, material, behavior } = pConfig;
        const geometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const velocities: number[] = [];
        const colors: number[] = [];
        const texture = this.createParticleTexture(material.textureType);

        for (let i = 0; i < count; i++) {
          positions.push(
            (Math.random() - 0.5) * behavior.spawnArea[0],
            Math.random() * behavior.spawnArea[1],
            (Math.random() - 0.5) * behavior.spawnArea[2]
          );
          const vel = behavior.velocity as number[];
          velocities.push(
            (Math.random() - 0.5) * vel[0],
            Math.random() * vel[1],
            (Math.random() - 0.5) * vel[2]
          );

          if (material.color === 'rainbow') {
            const color = new THREE.Color().setHSL(Math.random(), 1.0, 0.7);
            colors.push(color.r, color.g, color.b);
          } else if (Array.isArray(material.color)) {
            const color = new THREE.Color(this.getRandomColor(material.color));
            colors.push(color.r, color.g, color.b);
          }
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));

        if (colors.length > 0) {
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        }

        const pMaterial = new THREE.PointsMaterial({
          size: this.getRandomSize(material.size),
          map: texture,
          blending:
            material.blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
          depthWrite: material.depthWrite,
          transparent: true,
          opacity: this.getRandomOpacity(material.opacity),
          vertexColors: material.color === 'rainbow' || Array.isArray(material.color),
          color:
            material.color === 'rainbow' || Array.isArray(material.color)
              ? 0xffffff
              : new THREE.Color(material.color as string),
        });

        const points = new THREE.Points(geometry, pMaterial);
        points.name = pConfig.name || 'particleSystem';
        this.particleSystems.push({ points, behavior });
        this.scene.add(points);
      });
    }

    this.bloomPass.threshold = config.bloom.threshold;
    this.bloomPass.strength = config.bloom.strength;
    this.bloomPass.radius = config.bloom.radius;
  }

  private clearParticleSystems(): void {
    this.particleSystems.forEach(({ points }) => {
      this.scene.remove(points);
      points.geometry.dispose();
      if (points.material instanceof THREE.PointsMaterial && points.material.map) {
        points.material.map.dispose();
      }
      if (Array.isArray(points.material)) {
        points.material.forEach(mat => mat.dispose());
      } else {
        points.material.dispose();
      }
    });
    this.particleSystems = [];
  }

  update(deltaTime: number): void {
    this.particleSystems.forEach(({ points, behavior }) => {
      const positions = points.geometry.attributes.position.array as Float32Array;
      const velocities = points.geometry.attributes.velocity.array as Float32Array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i] * deltaTime * 100;
        positions[i + 1] += velocities[i + 1] * deltaTime * 100;
        positions[i + 2] += velocities[i + 2] * deltaTime * 100;

        if (positions[i + 1] > behavior.spawnArea[1] && behavior.direction === 'up') {
          positions[i + 1] = 0;
        }
        if (positions[i + 1] < 0 && behavior.direction === 'down') {
          positions[i + 1] = behavior.spawnArea[1];
        }
      }
      points.geometry.attributes.position.needsUpdate = true;
    });
  }

  dispose(): void {
    this.clearParticleSystems();
    this.composer.dispose();
  }
}
