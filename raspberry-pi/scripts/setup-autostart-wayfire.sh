#!/bin/bash
# ============================================================================
# Autostart Setup für Wayland/Wayfire (Ältere Raspberry Pi Bookworm)
# ============================================================================
# Konfiguriert Autostart für Wayfire Window Manager
#
# Verwendung:
#   chmod +x setup-autostart-wayfire.sh
#   ./setup-autostart-wayfire.sh
# ============================================================================

set -e

echo "🚀 Autostart Setup für Wayland/Wayfire"
echo "======================================="
echo ""

# Wayfire Config-Datei
WAYFIRE_CONFIG=~/.config/wayfire.ini

# Projekt-Verzeichnis ermitteln
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
START_SCRIPT="$SCRIPT_DIR/start-jukebox.sh"

if [ ! -f "$START_SCRIPT" ]; then
    echo "❌ start-jukebox.sh nicht gefunden: $START_SCRIPT"
    exit 1
fi

# Wayfire Config erstellen (falls nicht vorhanden)
if [ ! -f "$WAYFIRE_CONFIG" ]; then
    echo "📁 Erstelle Wayfire Config..."
    mkdir -p ~/.config
    cat > "$WAYFIRE_CONFIG" << 'EOF'
[autostart]
EOF
fi

# Backup erstellen
BACKUP_FILE="$WAYFIRE_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 Sichere Wayfire Config: $BACKUP_FILE"
cp "$WAYFIRE_CONFIG" "$BACKUP_FILE"

# Prüfe ob [autostart] Section existiert
if ! grep -q "\[autostart\]" "$WAYFIRE_CONFIG"; then
    echo "" >> "$WAYFIRE_CONFIG"
    echo "[autostart]" >> "$WAYFIRE_CONFIG"
fi

# Prüfe ob Eintrag bereits existiert
if grep -q "start-jukebox.sh" "$WAYFIRE_CONFIG"; then
    echo "✅ Jukebox Autostart bereits in wayfire.ini konfiguriert"
else
    echo "⚙️  Füge Jukebox zu [autostart] hinzu..."
    # Füge nach [autostart] ein
    sed -i "/\[autostart\]/a jukebox = $START_SCRIPT" "$WAYFIRE_CONFIG"
    echo "✅ Autostart-Eintrag hinzugefügt"
fi

echo ""
echo "✅ Wayland/Wayfire Autostart erfolgreich konfiguriert!"
echo ""
echo "📝 Konfiguration:"
echo "   Datei: $WAYFIRE_CONFIG"
echo "   Script: $START_SCRIPT"
echo ""
echo "🔄 Die Jukebox startet beim nächsten Boot automatisch"
echo ""
echo "💡 Tipps:"
echo "   • Config prüfen: cat $WAYFIRE_CONFIG"
echo "   • Autostart deaktivieren: Entferne 'jukebox = ...' Zeile aus [autostart]"
echo ""
