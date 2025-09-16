import * as THREE from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { assetLogger } from '../utils/Logger';

/**
 * Asset Manager - 3D Model Loading & Caching
 *
 * Handles OBJ/MTL loading with caching and fallback system.
 */

interface AssetCacheEntry {
  group: THREE.Group; // Original 3D-Model Group
  geometry: THREE.BufferGeometry; // Extrahierte Geometry für InstancedMesh
  material: THREE.Material | THREE.Material[]; // Material(s)
  loadTime: number; // Timestamp für LRU-Cache
  lastUsed: number; // Last Access für Cache-Eviction
  fileSize: number; // Geschätzte Memory-Größe
  isPlaceholder: boolean; // Ist dies ein Placeholder-Asset?
}

interface AssetLoadingOptions {
  preloadMaterials: boolean; // MTL vor OBJ laden (default: true)
  enableCaching: boolean; // Asset Caching aktivieren (default: true)
  fallbackToPlaceholder: boolean; // Bei Fehler Placeholder verwenden (default: true)
  timeout: number; // Loading Timeout in ms (default: 10000)
}

interface AssetLoadingProgress {
  assetName: string; // Asset filename
  stage: 'mtl' | 'obj' | 'complete' | 'error';
  progress: number; // 0-100
  loaded: number; // Bytes geladen
  total: number; // Total bytes (wenn bekannt)
  error?: string; // Error message bei Failure
}

type PlaceholderType = 'tree' | 'plant' | 'generic';

export class AssetManager {
  private static instance: AssetManager | null = null;

  private mtlLoader!: MTLLoader;
  private objLoader!: OBJLoader;

  private cache: Map<string, AssetCacheEntry> = new Map();
  private readonly maxCacheSize: number = 50;
  private readonly maxCacheMemory: number = 200 * 1024 * 1024;

  private placeholders: Map<PlaceholderType, THREE.Group> = new Map();

  private currentLoads: Map<string, Promise<THREE.Group>> = new Map();
  private loadingProgress: Map<string, AssetLoadingProgress> = new Map();

  private readonly basePath = '/';
  private readonly defaultOptions: AssetLoadingOptions = {
    preloadMaterials: true,
    enableCaching: true,
    fallbackToPlaceholder: true,
    timeout: 10000,
  };

  private constructor() {
    this.setupLoaders();
    this.createPlaceholders();
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  private setupLoaders(): void {
    this.mtlLoader = new MTLLoader();
    this.objLoader = new OBJLoader();
  }

  private createPlaceholders(): void {
    const treePlaceholder = new THREE.Group();
    const treeGeometry = new THREE.ConeGeometry(3, 12, 8);
    const treeMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      transparent: true,
      opacity: 0.5,
    });
    const treeMesh = new THREE.Mesh(treeGeometry, treeMaterial);
    treeMesh.position.y = 6;
    treePlaceholder.add(treeMesh);
    this.placeholders.set('tree', treePlaceholder);

