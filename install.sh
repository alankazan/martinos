#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  MartinsOS — Instalador Universal para Linux
#  Suporta: Ubuntu/Debian · Arch/Manjaro · Fedora/RHEL · openSUSE
#
#  Uso:
#    ./install.sh              → Instala e compila
#    ./install.sh --autostart  → Instala + configura para iniciar com o sistema
#    ./install.sh --dev        → Inicia em modo de desenvolvimento (sem build)
# ─────────────────────────────────────────────────────────────────────────────

set -e

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
AUTOSTART=false
DEV_MODE=false

for arg in "$@"; do
  [[ "$arg" == "--autostart" ]] && AUTOSTART=true
  [[ "$arg" == "--dev" ]]       && DEV_MODE=true
done

banner() {
  echo -e "${BLUE}${BOLD}"
  echo "  ███╗   ███╗ █████╗ ██████╗ ████████╗██╗███╗   ██╗███████╗"
  echo "  ████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝"
  echo "  ██╔████╔██║███████║██████╔╝   ██║   ██║██╔██╗ ██║███████╗"
  echo "  ██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║██║╚██╗██║╚════██║"
  echo "  ██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ██║██║ ╚████║███████║"
  echo "  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝"
  echo -e "${NC}${CYAN}  Linux HTPC Launcher — Instalador Universal v1.0${NC}\n"
}

step()    { echo -e "\n${YELLOW}▶ $1${NC}"; }
ok()      { echo -e "  ${GREEN}✓ $1${NC}"; }
warn()    { echo -e "  ${YELLOW}⚠ $1${NC}"; }
err()     { echo -e "  ${RED}✗ $1${NC}"; exit 1; }
info()    { echo -e "  ${CYAN}ℹ $1${NC}"; }

# ── Detecção de Package Manager ───────────────────────────────────────────────
detect_pm() {
  if command -v apt-get &>/dev/null; then   echo "apt"
  elif command -v pacman &>/dev/null;  then echo "pacman"
  elif command -v dnf    &>/dev/null;  then echo "dnf"
  elif command -v zypper &>/dev/null;  then echo "zypper"
  else err "Package manager não reconhecido. Suportados: apt, pacman, dnf, zypper"; fi
}

# ── Instalar pacote genérico por PM ──────────────────────────────────────────
install_pkg() {
  local PKG_APT="$1" PKG_PACMAN="${2:-$1}" PKG_DNF="${3:-$1}" PKG_ZYPPER="${4:-$1}"
  case "$PM" in
    apt)    sudo apt-get install -y -q "$PKG_APT"    2>/dev/null ;;
    pacman) sudo pacman -S --noconfirm --needed "$PKG_PACMAN" 2>/dev/null ;;
    dnf)    sudo dnf install -y -q "$PKG_DNF"        2>/dev/null ;;
    zypper) sudo zypper install -y "$PKG_ZYPPER"     2>/dev/null ;;
  esac
}

# ── Verificar se pacote existe ────────────────────────────────────────────────
pkg_installed() { command -v "$1" &>/dev/null; }

banner

# ── Detectar distro ───────────────────────────────────────────────────────────
step "Detectando sistema operacional..."
PM=$(detect_pm)
if [[ -f /etc/os-release ]]; then
  source /etc/os-release
  ok "Distro: ${PRETTY_NAME:-Linux} (package manager: $PM)"
else
  ok "Linux detectado (package manager: $PM)"
fi

# ── Atualizar repositórios ────────────────────────────────────────────────────
step "Atualizando repositórios..."
case "$PM" in
  apt)    sudo apt-get update -qq ;;
  pacman) sudo pacman -Sy --noconfirm >/dev/null 2>&1 ;;
  dnf)    sudo dnf check-update -q 2>/dev/null || true ;;
  zypper) sudo zypper refresh -q ;;
esac
ok "Repositórios atualizados"

# ── Node.js ───────────────────────────────────────────────────────────────────
step "Verificando Node.js..."
if ! pkg_installed node; then
  info "Node.js não encontrado. Instalando via NodeSource..."
  case "$PM" in
    apt)
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - -q
      sudo apt-get install -y -q nodejs
      ;;
    pacman)
      sudo pacman -S --noconfirm --needed nodejs npm
      ;;
    dnf)
      sudo dnf module install -y nodejs:20
      ;;
    zypper)
      sudo zypper install -y nodejs20 npm20
      ;;
  esac
fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[[ "$NODE_VER" -lt 18 ]] && err "Node.js 18+ necessário (atual: $(node -v)). Atualize em: https://nodejs.org"
ok "Node.js $(node -v)"

