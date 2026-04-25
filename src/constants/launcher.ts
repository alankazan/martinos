import { ControllerMapping, ControlAction } from "../types/launcher";

export const IDLE_MS = 3 * 60 * 1000; // 3 minutes

export const CATEGORIES = [
  "Todos", "Fixados", "Recentes", "Jogos", "Mídias", "Navegadores",
  "Ferramentas", "Docker", "Web Apps", "Utilitários", "Outros"
];

export const ICON_MAP: [RegExp, string][] = [
  [/steam/i, "🎮"], [/firefox/i, "🦊"], [/chrome|chromium/i, "🌐"],
  [/spotify/i, "🎵"], [/vlc/i, "🎬"], [/docker/i, "🐳"],
  [/code|vscode/i, "💻"], [/terminal|konsole|alacritty|kitty/i, "🖥️"],
  [/gimp/i, "🖼️"], [/discord/i, "💬"], [/telegram/i, "✈️"],
  [/plex/i, "🎞️"], [/jellyfin/i, "🍇"], [/emby/i, "🎭"],
  [/nginx/i, "🌐"], [/postgres/i, "🐘"], [/redis/i, "🔴"],
  [/mysql|mariadb/i, "🗃️"], [/mongo/i, "🍃"], [/node/i, "💚"],
];

export const SOURCE_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  native: { label: "Native", color: "#a78bfa", bg: "#1e1b4b" },
  docker: { label: "Docker", color: "#22d3ee", bg: "#0e2233" },
  podman: { label: "Podman", color: "#fb923c", bg: "#1c1008" },
  webapp: { label: "Web", color: "#34d399", bg: "#052e16" },
  manual: { label: "Manual", color: "#94a3b8", bg: "#1e293b" },
};

export const WEB_PRESETS = [
  { name: "YouTube", url: "https://youtube.com", icon: "📺" },
  { name: "Twitch", url: "https://twitch.tv", icon: "🎮" },
  { name: "Netflix", url: "https://netflix.com", icon: "🎬" },
  { name: "Spotify", url: "https://open.spotify.com", icon: "🎵" },
  { name: "GitHub", url: "https://github.com", icon: "🐙" },
  { name: "Grafana", url: "http://localhost:3000", icon: "📊" },
  { name: "Portainer", url: "http://localhost:9000", icon: "🐳" },
];

export const THEMES = {
  cosmos: {
    name: "Cosmos",
    bg: "#07070e",
    surface: "#11111d",
    card: "#18182a",
    accent: "#7e57c2",
    accentDim: "#5e35b1",
    text: "#ffffff",
    textDim: "#b0b0cc",
    textMuted: "#666680",
    border: "rgba(126, 87, 194, 0.2)",
  },
  ocean: {
    name: "Ocean",
    bg: "#050a10",
    surface: "#0a141e",
    card: "#101e2d",
    accent: "#00b0ff",
    accentDim: "#0081cb",
    text: "#ffffff",
    textDim: "#a0b0c0",
    textMuted: "#506070",
    border: "rgba(0, 176, 255, 0.2)",
  },
  ember: {
    name: "Ember",
    bg: "#0d0505",
    surface: "#1a0a0a",
    card: "#261212",
    accent: "#ff5252",
    accentDim: "#d32f2f",
    text: "#ffffff",
    textDim: "#c0a0a0",
    textMuted: "#705050",
    border: "rgba(255, 82, 82, 0.2)",
  }
};

