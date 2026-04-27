export type Theme = {
  bg: string;
  surface: string;
  card: string;
  cardHover?: string;
  border: string;
  accent: string;
  accentDim: string;
  accentGlow?: string;
  text: string;
  textDim: string;
  textMuted: string;
  green?: string;
  red?: string;
  orange?: string;
  yellow?: string;
  blue?: string;
  name: string;
  icon?: string;
};

export type AppSource = 
  | "native" 
  | "flatpak" 
  | "snap" 
  | "docker" 
  | "podman" 
  | "appimage" 
  | "manual" 
  | "youtube" 
  | "streaming" 
  | "webapp";

export type AppEntry = {
  id: string;
  name: string;
  icon: string;
  icon_path?: string;
  source: AppSource;
  category: string;
  exec?: string;
  openUrl?: string;
  webUrl?: string;
  running?: boolean;
  pinned?: boolean;
  lastUsed?: number;
  bgColor?: string;
  iconColor?: string;
  openMode?: "iframe" | "kiosk" | "tab";
  controllerPassthrough?: boolean;
  alreadyAdded?: boolean; // temporary for scan results
};

export type ActionCategory = "Navegação" | "Apps" | "Sistema" | "Filtros" | "Mídia" | "Docker" | "Utilitários" | "Ações";

export type ControlAction = {
  label: string;
  icon: string;
  group: ActionCategory;
};

export type ButtonConfig = {
  id: string;
  label: string;
  key: string;
  color: string;
  shape: "circle" | "dpad" | "trigger" | "small" | "stick" | "home";
};

export type ControllerMapping = Record<string, string>;

export type HUDEvent = {
  btnId: string;
  actionId: string;
};

export type ContainerNotifEvent = {
  name: string;
  icon: string;
  running: boolean;
};
