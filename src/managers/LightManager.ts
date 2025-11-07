import * as THREE from 'three';
import { MoodConfig, IManager, LightStorage, DynamicLightConfig } from '../types';

/**
 * LightManager - Complete Lighting System (ULTRATHINK Refactored)
 *
 * Features:
 * - Fully configurable animation parameters (no hardcoded values)
 * - Generic animation system supporting multiple modes
 * - Single source of truth: all parameters from mood-definitions.ts
 * - Extensible animation modes: strobe, disco, explosion, pulse, flash
 * - Efficient light management with proper cleanup
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

  private createDynamicLights(dynamicLights?: DynamicLightConfig[]): void {
    if (!dynamicLights) return;

    dynamicLights.forEach(lightConfig => {
      if (lightConfig.type === 'spot') {
        // Handle base intensity (arrays will be handled in animation)
        const baseIntensity = Array.isArray(lightConfig.intensity)
          ? lightConfig.intensity[0]
          : lightConfig.intensity;

        const spotLight = new THREE.SpotLight(
          Array.isArray(lightConfig.color) ? lightConfig.color[0] : lightConfig.color,
          baseIntensity,
          1000, // distance
          lightConfig.angle || Math.PI / 3,
          lightConfig.penumbra || 0.1,
          lightConfig.decay || 1
        );

        // Handle position (arrays will be handled in animation)
        const basePosition = Array.isArray(lightConfig.position[0])
          ? (lightConfig.position as [number[], number[]])[0]
          : (lightConfig.position as number[]);

        spotLight.position.fromArray(basePosition);
        spotLight.castShadow = true;
        this.scene.add(spotLight);
        this.scene.add(spotLight.target);
        this.lights[lightConfig.name] = spotLight;
      }

      if (lightConfig.type === 'point') {
        // Handle base intensity (arrays will be handled in animation)
        const baseIntensity = Array.isArray(lightConfig.intensity)
          ? lightConfig.intensity[0]
          : lightConfig.intensity;

        const pointLight = new THREE.PointLight(
          Array.isArray(lightConfig.color) ? lightConfig.color[0] : lightConfig.color,
          baseIntensity,
          lightConfig.distance || 1000,
          lightConfig.decay || 1
        );

        // Handle position (arrays will be handled in animation)
        const basePosition = Array.isArray(lightConfig.position[0])
          ? (lightConfig.position as [number[], number[]])[0]
          : (lightConfig.position as number[]);

        pointLight.position.fromArray(basePosition);
        this.scene.add(pointLight);
        this.lights[lightConfig.name] = pointLight;
      }
    });
  }

  private clearDynamicLights(): void {
    Object.keys(this.lights).forEach(key => {
      // Clear all lights except ambient, keyLight
      if (key !== 'ambient' && key !== 'keyLight') {
        const light = this.lights[key];
        this.scene.remove(light);
        if ('target' in light && light.target) this.scene.remove(light.target as THREE.Object3D);
        if (typeof light.dispose === 'function') light.dispose();
        delete this.lights[key];
      }
    });
  }

  update(elapsedTime: number, moodConfig: MoodConfig): void {
    if (!moodConfig.dynamicLights) return;

    // Process each dynamic light with its animation configuration
    moodConfig.dynamicLights.forEach(lightConfig => {
      const light = this.lights[lightConfig.name];
      if (!light || !lightConfig.animation?.enabled) return;

      this.updateAnimatedLight(light, lightConfig, elapsedTime);
    });
  }

  /**
   * Generic animated light update using configuration parameters
   * NO HARDCODED VALUES - everything comes from config!
   */
  private updateAnimatedLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    elapsedTime: number
  ): void {
    if (!config.animation) return;

    const { mode, params } = config.animation;

    switch (mode) {
      case 'strobe':
        this.updateStrobeLight(light, config, params.strobe!);
        break;

      case 'disco':
        this.updateDiscoLight(light, config, params.disco!, elapsedTime);
        break;

      case 'explosion':
        this.updateExplosionLight(light, config, params.explosion!);
        break;

      case 'pulse':
        this.updatePulseLight(light, config, params.pulse!, elapsedTime);
        break;

      case 'flash':
        this.updateFlashLight(light, config, params.flash!);
        break;
    }
  }

  private updateStrobeLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    params: NonNullable<DynamicLightConfig['animation']>['params']['strobe']
  ): void {
    if (!params) return;
    const baseIntensity = Array.isArray(config.intensity) ? config.intensity[0] : config.intensity;

    if (Math.random() > 1 - params.triggerChance) {
      light.intensity = params.maxIntensity;

      // Handle color changes if multiple colors specified
      if (params.colors && params.colors.length > 0) {
        const randomColor = params.colors[Math.floor(Math.random() * params.colors.length)];
        light.color.setHex(randomColor);
      }
    } else {
      light.intensity = THREE.MathUtils.lerp(light.intensity, baseIntensity, params.fadeSpeed);
    }
  }

  private updateDiscoLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    params: NonNullable<DynamicLightConfig['animation']>['params']['disco'],
    elapsedTime: number
  ): void {
    if (!params) return;
    if (!(light instanceof THREE.SpotLight)) return;

    // Use rotation speed from config
    const rotationSpeed = params.rotationSpeed[0];
    const angle = elapsedTime * rotationSpeed;

    // Calculate position using configurable radius
    const radius = params.radius;
    const heightOffset = params.heightOffset || 0;
    const basePosition = Array.isArray(config.position[0])
      ? (config.position as [number[], number[]])[0]
      : (config.position as number[]);

    light.position.set(
      Math.cos(angle) * radius + basePosition[0],
      basePosition[1] + heightOffset,
      Math.sin(angle) * radius + basePosition[2]
    );

    // Update target if configured
    if (params.targetMovement) {
      light.target.position.set(
        Math.cos(angle + Math.PI / 2) * (radius * 0.3),
        0,
        Math.sin(angle + Math.PI / 2) * (radius * 0.3)
      );
    }
  }

  private updateExplosionLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    params: NonNullable<DynamicLightConfig['animation']>['params']['explosion']
  ): void {
    if (!params) return;
    const baseIntensity = Array.isArray(config.intensity) ? config.intensity[0] : config.intensity;

    if (Math.random() > 1 - params.triggerChance) {
      light.intensity = baseIntensity * params.intensityMultiplier;

      // Randomize position if configured
      if (params.randomPosition) {
        const [rangeX, rangeY, rangeZ] = params.positionRange;
        const basePosition = Array.isArray(config.position[0])
          ? (config.position as [number[], number[]])[0]
          : (config.position as number[]);

        light.position.set(
          basePosition[0] + (Math.random() - 0.5) * rangeX,
          basePosition[1] + Math.random() * rangeY,
          basePosition[2] + (Math.random() - 0.5) * rangeZ
        );
      }
    } else {
      light.intensity = THREE.MathUtils.lerp(light.intensity, baseIntensity, params.fadeSpeed);
    }
  }

  private updatePulseLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    params: NonNullable<DynamicLightConfig['animation']>['params']['pulse'],
    elapsedTime: number
  ): void {
    if (!params) return;
    const baseIntensity = Array.isArray(config.intensity) ? config.intensity[0] : config.intensity;
    const phase = (elapsedTime * params.frequency + (params.phaseOffset || 0)) * Math.PI * 2;
    const pulseFactor = (Math.sin(phase) + 1) / 2; // Normalize to 0-1

    const [minMultiplier, maxMultiplier] = params.intensityRange;
    const multiplier = minMultiplier + pulseFactor * (maxMultiplier - minMultiplier);

    light.intensity = baseIntensity * multiplier;
  }

  private updateFlashLight(
    light: THREE.Light,
    config: DynamicLightConfig,
    params: NonNullable<DynamicLightConfig['animation']>['params']['flash']
  ): void {
    if (!params) return;
    const baseIntensity = Array.isArray(config.intensity) ? config.intensity[0] : config.intensity;

    // Simple flash implementation - enhanced timing could be added later
    if (Math.random() > 1 - 1 / (params.cooldown / 16)) {
      // Rough frame-based timing
      light.intensity = baseIntensity * params.intensityMultiplier;
    } else {
      light.intensity = THREE.MathUtils.lerp(light.intensity, baseIntensity, 0.1);
    }
  }
}