# ── Python 3 ──────────────────────────────────────────────────────────────────
step "Verificando Python 3..."
if ! pkg_installed python3; then
  install_pkg "python3" "python" "python3" "python3"
fi
if ! pkg_installed pip3; then
  install_pkg "python3-pip" "python-pip" "python3-pip" "python3-pip"
fi
ok "$(python3 --version)"

# ── Dependências opcionais ────────────────────────────────────────────────────
step "Instalando dependências opcionais..."

# Controle de volume — tenta PulseAudio, depois PipeWire, depois ALSA
if ! pkg_installed pactl; then
  if ! pkg_installed pw-cli; then
    install_pkg "pulseaudio-utils" "pulseaudio" "pulseaudio-utils" "pulseaudio-utils" 2>/dev/null || true
  fi
fi
pkg_installed pactl && ok "Controle de volume (pactl)" || warn "pactl não disponível — volume via controle pode não funcionar"

# Playerctl (controle de mídia)
if ! pkg_installed playerctl; then
  install_pkg "playerctl" "playerctl" "playerctl" "playerctl" 2>/dev/null || true
fi
pkg_installed playerctl && ok "playerctl (controle de mídia)" || warn "playerctl não instalado — controle de mídia desabilitado"

# Monitor de sistema (btop ou htop)
if ! pkg_installed btop && ! pkg_installed htop; then
  install_pkg "btop" "btop" "btop" "btop" 2>/dev/null || \
  install_pkg "htop" "htop" "htop" "htop" 2>/dev/null || true
fi
pkg_installed btop && ok "btop (monitor)" || (pkg_installed htop && ok "htop (monitor)" || warn "Nenhum monitor instalado")

# Screenshot
if ! pkg_installed scrot && ! pkg_installed gnome-screenshot && ! pkg_installed spectacle; then
  install_pkg "scrot" "scrot" "scrot" "scrot" 2>/dev/null || true
fi

# Terminal (Alacritty ou xterm como fallback)
if ! pkg_installed alacritty && ! pkg_installed xterm; then
  install_pkg "xterm" "xterm" "xterm" "xterm" 2>/dev/null || true
fi
pkg_installed alacritty && ok "Terminal: alacritty" || (pkg_installed xterm && ok "Terminal: xterm (fallback)" || warn "Nenhum terminal encontrado")

# Chromium (para modo kiosk)
CHROMIUM_BIN=""
for bin in chromium chromium-browser google-chrome google-chrome-stable; do
  if pkg_installed "$bin"; then CHROMIUM_BIN="$bin"; break; fi
done
if [[ -z "$CHROMIUM_BIN" ]]; then
  warn "Chromium não encontrado. Instalando..."
  case "$PM" in
    apt)    install_pkg "chromium-browser" 2>/dev/null || install_pkg "chromium" 2>/dev/null || true ;;
    pacman) install_pkg "" "chromium" 2>/dev/null || true ;;
    dnf)    install_pkg "" "" "chromium" 2>/dev/null || true ;;
    zypper) install_pkg "" "" "" "chromium" 2>/dev/null || true ;;
  esac
  for bin in chromium chromium-browser google-chrome; do
    if pkg_installed "$bin"; then CHROMIUM_BIN="$bin"; break; fi
  done
fi
[[ -n "$CHROMIUM_BIN" ]] && ok "Browser kiosk: $CHROMIUM_BIN" || warn "Chromium não encontrado — modo kiosk pode não funcionar"

# ── Frontend ──────────────────────────────────────────────────────────────────
step "Instalando dependências do frontend (npm)..."
cd "$INSTALL_DIR"
npm install --silent
ok "Dependências npm instaladas"

# ── Backend ───────────────────────────────────────────────────────────────────
step "Instalando dependências do backend (pip)..."
pip3 install -r backend/requirements.txt -q
ok "Dependências Python instaladas"

# ── Build ─────────────────────────────────────────────────────────────────────
if ! $DEV_MODE; then
  step "Compilando frontend para produção..."
  npm run build
  ok "Build concluído → dist/"
fi

# ── Configuração ──────────────────────────────────────────────────────────────
step "Criando arquivo de configuração..."
if [[ ! -f "$INSTALL_DIR/backend/.env" ]]; then
  cat > "$INSTALL_DIR/backend/.env" << EOF
FLASK_ENV=production
FLASK_PORT=5174
FRONTEND_PORT=5173
LAUNCHER_NATIVE_KB=auto
EOF
  ok ".env criado"
else
  ok ".env já existe"
fi

# ── Scripts de execução ───────────────────────────────────────────────────────
step "Criando scripts de execução..."
mkdir -p "$INSTALL_DIR/deploy"

