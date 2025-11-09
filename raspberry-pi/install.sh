#!/bin/bash
# ============================================================================
# Agroforst Jukebox - Raspberry Pi Installer
# ============================================================================
# One-Click Installation für Raspberry Pi 4 & 5 mit:
# - Waveshare 5" Round Display (1080x1080)
# - Automatische Display-Server Detection (X11/Wayfire/labwc)
# - Touch-optimierter Chromium Kiosk-Mode
# - Hardware Acceleration für WebGL/Three.js
#
# Verwendung:
#   chmod +x install.sh
#   ./install.sh
# ============================================================================

set -e

echo "🌳 Agroforst Jukebox - Raspberry Pi Installer"
echo "=============================================="
echo ""

# ============================================================================
# System Detection
# ============================================================================

echo "🔍 Erkenne System-Konfiguration..."
echo ""

# Raspberry Pi Model
PI_MODEL="Unknown"
if [ -f /proc/device-tree/model ]; then
    PI_MODEL=$(cat /proc/device-tree/model)
    echo "   📟 Model: $PI_MODEL"
fi

# OS Version
if [ -f /etc/os-release ]; then
    OS_VERSION=$(grep VERSION_CODENAME /etc/os-release | cut -d= -f2)
    echo "   💿 OS: Raspberry Pi OS $OS_VERSION"
fi

# Display Server
DISPLAY_SERVER="unknown"
if [ -n "$XDG_SESSION_TYPE" ]; then
    if [ "$XDG_SESSION_TYPE" = "x11" ]; then
        DISPLAY_SERVER="x11"
    elif [ "$XDG_SESSION_TYPE" = "wayland" ]; then
        if [ -n "$XDG_SESSION_DESKTOP" ]; then
            case "$XDG_SESSION_DESKTOP" in
                *wayfire*) DISPLAY_SERVER="wayfire" ;;
                *labwc*) DISPLAY_SERVER="labwc" ;;
                *) DISPLAY_SERVER="wayland" ;;
            esac
        fi
    fi
elif command -v loginctl &> /dev/null; then
    SESSION_DESKTOP=$(loginctl show-session 1 2>/dev/null | grep Desktop= | cut -d= -f2 || echo "")
    case "$SESSION_DESKTOP" in
        *x11*|*LXDE-pi-x*) DISPLAY_SERVER="x11" ;;
        *wayfire*|*LXDE-pi-wayfire*) DISPLAY_SERVER="wayfire" ;;
        *labwc*|*LXDE-pi-labwc*) DISPLAY_SERVER="labwc" ;;
    esac
fi

echo "   🖥️  Display Server: $DISPLAY_SERVER"
echo ""

# ============================================================================
# Projekt-Verzeichnis prüfen
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden in $PROJECT_DIR"
    echo "   Bist du im richtigen Verzeichnis?"
    exit 1
fi

echo "📁 Projekt-Verzeichnis: $PROJECT_DIR"
echo ""

# ============================================================================
# Dependencies prüfen
# ============================================================================

echo "🔧 Prüfe System-Dependencies..."
echo ""

MISSING_DEPS=()

# Node.js
if ! command -v node &> /dev/null; then
    MISSING_DEPS+=("Node.js")
else
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js: $NODE_VERSION"
fi

# npm
if ! command -v npm &> /dev/null; then
    MISSING_DEPS+=("npm")
else
    NPM_VERSION=$(npm --version)
    echo "   ✅ npm: $NPM_VERSION"
fi

# Chromium
if ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    MISSING_DEPS+=("chromium-browser")
else
    if command -v chromium &> /dev/null; then
        CHROMIUM_VERSION=$(chromium --version 2>/dev/null || echo "chromium")
    else
        CHROMIUM_VERSION=$(chromium-browser --version 2>/dev/null || echo "chromium-browser")
    fi
    echo "   ✅ Chromium: $CHROMIUM_VERSION"
fi

# curl
if ! command -v curl &> /dev/null; then
    MISSING_DEPS+=("curl")
else
    echo "   ✅ curl: $(curl --version | head -n1)"
fi

# xset (für Screen Blanking)
if ! command -v xset &> /dev/null; then
    echo "   ⚠️  xset nicht gefunden (optional für Screen Blanking)"
fi

echo ""

# Fehlende Dependencies installieren
if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "⚠️  Fehlende Dependencies: ${MISSING_DEPS[*]}"
    echo ""
    read -p "Möchtest du die fehlenden Pakete jetzt installieren? (j/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        echo "📦 Installiere fehlende Pakete..."
        sudo apt update
        sudo apt install -y "${MISSING_DEPS[@]}"
        echo "✅ Dependencies installiert!"
    else
        echo "❌ Installation abgebrochen. Bitte installiere manuell:"
        echo "   sudo apt install ${MISSING_DEPS[*]}"
        exit 1
    fi
else
    echo "✅ Alle Dependencies sind installiert!"
fi

echo ""

# ============================================================================
# Waveshare Display Setup
# ============================================================================

