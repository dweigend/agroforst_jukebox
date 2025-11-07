# 🎨 Mood Configuration Reference

Diese Datei erklärt alle Parameter der **Mood-Definitionen** in `mood-definitions.ts`. Jeder Mood definiert eine komplette 3D-Atmosphäre mit Beleuchtung, Partikeln, Effekten und UI-Styling.

## 📋 Verfügbare Moods

| Mood             | Beschreibung               | Charakteristika                                          |
| ---------------- | -------------------------- | -------------------------------------------------------- |
| **Harmonisch**   | Friedlicher, heller Look   | Warme Farben, sanfte Partikel, Sonnenlicht               |
| **Kooperativ**   | Cyberpunk/Neon-Ästhetik    | Regenbogenfarben, viele Partikel, dynamische Lichter     |
| **Neutral**      | Standard neutraler Look    | Ausgewogene Beleuchtung, natürliche Farben               |
| **Distanziert**  | Kühler, dunklerer Look     | Bläuliche Töne, fallende Partikel                        |
| **Spannung**     | Dramatisch rötlich         | Dunkler Himmel, orange Glühen, aufsteigende Partikel     |
| **Konflikt**     | Dunkel mit Strobo-Effekten | Sehr dunkel, Strobo-Lichter, minimale Beleuchtung        |
| **Krieg**        | Apokalyptisch              | Rauch, Feuer, Explosions-Lichter, sehr dunkle Atmosphäre |
| **Groove**       | Party/Disco-Atmosphäre     | Violett-Gold, starker Bloom, Spotlight-Effekte           |
| **Transzendent** | Mystisch/Spirituell        | Ethereale Lichter, "Seelen"-Partikel, sanfte Effekte     |

## 🌍 Basis-Atmosphäre Parameter

### skyColor

**Beschreibung**: Himmelfarbe als Hintergrund der 3D-Szene
**Format**: Hex-Color-String (z.B. `'#87CEEB'`)
**Beispiele**:

- `'#87CEEB'` - Harmonisch (Himmelblau)
- `'#220033'` - Kooperativ (Dunkles Violett)
- `'#050000'` - Krieg (Fast Schwarz)

### fog

**Beschreibung**: Nebel-Effekt für Tiefenwirkung
**Parameter**:

- `color`: Nebelfarbe (meist ähnlich skyColor)
- `density`: Nebeldichte (0.001 - 0.01)
  - Niedrige Werte (0.001): Subtiler Nebel
  - Hohe Werte (0.01): Dichter Nebel

```typescript
fog: { color: '#87CEEB', density: 0.001 }
```

### groundColor

**Beschreibung**: Bodenfarbe der Landschaft
**Format**: Hex-Color-String
**Beispiele**:

- `'#7CFC00'` - Harmonisch (Helles Grün)
- `'#4B0082'` - Kooperativ (Indigo)
- `'#080000'` - Krieg (Sehr dunkel)

## 💡 Beleuchtungs-System

### ambient

**Beschreibung**: Umgebungslicht - beleuchtet alle Objekte gleichmäßig
**Parameter**:

- `color`: Lichtfarbe (Hex-String)
- `intensity`: Lichtstärke (0.0 - 2.0)
  - 0.6-0.8: Normale Beleuchtung
  - 1.0+: Helle Beleuchtung

```typescript
ambient: { color: '#ffffff', intensity: 0.8 }
```

### keyLight

**Beschreibung**: Hauptlichtquelle mit gerichteter Beleuchtung
**Parameter**:

- `color`: Lichtfarbe
- `intensity`: Lichtstärke (0 - 5)
- `position`: 3D-Position [x, y, z] in der Szene

```typescript
keyLight: {
  color: '#FFDDAA',
  intensity: 3,
  position: [100, 150, 50]  // x=rechts, y=oben, z=vorn
}
```

### sun

**Beschreibung**: Sonnen-Simulation
**Parameter**:

- `visible`: Sonne sichtbar (true/false)
- `color`: Sonnenfarbe

```typescript
sun: { visible: true, color: '#FFFFAA' }
```

### dynamicLights (Optional)

**Beschreibung**: Animierte/bewegliche Lichter für spezielle Effekte wie Strobo, Explosionen, Stage Lights

#### Licht-Typen:

- **`'spot'`**: Gerichtetes Kegel-Licht (Scheinwerfer, Bühnenlicht)
- **`'point'`**: Omnidirektionales Licht (Glühbirnen, Explosionen)

#### Parameter im Detail:

##### Basis-Parameter (beide Typen):

- **`name`**: Eindeutiger Licht-Identifier
- **`type`**: `'spot'` oder `'point'`
- **`color`**:
  - Einzelwert: `0xff0000` (rot)
  - Array für Animation: `[0xff0000, 0x00ff00, 0x0000ff]` (RGB-Wechsel)
