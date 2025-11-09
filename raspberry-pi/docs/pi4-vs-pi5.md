# 🔬 Raspberry Pi 4 vs Pi 5 - Vergleich für Agroforst Jukebox

Unterschiede, Performance und Empfehlungen für beide Modelle.

## 📊 Hardware-Vergleich

| Eigenschaft           | Raspberry Pi 4              | Raspberry Pi 5              |
| --------------------- | --------------------------- | --------------------------- |
| **CPU**               | Cortex-A72 (4x 1.5 GHz)     | Cortex-A76 (4x 2.4 GHz)     |
| **GPU**               | VideoCore VI                | VideoCore VII               |
| **RAM**               | 1/2/4/8 GB LPDDR4           | 4/8 GB LPDDR4X              |
| **WebGL Performance** | Gut (mit Config)            | Exzellent (out-of-box)      |
| **USB**               | USB 3.0 (2x) + USB 2.0 (2x) | USB 3.0 (2x) + USB 2.0 (2x) |
| **Display Out**       | 2x Micro-HDMI               | 2x Micro-HDMI               |
| **Stromverbrauch**    | ~3-5W (idle/load)           | ~4-8W (idle/load)           |
| **Preis**             | ~50-80€                     | ~80-110€                    |

## 🎯 Empfehlung für Jukebox

### Raspberry Pi 5: ✅ Empfohlen

**Vorteile**:

- ⚡ **Beste Performance** - 60fps Three.js ohne Probleme
- 🎨 **WebGL Hardware Acceleration** - out-of-the-box, keine Config nötig
- 🚀 **Schnellerer Boot** - Autostart 20-30% schneller
- 💪 **Mehr GPU Power** - Komplexere Partikel-Effekte möglich
- 📈 **Zukunftssicher** - labwc Standard (seit Oktober 2024)

**Nachteile**:

- 💰 Teurer
- 🔋 Höherer Stromverbrauch

### Raspberry Pi 4: ✅ Funktioniert gut (2GB+ RAM)

**Vorteile**:

- 💶 **Günstiger**
- 🔋 **Weniger Strom**
- 📦 **Mehr verfügbar** - bessere Lieferbarkeit

**Nachteile**:

- ⚙️ Mehr Setup nötig (GPU Memory anpassen)
- 🐌 Langsamerer Boot
- 📉 Bei 1GB RAM: Nur X11 (älterer Desktop-Server)

### ⚠️ Raspberry Pi 4 mit 1GB RAM: Bedingt geeignet

- Nutzt X11 statt Wayland (Performance-Einbuße)
- WebGL läuft, aber langsamer
- Empfehlung: Mindestens 2GB RAM

## 🖥️ Display-Server Unterschiede

### Raspberry Pi 4

| RAM  | OS Version | Display-Server  | Status   |
| ---- | ---------- | --------------- | -------- |
| 1GB  | Bookworm   | X11/LXDE        | Standard |
| 2GB+ | < Okt 2024 | Wayland/Wayfire | Veraltet |
| 2GB+ | ≥ Okt 2024 | Wayland/labwc   | Modern   |

### Raspberry Pi 5

| OS Version | Display-Server    | Status       |
| ---------- | ----------------- | ------------ |
| < Okt 2024 | Wayland/Wayfire   | Veraltet     |
| ≥ Okt 2024 | **Wayland/labwc** | **Standard** |

**Wichtig**: Das `start-jukebox.sh` Script erkennt automatisch den Display-Server!

## ⚡ Performance-Vergleich

### Three.js Rendering (Agroforst Landscape)

| Szenario                | Pi 4 (4GB) | Pi 5 (4GB) |
| ----------------------- | ---------- | ---------- |
| 150 Bäume + 10k Crops   | 40-45 fps  | 55-60 fps  |
| + 5000 Partikel (Regen) | 30-35 fps  | 50-55 fps  |
| + 8 Disco-Lichter       | 25-30 fps  | 45-50 fps  |
| + UnrealBloom Post-FX   | 20-25 fps  | 40-45 fps  |

**Empfehlung**:

- **Pi 5**: Alle Effekte auf Maximum
- **Pi 4**: Partikel auf 2000-3000 reduzieren für flüssigere Performance

### Boot-Zeit bis Jukebox startet

| Phase             | Pi 4     | Pi 5     |
| ----------------- | -------- | -------- |
| Boot → Desktop    | ~40s     | ~30s     |
| Vite Server Start | ~8s      | ~5s      |
| Chromium Start    | ~6s      | ~4s      |
| **Total**         | **~54s** | **~39s** |

## 🔧 Setup-Unterschiede

### Display-Konfiguration

**Identisch** für beide Modelle:

- Selbe `config.txt` Einstellungen
- Selber `setup-display.sh` Script

### Chromium Setup

**Identisch** für beide Modelle:

- Gleiche Flags funktionieren
- Touch-Optimierung identisch
- Selber `setup-chromium.sh` Script

### Autostart-Setup

**Unterschiedlich** je nach OS-Version und RAM:

**Pi 4 (1GB)**:

```bash
# X11/LXDE
~/.config/lxsession/LXDE-pi/autostart
raspberry-pi/scripts/setup-autostart-x11.sh
```

**Pi 4 (2GB+) & Pi 5 (alte OS)**:

```bash
# Wayland/Wayfire
~/.config/wayfire.ini
raspberry-pi/scripts/setup-autostart-wayfire.sh
```

**Pi 4 (2GB+) & Pi 5 (neue OS ≥ Okt 2024)**:

```bash
# Wayland/labwc
~/.config/labwc/autostart
raspberry-pi/scripts/setup-autostart-labwc.sh
```

## 🎮 GPU Memory Empfehlungen

### Raspberry Pi 4

