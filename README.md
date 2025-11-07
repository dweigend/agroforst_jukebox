# 🌳 Agroforst Game - Interactive 3D Music Visualizer

Eine production-ready 3D-Musikvisualisierung für Agroforstsysteme mit vollständiger **RFID-Hardware-Integration**. Das System kombiniert immersive Landschaftsvisualisierung mit einer innovativen physischen Musiksteuerung durch RFID-Karten.

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

### 🎵 **RFID Music System** (Production-Ready)

- **100 SUNO-generierte Songs** mit realen MP3-Dateien
- **20 physische RFID-Karten** mit finalen Hardware-IDs (siehe `src/data/plants.json`)
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

### 🎨 **Modern UI System** (ULTRATHINK Simplified ✅)

- **Glasmorphism Design** mit Beer CSS v3.6.13 Framework
- **Round Display Optimized** für 1080x1080 Touchscreens
- **VEREINFACHT**: Ein einziger UIManager für alle UI-Funktionen
- **2-Mode System**: `main` (RFID + Music Player) + `info` (Text-to-Speech Panel)
- **FAB Audio Player** mit einfacher Show/Hide Logik
- **Touch-Optimized Controls** ohne komplexe Timer-Logik

## 🏗️ **Architektur**

Das System folgt dem **ULTRATHINK Prinzip** - maximale Vereinfachung durch direkte Integration statt abstrakten Service-Layern.

```
🎯 Core System (SIMPLIFIED):
├── SceneManager         → Three.js Renderer, Animation Loop
├── MoodManager          → 7 Mood Orchestration
├── CameraManager        → Auto-Rotation vs Manual Control
└── RFIDMusicManager     → ✨ ALL-IN-ONE: RFID + Music + Plant Logic

🌳 3D Visualization:
├── LandscapeManager     → Terrain + 10,150 Vegetation Objects
├── LightManager         → Dynamic Lighting (up to 8 animated lights)
├── EffectManager        → Particle Systems + UnrealBloom
└── AssetManager         → 3D Model Loading & Caching

🎵 Audio & UI (SIMPLIFIED):
├── AudioManager         → Music playback using Howler.js
└── UIManager            → ✨ UNIFIED: Music Player + Plant Selection UI
```

**✨ ULTRATHINK Refactoring Complete:**

- **Services-Ordner eliminiert** - Business Logic direkt in Manager integriert
- **6 Manager → 2 Haupt-Manager** - RFIDMusicManager + UIManager
- **~1100 Zeilen → ~400 Zeilen** - 65% Code-Reduktion
- **Keine State-Machine** - Einfache if/else Logik statt komplexer Zustandsautomaten

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

⚠️ **WICHTIG**: Die Hardware-IDs in `plants.json` sind **bindend** und dürfen nicht geändert werden!

### Scanner-Konfiguration

- **Modus**: Keyboard-Emulation
- **Format**: 10-stellige Zahl + ENTER
- **Beispiel**: `0009812671\n`

## 🛠️ **Development**

### Code Quality & Testing

```bash
# Code Quality
npm run lint          # ESLint checking
npm run lint:fix      # Auto-fix issues
npm run format        # Prettier formatting
npm run type-check    # TypeScript validation

# Testing (configured but no script)
# vitest is installed - add "test": "vitest" to package.json scripts
```

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

| Datei                      | Zweck                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| **`CLAUDE.md`**            | **Vollständige LLM-Anleitung** mit File-Index und Architektur-Details |
| **`RFID-CARD-MAPPING.md`** | **Hardware-Zuordnung** - Finale Karten-IDs (NICHT ÄNDERN)             |
| **`docs/archive/`**        | **Historische Dokumentation** - Architektur-Evolution, Design-Pläne   |

### Für neue Entwickler

1. **Start hier**: `CLAUDE.md`
2. **Architektur**: `src/types.ts` (Interfaces) → `src/core/main.ts` (Initialisierung)
3. **RFID-System**: `src/data/plants.json`
4. **UI-Entwicklung**: `src/styles/round-display.css` + `src/managers/InnerUIManager.ts`

## ⚠️ **Known Issues**

- **Missing Audio File**: Song 077 (Elsbeere_Mais.mp3) ist aktuell nicht im Repository vorhanden
- Dies betrifft die Kombination Elsbeere + Mais
- Alle anderen 99 Songs funktionieren einwandfrei

## 🎨 **UI Design Philosophy**

- **Beer CSS Framework** als Basis + **Agroforst Theme Extensions**
- **Glasmorphism** für moderne, transparente UI-Elemente
- **Material Design 3** Prinzipien für Konsistenz
- **Touch-First Design** für Tablet/Kiosk-Installation
- **Accessibility** durch ARIA-Labels und semantisches HTML

## 🌟 **Production Status**

✅ **Vollständig einsatzbereit für Installation/Museum**

- 100 Songs mit echter Hardware-Integration
- Robuste Error-Handling und Fallback-Systeme
- Performance-optimiert für Dauerbetrieb
- Comprehensive Testing Tools für Wartung

**Hardware-Anforderungen:**

- Raspberry Pi 4+ oder Desktop PC (WebGL 2.0)
- RFID-Scanner (USB, Keyboard-Emulation)
- 1080x1080 Touchscreen (optional, aber empfohlen)
- Audio-Ausgabe (Lautsprecher/Kopfhörer)

---

## 📄 **License**

MIT License - © 2025 David Weigend

Siehe [LICENSE.md](LICENSE.md) für Details.

---

**🚀 Ready for Production Deployment!**

_Für technische Fragen, siehe `CLAUDE.md` für vollständige LLM-Navigation und Architektur-Details._

**Entwickelt von**: [David Weigend](https://github.com/dweigend) | [weigend.studio](https://weigend.studio)
