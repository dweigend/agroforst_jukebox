#!/bin/bash
# ============================================================================
# Chromium Setup für Raspberry Pi Kiosk-Mode mit Touch-Optimierung
# ============================================================================
# Konfiguriert Chromium für:
# - Kiosk-Mode ohne Setup-Dialoge (Keyring, Sprache)
# - Hardware-Acceleration (WebGL für Three.js)
# - Touch-only (kein Zoom, kein Pinch, kein Swipe-Back)
#
# Verwendung:
#   chmod +x setup-chromium.sh
#   ./setup-chromium.sh
# ============================================================================

set -e

echo "🔧 Chromium Kiosk-Mode Setup für Raspberry Pi"
echo "=============================================="
echo ""

# Chromium Config-Verzeichnis erstellen
echo "📁 Erstelle Chromium Config-Verzeichnis..."
mkdir -p ~/.config/chromium/Default

# Backup existierender Preferences (falls vorhanden)
if [ -f ~/.config/chromium/Default/Preferences ]; then
    BACKUP_FILE=~/.config/chromium/Default/Preferences.backup.$(date +%Y%m%d_%H%M%S)
    echo "💾 Sichere existierende Preferences: $BACKUP_FILE"
    mv ~/.config/chromium/Default/Preferences "$BACKUP_FILE"
fi

# Preferences-Datei erstellen
echo "⚙️  Erstelle Chromium Preferences..."
cat > ~/.config/chromium/Default/Preferences << 'EOF'
{
  "browser": {
    "check_default_browser": false,
    "show_home_button": false
  },
  "intl": {
    "accept_languages": "de-DE,de,en-US,en",
    "selected_languages": "de-DE,de,en-US,en"
  },
  "translate": {
    "enabled": false
  },
  "profile": {
    "content_settings": {
      "exceptions": {}
    },
    "default_content_setting_values": {
      "notifications": 2
    }
  },
  "first_run_tabs": [],
  "homepage": "http://localhost:4173/",
  "homepage_is_newtabpage": false,
  "session": {
    "restore_on_startup": 4,
    "startup_urls": ["http://localhost:4173/"]
  }
}
EOF

# First Run Marker erstellen
echo "✅ Erstelle First-Run Marker..."
touch ~/.config/chromium/First\ Run

# Cache-Verzeichnisse löschen für sauberen Start
echo "🧹 Lösche Chromium Cache..."
rm -rf ~/.config/chromium/Default/Cache/* 2>/dev/null || true
rm -rf ~/.config/chromium/Default/Code\ Cache/* 2>/dev/null || true
rm -rf ~/.config/chromium/Default/GPUCache/* 2>/dev/null || true
rm -f ~/.config/chromium/SingletonLock 2>/dev/null || true
rm -f ~/.config/chromium/SingletonSocket 2>/dev/null || true

echo ""
echo "✅ Chromium Setup abgeschlossen!"
echo ""
echo "📝 Konfigurierte Features:"
echo "   ✓ Keine Setup-Dialoge (Keyring, Sprache, Default Browser)"
echo "   ✓ Deutsche Sprache voreingestellt"
echo "   ✓ Homepage: http://localhost:4173/"
echo "   ✓ Session-Restore deaktiviert"
echo ""
echo "🎯 Empfohlene Start-Flags für Kiosk-Mode:"
echo "   --kiosk                    # Vollbild ohne Browser-UI"
echo "   --password-store=basic     # Kein Keyring-Dialog"
echo "   --no-first-run             # Keine First-Run-Dialoge"
echo "   --disable-pinch            # Touch: Kein Zoom"
echo "   --disable-touch-drag-drop  # Touch: Kein Drag&Drop"
echo "   --ignore-gpu-blocklist     # Hardware Acceleration"
echo "   --enable-gpu-rasterization # WebGL Performance"
echo ""
echo "💡 Diese Flags werden automatisch von start-jukebox.sh gesetzt!"
echo ""