```bash
sudo raspi-config
# → Performance Options
# → GPU Memory → 256 (empfohlen für WebGL)
sudo reboot
```

**Wichtig**: Ohne GPU Memory Anpassung läuft WebGL im Software-Rendering (sehr langsam)!

### Raspberry Pi 5

Keine Anpassung nötig! GPU Memory wird automatisch dynamisch verwaltet.

## 🌐 WebGL Hardware Acceleration

### Raspberry Pi 4

**Chromium Flags notwendig**:

```bash
--ignore-gpu-blocklist
--enable-gpu-rasterization
--enable-zero-copy
--enable-features=CanvasOopRasterization
```

**Prüfen**:

```bash
# In Chromium: chrome://gpu/ öffnen
# Sollte zeigen: "WebGL: Hardware accelerated"
```

**Falls Software Rendering**:

1. GPU Memory auf 256MB setzen
2. Chromium-Setup neu ausführen
3. System neu starten

### Raspberry Pi 5

**Läuft out-of-the-box!**

Hardware Acceleration ist standardmäßig aktiv. Flags können trotzdem gesetzt werden (schadet nicht).

## 📈 Optimierungsempfehlungen

### Raspberry Pi 4 Optimierungen

1. **GPU Memory auf 256MB**:

   ```bash
   sudo raspi-config
   # Performance Options → GPU Memory → 256
   ```

2. **Partikel reduzieren** (in `src/configs/mood-definitions.ts`):

   ```javascript
   // Von:
   particleCount: 5000;
   // Zu:
   particleCount: 2000;
   ```

3. **UnrealBloom Intensity reduzieren**:

   ```javascript
   // In mood-definitions.ts
   bloom: {
     enabled: true,
     strength: 0.5,  // Von 1.0 auf 0.5
     // ...
   }
   ```

4. **Disco-Lichter reduzieren**:
   ```javascript
   // In mood-definitions.ts für "Kooperativ"
   lights: 4; // Statt 8
   ```

### Raspberry Pi 5 Optimierungen

Keine speziellen Optimierungen nötig! 🎉

Die Standard-Konfiguration läuft flüssig.

## 🔋 Stromversorgung

### Raspberry Pi 4

- **Offizielles Netzteil**: 5V / 3A (15W)
- **Minimum für Jukebox**: 5V / 2.5A
- **Plus Display**: +300mA (Display eigenes Netzteil!)

### Raspberry Pi 5

- **Offizielles Netzteil**: 5V / 5A (25W) - USB-C PD
- **Minimum für Jukebox**: 5V / 3A
- **Plus Display**: +300mA (Display eigenes Netzteil!)

⚠️ **Wichtig**: Das Waveshare Display braucht immer ein eigenes Netzteil am Power-Port!

## 💾 SD-Karte Empfehlungen

| Modell | Minimum       | Empfohlen  |
| ------ | ------------- | ---------- |
| Pi 4   | 16GB Class 10 | 32GB A1/A2 |
| Pi 5   | 16GB Class 10 | 32GB A2    |

**Begründung**:

- node_modules: ~500MB
- dist: ~10MB
- OS + Software: ~8GB
- Freier Platz für Logs/Cache: ~15GB

## 🔄 Migration Pi 4 → Pi 5

Falls du von Pi 4 auf Pi 5 wechselst:

### Option 1: Neu-Installation (empfohlen)

```bash
# Frisches Raspberry Pi OS auf SD-Karte
# Repository klonen
git clone https://github.com/dweigend/agroforst_jukebox.git
cd agroforst_jukebox/raspberry-pi

# Installer ausführen
./install.sh
```

### Option 2: SD-Karte von Pi 4 übernehmen

```bash
# 1. SD-Karte von Pi 4 in Pi 5 stecken
# 2. Booten (dauert länger beim ersten Mal)
# 3. Autostart prüfen - vermutlich Wayfire → labwc Wechsel nötig

# Display-Server prüfen
echo $XDG_SESSION_DESKTOP

# Falls Wayfire → labwc wechseln:
sudo raspi-config
# 6 Advanced → A6 Wayland → W3 labwc
sudo reboot

# Autostart neu einrichten
cd raspberry-pi/scripts
./setup-autostart-labwc.sh
```

## 🎯 Kaufentscheidung

### Wähle **Raspberry Pi 5** wenn:

- ✅ Budget vorhanden (~110€)
- ✅ Beste Performance gewünscht
- ✅ Neue Installation
- ✅ Zukunftssicher (labwc, neuere Hardware)

### Wähle **Raspberry Pi 4** wenn:

- ✅ Budget begrenzt (~60€ für 4GB)
- ✅ Bereits vorhanden
- ✅ Akzeptable Performance ausreichend (mit Optimierungen)
- ⚠️ **Mindestens 2GB RAM** - 1GB nur bedingt geeignet!

## 📊 Gesamtbewertung für Jukebox

| Kriterium      | Pi 4 (4GB) | Pi 5 (4GB)     |
| -------------- | ---------- | -------------- |
| Performance    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐     |
| Setup-Aufwand  | ⭐⭐⭐     | ⭐⭐⭐⭐       |
| Preis-Leistung | ⭐⭐⭐⭐   | ⭐⭐⭐         |
| Stromverbrauch | ⭐⭐⭐⭐   | ⭐⭐⭐         |
| Zukunftssicher | ⭐⭐       | ⭐⭐⭐⭐⭐     |
| **Gesamt**     | **⭐⭐⭐** | **⭐⭐⭐⭐⭐** |

**Fazit**: Pi 5 ist klar besser, aber Pi 4 (2GB+) funktioniert solide mit leichten Anpassungen.

---

**Zurück zu**: [Raspberry Pi Setup](../README.md)
