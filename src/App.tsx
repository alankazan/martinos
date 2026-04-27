import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Volume2, VolumeX, Play, SkipBack, SkipForward,
  Plus, Gamepad2, Palette, RefreshCw, Monitor
} from "lucide-react";

import { useLauncherStore } from "./store/useLauncherStore";
import { useShallow } from "zustand/shallow";
import { THEMES, BUTTONS, ACTIONS, CATEGORIES, IDLE_MS } from "./constants/launcher";
import { resolveIcon, NATIVE_KB, isElectron } from "./utils/system";
import { useGamepad } from "./hooks/useGamepad";
import { useSocket } from "./hooks/useSocket";
import { useSound } from "./hooks/useSound";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { PowerModal } from "./components/Modals/PowerModal";
import { QuickSettings } from "./components/QuickSettings";
import { UpdateModal } from "./components/Modals/UpdateModal";
import { Badge } from "./components/Badge";
import { StatusDot } from "./components/StatusDot";
import { SmartInput } from "./components/SmartInput";
import { HeroPanel } from "./components/HeroPanel";
import { CategoryRow } from "./components/CategoryRow";
import { Screensaver } from "./components/Screensaver";
import { WebAppViewer } from "./components/WebAppViewer";
import { AddAppModal } from "./components/Modals/AddAppModal";
import { EditModal } from "./components/Modals/EditModal";
import { AddWebAppModal } from "./components/Modals/AddWebAppModal";
import { ScanPickerModal } from "./components/Modals/ScanPickerModal";
import { ControllerConfig } from "./components/Modals/ControllerConfig";
import { ButtonHUD } from "./components/HUD/ButtonHUD";
import { ContainerNotif } from "./components/HUD/ContainerNotif";
import { LaunchToast } from "./components/HUD/LaunchToast";
import { KbSourceBadge } from "./components/HUD/KbSourceBadge";
import { AmbientBackground } from "./components/AmbientBackground";
import { Clock } from "./components/Clock";

import { AppEntry, HUDEvent, ContainerNotifEvent } from "./types/launcher";

const ThemeStyle: React.FC<{ theme: any }> = ({ theme: T }) => (
  <style>{`
    :root {
      --bg:${T.bg};--surface:${T.surface};--card:${T.card};--card-hover:${T.cardHover};
      --border:${T.border};--accent:${T.accent};--accent-dim:${T.accentDim};
      --accent-glow:${T.accentGlow};--text:${T.text};--text-dim:${T.textDim};
      --text-muted:${T.textMuted};--green:${T.green};--red:${T.red};
      --orange:${T.orange};--yellow:${T.yellow};--blue:${T.blue};
      font-family:'Outfit','Trebuchet MS',sans-serif;
    }
    *{box-sizing:border-box;}
    body{margin:0;overflow:hidden;background:var(--bg);}
    @keyframes kbUp  {from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    @keyframes hudIn {from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse {0%,100%{opacity:1}50%{opacity:.3}}
    @keyframes spin  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
    @keyframes blink {0%,100%{opacity:1}50%{opacity:0}}
    ::-webkit-scrollbar{width:0;height:0;}
  `}</style>
);

