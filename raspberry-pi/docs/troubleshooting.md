# 🔧 Troubleshooting Guide - Raspberry Pi Jukebox

Häufige Probleme und ihre Lösungen.

## 📑 Inhalt

- [Chromium Probleme](#chromium-probleme)
- [Display Probleme](#display-probleme)
- [Touch Probleme](#touch-probleme)
- [Server Probleme](#server-probleme)
- [Performance Probleme](#performance-probleme)
- [Autostart Probleme](#autostart-probleme)

---

## Chromium Probleme

### Chromium startet nicht - "command not found"

**Symptom**:

```bash
$ chromium
bash: chromium: command not found
```

**Lösung**:

```bash
# Prüfe welcher Befehl verfügbar ist
which chromium-browser
which chromium

# Falls keiner gefunden:
sudo apt update
sudo apt install chromium-browser -y
```

### Keyring-Passwort-Dialog erscheint

**Symptom**: Beim Chromium-Start erscheint: "Enter password to unlock your login keyring"

**Lösung**:

```bash
# 1. Chromium-Setup neu ausführen
raspberry-pi/scripts/setup-chromium.sh

# 2. Chromium mit --password-store=basic Flag starten
# (wird automatisch von start-jukebox.sh gesetzt)
chromium --password-store=basic --kiosk http://localhost:4173/
```

### Sprachauswahl-Dialog erscheint

**Symptom**: Bei jedem Start fragt Chromium nach der Sprache

**Lösung**:

```bash
# 1. Chromium-Setup neu ausführen
raspberry-pi/scripts/setup-chromium.sh

# 2. First Run Marker erstellen
touch ~/.config/chromium/First\ Run

# 3. Preferences manuell prüfen
cat ~/.config/chromium/Default/Preferences | grep accept_languages
```

### Touch-Zoom funktioniert noch (Pinch-to-Zoom)

**Symptom**: Man kann mit zwei Fingern zoomen - das ist im Kiosk-Mode unerwünscht

**Lösung**:

```bash
# start-jukebox.sh nutzen (setzt automatisch Touch-Flags)
raspberry-pi/scripts/start-jukebox.sh

# Oder manuell mit Flags:
chromium --kiosk --disable-pinch --disable-touch-drag-drop http://localhost:4173/
```

### Swipe-Back funktioniert (Zurück-Navigation per Geste)

**Symptom**: Wischen nach rechts geht zur vorherigen Seite

**Lösung**:

```bash
# Flag hinzufügen:
chromium --kiosk --overscroll-history-navigation=0 http://localhost:4173/

# Oder start-jukebox.sh nutzen (setzt Flag automatisch)
```

### Chromium zeigt nur kleinen Streifen auf Wayland

**Symptom**: Bei Wayland/labwc erscheint Chromium nur als schmaler Streifen am oberen Rand

**Lösung**:

```bash
# --start-maximized Flag hinzufügen
chromium --kiosk --start-maximized http://localhost:4173/

# start-jukebox.sh setzt das automatisch
```

---

## Display Probleme

### Display bleibt schwarz

**Diagnose**:

```bash
# 1. Prüfe HDMI-Verbindung
# - Kabel fest eingesteckt?
# - Anderes HDMI-Kabel testen

# 2. Prüfe Stromversorgung
# - Display-Power-LED leuchtet?
# - 5V Netzteil am USB-C Power-Port angeschlossen?

# 3. Prüfe config.txt
cat /boot/firmware/config.txt | grep hdmi_timings

# Sollte enthalten:
# hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0
```

**Lösung**:

```bash
# Display-Setup neu ausführen
sudo raspberry-pi/scripts/setup-display.sh
sudo reboot
```

### Display zeigt falsche Auflösung (1920x1080 statt 1080x1080)

**Symptom**: Bild ist verzerrt, nicht quadratisch

**Lösung**:

```bash
# 1. Prüfe HDMI-Mode
vcgencmd get_config hdmi_mode
vcgencmd get_config hdmi_group

# Sollte sein:
# hdmi_mode=87
# hdmi_group=2

# 2. Falls nicht: Display-Setup ausführen
sudo raspberry-pi/scripts/setup-display.sh
sudo reboot
```

### Display flackert

**Ursache**: Stromversorgung zu schwach

**Lösung**:

- Schließe ein **5V Netzteil** (≥300mA) am USB-C Power-Port des Displays an
- Nutze NICHT die USB-Ports des Raspberry Pi
- Verwende ein hochwertiges Netzteil

### Display-Ecken sind schwarz (runde Maske)

**Das ist normal!**

Das Display ist physisch rund, zeigt aber 1080x1080 Pixel. Die Ecken sind durch die runde Maske abgeschnitten.

**App-Optimierung**:

- Wichtige UI-Elemente im zentralen Bereich platzieren
- CSS `border-radius: 50%` für Container nutzen
- Die Jukebox ist bereits optimiert (siehe `src/styles/round-frame.css`)

---

## Touch Probleme

### Touch funktioniert nicht

**Diagnose**:

```bash
# 1. USB-Touch-Device erkannt?
lsusb | grep -i touch

# 2. Input-Devices prüfen
ls -la /dev/input/

# 3. Touch-Events testen
sudo evtest
# Wähle Touch-Device und berühre Display
```

**Lösungen**:

1. **USB-C Kabel prüfen**
   - Muss Data-Übertragung unterstützen!
   - Nicht nur Lade-Kabel verwenden

2. **USB-Port wechseln**
   - Anderen USB-Port am Pi testen

3. **USB neu verbinden**
   ```bash
   # USB-Kabel physisch ab- und wieder anstecken
   # Oder:
   sudo modprobe -r usb_storage
   sudo modprobe usb_storage
   ```

### Touch ist spiegelverkehrt / rotiert

**Bei Wayland**:

```bash
# GUI nutzen:
# Screen Configuration → HDMI-1 → Orientation → Auswählen → Apply
```

**Bei X11**:

```bash
# Touch-Device ID finden
xinput list

# Koordinaten transformieren (180° Rotation)
xinput set-prop <ID> "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1
```

### Multi-Touch wird nicht erkannt

**Symptom**: Nur ein Finger wird erkannt

**Prüfung**:

```bash
# Touch-Device Capabilities prüfen
sudo evtest /dev/input/event<X>

# Sollte "ABS_MT_SLOT" zeigen für Multi-Touch
```

Das Waveshare Display unterstützt 10-Punkt Touch - wenn nur 1 Punkt funktioniert, ist vermutlich das USB-Kabel defekt oder ein Treiberproblem.

---

## Server Probleme

### Vite Server startet nicht

**Diagnose**:

```bash
# Log prüfen
tail -f /tmp/vite-jukebox.log

# Port bereits belegt?
lsof -i :4173
```

**Lösungen**:

1. **Port belegt**:

   ```bash
   # Prozess beenden
   pkill -f "vite preview"

   # Neu starten
   npm run preview
   ```

2. **Dependencies fehlen**:

   ```bash
   cd /pfad/zum/projekt
   npm install
   ```

3. **Build fehlt**:
   ```bash
   npm run build
   ```

### Server läuft, aber Chromium zeigt Startseite

**Symptom**: Chromium öffnet, aber nicht die Jukebox-URL

**Ursache**: Server war noch nicht bereit

**Lösung**:

```bash
# start-jukebox.sh nutzen (wartet automatisch auf Server)
raspberry-pi/scripts/start-jukebox.sh

# Oder manuell warten:
while ! curl -s http://localhost:4173/ > /dev/null; do
  sleep 1
done
chromium --kiosk http://localhost:4173/
```

### "EADDRINUSE" Error - Port 4173 bereits in Verwendung

**Lösung**:

```bash
# Prozess finden und beenden
lsof -ti:4173 | xargs kill -9

# Oder alle Vite-Prozesse beenden
pkill -f "vite preview"
```

---

## Performance Probleme

### WebGL läuft langsam / Software Rendering

**Diagnose**:

```bash
# In Chromium: chrome://gpu/ öffnen
# Sollte zeigen:
# "WebGL: Hardware accelerated"
# "WebGL2: Hardware accelerated"
```

**Falls Software Rendering aktiv**:

1. **Chromium Flags prüfen**:

   ```bash
   # start-jukebox.sh nutzt automatisch:
   --ignore-gpu-blocklist
   --enable-gpu-rasterization
   --enable-zero-copy
   --enable-features=CanvasOopRasterization
   ```

2. **GPU Memory erhöhen**:

   ```bash
   sudo raspi-config
   # → Performance Options → GPU Memory → 256
   sudo reboot
   ```

3. **Driver prüfen** (Raspberry Pi 5):
   ```bash
   # V3D Driver sollte aktiv sein
   glxinfo | grep "OpenGL renderer"
   ```

### FPS zu niedrig (< 30fps)

**Optimierungen**:

1. **GPU Memory** auf 256MB setzen (siehe oben)

2. **Partikel-Count reduzieren**:

   ```bash
   # In src/configs/mood-definitions.ts
   # particleCount von 5000 auf 2000 reduzieren
   ```

3. **Vegetation-Count reduzieren** (nur bei extremen Problemen):

   ```bash
   # In src/managers/LandscapeManager.ts
   # CROP_COUNT von 10000 auf 5000 reduzieren
   ```

4. **Chromium Performance-Flags**:
   ```bash
   # Experimentell - kann helfen:
   --enable-features=VaapiVideoDecoder
   --disable-features=UseChromeOSDirectVideoDecoder
   ```

### Three.js FPS-Counter einblenden

```javascript
// Browser-Konsole (F12)
// Stats.js ist bereits geladen:
document.body.appendChild(stats.dom);
```

---

## Autostart Probleme

### Jukebox startet nicht beim Boot

**Diagnose - Welcher Display-Server?**:

```bash
echo $XDG_SESSION_TYPE
echo $XDG_SESSION_DESKTOP

# Oder:
loginctl show-session 1 | grep Desktop
```

**Lösungen nach Display-Server**:

**X11/LXDE**:

```bash
# Prüfe Autostart-Datei
cat ~/.config/lxsession/LXDE-pi/autostart

# Sollte enthalten:
# @/pfad/zu/start-jukebox.sh

# Falls nicht: Setup neu ausführen
raspberry-pi/scripts/setup-autostart-x11.sh
```

**Wayland/Wayfire**:

```bash
# Prüfe wayfire.ini
cat ~/.config/wayfire.ini

# Sollte enthalten:
# [autostart]
# jukebox = /pfad/zu/start-jukebox.sh

# Falls nicht:
raspberry-pi/scripts/setup-autostart-wayfire.sh
```

**Wayland/labwc**:

```bash
# Prüfe labwc autostart
cat ~/.config/labwc/autostart

# Sollte enthalten:
# /pfad/zu/start-jukebox.sh &

# Falls nicht:
raspberry-pi/scripts/setup-autostart-labwc.sh
```

### Autostart funktioniert, aber Chromium erscheint leer

**Ursache**: Server-Start dauert zu lange

**Lösung**:

`start-jukebox.sh` wartet automatisch auf den Server. Falls das nicht reicht:

```bash
# In start-jukebox.sh: sleep-Zeit erhöhen
# Zeile finden:
sleep 2

# Ändern zu:
sleep 5
```

### Autostart funktioniert nur manchmal

**Ursache**: Race Condition - Display-Server noch nicht bereit

**Lösung**:

Verzögerung vor Script-Start einfügen:

**X11**:

```bash
# In ~/.config/lxsession/LXDE-pi/autostart
@bash -c "sleep 10 && /pfad/zu/start-jukebox.sh"
```

**labwc**:

```bash
# In ~/.config/labwc/autostart
sleep 10 && /pfad/zu/start-jukebox.sh &
```

---

## Logs & Debugging

### Wichtige Log-Dateien

```bash
# Vite Server Log
tail -f /tmp/vite-jukebox.log

# System Log (allgemein)
journalctl -f

# Chromium Errors (nur wenn im Vordergrund gestartet)
chromium --kiosk http://localhost:4173/
# Errors werden im Terminal angezeigt

# X11 Errors
cat ~/.xsession-errors
```

### Debug-Modus für start-jukebox.sh

```bash
# Script im Debug-Mode ausführen
bash -x raspberry-pi/scripts/start-jukebox.sh
```

### Browser Console Errors anzeigen

```bash
# Chromium mit Remote Debugging starten
chromium --kiosk --remote-debugging-port=9222 http://localhost:4173/

# Von anderem Gerät im Netzwerk:
# http://[Pi-IP]:9222
# → DevTools öffnen
```

---

## Display-Server wechseln

Falls ein Display-Server Probleme macht, kannst du wechseln:

```bash
sudo raspi-config
# → 6 Advanced Options
# → A6 Wayland
# → Auswahl:
#    W1 X11      - Stabiler, aber älter
#    W2 Wayfire  - Wayland mit Wayfire Compositor
#    W3 labwc    - Wayland mit labwc (Pi 5 Standard)

sudo reboot
```

**Nach Wechsel**:

```bash
# Passenden Autostart neu einrichten
raspberry-pi/scripts/setup-autostart-<display-server>.sh
```

---

## Notfall: Komplett-Reset

Falls nichts mehr funktioniert:

```bash
# 1. Alle Jukebox-Prozesse beenden
pkill chromium
pkill -f "vite preview"

# 2. Chromium Config löschen
rm -rf ~/.config/chromium/

# 3. Autostart deaktivieren
# X11:
rm ~/.config/lxsession/LXDE-pi/autostart
# Wayfire:
rm ~/.config/wayfire.ini
# labwc:
rm ~/.config/labwc/autostart

# 4. Neu aufsetzen
cd raspberry-pi
./install.sh
```

---

## Hilfe holen

Falls nichts hilft:

1. **System-Info sammeln**:

   ```bash
   # Erstelle Debug-Report
   cat /proc/device-tree/model > debug-info.txt
   cat /etc/os-release >> debug-info.txt
   echo "---" >> debug-info.txt
   echo $XDG_SESSION_TYPE >> debug-info.txt
   echo $XDG_SESSION_DESKTOP >> debug-info.txt
   echo "---" >> debug-info.txt
   chromium --version >> debug-info.txt
   node --version >> debug-info.txt
   cat debug-info.txt
   ```

2. **GitHub Issue erstellen**: [github.com/dweigend/agroforst_jukebox/issues](https://github.com/dweigend/agroforst_jukebox/issues)

3. **Log-Dateien beifügen**:
   - `/tmp/vite-jukebox.log`
   - Output von `bash -x raspberry-pi/scripts/start-jukebox.sh`
   - Chrome Developer Console Errors

---

**Zurück zu**: [Raspberry Pi Setup](../README.md)
