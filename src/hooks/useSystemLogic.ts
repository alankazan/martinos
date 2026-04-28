import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLauncherStore } from "../store/useLauncherStore";
import { useShallow } from "zustand/shallow";
import { CATEGORIES, IDLE_MS } from "../constants/launcher";
import { resolveIcon, isElectron } from "../utils/system";
import { useSound } from "./useSound";
import { AppEntry, HUDEvent, ContainerNotifEvent } from "../types/launcher";

export function useSystemLogic() {
  const {
    theme, themeKey, apps, search, focusRow, focusCol, screensaver, minimized, volLevel, volMuted, mapping, booted,
    setTheme, setApps, setMapping, setSearch, setFocus, setScreensaver, setMinimized, setVolume, updateApp, addApp, setBooted
  } = useLauncherStore(useShallow(s => ({
    theme: s.theme, themeKey: s.themeKey, apps: s.apps, search: s.search, 
    focusRow: s.focusRow, focusCol: s.focusCol, screensaver: s.screensaver, 
    minimized: s.minimized, volLevel: s.volLevel, volMuted: s.volMuted, 
    mapping: s.mapping, booted: s.booted,
    setTheme: s.setTheme, setApps: s.setApps, setMapping: s.setMapping, setSearch: s.setSearch, 
    setFocus: s.setFocus, setScreensaver: s.setScreensaver, setMinimized: s.setMinimized, 
    setVolume: s.setVolume, updateApp: s.updateApp, addApp: s.addApp, setBooted: s.setBooted
  })));

  const { playSound } = useSound();

  const [editingApp, setEditing] = useState<AppEntry | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeWebApp, setActiveWebApp] = useState<AppEntry | null>(null);
  const [launchToast, setToast] = useState<AppEntry | null>(null);
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "done">("idle");
  const [showCtrl, setShowCtrl] = useState(false);
  const [hudEvent, setHudEvent] = useState<HUDEvent | null>(null);
  const [containerNotif, setContainerNotif] = useState<ContainerNotifEvent | null>(null);
  const [scanPicker, setScanPicker] = useState<AppEntry[] | null>(null);
  const [showPower, setShowPower] = useState(false);
  const [showQuickSettings, setShowQuickSettings] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [sysInfo, setSysInfo] = useState({ user: "...", hostname: "...", ip: "127.0.0.1" });

  const hudTimer = useRef<any>(null);
  const idleTimer = useRef<any>(null);
  const appsRef = useRef(apps);
  const focusRowRef = useRef(focusRow);
  const focusColRef = useRef(focusCol);

  useEffect(() => { appsRef.current = apps; }, [apps]);
  useEffect(() => { focusRowRef.current = focusRow; }, [focusRow]);
  useEffect(() => { focusColRef.current = focusCol; }, [focusCol]);

  // Screensaver idle
  const resetIdle = useCallback(() => {
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setScreensaver(true), IDLE_MS);
  }, [setScreensaver]);

  useEffect(() => {
    resetIdle();
    const h = () => resetIdle();
    const events = ["keydown", "mousemove", "mousedown", "touchstart"];
    events.forEach(e => window.addEventListener(e, h));
    return () => {
      events.forEach(e => window.removeEventListener(e, h));
      clearTimeout(idleTimer.current);
    };
  }, [resetIdle]);

  // Docker polling
  const pollDocker = useCallback(() => {
    fetch("/api/docker")
      .then(r => r.json())
      .then(containers => {
        setApps(prev => prev.map(app => {
          if (app.source !== "docker" && app.source !== "podman") return app;
          const match = containers.find((c: any) =>
            c.name.replace(/^\//, "").toLowerCase() === app.name.toLowerCase()
          );
          if (!match) return app;
          if (match.running !== app.running) {
            setContainerNotif({ name: app.name, icon: app.icon, running: match.running });
            setTimeout(() => setContainerNotif(null), 4000);
          }
          return { ...app, running: match.running };
        }));
      })
      .catch(() => { });
  }, [setApps]);

  useEffect(() => { pollDocker(); }, [pollDocker]);

  // Scan
  const runScan = useCallback(() => {
    setScanStatus("scanning");
    Promise.all([
      fetch("/api/scan").then(r => r.json()).catch(() => []),
      fetch("/api/docker").then(r => r.json()).catch(() => []),
    ]).then(([appList, containers]) => {
      const prev = appsRef.current;
      const allApps = appList.map((a: any) => {
        const id = `native_${a.name.toLowerCase().replace(/\s+/g, "_").replace(/\W+/g, "")}`;
        const existing = prev.find(p => p.id === id);
        return existing
          ? { ...existing, alreadyAdded: true }
          : {
            id, name: a.name, exec: a.exec, source: "native",
            category: a.category || "Utilitários", icon: a.icon, icon_path: a.icon_path,
            running: false, pinned: false, bgColor: "#0a0a14", iconColor: "#a78bfa",
            alreadyAdded: false
          };
      });

      const allContainers = containers.map((c: any) => {
        const cleanName = c.name.replace(/^\//, "");
        const id = `docker_${cleanName.toLowerCase().replace(/\W+/g, "_")}`;
        const existing = prev.find(p => p.id === id);
        return existing
          ? { ...existing, running: c.running, alreadyAdded: true }
          : {
            id, name: cleanName, source: "docker", category: "Docker",
            icon: resolveIcon(cleanName), running: c.running, pinned: false,
            bgColor: "#001218", iconColor: "#13BEF9", alreadyAdded: false
          };
      });

      setScanStatus("done");
      setScanPicker([...allApps, ...allContainers]);
    }).catch(() => setScanStatus("done"));
  }, []);

  useEffect(() => { if (apps.length === 0) runScan(); }, []);

  // Rows memo
  const rows = useMemo(() => {
    const q = search.toLowerCase();
    const vis = apps.filter(a => !q || a.name.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q));
    const result: { name: string, apps: AppEntry[] }[] = [];
    const pinned = vis.filter(a => a.pinned);
    if (pinned.length) result.push({ name: "Fixados", apps: pinned });
    if (!q) {
      const rec = [...vis].filter(a => a.lastUsed).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0)).slice(0, 10);
      if (rec.length) result.push({ name: "Recentes", apps: rec });
    }
    for (const cat of CATEGORIES.filter(c => c !== "Todos" && c !== "Fixados" && c !== "Recentes")) {
      const ca = vis.filter(a => a.category === cat);
      if (ca.length) result.push({ name: cat, apps: ca });
    }
    const known = new Set(CATEGORIES);
    const other = vis.filter(a => !known.has(a.category));
    if (other.length) result.push({ name: "Outros", apps: other });
    return result;
  }, [apps, search]);

  useEffect(() => {
    const currentMaxRow = Math.max(rows.length - 1, 0);
    const newRow = Math.min(focusRow, currentMaxRow);
    const currentMaxCol = Math.max((rows[newRow]?.apps?.length ?? 1) - 1, 0);
    const newCol = Math.min(focusCol, currentMaxCol);
    if (newRow !== focusRow || newCol !== focusCol) {
      setFocus(newRow, newCol);
      playSound("focus");
    }
  }, [rows, focusRow, focusCol, setFocus, playSound]);

  const focusedApp = rows[focusRow]?.apps?.[focusCol] ?? null;

  useEffect(() => {
    Promise.all([
      fetch("/api/volume/level").then(r => r.json()).then(d => setVolume(d.level, d.muted)).catch(() => { }),
      fetch("/api/sysinfo").then(r => r.json()).then(d => setSysInfo({ user: d.user, hostname: d.hostname, ip: d.ip || "127.0.0.1" })).catch(() => { })
    ]).then(() => {
      setTimeout(() => setBooted(true), 800);
    });
  }, [setVolume, setBooted]);

  const showHud = (btnId: string, actionId: string) => {
    setHudEvent({ btnId, actionId });
    clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHudEvent(null), 1400);
  };

  const handleLaunch = useCallback((app: AppEntry) => {
    if (!app) return;
    updateApp({ ...app, lastUsed: Date.now() });
    if (app.source === "webapp" && (app.openMode === "iframe" || !app.openMode)) {
      playSound("launch");
      setActiveWebApp(app);
      return;
    }
    playSound("launch");
    setToast(app);
    if (app.exec || app.openUrl || app.webUrl) {
      fetch("/api/launch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exec: app.exec || "", url: app.webUrl || app.openUrl || "", openMode: app.openMode || "tab" })
      }).catch(() => { });
    }
  }, [updateApp, playSound]);

  const handlePowerOff = useCallback(() => {
    if (isElectron) window.electronAPI.powerOff();
    else fetch("/api/poweroff", { method: "POST" });
  }, []);

  const handleReboot = useCallback(() => {
    if (isElectron) window.electronAPI.reboot();
    else fetch("/api/reboot", { method: "POST" });
  }, []);

  const handleQuit = useCallback(() => {
    if (isElectron) window.electronAPI.quit();
  }, []);

  return {
    theme, themeKey, apps, search, focusRow, focusCol, screensaver, minimized, volLevel, volMuted, mapping, booted,
    setTheme, setApps, setMapping, setSearch, setFocus, setScreensaver, setMinimized, setVolume, updateApp, addApp, setBooted,
    editingApp, setEditing, showAdd, setShowAdd, activeWebApp, setActiveWebApp, launchToast, setToast, scanStatus, runScan,
    showCtrl, setShowCtrl, hudEvent, containerNotif, scanPicker, setScanPicker, showPower, setShowPower, showQuickSettings, setShowQuickSettings,
    showUpdate, setShowUpdate, showStore, setShowStore, showQr, setShowQr, showSystemSettings, setShowSystemSettings, sysInfo,
    rows, focusedApp, showHud, handleLaunch, handlePowerOff, handleReboot, handleQuit, focusRowRef, focusColRef
  };
}
