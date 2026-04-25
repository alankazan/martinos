#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  MartinsOS — Instalador Automático para Linux
#  Uso: ./install.sh [--autostart]
# ─────────────────────────────────────────────────────────────────────────────

set -e

BLUE='\033[0;34m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

INSTALL_DIR="$(cd "$(dirname "$0")" && pwd)"
USER_HOME="$HOME"
AUTOSTART=false

for arg in "$@"; do
  [[ "$arg" == "--autostart" ]] && AUTOSTART=true
done

banner() {
  echo -e "${BLUE}"
  echo "  ███╗   ███╗ █████╗ ██████╗ ████████╗██╗███╗   ██╗███████╗ ██████╗ ███████╗"
  echo "  ████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║████╗  ██║██╔════╝██╔═══██╗██╔════╝"
  echo "  ██╔████╔██║███████║██████╔╝   ██║   ██║██╔██╗ ██║███████╗██║   ██║███████╗"
  echo "  ██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██║██║╚██╗██║╚════██║██║   ██║╚════██║"
  echo "  ██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ██║██║ ╚████║███████║╚██████╔╝███████║"
  echo "  ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝"
  echo -e "${NC}"
  echo -e "${GREEN}  Instalador MartinsOS v1.0${NC}\n"
}

step() { echo -e "\n${YELLOW}▶ $1${NC}"; }
ok()   { echo -e "  ${GREEN}✓ $1${NC}"; }
err()  { echo -e "  ${RED}✗ $1${NC}"; exit 1; }

banner

# ── Verificações ─────────────────────────────────────────────────────────────
step "Verificando dependências..."

command -v node  >/dev/null || err "Node.js não encontrado. Instale com: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
command -v npm   >/dev/null || err "npm não encontrado."
command -v python3 >/dev/null || err "Python 3 não encontrado."
command -v pip3  >/dev/null || err "pip3 não encontrado. Instale com: sudo apt install python3-pip"

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
[[ "$NODE_VER" -lt 18 ]] && err "Node.js 18+ necessário. Versão atual: $(node -v)"

ok "Node.js $(node -v)"
ok "Python $(python3 --version)"

# ── Frontend ─────────────────────────────────────────────────────────────────
step "Instalando dependências do frontend..."
cd "$INSTALL_DIR"
npm install --silent
ok "npm install concluído"

step "Compilando frontend..."
npm run build
ok "Build concluído → dist/"

# ── Backend ───────────────────────────────────────────────────────────────────
step "Instalando dependências do backend..."
pip3 install -r backend/requirements.txt -q
ok "Dependências Python instaladas"

# ── Variáveis de ambiente ─────────────────────────────────────────────────────
step "Criando arquivo de configuração .env..."
if [[ ! -f "$INSTALL_DIR/backend/.env" ]]; then
  cat > "$INSTALL_DIR/backend/.env" << EOF
FLASK_ENV=production
FLASK_PORT=5174
FRONTEND_PORT=5173
LAUNCHER_NATIVE_KB=auto
EOF
  ok ".env criado"
else
  ok ".env já existe, pulando"
fi

# ── Scripts de start ──────────────────────────────────────────────────────────
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

cat > "$INSTALL_DIR/deploy/start-kiosk.sh" << EOF
#!/usr/bin/env bash
# Aguarda o frontend estar disponível
sleep 5

# Desativa screensaver
xset s off -dpms 2>/dev/null || true

# Esconde cursor após inatividade
command -v unclutter >/dev/null && unclutter -idle 3 &

# Abre Chromium em modo kiosk
exec chromium-browser \\
  --kiosk \\
  --no-first-run \\
  --disable-infobars \\
  --disable-session-crashed-bubble \\
  --disable-restore-session-state \\
  --disable-translate \\
  --noerrdialogs \\
  --check-for-update-interval=31536000 \\
  --app=http://localhost:5173 \\
  2>/dev/null
EOF

chmod +x "$INSTALL_DIR/deploy/"*.sh
ok "Scripts de execução criados"

# ── Autostart ─────────────────────────────────────────────────────────────────
if $AUTOSTART; then
  step "Configurando autostart via systemd..."

  # Backend service
  sudo tee /etc/systemd/system/martinos-backend.service > /dev/null << EOF
[Unit]
Description=MartinsOS Backend (Flask)
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/python3 $INSTALL_DIR/backend/server.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  # Frontend service
  sudo tee /etc/systemd/system/martinos-frontend.service > /dev/null << EOF
[Unit]
Description=MartinsOS Frontend (serve)
After=network.target martinos-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/npx serve dist -p 5173 --no-clipboard
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

  # Kiosk service (inicia junto com o display)
  sudo tee /etc/systemd/system/martinos-kiosk.service > /dev/null << EOF
[Unit]
Description=MartinsOS Kiosk (Chromium)
After=graphical.target martinos-frontend.service
Wants=graphical.target

[Service]
Type=simple
User=$USER
Environment=DISPLAY=:0
Environment=XAUTHORITY=$USER_HOME/.Xauthority
ExecStart=$INSTALL_DIR/deploy/start-kiosk.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=graphical.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable martinos-backend martinos-frontend martinos-kiosk
  ok "Serviços systemd habilitados"
  echo -e "\n  ${YELLOW}Reinicie o sistema para ativar o modo kiosk.${NC}"
fi

# ── Finalização ───────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✅  MartinsOS instalado com sucesso!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Para iniciar manualmente:"
echo -e "  ${BLUE}cd $INSTALL_DIR${NC}"
echo -e "  ${BLUE}./deploy/start-backend.sh &${NC}"
echo -e "  ${BLUE}./deploy/start-frontend.sh &${NC}"
echo ""
echo -e "  Acesse: ${YELLOW}http://localhost:5173${NC}"
echo ""
if $AUTOSTART; then
  echo -e "  Autostart: ${GREEN}habilitado${NC} (reinicie para ativar)"
else
  echo -e "  Para habilitar autostart: ${YELLOW}./install.sh --autostart${NC}"
fi
echo ""
