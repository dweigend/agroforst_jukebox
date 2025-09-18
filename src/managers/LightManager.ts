import * as THREE from 'three';
import { MoodConfig, IManager, LightStorage } from '../types';

/**
 * LightManager - Complete Lighting System
 *
 * Manages: Standard lights (ambient/directional), visual sun mesh, dynamic lights.
 * Features: Shadow optimization, intelligent cleanup, mood-based animations.
 * Animations: Disco (Kooperativ), Strobe (Konflikt), Explosions (Krieg).
 */
export class LightManager implements IManager {
  private scene: THREE.Scene;

  // Licht-Storage für effizientes Management und Cleanup
  private lights: LightStorage = {};

  // Visuelle Sonne - 3D-Sphere für räumliche Orientierung
  private sunMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.init();
  }

  private init(): void {
    // Ambient Light: Base illumination (10% intensity)
    this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(this.lights.ambient);

    // Directional Light: Main sun/moon light with shadows
    this.lights.keyLight = new THREE.DirectionalLight(0xffffff, 1);
    this.lights.keyLight.castShadow = true;

    // Shadow optimization: 2048x2048 for quality/performance balance
    if (this.lights.keyLight.shadow) {
      this.lights.keyLight.shadow.mapSize.width = 2048;
      this.lights.keyLight.shadow.mapSize.height = 2048;
    }

    this.scene.add(this.lights.keyLight);
    if (this.lights.keyLight instanceof THREE.DirectionalLight) {
      this.scene.add(this.lights.keyLight.target);
    }

    // Visual Sun: 3D sphere for spatial orientation
    const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, fog: false });
    this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
    this.scene.add(this.sunMesh);
  }

  applyMood(config: MoodConfig): void {
    // Configure standard lights
    (this.lights.ambient as THREE.AmbientLight).color.set(config.ambient.color);
    (this.lights.ambient as THREE.AmbientLight).intensity = config.ambient.intensity;

    (this.lights.keyLight as THREE.DirectionalLight).color.set(config.keyLight.color);
    (this.lights.keyLight as THREE.DirectionalLight).intensity = config.keyLight.intensity;
    this.lights.keyLight.position.fromArray(config.keyLight.position);
    (this.lights.keyLight as THREE.DirectionalLight).target.position.set(0, 0, 0);

    // Configure visual sun
    if (this.sunMesh) {
      this.sunMesh.visible = config.sun.visible;
      (this.sunMesh.material as THREE.MeshBasicMaterial).color.set(config.sun.color);
      this.sunMesh.position.copy(this.lights.keyLight.position);
    }

    // Dynamic lights management
    this.clearDynamicLights();
    this.createDynamicLights(config.dynamicLights);
  }

  private createDynamicLights(dynamicLights?: any[]): void {
    if (!dynamicLights) return;

    dynamicLights.forEach(lightConfig => {
      if (lightConfig.type === 'spot') {
        const spotLight = new THREE.SpotLight(
          lightConfig.color,
          lightConfig.intensity,
          1000,
          lightConfig.angle,
          lightConfig.penumbra,
          lightConfig.decay
        );
        spotLight.position.fromArray(lightConfig.position);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
        this.lights[lightConfig.name] = spotLight;
      }

      if (lightConfig.type === 'point') {
        // Handle random intensity
        const intensity = Array.isArray(lightConfig.intensity)
          ? lightConfig.intensity[0] + Math.random() * (lightConfig.intensity[1] - lightConfig.intensity[0])
          : lightConfig.intensity;

        const pointLight = new THREE.PointLight(
          lightConfig.color,
          intensity,
          lightConfig.distance,
          lightConfig.decay
        );
        pointLight.position.fromArray(lightConfig.position);
        this.scene.add(pointLight);
        this.lights[lightConfig.name] = pointLight;
      }
    });
  }

  private clearDynamicLights(): void {
    Object.keys(this.lights).forEach(key => {
      if (key.startsWith('dynamic_')) {
        const light = this.lights[key];
        this.scene.remove(light);
        if ('target' in light && light.target) this.scene.remove(light.target as THREE.Object3D);
        if (typeof light.dispose === 'function') light.dispose();
        delete this.lights[key];
      }
    });
  }

  update(elapsedTime: number, moodConfig: MoodConfig): void {
    if (moodConfig.name === 'Kooperativ') {
      this.updateDiscoLights(elapsedTime);
    } else if (moodConfig.name === 'Konflikt') {
      this.updateStrobeEffect();
    } else if (moodConfig.name === 'Krieg') {
      this.updateExplosionEffect();
    }
  }

  private updateDiscoLights(elapsedTime: number): void {
    for (let i = 0; i < 8; i++) {
      const light = this.lights[`dynamic_spot_${i}`] as THREE.SpotLight;
      if (!light) continue;

      const rotationSpeed = i % 2 === 0 ? 0.5 : -0.5;
      const angle = elapsedTime * rotationSpeed + (i * Math.PI) / 4;

      light.position.set(Math.cos(angle) * 150, 80, Math.sin(angle) * 150);
      light.target.position.set(
        Math.cos(angle + Math.PI / 2) * 50,
        0,
        Math.sin(angle + Math.PI / 2) * 50
      );
    }
  }

  private updateStrobeEffect(): void {
    const strobe = this.lights['dynamic_strobe'] as THREE.SpotLight;
    if (!strobe) return;

    if (Math.random() > 0.9) {
      strobe.intensity = 4000;
      strobe.color.set(Math.random() > 0.5 ? 0xff0000 : 0xffffff);
    } else {
      strobe.intensity = THREE.MathUtils.lerp(strobe.intensity, 0, 0.3);
    }
  }

  private updateExplosionEffect(): void {
    const explosionMain = this.lights['dynamic_explosion_main'] as THREE.PointLight;
    const explosionFlash = this.lights['dynamic_explosion_flash'] as THREE.PointLight;
    const strobe = this.lights['dynamic_strobe'] as THREE.SpotLight;

    if (explosionMain && Math.random() > 0.98) {
      explosionMain.intensity = 1000;
      explosionFlash.intensity = 2000;
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 400,
        Math.random() * 50 + 10,
        (Math.random() - 0.5) * 400
      );
      explosionMain.position.copy(pos);
      explosionFlash.position.copy(pos);
    } else if (explosionMain) {
      explosionMain.intensity = THREE.MathUtils.lerp(explosionMain.intensity, 0, 0.05);
      explosionFlash.intensity = THREE.MathUtils.lerp(explosionFlash.intensity, 0, 0.1);
    }

    if (strobe) {
      if (Math.random() > 0.95) {
        strobe.intensity = 3000;
      } else {
        strobe.intensity = THREE.MathUtils.lerp(strobe.intensity, 0, 0.2);
      }
    }
  }
}
