# 🖥️ Waveshare 5" Round Display - Setup Guide

Detaillierte Anleitung für das Waveshare 5" Round Display (1080x1080) mit Raspberry Pi.

## Hardware-Spezifikationen

| Eigenschaft    | Wert                                  |
| -------------- | ------------------------------------- |
| Auflösung      | 1080 × 1080 px                        |
| Display-Typ    | IPS                                   |
| Form           | Rund (Circular)                       |
| Touch          | Kapazitiv, 10-Punkt                   |
| Anschlüsse     | HDMI + USB-C (Touch) + USB-C (Power)  |
| Bonding        | Optisches Bonding mit gehärtetem Glas |
| Refresh Rate   | 60 Hz                                 |
| Stromverbrauch | ≥300mA                                |

## 🔌 Hardware-Anschluss

### Schritt 1: Display an Raspberry Pi anschließen

```
Raspberry Pi          →    Waveshare Display
===============================================
HDMI Port             →    HDMI IN (Display)
USB Port (beliebig)   →    USB-C (Touch)
-                     →    USB-C (Power) → 5V Netzteil
```

### Wichtige Hinweise

⚠️ **Stromversorgung**:

- Das Display benötigt ein **eigenes 5V Netzteil** (USB-C Power-Port)
- Mindestens **300mA** für stabilen Betrieb
- Die USB-Ports des Raspberry Pi reichen NICHT aus!
- Bei fehlender externer Stromversorgung → Display flackert

💡 **Touch-Verbindung**:

- USB-C (Touch) vom Display zu **beliebigem USB-Port** am Pi
- Der Touch-Treiber wird automatisch erkannt (driver-free)
- Keine manuelle Kalibrierung nötig

## ⚙️ Software-Konfiguration

### Automatische Konfiguration (empfohlen)

```bash
cd raspberry-pi/scripts
sudo ./setup-display.sh
sudo reboot
```

### Manuelle Konfiguration

Falls du die Config manuell anpassen möchtest:

1. **Backup erstellen**:

   ```bash
   sudo cp /boot/firmware/config.txt /boot/firmware/config.txt.backup
   ```

2. **Config.txt editieren**:

   ```bash
   sudo nano /boot/firmware/config.txt
   ```

3. **Folgende Zeilen am Ende hinzufügen**:

   ```
   # Waveshare 5" Round Display (1080x1080)
   hdmi_group=2
   hdmi_mode=87
   hdmi_pixel_freq_limit=356000000
   hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0
   ```

4. **Speichern und Neustarten**:
   ```bash
   sudo reboot
   ```

## 📖 Erklärung der HDMI-Timings

```
hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0
```

| Parameter         | Wert     | Bedeutung                    |
| ----------------- | -------- | ---------------------------- |
| Horizontal Active | 1080     | Bildbreite in Pixeln         |
| H. Front Porch    | 68       | Horizontaler Blank vor Sync  |
| H. Sync Pulse     | 32       | Horizontaler Sync-Impuls     |
| H. Back Porch     | 100      | Horizontaler Blank nach Sync |
| Vertical Active   | 1080     | Bildhöhe in Pixeln           |
| V. Front Porch    | 12       | Vertikaler Blank vor Sync    |
| V. Sync Pulse     | 4        | Vertikaler Sync-Impuls       |
| V. Back Porch     | 16       | Vertikaler Blank nach Sync   |
| Refresh Rate      | 60       | 60 Hz                        |
| Pixel Clock       | 85500000 | 85.5 MHz                     |

## 🔍 Troubleshooting

### Display zeigt nichts / bleibt schwarz

**Mögliche Ursachen:**

1. **HDMI-Kabel lose**
   - Prüfe beide HDMI-Anschlüsse (Pi und Display)
   - Verwende ein hochwertiges HDMI-Kabel

2. **Stromversorgung fehlt**
   - Display braucht eigenes Netzteil am Power-Port
   - Prüfe ob Power-LED am Display leuchtet

3. **Config.txt nicht korrekt**

   ```bash
   # Prüfe ob Timings vorhanden sind:
   cat /boot/firmware/config.txt | grep hdmi_timings

   # Sollte ausgeben:
   # hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0
   ```

4. **Reboot vergessen**
   - Config-Änderungen werden erst nach Reboot aktiv
   - `sudo reboot`

### Display zeigt falsche Auflösung

