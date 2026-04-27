#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  MartinsOS — Universal Linux Installer
#  Optimized for: Ubuntu/Debian · Arch/Manjaro · Fedora · openSUSE
# ─────────────────────────────────────────────────────────────────────────────

set -e

# --- Visuals ---
BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
RED='\033[0;31m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

# --- Configuration ---
INSTALL_PATH="/opt/martinos"
REPO_URL="https://github.com/alankazan/medialauncher.git" # Update if needed
AUTOSTART=true
FORCE_INSTALL=false

# --- Arguments ---
for arg in "$@"; do
  [[ "$arg" == "--no-autostart" ]] && AUTOSTART=false
  [[ "$arg" == "--force" ]]        && FORCE_INSTALL=true
done

banner() {
  clear
  echo -e "${BLUE}${BOLD}"
  echo "  ███╗   ███╗ █████╗ ██████╗ ████████╗██╗███╗   ██╗███████╗"
  echo "  ████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝"
  echo "  ██╔████╔██║███████║██████╔╝   ██║   ██║██╔██╗ ██║███████╗"
  echo "  ██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║██║╚██╗██║╚════██║"
  echo "  ██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ██║██║ ╚████║███████║"
  echo "  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝"
  echo -e "${NC}${CYAN}  MartinsOS Native Launcher — Installer v2.0${NC}\n"
}

step()    { echo -e "\n${YELLOW}▶ $1${NC}"; }
ok()      { echo -e "  ${GREEN}✓ $1${NC}"; }
warn()    { echo -e "  ${YELLOW}⚠ $1${NC}"; }
err()     { echo -e "  ${RED}✗ $1${NC}"; exit 1; }
info()    { echo -e "  ${CYAN}ℹ $1${NC}"; }

# --- Root Check ---
if [[ $EUID -ne 0 ]]; then
   err "Este script deve ser executado como root (use sudo)."
fi

# --- System Detection ---
detect_pm() {
  if command -v apt-get &>/dev/null; then   echo "apt"
  elif command -v pacman &>/dev/null;  then echo "pacman"
  elif command -v dnf    &>/dev/null;  then echo "dnf"
  elif command -v zypper &>/dev/null;  then echo "zypper"
  else err "Package manager não suportado. Use Debian, Arch, Fedora ou openSUSE."; fi
}

banner
PM=$(detect_pm)
step "Detectando sistema operacional..."
if [[ -f /etc/os-release ]]; then
  source /etc/os-release
  ok "Sistema: $PRETTY_NAME ($PM)"
else
  ok "Linux Genérico ($PM)"
fi

# --- Bootstrapper / Self-Clone ---
if [[ "$(pwd)" != "$INSTALL_PATH" ]] && [[ "$FORCE_INSTALL" == "false" ]]; then
  step "Configurando diretório de instalação..."
  if [[ -d "$INSTALL_PATH" ]]; then
    warn "Diretório $INSTALL_PATH já existe. Atualizando..."
    cd "$INSTALL_PATH"
    git pull || true
  else
    info "Instalando em $INSTALL_PATH..."
    mkdir -p "$INSTALL_PATH"
    if command -v git &>/dev/null; then
      git clone "$REPO_URL" "$INSTALL_PATH"
    else
      # Fallback if git is not installed (will install git later and retry or assume current dir)
      warn "Git não encontrado. Tentando instalar dependências primeiro..."
    fi
  fi
  # Se o script foi movido, executa a partir do novo local
  if [[ -f "$INSTALL_PATH/install.sh" ]]; then
    cd "$INSTALL_PATH"
  fi
fi

# --- Dependency Installation ---
install_pkg() {
  local PKG="$1"
  case "$PM" in
    apt)    apt-get install -y -q "$PKG" >/dev/null 2>&1 ;;
    pacman) pacman -S --noconfirm --needed "$PKG" >/dev/null 2>&1 ;;
    dnf)    dnf install -y -q "$PKG" >/dev/null 2>&1 ;;
    zypper) zypper install -y "$PKG" >/dev/null 2>&1 ;;
  esac
}

step "Atualizando repositórios..."
case "$PM" in
  apt)    apt-get update -qq ;;
  pacman) pacman -Sy --noconfirm >/dev/null 2>&1 ;;
  dnf)    dnf check-update -q || true ;;
  zypper) zypper refresh -q ;;
esac
ok "Repositórios atualizados"

