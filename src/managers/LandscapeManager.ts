import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { MoodConfig, ILandscapeManager, VegetationConfig } from '../types';
import { AssetManager } from './AssetManager';
import { gameEventBus, GameEventListener } from '../events/GameEvents';
import { LANDSCAPE_DIMENSIONS } from '../constants/dimensions';

// Noise function for procedural terrain generation.
const noise3D = createNoise3D();

/**
 * Manages the 3D landscape, including terrain and vegetation.
 *
 * This manager is responsible for:
 * - Generating a procedural ground mesh using simplex noise.
 * - Loading 3D assets for vegetation (trees, crops) via the AssetManager.
 * - Placing thousands of vegetation instances onto the terrain with high performance
 *   using InstancedMesh.
 * - Accurately and efficiently positioning each instance on the terrain by using
 *   bilinear interpolation of the ground mesh vertices. This is much faster
 *   than raycasting and prevents performance issues on startup.
 * - Responding to events to dynamically regenerate the landscape with new assets.
 */
export class LandscapeManager implements ILandscapeManager {
  private scene: THREE.Scene;
  private assetManager: AssetManager;

  // Landscape components
  private ground: THREE.Mesh | null = null;
  private trees: THREE.InstancedMesh | null = null;
  private crops: THREE.InstancedMesh | null = null;

  // Ground properties for fast height calculation
  private readonly groundSize = LANDSCAPE_DIMENSIONS.GROUND_SIZE;
  private readonly groundSegments = { width: 200, height: 200 };
  private groundVertexPositions: THREE.BufferAttribute | null = null;

  // Current asset state
  private currentTreeAsset: string | null = null;
  private currentPlantAsset: string | null = null;
  private currentTreeGeometry: THREE.BufferGeometry | null = null;
  private currentTreeMaterial: THREE.Material | null = null;
  private currentPlantGeometry: THREE.BufferGeometry | null = null;
  private currentPlantMaterial: THREE.Material | null = null;

  // Scale configuration from plants.json
  private currentTreeScale: { min: number; max: number } = { min: 0.8, max: 1.2 };
  private currentPlantScale: { min: number; max: number } = { min: 1.5, max: 2.0 };

