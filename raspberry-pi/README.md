# 🌳 Raspberry Pi Setup - Agroforst Jukebox

Komplette Installationsanleitung für Raspberry Pi 4 & 5 mit Waveshare 5" Round Display im Kiosk-Mode.

## 🎯 Unterstützte Hardware

### Raspberry Pi Models

- **Raspberry Pi 5** (empfohlen) - Beste WebGL/Three.js Performance
- **Raspberry Pi 4** (2GB+ RAM empfohlen)

### Display

- **Waveshare 5" Round Display**
  - 1080x1080 IPS
  - Kapazitiv 10-Punkt Touch
  - USB-C Anschluss (Touch + Power)
  - Optisches Bonding
  - [Produktseite](https://www.waveshare.com/5inch-1080x1080-lcd.htm)

### Betriebssystem

- **Raspberry Pi OS Bookworm** (64-bit empfohlen)
- Desktop-Version (Wayland/labwc oder X11)

---

## ⚡ Quick Start - One-Click Installation

```bash
# Repository klonen
git clone https://github.com/dweigend/agroforst_jukebox.git
cd agroforst_jukebox/raspberry-pi

# Master-Installer ausführen
chmod +x install.sh
./install.sh
```

**Das war's!** Der Installer:

- ✅ Erkennt automatisch dein System (Pi 4/5, X11/Wayland)
- ✅ Installiert fehlende Dependencies (Node.js, Chromium, curl)
- ✅ Konfiguriert das Waveshare Display
- ✅ Führt `npm install` und `npm run build` aus
- ✅ Richtet Chromium für Kiosk-Mode ein (Touch-optimiert)
- ✅ Konfiguriert Autostart (optional)

---

## 📋 Manuelle Installation (Schritt für Schritt)

Falls du einzelne Schritte manuell durchführen möchtest:

### 1. Display Konfiguration

```bash
cd raspberry-pi/scripts
sudo ./setup-display.sh

# Anschließend neu starten
sudo reboot
```

**Was macht das Script?**

- Fügt HDMI-Timings für 1080x1080 zu `/boot/firmware/config.txt` hinzu
- Backup der Original-Config wird erstellt
- Display wird nach Reboot aktiv

### 2. Chromium Setup

```bash
cd raspberry-pi/scripts
./setup-chromium.sh
```

**Was wird konfiguriert?**

- Keine Setup-Dialoge (Keyring, Sprache, Default-Browser)
- Touch-Optimierung (kein Zoom, kein Pinch, kein Swipe-Back)
- Hardware Acceleration für WebGL/Three.js
- Deutsche Sprache voreingestellt

### 3. Projekt Dependencies

```bash
# Zurück zum Projekt-Root
cd ../..

# Dependencies installieren
npm install

# Production Build
npm run build
```

### 4. Jukebox starten (manuell)

```bash
cd raspberry-pi/scripts
./start-jukebox.sh
```

**Was macht das Start-Script?**

- Erkennt automatisch Display-Server (X11/Wayfire/labwc)
- Startet Vite Preview Server
- Wartet bis Server bereit ist (curl check)
- Startet Chromium mit optimalen Flags
- Deaktiviert Screen Blanking

### 5. Autostart einrichten (optional)

```bash
cd raspberry-pi/scripts

# Für X11/LXDE (Pi 4 mit 1GB RAM)
./setup-autostart-x11.sh

# Für Wayland/Wayfire (ältere Bookworm)
./setup-autostart-wayfire.sh

# Für Wayland/labwc (Pi 5 Standard seit Okt 2024)
./setup-autostart-labwc.sh
```

---

## 🔧 Script-Übersicht

| Script                         | Zweck                             | Sudo?  |
| ------------------------------ | --------------------------------- | ------ |
| `install.sh`                   | Master-Installer - alles in einem | Nein\* |
| `scripts/setup-display.sh`     | Waveshare Display konfigurieren   | **Ja** |
| `scripts/setup-chromium.sh`    | Chromium Preferences              | Nein   |
| `scripts/start-jukebox.sh`     | Jukebox im Kiosk-Mode starten     | Nein   |
| `scripts/setup-autostart-*.sh` | Autostart einrichten              | Nein   |

\* `install.sh` fragt nach sudo für Display-Setup

---

## 🖥️ Display-Server Unterschiede

### Raspberry Pi 4

| RAM  | Standard Display-Server | Autostart-Config                        |
| ---- | ----------------------- | --------------------------------------- |
| 1GB  | X11/LXDE                | `~/.config/lxsession/LXDE-pi/autostart` |
| 2GB+ | Wayland/Wayfire         | `~/.config/wayfire.ini`                 |

### Raspberry Pi 5

| OS Version      | Display-Server    | Autostart-Config            |
| --------------- | ----------------- | --------------------------- |
| Vor Okt 2024    | Wayland/Wayfire   | `~/.config/wayfire.ini`     |
| **Ab Okt 2024** | **Wayland/labwc** | `~/.config/labwc/autostart` |

💡 **Das start-jukebox.sh Script erkennt automatisch den richtigen Display-Server!**

---

## 🎮 Display-Server manuell wechseln

Falls du Probleme mit Wayland hast, kannst du zu X11 wechseln:

```bash
# raspi-config öffnen
sudo raspi-config

# Navigiere zu:
# 6 Advanced Options → A6 Wayland → W1 X11

# Neu starten
sudo reboot
```

---

## 🐛 Troubleshooting

### Display zeigt falsche Auflösung

```bash
# Prüfe config.txt
cat /boot/firmware/config.txt | grep hdmi_timings

# Sollte enthalten:
# hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0

# Falls nicht: Display-Setup neu ausführen
sudo raspberry-pi/scripts/setup-display.sh
sudo reboot
```

### Touch-Zoom funktioniert noch

```bash
# Chromium-Setup neu ausführen
raspberry-pi/scripts/setup-chromium.sh

# Oder start-jukebox.sh nutzen (setzt Flags automatisch)
raspberry-pi/scripts/start-jukebox.sh
```

### WebGL läuft nicht / schlechte Performance

```bash
# 1. Chromium öffnen und prüfen:
#    URL: chrome://gpu/
#    Sollte zeigen: "WebGL: Hardware accelerated"

# 2. Falls Software-Rendering:
#    setup-chromium.sh neu ausführen (setzt Hardware-Acceleration-Flags)

# 3. GPU-Info vom System prüfen:
vcgencmd get_mem gpu
# Sollte mindestens 128MB zeigen
```

### Server startet nicht

```bash
# Prüfe Log
tail -f /tmp/vite-jukebox.log

# Port bereits belegt?
lsof -i :4173
pkill -f "vite preview"

# Neu starten
raspberry-pi/scripts/start-jukebox.sh
```

### Display flackert

⚠️ **Stromversorgung prüfen!**

- Display braucht eigenes 5V Netzteil am USB-C Power-Port
- Mindestens 300mA
- Raspberry Pi USB-Ports reichen NICHT aus

---

## 📖 Weiterführende Dokumentation

- **[display-setup.md](docs/display-setup.md)** - Waveshare Display Details
- **[troubleshooting.md](docs/troubleshooting.md)** - Ausführliche Problemlösungen
- **[pi4-vs-pi5.md](docs/pi4-vs-pi5.md)** - Vergleich Pi 4 vs Pi 5

---

## 🚀 Performance-Tipps

### Raspberry Pi 5

- Nutze **64-bit OS** für beste Performance
- WebGL Hardware Acceleration läuft out-of-the-box
- Three.js Performance ist exzellent (60fps bei den meisten Szenen)

### Raspberry Pi 4

- Mindestens **2GB RAM** empfohlen
- GPU Memory auf 256MB erhöhen: `sudo raspi-config` → Performance → GPU Memory
- Bei Performance-Problemen: Partikel-Count in `src/configs/mood-definitions.ts` reduzieren

---

## 🔍 System-Info abrufen

```bash
# Raspberry Pi Model
cat /proc/device-tree/model

# OS Version
cat /etc/os-release | grep VERSION

# Display-Server
echo $XDG_SESSION_TYPE
echo $XDG_SESSION_DESKTOP

# Chromium Version
chromium --version

# Node.js Version
node --version
```

---

## 💡 Entwicklung auf dem Pi

```bash
# Development Server (mit Hot Reload)
npm run dev

# Zugriff von anderem Gerät:
# http://[Pi-IP]:5173

# Logs live anzeigen
tail -f /tmp/vite-jukebox.log

# Chromium DevTools remote:
# chrome://inspect auf einem Desktop-Browser
```

---

## 📝 Hardware-Checkliste

Vor dem Setup sicherstellen:

- [ ] Raspberry Pi 4 (2GB+) oder Pi 5
- [ ] Micro-SD Karte (32GB+ empfohlen) mit Raspberry Pi OS Bookworm
- [ ] Waveshare 5" Round Display
- [ ] HDMI-Kabel (Pi → Display HDMI)
- [ ] USB-C Kabel (Pi USB → Display Touch)
- [ ] 5V Netzteil für Display (≥300mA, USB-C Power-Port)
- [ ] Netzteil für Raspberry Pi (offizielles empfohlen)
- [ ] Ethernet oder WiFi-Verbindung
- [ ] Tastatur (für initiales Setup)

---

## 🎯 Empfohlene Workflow

1. **Initiales Setup** (mit Tastatur/Maus)
   - Raspberry Pi OS installieren
   - Display anschließen und konfigurieren (`setup-display.sh`)
   - Reboot

2. **Installation** (kann remote via SSH)
   - Repository klonen
   - `install.sh` ausführen
   - Autostart einrichten

3. **Testing**
   - Manuell starten mit `start-jukebox.sh`
   - WebGL Performance prüfen
   - Touch-Funktionen testen

4. **Production**
   - Reboot → Autostart sollte greifen
   - Kiosk-Mode ist aktiv
   - RFID-Scanner anschließen (USB)

---

**Entwickelt von**: [David Weigend](https://github.com/dweigend) | [weigend.studio](https://weigend.studio)

**Installation für**: [Futurium Lab Berlin](https://futurium.de)
