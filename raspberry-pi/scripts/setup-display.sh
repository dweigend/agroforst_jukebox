#!/bin/bash
# ============================================================================
# Waveshare 5" Round Display (1080x1080) Setup für Raspberry Pi
# ============================================================================
# Konfiguriert /boot/firmware/config.txt für das Waveshare Round Display
#
# Display: 5inch 1080x1080 LCD, IPS, 10-Point Touch, USB-C
# Verwendung:
#   chmod +x setup-display.sh
#   sudo ./setup-display.sh
# ============================================================================

set -e

echo "🖥️  Waveshare 5\" Round Display Setup"
echo "======================================"
echo ""

# Root-Check
if [ "$EUID" -ne 0 ]; then
    echo "❌ Dieses Script muss mit sudo ausgeführt werden"
    echo "   Verwendung: sudo ./setup-display.sh"
    exit 1
fi

CONFIG_FILE="/boot/firmware/config.txt"
BACKUP_FILE="/boot/firmware/config.txt.backup.$(date +%Y%m%d_%H%M%S)"

# Prüfe ob config.txt existiert
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ config.txt nicht gefunden: $CONFIG_FILE"
    echo "   Bist du auf einem Raspberry Pi mit Bookworm OS?"
    exit 1
fi

# Backup erstellen
echo "💾 Erstelle Backup: $BACKUP_FILE"
cp "$CONFIG_FILE" "$BACKUP_FILE"

# Prüfe ob HDMI-Timings bereits vorhanden
if grep -q "hdmi_timings=1080 0 68 32 100 1080" "$CONFIG_FILE"; then
    echo "✅ Waveshare Display-Konfiguration bereits vorhanden"
    echo ""
    echo "📝 Falls du die Config neu setzen willst:"
    echo "   sudo rm /boot/firmware/config.txt"
    echo "   sudo cp $BACKUP_FILE /boot/firmware/config.txt"
    echo "   sudo ./setup-display.sh"
    exit 0
fi

# HDMI-Konfiguration hinzufügen
echo "⚙️  Füge Display-Konfiguration zu config.txt hinzu..."
cat >> "$CONFIG_FILE" << 'EOF'

# ============================================================================
# Waveshare 5" Round Display (1080x1080) Configuration
# ============================================================================
hdmi_group=2
hdmi_mode=87
hdmi_pixel_freq_limit=356000000
hdmi_timings=1080 0 68 32 100 1080 0 12 4 16 0 0 0 60 0 85500000 0
EOF

echo "✅ Display-Konfiguration erfolgreich hinzugefügt!"
echo ""
echo "📋 Wichtige Hinweise:"
echo ""
echo "   🔌 Hardware-Anschluss:"
echo "      • HDMI → Pi HDMI Port"
echo "      • USB-C (Touch) → Pi USB Port"
echo "      • USB-C (Power) → 5V Netzteil (≥300mA!)"
echo ""
echo "   🎯 Touch-Funktionalität:"
echo "      • Touch wird automatisch erkannt (driver-free)"
echo "      • Keine Kalibrierung nötig"
echo "      • 10-Punkt kapazitiv"
echo ""
echo "   ⚡ Stromversorgung:"
echo "      • Display braucht eigenes Netzteil!"
echo "      • Mindestens 300mA für stabilen Betrieb"
echo "      • Bei Flackern: Power-Port am Display nutzen"
echo ""
echo "🔄 REBOOT ERFORDERLICH für Display-Aktivierung!"
echo ""
read -p "Jetzt neu starten? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo "🔄 Starte Raspberry Pi neu..."
    reboot
else
    echo "⏸️  Bitte manuell neu starten: sudo reboot"
fi