    const plantPlaceholder = new THREE.Group();
    const plantGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
    const plantMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      transparent: true,
      opacity: 0.4,
    });
    const plantMesh = new THREE.Mesh(plantGeometry, plantMaterial);
    plantMesh.position.y = 2;
    plantPlaceholder.add(plantMesh);
    this.placeholders.set('plant', plantPlaceholder);

    const genericPlaceholder = new THREE.Group();
    const genericGeometry = new THREE.BoxGeometry(4, 4, 4);
    const genericMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      transparent: true,
      opacity: 0.3,
    });
    const genericMesh = new THREE.Mesh(genericGeometry, genericMaterial);
    genericPlaceholder.add(genericMesh);
    this.placeholders.set('generic', genericPlaceholder);
  }

  public async loadAsset(
    fileName: string,
    options?: Partial<AssetLoadingOptions>
  ): Promise<THREE.Group> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.getCacheKey(fileName);

    if (opts.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      cached.lastUsed = Date.now();
      return cached.group.clone();
    }

    if (this.currentLoads.has(fileName)) {
      return await this.currentLoads.get(fileName)!;
    }

    const loadPromise = this.performAssetLoad(fileName, opts);
    this.currentLoads.set(fileName, loadPromise);

    try {
      const group = await loadPromise;
      return group;
    } catch (error) {
      assetLogger.error(`Asset load failed: ${fileName}`, error);

      if (opts.fallbackToPlaceholder) {
        return this.getFallbackAsset(fileName);
      }
      throw error;
    } finally {
      this.currentLoads.delete(fileName);
      this.loadingProgress.delete(fileName);
    }
  }

  public async loadAssets(fileNames: string[]): Promise<Map<string, THREE.Group>> {
    const results = new Map<string, THREE.Group>();
    const loadPromises = fileNames.map(async fileName => {
      try {
        const group = await this.loadAsset(fileName);
        results.set(fileName, group);
      } catch (error) {
        assetLogger.error(`Asset batch load failed: ${fileName}`, error);
        results.set(fileName, this.getFallbackAsset(fileName));
      }
    });

    await Promise.all(loadPromises);
    return results;
  }

  public async preloadAssets(fileNames: string[]): Promise<void> {
    const preloadPromises = fileNames.map(fileName =>
      this.loadAsset(fileName).catch(error => {
        assetLogger.warn(`Preload failed: ${fileName}`, error);
      })
    );

    await Promise.allSettled(preloadPromises);
  }

  public getPlaceholderTree(): THREE.Group {
    return this.placeholders.get('tree')!.clone();
  }

  public getPlaceholderPlant(): THREE.Group {
    return this.placeholders.get('plant')!.clone();
  }

  public async getSelectionAsset(assetPath: string): Promise<THREE.Group> {
    return await this.loadAsset(assetPath);
  }

  public async getGeometryForInstancing(assetPath: string): Promise<THREE.BufferGeometry> {
    const group = await this.loadAsset(assetPath);
    return this.extractGeometry(group);
  }

  public async getMaterialForInstancing(assetPath: string): Promise<THREE.Material> {
    const group = await this.loadAsset(assetPath);
    return this.extractMaterial(group);
  }

  private async performAssetLoad(
    fileName: string,
    options: AssetLoadingOptions
  ): Promise<THREE.Group> {
    const progress: AssetLoadingProgress = {
      assetName: fileName,
      stage: 'mtl',
      progress: 0,
      loaded: 0,
      total: 0,
    };

    this.loadingProgress.set(fileName, progress);
    this.emitProgressEvent(progress);

    try {
      let materials: any | null = null;
      if (options.preloadMaterials) {
        materials = await this.loadMTL(fileName, progress);
      }

      progress.stage = 'obj';
      progress.progress = 50;
      this.emitProgressEvent(progress);

      const group = await this.loadOBJ(fileName, materials, progress);

      progress.stage = 'complete';
      progress.progress = 100;
      this.emitProgressEvent(progress);

      this.postProcessGroup(group);

      if (options.enableCaching) {
        this.cacheAsset(fileName, group);
      }

      return group;
    } catch (error) {
      progress.stage = 'error';
      progress.error = error instanceof Error ? error.message : String(error);
      this.emitProgressEvent(progress);
      throw error;
    }
  }

  private async loadMTL(fileName: string, progress: AssetLoadingProgress): Promise<any | null> {
    const mtlFileName = fileName.replace('.obj', '.mtl');

    // Construct full path - assets/ is served as public root in vite.config.ts
    const fullPath = `/3d_assets/${mtlFileName}`;

    return new Promise((resolve, _reject) => {
      this.mtlLoader.load(
        fullPath,
        materials => {
          materials.preload();
          progress.progress = 25;
          this.emitProgressEvent(progress);
          resolve(materials);
        },
        progressEvent => {
          if (progressEvent.total > 0) {
            progress.loaded = progressEvent.loaded;
            progress.total = progressEvent.total;
            progress.progress = Math.round((progressEvent.loaded / progressEvent.total) * 25);
            this.emitProgressEvent(progress);
          }
        },
        error => {
          assetLogger.debug(`MTL not found or failed: ${mtlFileName}`, error);
          resolve(null);
        }
      );
    });
  }

  private async loadOBJ(
    fileName: string,
    materials: any | null,
    progress: AssetLoadingProgress
  ): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      if (materials) {
        this.objLoader.setMaterials(materials);
      }

      // Construct full path - assets/ is served as public root in vite.config.ts
      const fullPath = `/3d_assets/${fileName}`;

      // Unterdrücke OBJLoader usemap Warnungen (Assets haben Farben, keine Texturen)
      const originalWarn = console.warn;
      console.warn = (message: any, ...args: any[]) => {
        if (
          typeof message === 'string' &&
          message.includes('OBJLoader') &&
          message.includes('usemap') &&
          message.includes('not supported')
        ) {
          return; // Warnung unterdrücken - Farben werden korrekt geladen
        }
        originalWarn(message, ...args);
      };

      this.objLoader.load(
        fullPath,
        group => {
          console.warn = originalWarn; // Console wiederherstellen
          progress.progress = 90;
          this.emitProgressEvent(progress);
          resolve(group);
        },
        progressEvent => {
          if (progressEvent.total > 0) {
            progress.loaded = progressEvent.loaded;
            progress.total = progressEvent.total;
            const objProgress = Math.round((progressEvent.loaded / progressEvent.total) * 40);
            progress.progress = 50 + objProgress;
            this.emitProgressEvent(progress);
          }
        },
        error => {
          console.warn = originalWarn; // Console auch bei Fehler wiederherstellen
          reject(new Error(`OBJ load failed: ${fileName} - ${error}`));
        }
      );
    });
  }

  private postProcessGroup(group: THREE.Group): void {
    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(group);

    group.position.y = -box.min.y;

    group.name = `AssetGroup_${Date.now()}`;
  }

  private extractGeometry(group: THREE.Group): THREE.BufferGeometry {
    let geometry: THREE.BufferGeometry | null = null;

    group.traverse(child => {
      if (child instanceof THREE.Mesh && child.geometry) {
        if (!geometry) {
          geometry = child.geometry.clone();
        } else {
          assetLogger.debug('Multiple geometries found, using first one');
        }
      }
    });

    if (!geometry) {
      assetLogger.warn('No geometry found in group, using fallback');
      return new THREE.BoxGeometry(2, 4, 2);
    }

    return geometry;
  }

  private extractMaterial(group: THREE.Group): THREE.Material {
    let material: THREE.Material | null = null;

    group.traverse(child => {
      if (child instanceof THREE.Mesh && child.material) {
        if (!material) {
          material = Array.isArray(child.material) ? child.material[0] : child.material;
        }
      }
    });

    if (!material) {
      assetLogger.warn('No material found in group, using fallback');
      return new THREE.MeshStandardMaterial({ color: 0x808080 });
    }

    return material;
  }

  private cacheAsset(fileName: string, group: THREE.Group): void {
    const cacheKey = this.getCacheKey(fileName);
    const geometry = this.extractGeometry(group);
    const material = this.extractMaterial(group);

    const entry: AssetCacheEntry = {
      group: group.clone(),
      geometry: geometry.clone(),
      material: material,
      loadTime: Date.now(),
      lastUsed: Date.now(),
      fileSize: this.estimateAssetSize(group),
      isPlaceholder: false,
    };

    this.enforceCache();

    this.cache.set(cacheKey, entry);
  }

  private enforceCache(): void {
    let totalMemory = 0;
    for (const entry of this.cache.values()) {
      totalMemory += entry.fileSize;
    }

    if (this.cache.size >= this.maxCacheSize || totalMemory > this.maxCacheMemory) {
      const sorted = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.lastUsed - b.lastUsed
      );

      const toRemove = Math.max(1, Math.floor(this.cache.size * 0.2));

      for (let i = 0; i < toRemove && sorted.length > 0; i++) {
        const [key, entry] = sorted.shift()!;
        this.disposeAssetEntry(entry);
        this.cache.delete(key);
      }
    }
  }

  private disposeAssetEntry(entry: AssetCacheEntry): void {
    entry.geometry.dispose();

    if (Array.isArray(entry.material)) {
      entry.material.forEach(mat => mat.dispose());
    } else {
      entry.material.dispose();
    }
  }

  private estimateAssetSize(group: THREE.Group): number {
    let size = 0;

    group.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) {
          size += child.geometry.attributes.position?.count * 12 || 1000;
        }
      }
    });

    return size;
  }

  private getCacheKey(fileName: string): string {
    return fileName.toLowerCase();
  }

  private getFallbackAsset(fileName: string): THREE.Group {
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('tree') || lowerName.startsWith('tree_')) {
      return this.getPlaceholderTree();
    } else if (
      lowerName.includes('crop') ||
      lowerName.includes('wheat') ||
      lowerName.includes('flower')
    ) {
      return this.getPlaceholderPlant();
    } else {
      return this.placeholders.get('generic')!.clone();
    }
  }

  private emitProgressEvent(_progress: AssetLoadingProgress): void {
    // Progress events disabled - could be implemented for loading UI
    return;
  }

  public getCacheStatus(): {
    size: number;
    maxSize: number;
    memoryUsage: number;
    maxMemory: number;
  } {
    let memoryUsage = 0;
    for (const entry of this.cache.values()) {
      memoryUsage += entry.fileSize;
    }

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      memoryUsage,
      maxMemory: this.maxCacheMemory,
    };
  }

  public clearCache(): void {
    for (const entry of this.cache.values()) {
      this.disposeAssetEntry(entry);
    }
    this.cache.clear();
  }

  public getLoadingProgress(fileName: string): AssetLoadingProgress | null {
    return this.loadingProgress.get(fileName) || null;
  }

  public dispose(): void {
    this.clearCache();

    for (const placeholder of this.placeholders.values()) {
      placeholder.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }
    this.placeholders.clear();

    this.currentLoads.clear();
    this.loadingProgress.clear();

    AssetManager.instance = null;
  }
}

export const assetManager = AssetManager.getInstance();