  private currentVegConfig: VegetationConfig | null = null;
  private eventListeners: Array<{ event: string; listener: (...args: any[]) => void }> = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.assetManager = AssetManager.getInstance();
    this.setupEventListeners();
    this.init();
  }

  private async init(): Promise<void> {
    this.createGround();
    await this.loadInitialVegetation();
  }

  /**
   * Creates the procedural ground mesh and caches its vertex data for fast access.
   */
  private createGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(
      this.groundSize.width,
      this.groundSize.height,
      this.groundSegments.width,
      this.groundSegments.height
    );
    const positions = groundGeometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = noise3D(x * 0.005, y * 0.005, 0) * 20;
      positions.setZ(i, z);
    }
    groundGeometry.computeVertexNormals();

    // Cache the vertex positions for fast height interpolation
    this.groundVertexPositions = positions as THREE.BufferAttribute;

    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x556b2f });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  private async loadInitialVegetation(): Promise<void> {
    try {
      await this.generateLandscapeFromSelection({
        treeAsset: 'tree_oak.obj',
        plantAsset: 'crops_cornStageA.obj',
        treeName: 'Eiche',
        plantName: 'Weizen',
      });
    } catch (error) {
      console.error(
        '⚠️ [LandscapeManager] Initial asset loading failed. The scene will be empty.',
        error
      );
    }
  }

  private setupEventListeners(): void {
    const landscapeGenerationListener: GameEventListener<
      'landscape:generate-from-selection'
    > = async data => {
      await this.generateLandscapeFromSelection(data);
    };
    gameEventBus.on('landscape:generate-from-selection', landscapeGenerationListener);
    this.eventListeners.push({
      event: 'landscape:generate-from-selection',
      listener: landscapeGenerationListener,
    });
  }

  private async generateLandscapeFromSelection(data: any): Promise<void> {
    try {
      gameEventBus.emit('landscape:generation-started', {
        ...data,
        treeCount: LANDSCAPE_DIMENSIONS.VEGETATION_COUNTS.TREES,
        plantCount: LANDSCAPE_DIMENSIONS.VEGETATION_COUNTS.PLANTS,
      });

      const [treeGeometry, treeMaterial, plantGeometry, plantMaterial] = await Promise.all([
        this.assetManager.getGeometryForInstancing(data.treeAsset),
        this.assetManager.getMaterialForInstancing(data.treeAsset),
        this.assetManager.getGeometryForInstancing(data.plantAsset),
        this.assetManager.getMaterialForInstancing(data.plantAsset),
      ]);

      this.currentTreeAsset = data.treeAsset;
      this.currentPlantAsset = data.plantAsset;
      this.currentTreeGeometry = treeGeometry;
      this.currentTreeMaterial = treeMaterial;
      this.currentPlantGeometry = plantGeometry;
      this.currentPlantMaterial = plantMaterial;

      // Store scale information from plant data
      this.currentTreeScale = data.treeInfo?.scale || { min: 0.8, max: 1.2 };
      this.currentPlantScale = data.plantInfo?.scale || { min: 1.5, max: 2.0 };

      if (this.currentVegConfig) {
        this.applyMoodToAssetMaterials(this.currentVegConfig);
      }

      this.cleanupVegetation();
      this.generateVegetation();

      gameEventBus.emit('landscape:generation-completed', { ...data, success: true });
    } catch (error) {
      console.error(`[LandscapeManager] Error generating asset-based landscape:`, error);
      gameEventBus.emit('landscape:generation-completed', { ...data, success: false, error });
    }
  }

  /**
   * Creates and places all vegetation instances on the terrain.
   */
  private generateVegetation(): void {
    if (
      !this.currentTreeGeometry ||
      !this.currentTreeMaterial ||
      !this.currentPlantGeometry ||
      !this.currentPlantMaterial
    ) {
      console.error('[LandscapeManager] Cannot generate vegetation: Assets not loaded');
      return;
    }

    this.trees = new THREE.InstancedMesh(
      this.currentTreeGeometry,
      this.currentTreeMaterial,
      LANDSCAPE_DIMENSIONS.VEGETATION_COUNTS.TREES
    );
    this.trees.castShadow = true;
    this.trees.receiveShadow = true;
    this.populateTreeInstances(this.trees);
    this.scene.add(this.trees);

    this.crops = new THREE.InstancedMesh(
      this.currentPlantGeometry,
      this.currentPlantMaterial,
      LANDSCAPE_DIMENSIONS.VEGETATION_COUNTS.PLANTS
    );
    this.crops.castShadow = true;
    this.populateCropInstances(this.crops);
    this.scene.add(this.crops);
  }

  private populateTreeInstances(mesh: THREE.InstancedMesh): void {
    const tree = new THREE.Object3D();
    const baseOffset = this.calculateAssetBaseOffset(mesh.geometry);
    const rows = 5;
    const treesPerRow = mesh.count / rows;

    for (let i = 0; i < mesh.count; i++) {
      const row = Math.floor(i / treesPerRow);
      const posInRow = i % treesPerRow;
      const z = (posInRow / treesPerRow - 0.5) * 800;
      const x = (row / rows - 0.5) * 400 + 20; // Offset von +20 ist nötig damit die Bäume zwischen den Feldern stehen und nicht am Rand

      const finalX = x;
      const finalZ = z;

      const terrainHeight = this.getInterpolatedGroundHeightAt(finalX, finalZ);
      const scale = this.currentTreeScale.min + Math.random() * (this.currentTreeScale.max - this.currentTreeScale.min);

      tree.position.set(finalX, terrainHeight + baseOffset * scale, finalZ);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.scale.set(scale, scale, scale);
      tree.updateMatrix();
      mesh.setMatrixAt(i, tree.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  private populateCropInstances(mesh: THREE.InstancedMesh): void {
    const crop = new THREE.Object3D();
    const baseOffset = this.calculateAssetBaseOffset(mesh.geometry);
    const rows = 4;
    const cropsPerStrip = mesh.count / rows;

    for (let i = 0; i < mesh.count; i++) {
      const strip = Math.floor(i / cropsPerStrip);
      const xBase = ((strip + 0.5) / (rows + 1) - 0.5) * 400 + 100 / (rows + 1);

      const finalX = xBase + (Math.random() - 0.5) * 60;
      const finalZ = (Math.random() - 0.5) * 800;

      const terrainHeight = this.getInterpolatedGroundHeightAt(finalX, finalZ);
      const scale = this.currentPlantScale.min + Math.random() * (this.currentPlantScale.max - this.currentPlantScale.min);

      crop.position.set(finalX, terrainHeight + baseOffset * scale + 2, finalZ); // +2 für bessere Sichtbarkeit
      crop.rotation.y = Math.random() * Math.PI * 2;
      crop.scale.set(scale, scale, scale);
      crop.updateMatrix();
      mesh.setMatrixAt(i, crop.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Calculates the precise ground height at a world coordinate via bilinear interpolation
   * of the ground mesh's vertices. This is much faster than raycasting.
   * @param x World x-coordinate.
   * @param z World z-coordinate.
   * @returns The world y-coordinate (height) of the ground.
   */
  private getInterpolatedGroundHeightAt(x: number, z: number): number {
    if (!this.groundVertexPositions) return 0;

    const { width: groundWidth, height: groundHeight } = this.groundSize;
    const { width: segmentsX, height: segmentsZ } = this.groundSegments;

    // Convert world coordinates to local grid coordinates (e.g., -500..500 to 0..1000)
    const gridX = x + groundWidth / 2;
    const gridZ = z + groundHeight / 2; // Note: world Z corresponds to plane's local Y

    // Find which grid cell the point is in
    const cellX = Math.floor(gridX / (groundWidth / segmentsX));
    const cellZ = Math.floor(gridZ / (groundHeight / segmentsZ));

    if (cellX < 0 || cellX >= segmentsX || cellZ < 0 || cellZ >= segmentsZ) {
      return 0; // Out of bounds
    }

    // Calculate the fractional position within the cell (0 to 1)
    const fracX = gridX / (groundWidth / segmentsX) - cellX;
    const fracZ = gridZ / (groundHeight / segmentsZ) - cellZ;

    // Get indices of the 4 corner vertices in the buffer attribute
    const v00_idx = cellZ * (segmentsX + 1) + cellX;
    const v10_idx = v00_idx + 1;
    const v01_idx = v00_idx + (segmentsX + 1);
    const v11_idx = v01_idx + 1;

    // The height is stored in the Z component of the original PlaneGeometry
    const h00 = this.groundVertexPositions.getZ(v00_idx);
    const h10 = this.groundVertexPositions.getZ(v10_idx);
    const h01 = this.groundVertexPositions.getZ(v01_idx);
    const h11 = this.groundVertexPositions.getZ(v11_idx);

    // Bilinear interpolation
    const h_x1 = h00 * (1 - fracX) + h10 * fracX;
    const h_x2 = h01 * (1 - fracX) + h11 * fracX;
    const finalHeight = h_x1 * (1 - fracZ) + h_x2 * fracZ;

    return finalHeight;
  }

  private calculateAssetBaseOffset(geometry: THREE.BufferGeometry): number {
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox();
    }
    if (!geometry.boundingBox) return 0;
    return Math.abs(geometry.boundingBox.min.y);
  }

  private applyMoodToAssetMaterials(vegConfig: VegetationConfig): void {
    if (this.trees && this.trees.material instanceof THREE.MeshStandardMaterial) {
      this.trees.material.color.set(vegConfig.treeColor);
    }
    if (this.crops && this.crops.material instanceof THREE.MeshStandardMaterial) {
      this.crops.material.color.set(vegConfig.cropColor);
    }
  }

  private cleanupVegetation(): void {
    if (this.trees) {
      this.scene.remove(this.trees);
      this.trees.geometry.dispose();
      if (Array.isArray(this.trees.material)) {
        this.trees.material.forEach(mat => mat.dispose());
      } else {
        this.trees.material.dispose();
      }
      this.trees = null;
    }
    if (this.crops) {
      this.scene.remove(this.crops);
      this.crops.geometry.dispose();
      if (Array.isArray(this.crops.material)) {
        this.crops.material.forEach(mat => mat.dispose());
      } else {
        this.crops.material.dispose();
      }
      this.crops = null;
    }
  }

  applyMood(config: MoodConfig): void {
    if (this.ground) {
      (this.ground.material as THREE.MeshStandardMaterial).color.set(config.groundColor);
    }
    this.currentVegConfig = config.vegetation;
    this.applyMoodToAssetMaterials(config.vegetation);
  }

  update(elapsedTime: number, moodConfig: MoodConfig): void {
    if (!this.trees || !this.crops || !this.ground) return;

    const vegConfig = moodConfig.vegetation;
    const treeMaterial = this.trees.material as THREE.MeshStandardMaterial;
    const cropMaterial = this.crops.material as THREE.MeshStandardMaterial;
    const groundMaterial = this.ground.material as THREE.MeshStandardMaterial;

    // Update ground color from mood config
    groundMaterial.color.set(moodConfig.groundColor);

    if (vegConfig.pulsingColor) {
      // Slower pulsing: 0.1 -> 0.03 for more meditative pace
      const hue = (elapsedTime * 0.03) % 1;
      const saturation = 0.7 + Math.sin(elapsedTime * 0.05) * 0.2; // Soft saturation shift
      const lightness = 0.5 + Math.sin(elapsedTime * 0.04) * 0.15; // Gentle brightness shift

      treeMaterial.color.setHSL(hue, saturation, lightness);
      cropMaterial.color.setHSL((hue + 0.3) % 1, saturation * 0.9, lightness + 0.1);
    } else {
      treeMaterial.color.set(vegConfig.treeColor);
      cropMaterial.color.set(vegConfig.cropColor);
    }

    if (vegConfig.emissiveGlow && vegConfig.emissiveColor) {
      // Slower emissive pulsing with reduced intensity
      const intensity = ((Math.sin(elapsedTime * 0.8) + 1) / 2) * 0.3 + 0.1;

      // Color-shifting emissive glow with reduced saturation
      const emissiveHue = (elapsedTime * 0.02) % 1;
      const emissiveColor = new THREE.Color().setHSL(emissiveHue, 0.5, 0.4);

      treeMaterial.emissive.copy(emissiveColor);
      treeMaterial.emissiveIntensity = intensity * 0.7;
      cropMaterial.emissive.copy(emissiveColor);
      cropMaterial.emissiveIntensity = intensity * 0.8;
      groundMaterial.emissive.copy(emissiveColor);
      groundMaterial.emissiveIntensity = intensity * 0.2;
    } else {
      treeMaterial.emissiveIntensity = 0;
      cropMaterial.emissiveIntensity = 0;
      groundMaterial.emissiveIntensity = 0;
    }
  }

  dispose(): void {
    this.eventListeners.forEach(({ event, listener }) => {
      gameEventBus.off(event as any, listener as any);
    });
    this.eventListeners = [];

    this.cleanupVegetation();

    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
      this.ground = null;
    }

    this.currentTreeAsset = null;
    this.currentPlantAsset = null;
    this.currentTreeGeometry = null;
    this.currentTreeMaterial = null;
    this.currentPlantGeometry = null;
    this.currentPlantMaterial = null;
  }
}
