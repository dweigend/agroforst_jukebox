# 🌳 Agroforst Jukebox - Interactive 3D Music Visualizer

Eine 3D-Musikvisualisierung für Agroforstsysteme mit RFID-Hardware-Integration. Das System kombiniert immersive Landschaftsvisualisierung mit einer innovativen physischen Musiksteuerung durch RFID-Karten.

**Entwickelt als Exponat für das [Futurium Lab](https://futurium.de) in Berlin.**

## 🎯 **Was ist das Agroforst Game?**

Ein interaktives Installation für Museen, Bildungszentren oder Ausstellungen, bei dem Besucher durch das Scannen von **20 physischen RFID-Karten** (10 Bäume + 10 Pflanzen) **100 einzigartige Song-Kombinationen** auslösen können. Jeder Song visualisiert automatisch die **Agroforst-Kompatibilität** zwischen der gewählten Baum-Pflanzen-Kombination durch eine realistische 3D-Landschaft mit atmosphärischen Effekten.

### 🌱 **Kernkonzept: Agroforest Compatibility Visualization**

Die Stimmung der 3D-Landschaft wird direkt durch die Song-Kombination bestimmt:

- **Harmonische Kombinationen** → Sonnige, friedliche Landschaft
- **Kooperative Kombinationen** → Lebendige Disco-Atmosphäre mit Regenbogen-Effekten
- **Neutrale Kombinationen** → Ausgewogene, ruhige Darstellung
- **Problematische Kombinationen** → Regnerische, düstere oder konfliktreiche Atmosphären
- **Kriegszustand** → Dramatische Feuer- und Raucheffekte

## 🚀 **Quick Start**

### Voraussetzungen

- **Node.js 18+** und npm
- **RFID-Scanner** im Keyboard-Emulation Modus (optional für Tests)
- **WebGL 2.0** Browser support
- **Touchscreen Display** empfohlen (optimiert für 1080x1080 round display)

### Installation & Start

```bash
# Repository klonen
git clone https://github.com/dweigend/agroforst_jukebox.git
cd agroforst_jukebox

# Dependencies installieren
npm install

# Development Server starten (Hot Reload)
npm run dev

# Production Build erstellen
npm run build

# Production Preview testen
npm run preview
```

**➡️ Anwendung läuft unter: http://localhost:5173**

### 🧪 **Sofortiger Test ohne Hardware**

```javascript
// Browser-Konsole öffnen (F12)

// RFID-Simulation:
scanTree(); // Simuliert Baum-Scan (Pappel)
scanPlant(); // Simuliert Pflanzen-Scan (Sonnenblume) → Spielt Song + zeigt Mood-Visualisierung

// UI-Tests:
window.innerUIManager.showPopup('main'); // Testet das Haupt-UI-Popup
window.innerUIManager.showPopup('info'); // Testet das Info-Panel

// Direkte Mood-Tests:
window.moodManager.applyMood('Harmonisch');
window.moodManager.applyMood('Konflikt');
```

## 🎮 **Features & Technische Highlights**

### 🎵 **RFID Music System**

- **100 Songs** (erstellt mit SUNO und 11Labs) mit realen MP3-Dateien
- **20 physische RFID-Karten** - Hardware-IDs konfigurierbar in `src/data/plants.json`
- **Direkte Mood-Zuordnung** in der Song-Datenbank
- **Keyboard-Fallback** für Entwicklung ohne RFID-Hardware
- **Automatic Mood Switching** basierend auf Song-Selection

### 🌍 **Immersive 3D Visualization**

- **150 Bäume + 10.000 Feldfrüchte** mit optimiertem InstancedMesh-Rendering
- **7 Mood-Atmosphären** mit einzigartigen visuellen Effekten:
  - Bis zu **5.000 Partikel** für Regen, Schnee, Feuer-Effekte
  - **8 dynamische Scheinwerfer** mit animierten Rotationen (Disco-Mode)
  - **UnrealBloom Post-Processing** für realistische Licht-Effekte
  - **Prozedurales Terrain** mit Simplex Noise
- **Auto-Rotation vs Manual Control** umschaltbar
- **Formwandler-Effekte** ändern Vegetation zur Laufzeit

### 🎨 **Modern UI System**

- **Glasmorphism Design** mit Beer CSS v3.6.13 Framework
- **Round Display Optimized** für 1080x1080 Touchscreens
- **2-Mode System**: `main` (RFID + Music Player) + `info` (Text-to-Speech Panel)
- **FAB Audio Player** mit Music Controls
- **Touch-Optimized Controls**

## 🏗️ **Architektur**

```
🎯 Core System:
├── SceneManager         → Three.js Renderer, Animation Loop
├── MoodManager          → 7 Mood Orchestration
├── CameraManager        → Auto-Rotation vs Manual Control
└── RFIDMusicManager     → ✨ ALL-IN-ONE: RFID + Music + Plant Logic

🌳 3D Visualization:
├── LandscapeManager     → Terrain + 10,150 Vegetation Objects
├── LightManager         → Dynamic Lighting (up to 8 animated lights)
├── EffectManager        → Particle Systems + UnrealBloom
└── AssetManager         → 3D Model Loading & Caching

🎵 Audio & UI:
├── AudioManager         → Music playback using Howler.js
└── UIManager            → Music Player + Plant Selection UI
```

**Event System**: Entkoppelte Manager-Kommunikation via `GameEventBus`

## 📱 **Hardware Integration**

### RFID-Setup (Production)

Die Zuordnung der 20 physischen Karten ist in `src/data/plants.json` definiert. Hier ist ein Auszug der IDs die im Futurium genutzt werden:

```json
// Bäume (Auszug)
"pappel": {
  "ids": ["0009806867", "T001_PAPPEL", "B001"],
  "name": "Pappel"
},
"robinie": {
  "ids": ["0009812134", "T002_ROBINIE", "B002"],
  "name": "Robinie"
}

// Pflanzen (Auszug)
"weizen": {
  "ids": ["0009812671", "P001_WEIZEN", "A001"],
  "name": "Weizen"
},
"dinkel": {
  "ids": ["0009811409", "P002_DINKEL", "A002"],
  "name": "Dinkel"
}
```

💡 **Anpassung**: Die Hardware-IDs können in `plants.json` für eigene RFID-Karten angepasst werden. Die gezeigten IDs sind die aktuell im Futurium Lab verwendeten Karten.

### Scanner-Konfiguration

- **Modus**: Keyboard-Emulation
- **Format**: 10-stellige Zahl + ENTER
- **Beispiel**: `0009812671\n`

## 🛠️ **Development**



### Debug Controls (Browser Console)

```javascript
// Event-System Debug
gameEventBus.setDebugMode(false); // Deaktiviert verbose logging

// Manager-spezifische Tests
window.moodManager.applyMood('Kooperativ');

// RFID Simulation
scanTree();
scanPlant();
```

### Performance Monitoring

- **WebGL Stats**: `renderer.info.render` (Draw calls, geometries)
- **Manager Performance**: Asset cache, particle counts, active lights
- **Bundle Size**: ~646KB (optimized Three.js tree-shaking)

## 📖 **Dokumentation**

| Datei                       | Zweck                                                       |
| --------------------------- | ----------------------------------------------------------- |
| **`README.md`**             | **Hauptdokumentation** - Quick Start, Features, Architektur |
| **`RFID-CARD-MAPPING.md`**  | **Hardware-Zuordnung** - Vollständige Karten-IDs            |
| **`src/configs/README.md`** | **Mood System Dokumentation** - Alle Parameter erklärt      |

### Für neue Entwickler

1. **Start hier**: `README.md` (diese Datei)
2. **Architektur**: `src/types.ts` (Interfaces) → `src/core/main.ts` (Initialisierung)
3. **RFID-System**: `src/data/plants.json`
4. **Mood-Konfiguration**: `src/configs/README.md` für detaillierte Parameter
5. **UI-Entwicklung**: `src/styles/round-frame.css` + `src/managers/UIManager.ts`

## 🎨 **UI Design Philosophy**

- **Beer CSS Framework** als Basis + **Agroforst Theme Extensions**
- **Glasmorphism** für moderne, transparente UI-Elemente
- **Material Design 3** Prinzipien für Konsistenz
- **Touch-First Design** für Tablet/Kiosk-Installation
- **Accessibility** durch ARIA-Labels und semantisches HTML

## 📄 **License**

MIT License - © 2025 David Weigend

Siehe [LICENSE.md](LICENSE.md) für Details.

---

**Entwickelt von**: [David Weigend](https://github.com/dweigend) | [weigend.studio](https://weigend.studio)
