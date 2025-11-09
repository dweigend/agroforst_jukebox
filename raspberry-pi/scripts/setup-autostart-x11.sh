#!/bin/bash
# ============================================================================
# Autostart Setup für X11/LXDE (Raspberry Pi 4 mit 1GB RAM)
# ============================================================================
# Konfiguriert Autostart für X11-basiertes Desktop Environment
#
# Verwendung:
#   chmod +x setup-autostart-x11.sh
#   ./setup-autostart-x11.sh
# ============================================================================

set -e

echo "🚀 Autostart Setup für X11/LXDE"
echo "================================"
echo ""

# Autostart-Verzeichnis und Datei
AUTOSTART_DIR=~/.config/lxsession/LXDE-pi
AUTOSTART_FILE="$AUTOSTART_DIR/autostart"

# Projekt-Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$SCRIPT_DIR/start-jukebox.sh"

if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ start-jukebox.sh nicht gefunden: $START_SCRIPT"
    exit 1
fi

# Autostart-Verzeichnis erstellen
echo "📁 Erstelle Autostart-Verzeichnis..."
mkdir -p "$AUTOSTART_DIR"

# Backup erstellen (falls vorhanden)
if [ -f "$AUTOSTART_FILE" ]; then
    BACKUP_FILE="$AUTOSTART_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    echo "💾 Sichere existierende Autostart-Datei: $BACKUP_FILE"
    cp "$AUTOSTART_FILE" "$BACKUP_FILE"
fi

# Autostart-Eintrag hinzufügen
echo "⚙️  Konfiguriere Autostart..."

# Prüfe ob Eintrag bereits existiert
if [ -f "$AUTOSTART_FILE" ] && grep -q "start-jukebox.sh" "$AUTOSTART_FILE"; then
    echo "✅ Jukebox Autostart bereits konfiguriert"
else
    echo "@$START_SCRIPT" >> "$AUTOSTART_FILE"
    echo "✅ Autostart-Eintrag hinzugefügt"
fi

echo ""
echo "✅ X11/LXDE Autostart erfolgreich konfiguriert!"
echo ""
echo "📝 Konfiguration:"
echo "   Datei: $AUTOSTART_FILE"
echo "   Script: $START_SCRIPT"
echo ""
echo "🔄 Die Jukebox startet beim nächsten Boot automatisch"
echo ""
echo "💡 Tipps:"
echo "   • Autostart deaktivieren: Kommentiere Zeile in $AUTOSTART_FILE aus"
echo "   • Autostart testen: Neu starten und prüfen"
echo ""