echo "🖥️  Waveshare 5\" Round Display Setup"
echo "======================================"
echo ""
echo "Dieses Setup konfiguriert /boot/firmware/config.txt für das"
echo "Waveshare 5\" Round Display (1080x1080)."
echo ""
read -p "Möchtest du das Display jetzt konfigurieren? (j/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[JjYy]$ ]]; then
    sudo "$SCRIPT_DIR/scripts/setup-display.sh"
    echo ""
    echo "⚠️  WICHTIG: Für Display-Aktivierung ist ein Reboot nötig!"
    echo "   Du kannst später neu starten - Installation wird fortgesetzt."
    echo ""
else
    echo "⏭️  Display-Setup übersprungen"
    echo "   Du kannst es später manuell ausführen:"
    echo "   sudo $SCRIPT_DIR/scripts/setup-display.sh"
fi

echo ""

# ============================================================================
# npm install & build
# ============================================================================

echo "📦 Projekt-Dependencies installieren"
echo "====================================="
echo ""

cd "$PROJECT_DIR"

if [ -d "node_modules" ]; then
    echo "✅ node_modules bereits vorhanden"
else
    echo "⏳ npm install läuft... (das kann ein paar Minuten dauern)"
    npm install
    echo "✅ Dependencies installiert!"
fi

echo ""

# Build
echo "🔨 Production Build erstellen"
echo "=============================="
echo ""

if [ -d "dist" ]; then
    echo "⚠️  dist/ Ordner bereits vorhanden"
    read -p "Möchtest du neu builden? (j/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        npm run build
        echo "✅ Build erfolgreich!"
    else
        echo "⏭️  Build übersprungen"
    fi
else
    npm run build
    echo "✅ Build erfolgreich!"
fi

echo ""

# ============================================================================
# Chromium Setup
# ============================================================================

echo "🌐 Chromium Kiosk-Mode Setup"
echo "============================"
echo ""

"$SCRIPT_DIR/scripts/setup-chromium.sh"

echo ""

# ============================================================================
# Autostart Setup
# ============================================================================

echo "🚀 Autostart-Konfiguration"
echo "=========================="
echo ""
echo "Erkannter Display-Server: $DISPLAY_SERVER"
echo ""

if [ "$DISPLAY_SERVER" = "unknown" ]; then
    echo "⚠️  Display-Server konnte nicht automatisch erkannt werden!"
    echo ""
    echo "Bitte wähle manuell:"
    echo "  1) X11/LXDE (Raspberry Pi 4 mit 1GB RAM)"
    echo "  2) Wayland/Wayfire (Ältere Bookworm Installationen)"
    echo "  3) Wayland/labwc (Raspberry Pi 5 Standard seit Okt 2024)"
    echo "  4) Überspringen (manuell später einrichten)"
    echo ""
    read -p "Auswahl (1-4): " -n 1 -r
    echo

    case $REPLY in
        1) DISPLAY_SERVER="x11" ;;
        2) DISPLAY_SERVER="wayfire" ;;
        3) DISPLAY_SERVER="labwc" ;;
        4) DISPLAY_SERVER="skip" ;;
        *) echo "❌ Ungültige Auswahl"; DISPLAY_SERVER="skip" ;;
    esac
fi

if [ "$DISPLAY_SERVER" != "skip" ]; then
    read -p "Möchtest du Autostart jetzt einrichten? (j/n): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        case "$DISPLAY_SERVER" in
            x11)
                "$SCRIPT_DIR/scripts/setup-autostart-x11.sh"
                ;;
            wayfire)
                "$SCRIPT_DIR/scripts/setup-autostart-wayfire.sh"
                ;;
            labwc)
                "$SCRIPT_DIR/scripts/setup-autostart-labwc.sh"
                ;;
        esac
        echo "✅ Autostart konfiguriert!"
    else
        echo "⏭️  Autostart-Setup übersprungen"
        echo "   Du kannst es später manuell einrichten:"
        echo "   $SCRIPT_DIR/scripts/setup-autostart-$DISPLAY_SERVER.sh"
    fi
fi

echo ""

# ============================================================================
# Installation abgeschlossen
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🎉 Installation abgeschlossen!                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Zusammenfassung:"
echo "   ✅ System: $PI_MODEL"
echo "   ✅ Display-Server: $DISPLAY_SERVER"
echo "   ✅ Dependencies installiert"
echo "   ✅ npm install & build erfolgreich"
echo "   ✅ Chromium konfiguriert (Kiosk-Mode, Touch-optimiert)"
echo ""
echo "🚀 Nächste Schritte:"
echo ""
echo "   1. Jukebox manuell testen:"
echo "      cd $PROJECT_DIR"
echo "      $SCRIPT_DIR/scripts/start-jukebox.sh"
echo ""
echo "   2. Falls Reboot für Display nötig:"
echo "      sudo reboot"
echo ""
echo "   3. Nach Reboot startet die Jukebox automatisch (wenn Autostart aktiv)"
echo ""
echo "📖 Dokumentation:"
echo "   • Anleitung: $SCRIPT_DIR/README.md"
echo "   • Troubleshooting: $SCRIPT_DIR/docs/troubleshooting.md"
echo "   • Pi 4 vs Pi 5: $SCRIPT_DIR/docs/pi4-vs-pi5.md"
echo ""
echo "💡 Tipps:"
echo "   • WebGL Check: chrome://gpu/ im Browser öffnen"
echo "   • Performance: Stelle sicher, dass GPU Acceleration aktiv ist"
echo "   • Touch: Zoom/Pinch sind deaktiviert für Kiosk-Betrieb"
echo ""