export default function App() {
  const theme = useLauncherStore(state => state.theme);
  const themeKey = useLauncherStore(state => state.themeKey);
  const apps = useLauncherStore(state => state.apps);
  const search = useLauncherStore(state => state.search);
  const focusRow = useLauncherStore(state => state.focusRow);
  const focusCol = useLauncherStore(state => state.focusCol);
  const screensaver = useLauncherStore(state => state.screensaver);
  const minimized = useLauncherStore(state => state.minimized);
  const volLevel = useLauncherStore(state => state.volLevel);
  const volMuted = useLauncherStore(state => state.volMuted);
  const mapping = useLauncherStore(state => state.mapping);
  const booted = useLauncherStore(state => state.booted);

  const {
    setTheme, setApps, setMapping, setSearch, setFocus, setScreensaver, setMinimized, setVolume, updateApp, addApp, setBooted
  } = useLauncherStore(useShallow(s => ({
    setTheme: s.setTheme, setApps: s.setApps, setMapping: s.setMapping, setSearch: s.setSearch, 
    setFocus: s.setFocus, setScreensaver: s.setScreensaver, setMinimized: s.setMinimized, 
    setVolume: s.setVolume, updateApp: s.updateApp, addApp: s.addApp, setBooted: s.setBooted
  })));

  useSocket();
  const { playSound } = useSound();

  const [editingApp, setEditing] = useState<AppEntry | null>(null);
  const [addingApp, setAdding] = useState(false);
  const [addingWebApp, setAddingWebApp] = useState(false);
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
  const [sysInfo, setSysInfo] = useState({ user: "...", hostname: "..." });

  const hudTimer = useRef<any>(null);
  const idleTimer = useRef<any>(null);
  const searchInputRef = useRef<HTMLDivElement>(null);

  // Refs for callbacks to avoid closure traps
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
    window.addEventListener("keydown", h);
    window.addEventListener("mousemove", h);
    window.addEventListener("mousedown", h);
    return () => {
      window.removeEventListener("keydown", h);
      window.removeEventListener("mousemove", h);
      window.removeEventListener("mousedown", h);
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

  // Initial Docker state
  useEffect(() => {
    pollDocker();
  }, [pollDocker]);

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

  // Initial scan
  useEffect(() => {
    if (apps.length === 0) runScan();
  }, []);

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

  // Initial volume level
  useEffect(() => {
    Promise.all([
      fetch("/api/volume/level").then(r => r.json()).then(d => setVolume(d.level, d.muted)).catch(() => { }),
      fetch("/api/sysinfo").then(r => r.json()).then(d => setSysInfo({ user: d.user, hostname: d.hostname })).catch(() => { })
    ]).then(() => {
      // Small artificial delay for smoothness
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
  }, [updateApp]);
  
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


  const execAction = useCallback((actionId: string) => {
    const rs = rows;
    const fr = focusRowRef.current;
    const fc = focusColRef.current;
    const app = rs[fr]?.apps?.[fc] ?? null;

    switch (actionId) {
      case "nav_up": setFocus(Math.max(fr - 1, 0), 0); break;
      case "nav_down": setFocus(Math.min(fr + 1, rs.length - 1), 0); break;
      case "nav_left": setFocus(fr, Math.max(fc - 1, 0)); break;
      case "nav_right": setFocus(fr, Math.min(fc + 1, (rs[fr]?.apps?.length ?? 1) - 1)); break;
      case "prev_category": setFocus(Math.max(fr - 1, 0), 0); break;
      case "next_category": setFocus(Math.min(fr + 1, rs.length - 1), 0); break;
      case "confirm": case "launch_app": if (app) handleLaunch(app); break;
      case "back": setSearch(""); break;
      case "home": setFocus(0, 0); setSearch(""); break;
      case "edit_app": if (app) setEditing(app); break;
      case "pin_app": if (app) updateApp({ ...app, pinned: !app.pinned }); break;
      case "remove_app": if (app) { useLauncherStore.getState().removeApp(app.id); setFocus(fr, Math.max(fc - 1, 0)); } break;
      case "add_app": setAdding(true); break;
      case "minimize": setMinimized(true); break;
      case "scan_apps": runScan(); break;
      case "open_settings": setShowQuickSettings(true); break;
      case "open_quick_settings": setShowQuickSettings(true); break;
      case "search_focus": searchInputRef.current?.click(); break;
      case "filter_all": setSearch(""); setFocus(0, 0); break;
      case "filter_pinned": { const i = rs.findIndex(r => r.name === "Fixados"); if (i >= 0) setFocus(i, 0); break; }
      case "filter_docker": { const i = rs.findIndex(r => r.name === "Docker"); if (i >= 0) setFocus(i, 0); break; }
      case "volume_up": fetch("/api/volume/up", { method: "POST" }); break;
      case "volume_down": fetch("/api/volume/down", { method: "POST" }); break;
      case "mute": fetch("/api/volume/mute", { method: "POST" }); break;
      case "play_pause": fetch("/api/media/play-pause", { method: "POST" }); break;
      case "media_next": fetch("/api/media/next", { method: "POST" }); break;
      case "media_prev": fetch("/api/media/previous", { method: "POST" }); break;
      case "stop_media": fetch("/api/media/stop", { method: "POST" }); break;
      case "screenshot": fetch("/api/screenshot", { method: "POST" }); break;
      case "open_terminal": fetch("/api/terminal", { method: "POST" }); break;
      case "power_off": setShowPower(true); break;
      case "toggle_theme": {
        playSound("select");
        const keys = Object.keys(THEMES);
        const idx = keys.indexOf(themeKey);
        setTheme(keys[(idx + 1) % keys.length]);
        break;
      }
      case "clear_recent": {
        setApps(prev => prev.map(a => ({ ...a, lastUsed: 0 })));
        break;
      }
      case "app_settings": if (app) setEditing(app); break;
      case "sys_monitor": 
        fetch("/api/launch", { 
          method: "POST", headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify({ exec: "btop || htop || top", openMode: "terminal" }) 
        }); 
        break;
      case "docker_logs":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/logs", { 
            method: "POST", headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ name: app.name.toLowerCase() }) 
          });
        break;
      case "reboot": setShowPower(true); break;
      case "start_container":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) }).then(() => pollDocker());
        break;
      case "stop_container":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) }).then(() => pollDocker());
        break;
      case "restart_cont":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/restart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) }).then(() => pollDocker());
        break;
      default: break;
    }
  }, [rows, handleLaunch, pollDocker, runScan, setFocus, setSearch, setMinimized, updateApp]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingApp || addingApp || addingWebApp || showCtrl || activeWebApp) return;
      const btn = BUTTONS.find(b => b.key === e.key);
      if (!btn) return;
      const actionId = mapping[btn.id];
      if (!actionId || actionId === "none") return;
      e.preventDefault();
      showHud(btn.id, actionId);
      execAction(actionId);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [mapping, execAction, editingApp, addingApp, addingWebApp, showCtrl, activeWebApp]);

  useGamepad(execAction, mapping, showHud);

  if (!booted) return <SplashScreen />;

  if (screensaver) return <Screensaver onDismiss={() => setScreensaver(false)} />;

  if (minimized) return (
    <>
      <ThemeStyle theme={theme} />
      <div style={{ width: "100vw", height: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${theme.accent}15 0%, transparent 70%)` }} />
        
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "relative" }}
        >
          <img src="/logo.png" alt="MartinsOS" style={{ width: 120, height: 120, borderRadius: 32, boxShadow: `0 20px 60px ${theme.accent}44`, border: `1px solid ${theme.border}` }} />
          <div style={{ position: "absolute", inset: -20, borderRadius: 40, border: `1px solid ${theme.accent}22`, animation: "pulse 3s infinite" }} />
        </motion.div>

        <div style={{ textAlign: "center", zIndex: 10 }}>
          <div style={{ color: "var(--text)", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>MartinsOS</div>
          <div style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 600, marginTop: 4, opacity: 0.7 }}>O launcher está em segundo plano</div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: `0 12px 40px ${theme.accent}55` }}
          whileTap={{ scale: .95 }}
          onClick={() => setMinimized(false)}
          style={{
            background: `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`,
            border: "none", borderRadius: 18, padding: "16px 40px",
            color: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif", zIndex: 10,
            boxShadow: `0 8px 30px ${theme.accent}33`, display: "flex", alignItems: "center", gap: 12
          }}
        >
          <RefreshCw size={20} /> Restaurar Interface
        </motion.button>

        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.03)", padding: "8px 16px",
          borderRadius: 12, border: `1px solid ${theme.border}`,
          color: "var(--text-muted)", fontSize: 13, fontWeight: 700
        }}>
          <div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: "4px", background: theme.card }}>H</div> Home p/ Restaurar
        </div>
      </div>
    </>
  );

  return (
    <>
      <ThemeStyle theme={theme} />
      <AmbientBackground accentColor={focusedApp?.iconColor || theme.accent} />
      <div style={{ width: "100vw", height: "100vh", background: "transparent", color: "var(--text)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <ButtonHUD event={hudEvent} />
        <ContainerNotif event={containerNotif} />

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 48px", height: 68, borderBottom: "1px solid var(--border)", background: `linear-gradient(180deg,var(--surface),transparent)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 8 }}>
            <img src="/logo.png" alt="MartinsOS" style={{ width: 44, height: 44, borderRadius: 12, boxShadow: `0 0 20px ${theme.accent}66`, objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1 }}>MartinsOS</div>
              <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em" }}>
                {apps.length} APPS · {apps.filter(a => a.running).length} ATIVOS
              </div>
            </div>
          </div>

          <div ref={searchInputRef} style={{ flex: "0 0 280px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={16} style={{ position: "absolute", left: 12, color: "var(--text-muted)", pointerEvents: "none" }} />
              <SmartInput value={search} onChange={v => setSearch(v)} placeholder="Buscar app..." style={{ paddingLeft: 36 }} />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 14px" }}>
            <button onClick={() => fetch("/api/volume/mute", { method: "POST" })}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", padding: 0 }}>
              {volMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div style={{ width: 72, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${volLevel}%`, height: "100%", background: `linear-gradient(90deg,${theme.accentDim},${theme.accent})`, borderRadius: 2, transition: "width .3s" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)", minWidth: 28 }}>{volLevel}%</span>
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            {[
              [SkipBack, () => fetch("/api/media/previous", { method: "POST" }), "Anterior"],
              [Play, () => fetch("/api/media/play-pause", { method: "POST" }), "Play/Pause"],
              [SkipForward, () => fetch("/api/media/next", { method: "POST" }), "Próxima"],
            ].map(([Icon, fn, title]: any) => (
              <motion.button key={title} whileHover={{ scale: 1.1 }} whileTap={{ scale: .9 }}
                onClick={fn} title={title}
                style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, padding: "7px 10px", cursor: "pointer", color: "var(--text-dim)", display: "flex" }}>
                <Icon size={16} />
              </motion.button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 10px" }}>
            <Palette size={13} style={{ color: "var(--text-muted)" }} />
            {Object.entries(THEMES).map(([key, th]) => (
              <button key={key} onClick={() => setTheme(key)} title={th.name}
                style={{
                  width: 18, height: 18, borderRadius: "50%", padding: 0, cursor: "pointer", background: th.accent,
                  border: themeKey === key ? `2.5px solid var(--text)` : "2.5px solid transparent",
                  boxShadow: themeKey === key ? `0 0 8px ${th.accent}` : "none", transition: "all .15s"
                }} />
            ))}
          </div>

          {[
            [RefreshCw, runScan, scanStatus === "scanning", "Escanear"],
            [Plus, () => setAdding(true), false, "Adicionar"],
            [Gamepad2, () => setShowCtrl(true), false, "Controle"],
            [Monitor, () => setMinimized(true), false, "Desktop"],
          ].map(([Icon, fn, spin, title]: any) => (
            <motion.button key={title} whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }}
              onClick={fn} title={title}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
                border: "1px solid var(--border)", background: "var(--card)",
                color: "var(--text-dim)", cursor: "pointer", fontWeight: 700, fontSize: 14,
                fontFamily: "'Outfit',sans-serif"
              }}>
              <Icon size={15} style={{ animation: spin ? "spin 1s linear infinite" : "none" }} />
              {title}
            </motion.button>
          ))}

          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }}
            onClick={() => setAddingWebApp(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
              border: "1px solid #34d39966", background: "linear-gradient(135deg,#022c22,#065f46)",
              color: "#34d399", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "'Outfit',sans-serif"
            }}>
            🌐 Web App
          </motion.button>

          <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 8px" }} />
          <Clock />
        </div>

        <HeroPanel app={focusedApp} onLaunch={handleLaunch} onEdit={setEditing} />

        <div style={{ flex: 1, overflowY: "auto", paddingTop: 8, paddingBottom: 32 }}>
          {rows.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "60px 48px", color: "var(--text-muted)", textAlign: "center" }}>
              {scanStatus === "scanning" ? (
                <>
                  <RefreshCw size={40} style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dim)" }}>Escaneando apps do sistema...</div>
                </>
              ) : (
                <>
                  <img src="/logo.png" alt="MartinsOS" style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 8, boxShadow: `0 0 40px ${theme.accent}55` }} />
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-dim)" }}>Bem-vindo ao MartinsOS</div>
                  <div style={{ fontSize: 16, maxWidth: 440, lineHeight: 1.7, color: "var(--text-muted)" }}>
                    Clique em <b style={{ color: "var(--accent)" }}>Escanear</b> para detectar apps instalados.
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }} onClick={runScan}
                    style={{ padding: "14px 28px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 17, fontFamily: "'Outfit',sans-serif", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, color: "#fff" }}>
                    <RefreshCw size={16} style={{ marginRight: 8, display: "inline", verticalAlign: "middle" }} /> Escanear Apps
                  </motion.button>
                </>
              )}
            </div>
          ) : rows.map((row, ri) => {
            // Lazy rendering: only render rows within 2 steps of focus
            const isVisible = Math.abs(ri - focusRow) <= 2;
            if (!isVisible) return <div key={row.name} style={{ height: 260 }} />;

            return (
              <CategoryRow key={row.name} name={row.name} apps={row.apps}
                isFocusedRow={ri === focusRow}
                focusedCol={ri === focusRow ? focusCol : -1}
                onSelectApp={ci => setFocus(ri, ci)}
                onLaunchApp={handleLaunch} />
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 48px", borderTop: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.02em", opacity: 0.8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Monitor size={12} style={{ color: theme.accent }} />
              <span style={{ textTransform: "uppercase" }}>{sysInfo.hostname}</span>
            </div>
            <div style={{ width: 1, height: 10, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.accent }} />
              <span>{sysInfo.user}</span>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600 }}>
            <KbSourceBadge native={NATIVE_KB.has} source={NATIVE_KB.source} />
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }}
            onClick={() => setShowCtrl(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
            <Gamepad2 size={13} /> Editar mapeamento
          </motion.button>
        </div>

        {showPower && (
          <PowerModal
            onPowerOff={handlePowerOff}
            onReboot={handleReboot}
            onQuit={handleQuit}
            onClose={() => setShowPower(false)}
          />
        )}
        <QuickSettings 
          isOpen={showQuickSettings} 
          onClose={() => setShowQuickSettings(false)} 
          volLevel={volLevel}
          sysInfo={sysInfo}
          onCheckUpdate={() => { setShowQuickSettings(false); setShowUpdate(true); }}
        />
        {showUpdate && <UpdateModal onClose={() => setShowUpdate(false)} />}
        {editingApp && <EditModal app={editingApp} onSave={handleSave} onClose={() => setEditing(null)} />}
        {addingApp && <AddAppModal onAdd={handleAdd} onClose={() => setAdding(false)} />}
        {addingWebApp && <AddWebAppModal onAdd={handleAddWeb} onClose={() => setAddingWebApp(false)} />}
        {launchToast && <LaunchToast app={launchToast} onClose={() => setToast(null)} />}
        {showCtrl && <ControllerConfig mapping={mapping} onSave={m => { setMapping(m); setShowCtrl(false); }} onClose={() => setShowCtrl(false)} />}
        {activeWebApp && <WebAppViewer app={activeWebApp} mapping={mapping} onClose={() => setActiveWebApp(null)} onAction={(btnId, actionId) => showHud(btnId, actionId)} />}
        {scanPicker !== null && (
          <ScanPickerModal items={scanPicker}
            onConfirm={selectedItems => {
              const scannedIds = new Set(scanPicker.map(a => a.id));
              const selectedIds = new Set(selectedItems.map(a => a.id));
              setApps(prev => {
                const kept = prev.filter(a => !scannedIds.has(a.id) || selectedIds.has(a.id));
                const prevIds = new Set(prev.map(a => a.id));
                const toAdd = selectedItems.filter(a => !prevIds.has(a.id)).map(({ alreadyAdded, ...rest }) => rest as AppEntry);
                return [...kept, ...toAdd];
              });
              setScanPicker(null);
            }}
            onClose={() => setScanPicker(null)} />
        )}
      </div>
    </>
  );

  function handleSave(u: AppEntry) { updateApp(u); setEditing(null); }
  function handleAdd(n: AppEntry) { addApp(n); setAdding(false); }
  function handleAddWeb(n: AppEntry) { addApp(n); setAddingWebApp(false); }
}
