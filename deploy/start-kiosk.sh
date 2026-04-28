#!/usr/bin/env bash
# Espera o sistema e o backend carregarem
sleep 5

# Desativa proteção de tela e economia de energia
xset s off -dpms 2>/dev/null || true

# Detecta o browser disponível
BROWSER=$(command -v chromium-browser || command -v chromium || command -v google-chrome)

if [ -z "$BROWSER" ]; then
    echo "Nenhum navegador compatível encontrado (Chromium/Chrome)."
    exit 1
fi

# Inicia o navegador em modo kiosk apontando para o backend (que serve o frontend)
exec $BROWSER --kiosk --app=http://localhost:5174 --no-first-run --disable-infobars --autoplay-policy=no-user-gesture-required 2>/dev/null
