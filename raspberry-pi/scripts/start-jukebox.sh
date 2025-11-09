#!/bin/bash
# ============================================================================
# Agroforst Jukebox Starter für Raspberry Pi Kiosk-Mode
# ============================================================================
# Intelligentes Start-Script mit:
# - Automatischer Display-Server Detection (X11/Wayfire/labwc)
# - Server-Ready Check (wartet bis Vite läuft)
# - Touch-optimierte Chromium Flags (kein Zoom/Pinch)
# - Hardware Acceleration für WebGL/Three.js
# - Screen Blanking Prevention
#
# Verwendung:
#   chmod +x start-jukebox.sh
#   ./start-jukebox.sh
# ============================================================================

set -e

echo "🎵 Agroforst Jukebox Starter"
echo "============================"
echo ""

# ============================================================================
# Display-Server Detection
# ============================================================================

DISPLAY_SERVER="unknown"
SESSION_DESKTOP=""

# Methode 1: XDG_SESSION_TYPE Variable (funktioniert in aktiver Desktop-Session)
if [ -n "$XDG_SESSION_TYPE" ]; then
    if [ "$XDG_SESSION_TYPE" = "x11" ]; then
        DISPLAY_SERVER="x11"
    elif [ "$XDG_SESSION_TYPE" = "wayland" ]; then
        # Unterscheide zwischen Wayfire und labwc
        if [ -n "$XDG_SESSION_DESKTOP" ]; then
            case "$XDG_SESSION_DESKTOP" in
                *wayfire*)
                    DISPLAY_SERVER="wayfire"
                    ;;
                *labwc*)
                    DISPLAY_SERVER="labwc"
                    ;;
                *)
                    DISPLAY_SERVER="wayland"
                    ;;
            esac
        else
            DISPLAY_SERVER="wayland"
        fi
    fi
fi

# Methode 2: loginctl (funktioniert auch bei SSH)
if [ "$DISPLAY_SERVER" = "unknown" ] && command -v loginctl &> /dev/null; then
    SESSION_DESKTOP=$(loginctl show-session 1 2>/dev/null | grep Desktop= | cut -d= -f2)
    case "$SESSION_DESKTOP" in
        *x11*|*LXDE-pi-x*)
            DISPLAY_SERVER="x11"
            ;;
        *wayfire*|*LXDE-pi-wayfire*)
            DISPLAY_SERVER="wayfire"
            ;;
        *labwc*|*LXDE-pi-labwc*)
            DISPLAY_SERVER="labwc"
            ;;
    esac
fi

echo "🖥️  Erkannter Display-Server: $DISPLAY_SERVER"
echo ""

# ============================================================================
# DISPLAY Variable setzen (wichtig für SSH-Sessions)
# ============================================================================

export DISPLAY=:0

# ============================================================================
# Projekt-Verzeichnis
# ============================================================================

# Automatisch ermitteln: Ein Verzeichnis über dem raspberry-pi/ Ordner
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "❌ Fehler: package.json nicht in $PROJECT_DIR gefunden!"
    echo "   Bitte passe PROJECT_DIR im Script an oder führe das Script aus dem richtigen Ordner aus."
    exit 1
fi

echo "📁 Projekt-Verzeichnis: $PROJECT_DIR"
cd "$PROJECT_DIR"

# ============================================================================
# Screen Blanking deaktivieren
# ============================================================================

echo "🖥️  Deaktiviere Screen Blanking..."
if command -v xset &> /dev/null; then
    xset s off 2>/dev/null || true
    xset -dpms 2>/dev/null || true
    xset s noblank 2>/dev/null || true
fi

# ============================================================================
# Vite Preview Server starten
# ============================================================================

echo "🚀 Starte Vite Preview Server..."

# Alte Vite-Prozesse beenden
pkill -f "vite preview" 2>/dev/null || true