cat > "$INSTALL_DIR/deploy/start-backend.sh" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR/backend"
exec python3 server.py
EOF

cat > "$INSTALL_DIR/deploy/start-frontend.sh" << EOF
#!/usr/bin/env bash
cd "$INSTALL_DIR"
exec npx serve dist -p 5173 --no-clipboard
EOF

# Detecta o binário do Chromium disponível
cat > "$INSTALL_DIR/deploy/start-kiosk.sh" << EOF
#!/usr/bin/env bash
sleep 5
xset s off -dpms 2>/dev/null || true
command -v unclutter >/dev/null 2>&1 && unclutter -idle 3 &

# Detecta browser disponível
BROWSER=""
for b in chromium chromium-browser google-chrome google-chrome-stable; do
  command -v "\$b" >/dev/null 2>&1 && BROWSER="\$b" && break
done

if [[ -z "\$BROWSER" ]]; then
  echo "Nenhum browser compatível encontrado" >&2
  exit 1
fi

exec "\$BROWSER" \\
  --kiosk \\
  --no-first-run \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-restore-session-state \\
  --disable-translate \\
  --noerrdialogs \\
  --disable-pinch \\
  --overscroll-history-navigation=0 \\
  --check-for-update-interval=31536000 \\
  --app=http://localhost:5173 \\
  2>/dev/null
EOF

chmod +x "$INSTALL_DIR/deploy/"*.sh
ok "Scripts criados em deploy/"

# ── Autostart via Systemd ─────────────────────────────────────────────────────
if $AUTOSTART; then
  step "Configurando autostart via systemd..."

  # Valida que systemd está disponível
  if ! command -v systemctl &>/dev/null; then
    err "systemd não encontrado. Autostart requer systemd."
  fi

  CURRENT_USER=$(whoami)
  PYTHON_BIN=$(command -v python3)
  NPX_BIN=$(command -v npx)

  sudo tee /etc/systemd/system/martinos-backend.service > /dev/null << EOF
[Unit]
Description=MartinsOS Backend (Flask + SocketIO)
After=network.target

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=$PYTHON_BIN $INSTALL_DIR/backend/server.py
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo tee /etc/systemd/system/martinos-frontend.service > /dev/null << EOF
[Unit]
Description=MartinsOS Frontend (HTTP Server)
After=network.target martinos-backend.service

[Service]
Type=simple
User=$CURRENT_USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$NPX_BIN serve dist -p 5173 --no-clipboard
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

  sudo tee /etc/systemd/system/martinos-kiosk.service > /dev/null << EOF
[Unit]
Description=MartinsOS Kiosk (Browser em tela cheia)
After=graphical.target martinos-frontend.service
Wants=graphical.target

[Service]
Type=simple
User=$CURRENT_USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=$HOME/.Xauthority
ExecStart=$INSTALL_DIR/deploy/start-kiosk.sh
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=graphical.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable martinos-backend martinos-frontend martinos-kiosk
  ok "Serviços systemd criados e habilitados"

  # Desabilita screensaver do sistema via logind
  if [[ -f /etc/systemd/logind.conf ]]; then
    sudo sed -i 's/#IdleAction=.*/IdleAction=ignore/' /etc/systemd/logind.conf 2>/dev/null || true
    ok "Screensaver do sistema desabilitado"
  fi

  echo -e "\n  ${YELLOW}⚑  Reinicie o sistema para ativar o modo kiosk${NC}"
fi

# ── Resumo ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  ✅  MartinsOS instalado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
if $DEV_MODE; then
  echo -e "  Modo desenvolvimento:"
  echo -e "  ${BLUE}./deploy/start-backend.sh &${NC}   # Terminal 1"
  echo -e "  ${BLUE}npm run dev${NC}                   # Terminal 2"
  echo -e "  Acesse: ${YELLOW}http://localhost:5173${NC}"
else
  echo -e "  Para iniciar manualmente:"
  echo -e "  ${BLUE}./deploy/start-backend.sh &${NC}"
  echo -e "  ${BLUE}./deploy/start-frontend.sh &${NC}"
  echo -e "  ${BLUE}./deploy/start-kiosk.sh${NC}"
  echo ""
  echo -e "  Acesse: ${YELLOW}http://localhost:5173${NC}"
fi
echo ""
if $AUTOSTART; then
  echo -e "  Autostart: ${GREEN}habilitado${NC}"
  echo -e "  Verifique status: ${BLUE}systemctl status martinos-backend${NC}"
else
  echo -e "  Para autostart ao ligar: ${YELLOW}./install.sh --autostart${NC}"
fi
echo ""