step "Instalando dependências de sistema..."
DEPS=(git curl python3 python3-pip chromium-browser btop playerctl)
[[ "$PM" == "pacman" ]] && DEPS=(git curl python python-pip chromium btop playerctl)

for pkg in "${DEPS[@]}"; do
  install_pkg "$pkg" && ok "$pkg instalado" || warn "Falha ao instalar $pkg"
done

# --- Node.js ---
step "Verificando Node.js..."
if ! command -v node &>/dev/null; then
  info "Instalando Node.js..."
  case "$PM" in
    apt)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y nodejs
      ;;
    *)
      install_pkg nodejs
      [[ "$PM" == "pacman" ]] && install_pkg npm
      ;;
  esac
fi
ok "Node.js $(node -v)"

# --- Project Setup ---
step "Instalando dependências do projeto..."
cd "$INSTALL_PATH"

info "Frontend (npm)..."
npm install --silent
ok "NPM concluído"

info "Backend (pip)..."
pip3 install -r backend/requirements.txt --break-system-packages 2>/dev/null || \
pip3 install -r backend/requirements.txt 2>/dev/null
ok "PIP concluído"

# --- Build ---
step "Compilando frontend..."
npm run build >/dev/null
ok "Build finalizado (dist/)"

# --- Configuration ---
step "Configurando ambiente..."
if [[ ! -f "backend/.env" ]]; then
  cat > "backend/.env" << EOF
FLASK_ENV=production
FLASK_PORT=5174
FRONTEND_PORT=5173
LAUNCHER_NATIVE_KB=auto
EOF
  ok ".env criado"
fi

# --- Exec Scripts ---
mkdir -p deploy
cat > deploy/start-backend.sh << EOF
#!/usr/bin/env bash
cd "$INSTALL_PATH/backend"
exec python3 server.py
EOF

cat > deploy/start-frontend.sh << EOF
#!/usr/bin/env bash
cd "$INSTALL_PATH"
exec npx serve dist -p 5173 --no-clipboard
EOF

cat > deploy/start-kiosk.sh << EOF
#!/usr/bin/env bash
sleep 5
xset s off -dpms 2>/dev/null || true
BROWSER=\$(command -v chromium-browser || command -v chromium || command -v google-chrome)
exec \$BROWSER --kiosk --app=http://localhost:5173 --no-first-run --disable-infobars 2>/dev/null
EOF
chmod +x deploy/*.sh
ok "Scripts de execução criados"

# --- Autostart Systemd ---
if $AUTOSTART; then
  step "Configurando Autostart (Systemd)..."
  USER_NAME=$(logname || echo $SUDO_USER || echo $USER)
  
  # Backend Service
  cat > /etc/systemd/system/martinos-backend.service << EOF
[Unit]
Description=MartinsOS Backend
After=network.target

[Service]
User=$USER_NAME
WorkingDirectory=$INSTALL_PATH/backend
ExecStart=/usr/bin/python3 $INSTALL_PATH/backend/server.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

  # Frontend Service
  cat > /etc/systemd/system/martinos-frontend.service << EOF
[Unit]
Description=MartinsOS Frontend
After=martinos-backend.service

[Service]
User=$USER_NAME
WorkingDirectory=$INSTALL_PATH
ExecStart=$(command -v npx) serve dist -p 5173 --no-clipboard
Restart=always

[Install]
WantedBy=multi-user.target
EOF

  # Kiosk Service (Requires GUI)
  cat > /etc/systemd/system/martinos-kiosk.service << EOF
[Unit]
Description=MartinsOS Kiosk UI
After=martinos-frontend.service graphical.target

[Service]
User=$USER_NAME
Environment=DISPLAY=:0
ExecStart=$INSTALL_PATH/deploy/start-kiosk.sh
Restart=on-failure

[Install]
WantedBy=graphical.target
EOF

  systemctl daemon-reload
  systemctl enable martinos-backend martinos-frontend martinos-kiosk
  ok "Serviços habilitados e configurados"
fi

# --- Final Message ---
echo -e "\n${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  ✅  MartinsOS Instalado com Sucesso em $INSTALL_PATH${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n  Para iniciar agora:"
echo -e "  ${CYAN}sudo systemctl start martinos-backend martinos-frontend martinos-kiosk${NC}"
echo -e "\n  O sistema iniciará automaticamente no próximo reboot."
echo -e "  Acesse em: ${YELLOW}http://localhost:5173${NC}\n"
$INSTALL_DIR/backend/server.py
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