# Server im Hintergrund starten
npm run preview > /tmp/vite-jukebox.log 2>&1 &
VITE_PID=$!

echo "   PID: $VITE_PID"
echo "   Log: /tmp/vite-jukebox.log"

# ============================================================================
# Server-Ready Check
# ============================================================================

echo ""
echo "⏳ Warte auf Vite Server (http://localhost:4173)..."

SERVER_READY=false
MAX_ATTEMPTS=30

for i in $(seq 1 $MAX_ATTEMPTS); do
    if curl -s http://localhost:4173/ > /dev/null 2>&1; then
        echo "✅ Server ist bereit nach $i Sekunden!"
        SERVER_READY=true
        break
    fi
    echo "   Versuch $i/$MAX_ATTEMPTS..."
    sleep 1
done

if [ "$SERVER_READY" = false ]; then
    echo "❌ Server hat nach $MAX_ATTEMPTS Sekunden nicht geantwortet!"
    echo "   Prüfe Log: tail -f /tmp/vite-jukebox.log"
    exit 1
fi

# Zusätzlicher Puffer
sleep 2

# ============================================================================
# Chromium Browser-Befehl ermitteln
# ============================================================================

BROWSER=""
if command -v chromium-browser &> /dev/null; then
    BROWSER="chromium-browser"
elif command -v chromium &> /dev/null; then
    BROWSER="chromium"
else
    echo "❌ Kein Chromium gefunden! Installiere mit:"
    echo "   sudo apt install chromium-browser -y"
    exit 1
fi

echo ""
echo "🌐 Browser: $BROWSER"

# ============================================================================
# Chromium-Flags zusammenstellen
# ============================================================================

# Base Flags (für alle Display-Server)
CHROMIUM_FLAGS=(
    "--kiosk"
    "--password-store=basic"
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-infobars"
    "--noerrdialogs"
    "--start-maximized"
    "--disable-translate"
    "--disable-features=TranslateUI"
    "--disable-session-crashed-bubble"
    "--disable-restore-session-state"
)

# Touch-Optimierung (kein Zoom, kein Pinch, kein Swipe-Back)
CHROMIUM_FLAGS+=(
    "--disable-pinch"
    "--disable-touch-drag-drop"
    "--overscroll-history-navigation=0"
)

# Hardware Acceleration für WebGL/Three.js
CHROMIUM_FLAGS+=(
    "--ignore-gpu-blocklist"
    "--enable-gpu-rasterization"
    "--enable-zero-copy"
    "--enable-features=CanvasOopRasterization"
)

# Display-Server spezifische Flags
case "$DISPLAY_SERVER" in
    wayfire|wayland)
        CHROMIUM_FLAGS+=("--ozone-platform=wayland")
        CHROMIUM_FLAGS+=("--enable-features=OverlayScrollbar")
        ;;
    labwc)
        # labwc braucht keine speziellen Flags
        ;;
    x11)
        # X11 braucht keine speziellen Flags
        ;;
esac

# URL
URL="http://localhost:4173/"

# ============================================================================
# Chromium starten
# ============================================================================

echo ""
echo "🎨 Starte Chromium im Kiosk-Mode..."
echo "   Display-Server: $DISPLAY_SERVER"
echo "   URL: $URL"
echo ""

# Alte Chromium-Prozesse beenden
pkill chromium 2>/dev/null || true
sleep 1

# Chromium mit allen Flags starten (Errors unterdrücken)
$BROWSER "${CHROMIUM_FLAGS[@]}" "$URL" > /dev/null 2>&1 &

echo "✅ Jukebox läuft!"
echo ""
echo "💡 Tipps:"
echo "   • Vite Log: tail -f /tmp/vite-jukebox.log"
echo "   • Chromium beenden: pkill chromium"
echo "   • Server beenden: pkill -f 'vite preview'"
echo "   • WebGL Check: Öffne chrome://gpu/ im Browser"
echo ""
