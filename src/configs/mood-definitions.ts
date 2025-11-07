import * as THREE from 'three';
import { MoodConfig } from '../types';

export const moodStyles: Record<string, MoodConfig> = {
  Harmonisch: {
    name: 'Harmonisch',
    skyColor: '#87CEEB',
    fog: { color: '#87CEEB', density: 0.001 },
    ambient: { color: '#ffffff', intensity: 0.1 },
    keyLight: {
      color: '##FFFF00',
      intensity: 3,
      position: [-100, 150, 50],
    },
    sun: { visible: true, color: '#FFFF4F' },
    groundColor: '#7CFC00',
    vegetation: {
      treeColor: '#228B22',
      cropColor: '#ADFF2F',
    },
    bloom: {
      threshold: 0.85,
      strength: 0.8,
      radius: 0.5,
    },
    particles: {
      count: 200,
      material: {
        size: 2,
        textureType: 'sparkle',
        blending: 'additive',
        depthWrite: false,
        opacity: 0.8,
        color: '#FFFFDD',
      },
      behavior: {
        spawnArea: [800, 200, 800],
        velocity: [0, 0.1, 0],
        direction: 'up',
      },
    },
    ui: {
      borderColor: '#FFFFAA',
      shadowColor: '#FFFF00',
      shadowBlur: '30',
    },
  },
  Kooperativ: {
    name: 'Kooperativ',
    skyColor: '#220033',
    fog: { color: '#220033', density: 0.002 },
    ambient: { color: '#ffffff', intensity: 0.6 },
    keyLight: {
      color: '#FFD700',
      intensity: 3,
      position: [-150, 80, 0],
    },
    sun: { visible: true, color: '#FFD700' },
    groundColor: '#4F7039',
    vegetation: {
      pulsingColor: true,
      treeColor: '#ff00ff',
      cropColor: '#00ffff',
    },
    bloom: {
      threshold: 0.1,
      strength: 1.0,
      radius: 0.8,
    },
    particles: {
      count: 5000,
      material: {
        size: 1.5,
        textureType: 'sparkle',
        blending: 'additive',
        depthWrite: false,
        opacity: 1.0,
        color: 'rainbow',
      },
      behavior: {
        spawnArea: [800, 200, 800],
        velocity: [0, 0.05, 0],
        direction: 'up',
      },
    },
    dynamicLights: Array.from({ length: 8 }, (_, i) => ({
      name: `disco_spot_${i}`,
      type: 'spot' as const,
      color: new THREE.Color().setHSL(i / 8, 1, 0.5).getHex(),
      intensity: 300,
      angle: Math.PI / 8,
      penumbra: 0.5,
      decay: 2,
      position: [0, 80, 0],
      animation: {
        enabled: true,
        mode: 'disco' as const,
        params: {
          disco: {
            rotationSpeed: [2.0 + i * 0.3, 3.0 + i * 0.2], // Verschiedene Geschwindigkeiten
            radius: 120 + i * 15, // Verschiedene Radien
            heightOffset: i * 5, // Verschiedene Höhen
            targetMovement: true, // Bewegliche Targets
          },
        },
      },
    })),
    ui: {
      borderColor: 'rainbow',
      shadowColor: 'rainbow',
      shadowBlur: '40',
    },
  },
  Neutral: {
    name: 'Neutral',
    skyColor: '#B0C4DE',
    fog: { color: '#B0C4DE', density: 0.002 },
    ambient: { color: '#aaaaaa', intensity: 0.7 },
    keyLight: {
      color: '#ffffff',
      intensity: 2.5,
      position: [50, 100, 50],
    },
    sun: { visible: false, color: '#FFFFFF' },
    groundColor: '#8FBC8F',
    vegetation: {
      treeColor: '#556B2F',
      cropColor: '#6B8E23',
    },
    bloom: {
      threshold: 0.9,
      strength: 0.5,
      radius: 0.5,
    },
    ui: {
      borderColor: '#CCCCCC',
      shadowColor: '#FFFFFF',
      shadowBlur: '20',
    },
  },
  Distanziert: {
    name: 'Distanziert',
    skyColor: '#483D8B',
    fog: { color: '#483D8B', density: 0.003 },
    ambient: { color: '#483D8B', intensity: 0.7 },
    keyLight: {
      color: '#ffccaa',
      intensity: 2.2,
      position: [-840, 20, 10],
    },
    sun: { visible: true, color: '#ffccaa' },
    groundColor: '#0E1C00',
    vegetation: {
      treeColor: '#2F4F4F',
      cropColor: '#556B2F',
    },
    bloom: {
      threshold: 0.5,
      strength: 1.2,
      radius: 0.8,
    },
    particles: {
      count: 4000,
      material: {
        size: 0.8,
        textureType: 'sparkle',
        blending: 'normal',
        depthWrite: true,
        opacity: 0.5,
        color: '#AAAAFF',
      },
      behavior: {
        spawnArea: [800, 200, 800],
        velocity: [0, -2, 0],
        direction: 'down',
      },
    },
    ui: {
      borderColor: '#ffccaa',
      shadowColor: '#FF4500',
      shadowBlur: '35',
    },
  },
  Spannung: {
    name: 'Spannung',
    skyColor: '#200000',
    fog: { color: '#570066', density: 0.004 },
    ambient: { color: '#400000', intensity: 0.005 },
    keyLight: {
      color: '#B00000',
      intensity: 1.5,
      position: [0, 100, 0],
    },
    sun: { visible: true, color: '#ff0000' },
    groundColor: '#008556',
    vegetation: {
      treeColor: '#1a0000',
      cropColor: '#100000',
      emissiveGlow: true,
      emissiveColor: '#FF0000',
    },
    bloom: {
      threshold: 0.1,
      strength: 2.0,
      radius: 1.2,
    },
    dynamicLights: [
      {
        name: 'dynamic_strobe',
        type: 'point' as const,
        color: [0xffffff, 0x00ffff00],
        intensity: [20, 60],
        angle: Math.PI / 3,
        penumbra: 0.1,
        decay: 0.6,
        position: [10, 80, 0],
      },
    ],
    particles: {
      count: 2500,
      material: {
        size: 4,
        textureType: 'sparkle',
        blending: 'additive',
        depthWrite: false,
        opacity: 0.5,
        color: '#FF4500',
      },
      behavior: {
        spawnArea: [800, 200, 800],
        velocity: [0, 0.2, 0],
        direction: 'up',
      },
    },

    ui: {
      borderColor: '#FF4500',
      shadowColor: '#FF0000',
      shadowBlur: '40',
    },
  },
  Konflikt: {
    name: 'Konflikt',
    skyColor: '#050505',
    fog: { color: '#110000', density: 0.005 },
    ambient: { color: '#220000', intensity: 1.5 },
    keyLight: {
      color: '#009900', // Fixed color format
      intensity: 1,
      position: [-200, 30, 0],
    },
    sun: { visible: true, color: '#ffffff' },
    groundColor: '#333333',
    vegetation: {
      treeColor: '#444444',
      cropColor: '#555555',
    },
    bloom: { threshold: 0, strength: 3.0, radius: 0.8 },

    dynamicLights: [
      {
        name: 'conflict_strobe',
        type: 'spot' as const,
        color: 0xffffff,
        intensity: 100,
        angle: Math.PI / 3,
        penumbra: 0.0,
        decay: 0.4,
        position: [0, 150, 0],
        animation: {
          enabled: true,
          mode: 'strobe' as const,
          params: {
            strobe: {
              triggerChance: 0.15, // 15% chance = häufige Strobo-Blitze
              maxIntensity: 3000, // Sehr hell
              fadeSpeed: 0.4, // Mittleres Ausblenden
              colors: [0xffffff, 0x440000], // Weiß-Rot Konflikt
            },
          },
        },
      },
    ],

    ui: {
      borderColor: '#FFFFFF',
      shadowColor: '#FF0000',
      shadowBlur: '50',
    },
  },
  Krieg: {
    name: 'Krieg',
    skyColor: '#1A0000',
    fog: { color: '#FF4500', density: 0.001 },
    ambient: { color: '#FF0000', intensity: 0.3 },
    keyLight: {
      color: '#FF6600',
      intensity: 2.5,
      position: [200, 50, -100],
    },
    sun: { visible: false, color: '#ff0000' },
    groundColor: '#330000',
    vegetation: {
      treeColor: '#4A0000',
      cropColor: '#661100',
      emissiveGlow: true,
      emissiveColor: '#FF6600',
    },
    bloom: { threshold: 0, strength: 3.5, radius: 1.8 },
    dynamicLights: [
      {
        name: 'lightning_strobe',
        type: 'spot' as const,
        color: 0xffffff,
        intensity: 200,
        angle: Math.PI / 3,
        penumbra: 0.1,
        decay: 0.8,
        position: [0, 150, 0],
        animation: {
          enabled: true,
          mode: 'strobe' as const,
          params: {
            strobe: {
              triggerChance: 0.05, // 5% chance per frame = seltene Blitze
              maxIntensity: 4000, // Sehr heller Blitz
              fadeSpeed: 0.2, // Schnelles Ausblenden
              colors: [0xffffff, 0x87ceeb, 0xffffff], // Weiß-Blau Variationen
            },
          },
        },
      },
      {
        name: 'fire_explosion',
        type: 'point' as const,
        color: 0xff4500,
        intensity: 150,
        distance: 400,
        decay: 1.5,
        position: [100, 40, -80],
        animation: {
          enabled: true,
          mode: 'explosion' as const,
          params: {
            explosion: {
              triggerChance: 0.08, // 8% chance = häufige Explosionen
              intensityMultiplier: 3.5,
              fadeSpeed: 0.15,
              randomPosition: true,
              positionRange: [200, 60, 200], // Große Explosionsfläche
            },
          },
        },
      },
      {
        name: 'war_pulse',
        type: 'point' as const,
        color: 0xff0000,
        intensity: 80,
        distance: 300,
        decay: 2.0,
        position: [-120, 60, 100],
        animation: {
          enabled: true,
          mode: 'pulse' as const,
          params: {
            pulse: {
              frequency: 1.2, // Schneller Puls
              intensityRange: [0.2, 4.0], // Von sehr dunkel zu sehr hell
              phaseOffset: 0,
            },
          },
        },
      },
    ],

    particles: [
      {
        name: 'smoke',
        count: 500,
        material: {
          size: 60,
          textureType: 'smoke' as const,
          blending: 'normal' as const,
          depthWrite: false,
          opacity: 0.3,
          color: '#220000',
        },
        behavior: {
          spawnArea: [600, 200, 1000],
          velocity: [0.1, 0.15, 0.1],
          direction: 'up' as const,
        },
      },
      {
        name: 'fire',
        count: 1500,
        material: {
          size: 1.5,
          textureType: 'sparkle' as const,
          blending: 'additive' as const,
          depthWrite: false,
          opacity: 1.0,
          color: ['#FF0000'],
        },
        behavior: {
          spawnArea: [900, 150, 900],
          velocity: [0, 0.6, 0],
          direction: 'up' as const,
        },
      },
      {
        name: 'embers',
        count: 500,
        material: {
          size: 2.2,
          textureType: 'sparkle' as const,
          blending: 'additive' as const,
          depthWrite: false,
          opacity: 0.8,
          color: '#FF4500',
        },
        behavior: {
          spawnArea: [1200, 400, 1200],
          velocity: [0.2, 0.3, 0.2],
          direction: 'up' as const,
        },
      },
    ],

    ui: {
      borderColor: '#FF0000',
      shadowColor: '#FF6600',
      shadowBlur: '80',
    },
  },

  Groove: {
    name: 'Groove',
    skyColor: '#2d1b69',
    fog: { color: '#2d1b69', density: 0.0025 },
    ambient: { color: '#ffd700', intensity: 0.7 },
    keyLight: {
      color: '#ffd700',
      intensity: 4.0,
      position: [0, 120, 100],
    },
    sun: { visible: true, color: '#ffd700' },
    groundColor: '#4a0080',
    vegetation: {
      treeColor: '#8a2be2',
      cropColor: '#ffd700',
      pulsingColor: true,
    },
    bloom: {
      threshold: 0.4,
      strength: 2.2,
      radius: 0.9,
    },
    particles: {
      count: 3000,
      material: {
        size: 2.5,
        textureType: 'sparkle',
        blending: 'additive',
        depthWrite: false,
        opacity: 0.8,
        color: '#ffd700',
      },
      behavior: {
        spawnArea: [600, 150, 600],
        velocity: [0, 0.08, 0],
        direction: 'up',
      },
    },
    dynamicLights: [
      {
        name: 'groove_spot_1',
        type: 'spot' as const,
        color: 0xffd700,
        intensity: 150,
        angle: Math.PI / 6,
        penumbra: 0.3,
        decay: 1.8,
        position: [-100, 80, 50],
      },
      {
        name: 'groove_spot_2',
        type: 'spot' as const,
        color: 0x8a2be2,
        intensity: 150,
        angle: Math.PI / 6,
        penumbra: 0.3,
        decay: 1.8,
        position: [100, 80, -50],
      },
    ],
    ui: {
      borderColor: '#ffd700',
      shadowColor: '#8a2be2',
      shadowBlur: '35',
    },
  },
  Transzendent: {
    name: 'Transzendent',
    skyColor: '#000011',
    fog: { color: '#110022', density: 0.004 },
    ambient: { color: '#6a4c93', intensity: 1.2 },
    keyLight: {
      color: '#ffd700',
      intensity: 2.8,
      position: [0, 180, 0],
    },
    sun: { visible: true, color: '#ffd700' },
    groundColor: '#2a1b5d',
    vegetation: {
      treeColor: '#8a2be2',
      cropColor: '#00ffff',
      emissiveGlow: true,
      emissiveColor: '#ff69b4',
      pulsingColor: true,
    },
    bloom: {
      threshold: 0.5,
      strength: 1.0,
      radius: 1.5,
    },
    particles: [
      {
        name: 'souls',
        count: 800,
        material: {
          size: [6, 22],
          textureType: 'sparkle',
          blending: 'additive',
          depthWrite: false,
          opacity: [0.2, 0.5],
          color: ['#ff69b4', '#ffc0cb', '#da70d6'],
        },
        behavior: {
          spawnArea: [600, 400, 600],
          velocity: [0.1, 0.04, 0.01],
          direction: 'up',
        },
      },
      {
        name: 'stars',
        count: 3000,
        material: {
          size: [1, 5],
          textureType: 'sparkle',
          blending: 'additive',
          depthWrite: false,
          opacity: [0.3, 0.8],
          color: ['#e6e6fa', '#b19cd9', '#dda0dd', '#ffd700'],
        },
        behavior: {
          spawnArea: [800, 300, 800],
          velocity: [0.01, 0.05, 0],
          direction: 'up',
        },
      },
    ],
    dynamicLights: [
      {
        name: 'ethereal_point_1',
        type: 'point' as const,
        color: 0xff69b4,
        intensity: 42, // Base intensity (middle of [20, 65])
        distance: 480,
        decay: 3.0,
        position: [-80, 60, 40],
        animation: {
          enabled: true,
          mode: 'pulse' as const,
          params: {
            pulse: {
              frequency: 0.8,
              intensityRange: [0.5, 1.5], // 20-65 range through multiplier
              phaseOffset: 0,
            },
          },
        },
      },
      {
        name: 'ethereal_point_2',
        type: 'point' as const,
        color: 0x00ffff,
        intensity: 27, // Base intensity (middle of [15, 40])
        distance: 260,
        decay: 3.2,
        position: [60, 90, -60],
        animation: {
          enabled: true,
          mode: 'pulse' as const,
          params: {
            pulse: {
              frequency: 1.2,
              intensityRange: [0.6, 1.4], // 15-40 range through multiplier
              phaseOffset: Math.PI / 3, // 60° Phasenverschiebung
            },
          },
        },
      },
      {
        name: 'ethereal_point_3',
        type: 'point' as const,
        color: 0xffd700,
        intensity: 45, // Base intensity (middle of [28, 62])
        distance: 300,
        decay: 2.8,
        position: [0, 120, 80],
        animation: {
          enabled: true,
          mode: 'pulse' as const,
          params: {
            pulse: {
              frequency: 0.6,
              intensityRange: [0.6, 1.4], // 28-62 range through multiplier
              phaseOffset: Math.PI / 2, // 90° Phasenverschiebung
            },
          },
        },
      },
      {
        name: 'ethereal_point_4',
        type: 'point' as const,
        color: 0x8a2be2,
        intensity: 25, // Base intensity (middle of [12, 38])
        distance: 240,
        decay: 3.5,
        position: [-60, 80, -40],
        animation: {
          enabled: true,
          mode: 'pulse' as const,
          params: {
            pulse: {
              frequency: 1.5,
              intensityRange: [0.5, 1.5], // 12-38 range through multiplier
              phaseOffset: Math.PI, // 180° Phasenverschiebung
            },
          },
        },
      },
    ],
    ui: {
      borderColor: '#ffd700',
      shadowColor: '#ff69b4',
      shadowBlur: '40',
    },
  },
};