- **`intensity`**:
  - **Range**: 0-500 (typisch 50-200)
  - Einzelwert: `150` (konstant)
  - Array für Pulsierung: `[20, 200]` (min/max)
- **`position`**: `[x, y, z]` im 3D-Raum
  - **x**: Links(-) / Rechts(+)
  - **y**: Unten(-) / Oben(+)
  - **z**: Hinten(-) / Vorn(+)
  - Kann auch `[min, max]` Arrays sein für Bewegung
- **`decay`**: Lichtabfall über Distanz
  - **Range**: 1.0-3.0
  - 1.0 = langsamer Abfall (weit reichend)
  - 3.0 = schneller Abfall (lokal begrenzt)

##### Spot-Light spezifisch:

- **`angle`**: Öffnungswinkel des Lichtkegels (Radians)
  - `Math.PI / 6` = 30° (enger Spot)
  - `Math.PI / 4` = 45° (mittlerer Spot)
  - `Math.PI / 3` = 60° (breiter Spot)
  - `Math.PI / 2` = 90° (sehr breit)
- **`penumbra`**: Weichheit der Kanten
  - **Range**: 0.0-1.0
  - 0.0 = harte Kanten (scharfer Spot)
  - 0.5 = mittlere Weichheit
  - 1.0 = sehr weiche Kanten (diffuser Spot)

##### Point-Light spezifisch:

- **`distance`**: Maximale Reichweite in World-Units
  - Light fällt auf 0 bei dieser Distanz
  - Typisch: 200-600

#### Beispiele:

```typescript
// Strobo-Effekt (Konflikt)
{
  name: 'dynamic_strobe',
  type: 'spot',
  color: 0xffffff,          // Weiß
  intensity: [0, 300],      // Blinken zwischen aus und hell
  angle: Math.PI / 3,       // 60° Kegel
  penumbra: 0.2,           // Harte Kanten
  decay: 0.4,              // Langsamer Abfall
  position: [0, 80, 0]     // Zentral über Szene
}

// Explosion (Krieg)
{
  name: 'dynamic_explosion',
  type: 'point',
  color: [0xff8c00, 0xff0000],  // Orange zu Rot
  intensity: [0, 400],           // Flash-Effekt
  distance: 600,                 // Große Reichweite
  decay: 2.0,                   // Normaler Abfall
  position: [0, 50, 0]          // Bodennähe
}

// Disco-Spots (Kooperativ)
Array.from({ length: 8 }, (_, i) => ({
  name: `dynamic_spot_${i}`,
  type: 'spot',
  color: new THREE.Color().setHSL(i / 8, 1, 0.5).getHex(),  // Regenbogen
  intensity: 300,
  angle: Math.PI / 8,      // 22.5° enger Spot
  penumbra: 0.5,          // Mittlere Weichheit
  decay: 2,               // Normaler Abfall
  position: [0, 80, 0]    // Alle zentral (rotieren dann)
}))
```

#### Performance-Tipps:

- **Max 8 dynamische Lichter** gleichzeitig für gute Performance
- **Spot-Lights** sind teurer als Point-Lights (Schatten-Berechnung)
- **Hoher decay** (2-3) reduziert Reichweite und verbessert Performance
- **Arrays** (für Animation) sollten sparsam verwendet werden

## 🌿 Vegetation-Styling

### vegetation

**Beschreibung**: Farbgebung für Bäume und Pflanzen
**Parameter**:

- `treeColor`: Baumfarbe
- `cropColor`: Pflanzenfarbe
- `pulsingColor`: Pulsierende Farben (true/false)
- `emissiveGlow`: Leuchteffekt (true/false)
- `emissiveColor`: Leuchtfarbe

```typescript
vegetation: {
  treeColor: '#228B22',
  cropColor: '#ADFF2F',
  pulsingColor: true,        // Optional
  emissiveGlow: true,        // Optional
  emissiveColor: '#ff4500'   // Optional
}
```

## ✨ Partikel-Systeme

### particles

**Beschreibung**: Partikel-Effekte (Staub, Funken, etc.)
**Kann sein**: Einzelnes Objekt oder Array für mehrere Systeme

#### Einzelnes Partikel-System:

```typescript
particles: {
  count: 200,                    // Anzahl Partikel
  material: {
    size: 2,                     // Partikelgröße
    textureType: 'sparkle',      // 'sparkle', 'smoke'
    blending: 'additive',        // 'additive', 'normal'
    depthWrite: false,           // Z-Buffer schreiben
    opacity: 0.8,               // Transparenz (0-1)
    color: '#FFFFDD'            // Partikelfarbe
  },
  behavior: {
    spawnArea: [800, 200, 800], // Spawn-Bereich [x,y,z]
    velocity: [0, 0.1, 0],      // Bewegungsgeschwindigkeit
    direction: 'up'             // 'up', 'down'
  }
}
```