export const ACTIONS: Record<string, ControlAction> = {
  nav_up: { label: "Navegar ↑", icon: "⬆️", group: "Navegação" },
  nav_down: { label: "Navegar ↓", icon: "⬇️", group: "Navegação" },
  nav_left: { label: "Navegar ←", icon: "⬅️", group: "Navegação" },
  nav_right: { label: "Navegar →", icon: "➡️", group: "Navegação" },
  confirm: { label: "Confirmar/Abrir", icon: "✅", group: "Ações" },
  back: { label: "Voltar", icon: "↩️", group: "Ações" },
  edit_app: { label: "Editar App", icon: "✏️", group: "Ações" },
  pin_app: { label: "Fixar / Desafixar", icon: "📌", group: "Ações" },
  vol_up: { label: "Aumentar Volume", icon: "🔊", group: "Mídia" },
  vol_down: { label: "Diminuir Volume", icon: "🔉", group: "Mídia" },
  vol_mute: { label: "Mudar Mudo", icon: "🔇", group: "Mídia" },
  play_pause: { label: "Play / Pause", icon: "⏯️", group: "Mídia" },
  next_media: { label: "Próxima Mídia", icon: "⏭️", group: "Mídia" },
  prev_media: { label: "Mídia Anterior", icon: "⏮️", group: "Mídia" },
  stop_media: { label: "Parar Mídia", icon: "⏹️", group: "Mídia" },
  start_container: { label: "Iniciar Container", icon: "▶️", group: "Docker" },
  stop_container: { label: "Parar Container", icon: "⏹️", group: "Docker" },
  restart_cont: { label: "Reiniciar Container", icon: "🔁", group: "Docker" },
  docker_logs: { label: "Ver Logs Docker", icon: "📜", group: "Docker" },
  screenshot: { label: "Screenshot", icon: "📸", group: "Utilitários" },
  open_terminal: { label: "Abrir Terminal", icon: "💻", group: "Utilitários" },
  reboot: { label: "Reiniciar sistema", icon: "🔃", group: "Utilitários" },
  power_off: { label: "Desligar sistema", icon: "🔌", group: "Utilitários" },
  toggle_theme: { label: "Trocar Tema", icon: "🎨", group: "Sistema" },
  clear_recent: { label: "Limpar Recentes", icon: "🧹", group: "Apps" },
  app_settings: { label: "Config. do App", icon: "⚙️", group: "Apps" },
  sys_monitor: { label: "Monitor de Sist.", icon: "📊", group: "Sistema" },
  none: { label: "(sem ação)", icon: "—", group: "Utilitários" },
};

export const BUTTONS = [
  { id: "0", label: "A", x: 600, y: 290, labelX: 740, labelY: 450, color: "#4ade80" },
  { id: "1", label: "B", x: 650, y: 240, labelX: 740, labelY: 350, color: "#f87171" },
  { id: "2", label: "X", x: 550, y: 240, labelX: 740, labelY: 250, color: "#60a5fa" },
  { id: "3", label: "Y", x: 600, y: 190, labelX: 740, labelY: 150, color: "#facc15" },
  { id: "4", label: "LB", x: 220, y: 120, labelX: 60, labelY: 120, color: "#94a3b8" },
  { id: "5", label: "RB", x: 580, y: 120, labelX: 740, labelY: 50, color: "#94a3b8" },
  { id: "6", label: "LT", x: 180, y: 80, labelX: 60, labelY: 50, color: "#94a3b8" },
  { id: "7", label: "RT", x: 620, y: 80, labelX: 740, labelY: 100, color: "#94a3b8" },
  { id: "8", label: "View", x: 350, y: 240, labelX: 60, labelY: 200, color: "#94a3b8" },
  { id: "9", label: "Menu", x: 450, y: 240, labelX: 740, labelY: 200, color: "#94a3b8" },
  { id: "10", label: "L3", x: 280, y: 240, labelX: 60, labelY: 280, color: "#38bdf8" },
  { id: "11", label: "R3", x: 520, y: 380, labelX: 740, labelY: 500, color: "#38bdf8" },
  { id: "12", label: "UP", x: 360, y: 340, labelX: 60, labelY: 350, color: "#fb923c" },
  { id: "13", label: "DOWN", x: 360, y: 420, labelX: 60, labelY: 500, color: "#fb923c" },
  { id: "14", label: "LEFT", x: 320, y: 380, labelX: 60, labelY: 420, color: "#fb923c" },
  { id: "15", label: "RIGHT", x: 400, y: 380, labelX: 200, labelY: 520, color: "#fb923c" },
];

export const DEFAULT_MAPPING: ControllerMapping = {
  "0": "confirm",
  "1": "back",
  "2": "edit_app",
  "3": "pin_app",
  "4": "vol_down",
  "5": "vol_up",
  "6": "prev_media",
  "7": "next_media",
  "8": "open_terminal",
  "9": "app_settings",
  "10": "none",
  "11": "none",
  "12": "nav_up",
  "13": "nav_down",
  "14": "nav_left",
  "15": "nav_right",
};

export const GAMEPAD_BTN_MAP: Record<number, string> = {
  0: "0", 1: "1", 2: "2", 3: "3",
  4: "4", 5: "5", 6: "6", 7: "7",
  8: "8", 9: "9", 10: "10", 11: "11",
  12: "12", 13: "13", 14: "14", 15: "15"
};
