#!/bin/bash
# ============================================================================
# Autostart Setup für Wayland/labwc (Raspberry Pi 5 Standard seit Okt 2024)
# ============================================================================
# Konfiguriert Autostart für labwc Window Manager
#
# Verwendung:
#   chmod +x setup-autostart-labwc.sh
#   ./setup-autostart-labwc.sh
# ============================================================================

set -e

echo "🚀 Autostart Setup für Wayland/labwc"
echo "====================================="
echo ""

# labwc Config-Datei
LABWC_AUTOSTART=~/.config/labwc/autostart

# Projekt-Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$SCRIPT_DIR/start-jukebox.sh"

if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ start-jukebox.sh nicht gefunden: $START_SCRIPT"
    exit 1
fi

# labwc Config-Verzeichnis erstellen
echo "📁 Erstelle labwc Config-Verzeichnis..."
mkdir -p ~/.config/labwc

# Backup erstellen (falls vorhanden)
if [ -f "$LABWC_AUTOSTART" ]; then
    BACKUP_FILE="$LABWC_AUTOSTART.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Sichere existierende Autostart-Datei: $BACKUP_FILE"
    cp "$LABWC_AUTOSTART" "$BACKUP_FILE"
fi

# Prüfe ob Eintrag bereits existiert
if [ -f "$LABWC_AUTOSTART" ] && grep -q "start-jukebox.sh" "$LABWC_AUTOSTART"; then
    echo "✅ Jukebox Autostart bereits konfiguriert"
else
    echo "⚙️  Konfiguriere Autostart..."
    echo "$START_SCRIPT &" >> "$LABWC_AUTOSTART"
    echo "✅ Autostart-Eintrag hinzugefügt"
fi

# Autostart-Datei ausführbar machen
chmod +x "$LABWC_AUTOSTART"

echo ""
echo "✅ Wayland/labwc Autostart erfolgreich konfiguriert!"
echo ""
echo "📝 Konfiguration:"
echo "   Datei: $LABWC_AUTOSTART"
echo "   Script: $START_SCRIPT"
echo ""
echo "🔄 Die Jukebox startet beim nächsten Boot automatisch"
echo ""
echo "💡 Tipps:"
echo "   • Autostart prüfen: cat $LABWC_AUTOSTART"
echo "   • Autostart deaktivieren: Kommentiere Zeile aus (# davor setzen)"
echo "   • Raspberry Pi 5 nutzt labwc als Standard seit Oktober 2024"
echo ""
