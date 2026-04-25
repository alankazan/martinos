import { create } from "zustand";
import { AppEntry, Theme, ControllerMapping } from "../types/launcher";
import { THEMES, DEFAULT_MAPPING } from "../constants/launcher";
import { loadLS, saveLS } from "../utils/storage";

interface LauncherState {
  themeKey: string;
  theme: Theme;
  apps: AppEntry[];
  mapping: ControllerMapping;
  search: string;
  focusRow: number;
  focusCol: number;
  screensaver: boolean;
  minimized: boolean;
  volLevel: number;
  volMuted: boolean;

  // Actions
  setTheme: (key: string) => void;
  setApps: (apps: AppEntry[] | ((prev: AppEntry[]) => AppEntry[])) => void;
  setMapping: (mapping: ControllerMapping) => void;
  setSearch: (search: string) => void;
  setFocus: (row: number, col: number) => void;
  setScreensaver: (open: boolean) => void;
  setMinimized: (min: boolean) => void;
  setVolume: (level: number, muted: boolean) => void;
  updateApp: (updatedApp: AppEntry) => void;
  addApp: (newApp: AppEntry) => void;
  removeApp: (appId: string) => void;
}

export const useLauncherStore = create<LauncherState>((set) => ({
  themeKey: loadLS("ml_theme", "cosmos"),
  theme: THEMES[loadLS("ml_theme", "cosmos")] || THEMES.cosmos,
  apps: loadLS("ml_apps", []),
  mapping: loadLS("ml_mapping", DEFAULT_MAPPING),
  search: "",
  focusRow: 0,
  focusCol: 0,
  screensaver: false,
  minimized: false,
  volLevel: 0,
  volMuted: false,

  setTheme: (key) => {
    saveLS("ml_theme", key);
    set({ themeKey: key, theme: THEMES[key] || THEMES.cosmos });
  },
  setApps: (appsOrFn) => {
    set((state) => {
      const nextApps = typeof appsOrFn === "function" ? appsOrFn(state.apps) : appsOrFn;
      saveLS("ml_apps", nextApps);
      return { apps: nextApps };
    });
  },
  setMapping: (mapping) => {
    saveLS("ml_mapping", mapping);
    set({ mapping });
  },
  setSearch: (search) => set({ search, focusRow: 0, focusCol: 0 }),
  setFocus: (row, col) => set({ focusRow: row, focusCol: col }),
  setScreensaver: (open) => set({ screensaver: open }),
  setMinimized: (min) => set({ minimized: min }),
  setVolume: (level, muted) => set({ volLevel: level, volMuted: muted }),
  updateApp: (updatedApp) => set((state) => {
    const nextApps = state.apps.map(a => a.id === updatedApp.id ? updatedApp : a);
    saveLS("ml_apps", nextApps);
    return { apps: nextApps };
  }),
  addApp: (newApp) => set((state) => {
    const nextApps = [...state.apps, newApp];
    saveLS("ml_apps", nextApps);
    return { apps: nextApps };
  }),
  removeApp: (appId) => set((state) => {
    const nextApps = state.apps.filter(a => a.id !== appId);
    saveLS("ml_apps", nextApps);
    return { apps: nextApps };
  }),
}));