**Symptome**: Display zeigt 1920x1080 statt 1080x1080, Bild verzerrt

**Lösung**:

```bash
# 1. Prüfe ob EDID Auto-Detection aktiv ist
vcgencmd get_config hdmi_mode

# 2. Falls hdmi_mode nicht auf 87 steht:
sudo nano /boot/firmware/config.txt

# 3. Stelle sicher dass folgende Zeilen vorhanden sind:
hdmi_group=2
hdmi_mode=87
hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0

# 4. Neu starten
sudo reboot
```

### Display flackert

**Ursache**: Unzureichende Stromversorgung

**Lösung**:

1. Schließe ein **5V Netzteil** am USB-C Power-Port des Displays an
2. Mindestens 300mA Ausgangsstrom
3. Nutze NICHT die USB-Ports des Raspberry Pi

### Touch funktioniert nicht

**Diagnose**:

```bash
# 1. Prüfe ob USB-Touch-Device erkannt wurde
lsusb | grep -i touch

# 2. Prüfe Input-Devices
ls -la /dev/input/

# 3. Teste Touch-Events
sudo evtest
# Wähle das Touch-Device und berühre das Display
```

**Lösungen**:

1. **USB-C Kabel prüfen**
   - Muss Data-Übertragung unterstützen (nicht nur Laden!)
   - Anderes USB-C Kabel testen

2. **USB-Port wechseln**
   - Probiere einen anderen USB-Port am Raspberry Pi

3. **USB-Gerät neu verbinden**
   ```bash
   # USB-Geräte neu laden
   sudo modprobe -r usb_storage
   sudo modprobe usb_storage
   ```

### Touch ist spiegelverkehrt / rotiert

**Bei Wayland (labwc/Wayfire)**:

```bash
# Screen Configuration App öffnen
# Screen → HDMI-1 → Orientation → Auswählen → Apply
```

**Bei X11 (manuell)**:

```bash
# Touch-Device ID finden
xinput list

# Transformation Matrix setzen (Beispiel für 180° Rotation)
xinput set-prop <DEVICE_ID> "Coordinate Transformation Matrix" -1 0 1 0 -1 1 0 0 1
```

### Rundes Display → Schwarze Ecken

**Das ist normal!**

Das Display ist physisch rund, zeigt aber 1080x1080 Pixel (quadratisch). Die Ecken werden durch die runde Maske abgeschnitten.

**Optimierung für deine App**:

- Verwende CSS `border-radius: 50%` für Container
- Platziere wichtige UI-Elemente im zentralen Bereich
- Die Jukebox nutzt bereits `.round-display` Styles (siehe `src/styles/round-frame.css`)

## 🎯 Optimale Display-Einstellungen

### GPU Memory (für bessere Performance)

```bash
sudo raspi-config
# → Performance Options
# → GPU Memory → 256 (empfohlen für WebGL)
sudo reboot
```

### Bildschirmschoner deaktivieren

Das `start-jukebox.sh` Script macht das automatisch, aber manuell:

```bash
# X11
xset s off
xset -dpms
xset s noblank

# Wayland/labwc
# Aktuell kein screen blanking bei labwc
```

### Display-Helligkeit

```bash
# Helligkeit prüfen (falls unterstützt)
cat /sys/class/backlight/*/brightness

# Helligkeit setzen (Wert: 0-255)
echo 200 | sudo tee /sys/class/backlight/*/brightness
```

## 📊 Technische Details

### Unterstützte Betriebssysteme

✅ Raspberry Pi OS
✅ Ubuntu
✅ Kali Linux
✅ RetroPie

### Pixel Density

- Auflösung: 1080 × 1080
- Display-Größe: 5 Zoll (diagonal)
- PPI: ~305 (sehr scharf!)

### Refresh Rate

- Standard: 60 Hz
- Für andere Refresh Rates müsste `hdmi_timings` angepasst werden

## 🔗 Weiterführende Links

- [Waveshare Official Wiki](https://www.waveshare.com/wiki/5inch_1080x1080_LCD)
- [Produktseite](https://www.waveshare.com/5inch-1080x1080-lcd.htm)
- [Raspberry Pi HDMI Config Dokumentation](https://www.raspberrypi.com/documentation/computers/config_txt.html#hdmi-mode)

---

**Zurück zu**: [Raspberry Pi Setup](../README.md)
