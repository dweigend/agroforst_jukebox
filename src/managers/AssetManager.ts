import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { assetLogger } from '../utils/Logger';

/**
 * AssetManager - 3D Asset Loading for Agroforest RFID Visualization
 *
 * Manages loading of 20 plant/tree 3D models (.obj files) used in the RFID-controlled
 * agroforest music visualizer. Each RFID card scan triggers loading of specific
 * plant assets (trees + crops) to create dynamic 3D landscapes.
 *
 * Architecture: Simple caching system for fast asset reuse during RFID interactions.
 * No over-engineering - optimized for 20 small OBJ files, not thousands.
 */

// Asset loading configuration
const ASSET_BASE_PATH = '/3d_assets/';
const LOAD_TIMEOUT_MS = 5000;
const PLACEHOLDER_TREE_COLOR = 0x228b22;
const PLACEHOLDER_PLANT_COLOR = 0x32cd32;

interface LoadedAsset {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  group: THREE.Group;
}

type PlaceholderType = 'tree' | 'plant';

export class AssetManager {
  private static instance: AssetManager | null = null;

  private mtlLoader = new MTLLoader();
  private objLoader = new OBJLoader();
  private cache = new Map<string, LoadedAsset>();
  private placeholders = new Map<PlaceholderType, LoadedAsset>();

  private constructor() {
    this.createPlaceholders();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  // Initialize geometric fallback shapes for missing assets
  private createPlaceholders(): void {
    this.placeholders.set('tree', this.createTreePlaceholder());
    this.placeholders.set('plant', this.createPlantPlaceholder());
  }

  private createTreePlaceholder(): LoadedAsset {
    const geometry = new THREE.ConeGeometry(2, 8, 8);
    const material = new THREE.MeshStandardMaterial({
      color: PLACEHOLDER_TREE_COLOR,
    });
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 4;
    group.add(mesh);

    return { geometry, material, group };
  }

  private createPlantPlaceholder(): LoadedAsset {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 6);
    const material = new THREE.MeshStandardMaterial({
      color: PLACEHOLDER_PLANT_COLOR,
    });
    const group = new THREE.Group();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1;
    group.add(mesh);

    return { geometry, material, group };
  }

  // Primary interface: Load 3D asset from /public/3d_assets/ directory
  public async loadAsset(fileName: string): Promise<THREE.Group> {
    if (this.cache.has(fileName)) {
      return this.cache.get(fileName)!.group.clone();
    }

    try {
      const asset = await this.loadFromFile(fileName);
      this.cache.set(fileName, asset);
      return asset.group.clone();
    } catch (error) {
      assetLogger.error(`Asset load failed: ${fileName}`, error);
      return this.getFallbackAsset(fileName);
    }
  }

  // Extract geometry for high-performance vegetation rendering (InstancedMesh)
  public async getGeometryForInstancing(fileName: string): Promise<THREE.BufferGeometry> {
    const group = await this.loadAsset(fileName);
    return this.extractGeometry(group);
  }

  // Extract material for vegetation instancing
  public async getMaterialForInstancing(fileName: string): Promise<THREE.Material> {
    const group = await this.loadAsset(fileName);
    return this.extractMaterial(group);
  }

  // Fallback assets when OBJ files fail to load
  public getPlaceholderTree(): THREE.Group {
    return this.placeholders.get('tree')!.group.clone();
  }

  public getPlaceholderPlant(): THREE.Group {
    return this.placeholders.get('plant')!.group.clone();
  }

  // Core asset loading: MTL materials + OBJ geometry pipeline
  private async loadFromFile(fileName: string): Promise<LoadedAsset> {
    const materials = await this.loadMTL(fileName);
    const group = await this.loadOBJ(fileName, materials);

    this.setupShadows(group);
    this.centerGroup(group);

    const geometry = this.extractGeometry(group);
    const material = this.extractMaterial(group);

    return { geometry, material, group };
  }

  private async loadMTL(fileName: string): Promise<any | null> {
    const mtlPath = `${ASSET_BASE_PATH}${fileName.replace('.obj', '.mtl')}`;

    return new Promise(resolve => {
      this.mtlLoader.load(
        mtlPath,
        materials => {
          materials.preload();
          resolve(materials);
        },
        undefined,
        () => resolve(null) // MTL files optional - fallback to OBJ vertex colors
      );
    });
  }

  private async loadOBJ(fileName: string, materials: any): Promise<THREE.Group> {
    const objPath = `${ASSET_BASE_PATH}${fileName}`;

    if (materials) {
      this.objLoader.setMaterials(materials);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Asset load timeout: ${fileName}`));
      }, LOAD_TIMEOUT_MS);

      this.objLoader.load(
        objPath,
        group => {
          clearTimeout(timeoutId);
          resolve(group);
        },
        undefined,
        error => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  private setupShadows(group: THREE.Group): void {
    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private centerGroup(group: THREE.Group): void {
    const box = new THREE.Box3().setFromObject(group);
    group.position.y = -box.min.y; // Position model at ground level
  }

  private extractGeometry(group: THREE.Group): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry | null = null;

    group.traverse(child => {
      if (child instanceof THREE.Mesh && !geometry) {
        geometry = child.geometry.clone();
      }
    });

    return geometry || new THREE.BoxGeometry(1, 1, 1);
  }

  private extractMaterial(group: THREE.Group): THREE.Material {
    let material: THREE.Material | null = null;

    group.traverse(child => {
      if (child instanceof THREE.Mesh && !material) {
        material = Array.isArray(child.material) ? child.material[0] : child.material;
      }
    });

    return material || new THREE.MeshStandardMaterial({ color: 0x808080 });
  }

  private getFallbackAsset(fileName: string): THREE.Group {
    const isTree = fileName.toLowerCase().includes('tree');
    return isTree ? this.getPlaceholderTree() : this.getPlaceholderPlant();
  }

  // Resource cleanup for memory management
  public dispose(): void {
    this.cache.clear();
    this.placeholders.clear();
    AssetManager.instance = null;
  }
}

export const assetManager = AssetManager.getInstance();