#### Mehrere Partikel-Systeme:

```typescript
particles: [
  {
    name: 'smoke', // System-Name
    count: 2000,
    material: {
      /* ... */
    },
    behavior: {
      /* ... */
    },
  },
  {
    name: 'fire',
    count: 1000,
    material: {
      /* ... */
    },
    behavior: {
      /* ... */
    },
  },
];
```

### Spezielle Partikel-Eigenschaften

#### Größen-/Farb-Variationen (Transzendent):

```typescript
material: {
  size: [6, 22],                      // Min-Max Größe
  opacity: [0.2, 0.5],               // Min-Max Transparenz
  color: ['#ff69b4', '#ffc0cb', '#da70d6']  // Zufällige Farbauswahl
}
```

#### Texturetypen:

- `'sparkle'`: Funkel-Effekte, leuchtende Punkte
- `'smoke'`: Rauch-Effekte, weiche Kanten

#### Blending-Modi:

- `'additive'`: Leuchtende, additive Effekte
- `'normal'`: Standard-Transparenz

## 🌟 Bloom-Effekte

### bloom

**Beschreibung**: Leucht-/Glüh-Effekte für helle Bereiche
**Parameter**:

- `threshold`: Ab welcher Helligkeit Bloom einsetzt (0-1)
- `strength`: Bloom-Intensität (0-3)
- `radius`: Bloom-Ausbreitung (0-2)

```typescript
bloom: {
  threshold: 0.85,  // Nur sehr helle Bereiche
  strength: 0.8,    // Moderate Intensität
  radius: 0.5       // Kleine Ausbreitung
}
```

**Bloom-Strategien**:

- **Subtil** (Harmonisch): `threshold: 0.85, strength: 0.8`
- **Intensiv** (Kooperativ): `threshold: 0.1, strength: 2.0`
- **Dramatisch** (Krieg): `threshold: 0, strength: 2.2`

## 🎨 UI-Styling

### ui

**Beschreibung**: User Interface Farb-Anpassungen
**Parameter**:

- `borderColor`: Rahmenfarbe
- `shadowColor`: Schattenfarbe
- `shadowBlur`: Schattenunschärfe (String mit px)

```typescript
ui: {
  borderColor: '#FFFFAA',
  shadowColor: '#FFFF00',
  shadowBlur: '30'
}
```

**Spezialfarben**:

- `'rainbow'`: Regenbogen-Animationen (Kooperativ)

## 🔧 Technische Details

### Koordinatensystem

- **X-Achse**: Links (negativ) / Rechts (positiv)
  - Beispiel: `[-100, y, z]` = 100 Units links
- **Y-Achse**: Unten (negativ) / Oben (positiv)
  - Beispiel: `[x, 150, z]` = 150 Units über dem Boden
- **Z-Achse**: Hinten (negativ) / Vorn (positiv)
  - Beispiel: `[x, y, 50]` = 50 Units nach vorne

**Typische Positionen**:

- Sonnenlicht: `[100, 150, 50]` (rechts oben vorne)
- Zentrale Decke: `[0, 200, 0]`
- Boden-Effekt: `[0, 10, 0]`
- Seitenlicht: `[-200, 80, 0]` (links mittig)

### Performance-Überlegungen

- **Partikelanzahl**: 200-5000 (je nach Komplexität)
- **Dynamische Lichter**: Max 8 gleichzeitig für Performance
- **Bloom-Threshold**: Höhere Werte = bessere Performance

### Farb-Formate

- **Hex-Strings**: `'#FF0000'` (bevorzugt für einfache Farben)
- **THREE.Color**: `0xff0000` (für dynamische Lichter)
- **Farb-Arrays**: `['#ff0000', '#00ff00']` (für Variationen)

## 💡 Best Practices

1. **Konsistenz**: Ähnliche Farbpaletten für skyColor, fog und groundColor
2. **Kontrast**: Vegetation sollte sich vom Ground abheben
3. **Performance**: Nicht zu viele Partikel gleichzeitig
4. **Atmosphere**: Bloom und Fog für stimmungsvolle Tiefe
5. **UI-Harmonie**: UI-Farben passend zur Mood-Ästhetik

## 🚀 Debug-Möglichkeiten

Verwende die Debug-Tools um Moods live zu testen:

```javascript
// Mood wechseln
window.moodDebug.setMood('Harmonisch');

// Einzelne Parameter anpassen
window.moodDebug.adjustBloom({ strength: 2.0 });

// Debug-System aktivieren
window.moodDebug.enable(true);
```

> 💡 **Tipp**: Experimentiere mit verschiedenen Parametern um die gewünschte Atmosphäre zu erreichen!
