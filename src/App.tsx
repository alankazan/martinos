import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

import { useLauncherStore } from "./store/useLauncherStore";
import { BUTTONS } from "./constants/launcher";
import { useGamepad } from "./hooks/useGamepad";
import { useSocket } from "./hooks/useSocket";
import { useSystemLogic } from "./hooks/useSystemLogic";

// Components
import { SplashScreen } from "./components/SplashScreen";
import { PowerModal } from "./components/Modals/PowerModal";
import { QuickSettings } from "./components/QuickSettings";
import { StoreView } from "./components/StoreView";
import { UpdateModal } from "./components/Modals/UpdateModal";
import { HeroPanel } from "./components/HeroPanel";
import { CategoryRow } from "./components/CategoryRow";
import { Screensaver } from "./components/Screensaver";
import { WebAppViewer } from "./components/WebAppViewer";
import { EditModal } from "./components/Modals/EditModal";
import { UnifiedAddModal } from "./components/Modals/UnifiedAddModal";
import { ScanPickerModal } from "./components/Modals/ScanPickerModal";
import { ControllerConfig } from "./components/Modals/ControllerConfig";
import { ButtonHUD } from "./components/HUD/ButtonHUD";
import { ContainerNotif } from "./components/HUD/ContainerNotif";
import { LaunchToast } from "./components/HUD/LaunchToast";
import { AmbientBackground } from "./components/AmbientBackground";
import { SmartRemote } from "./components/Remote/SmartRemote";
import { QrCodeModal } from "./components/Modals/QrCodeModal";
import { SystemSettings } from "./components/Modals/SystemSettings";
import { TopBar } from "./components/TopBar";
import { BottomBar } from "./components/BottomBar";

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
    
    .app-container { 
      width: 100vw; 
      height: 100vh; 
      background: transparent; 
      color: var(--text); 
      display: flex; 
      flex-direction: column; 
      overflow: hidden; 
      position: relative;
    }
    .top-bar { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      padding: 0 48px; 
      height: 80px; 
      border-bottom: 1px solid var(--border); 
      background: linear-gradient(180deg, var(--surface), transparent); 
      flex-shrink: 0; 
      z-index: 100;
    }
    .search-container { flex: 0 1 320px; }
    .hero-container { position: relative; height: 260px; overflow: hidden; flex-shrink: 0; }
    .hero-content { position: relative; height: 100%; display: flex; align-items: center; gap: 48px; padding: 0 64px; }
    .hero-icon { width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .hero-title { font-size: 56px; font-weight: 900; color: var(--text); line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: -0.03em; }
    .content-area { 
      flex: 1; 
      overflow-y: auto; 
      padding-top: 24px; 
      padding-bottom: 40px; 
      scroll-behavior: smooth;
    }
    .bottom-bar { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      padding: 12px 48px; 
      border-top: 1px solid var(--border); 
      background: var(--surface); 
      flex-shrink: 0; 
    }
    
    @media (max-width: 1280px) {
      .top-bar { padding: 0 24px; height: 72px; }
      .hero-content { padding: 0 32px; gap: 24px; }
      .hero-title { font-size: 40px; }
      .hero-icon { width: 100px; height: 100px; }
    }

    @media (max-width: 1024px) {
      .top-bar { flex-wrap: wrap; height: auto; padding: 16px 24px; gap: 12px; }
      .search-container { flex: 1 1 100%; order: 10; margin-top: 8px; }
      .hero-container { height: 200px; }
      .hero-content { padding: 0 24px; gap: 16px; }
      .hero-icon { width: 80px; height: 80px; }
      .hero-title { font-size: 32px; }
      .content-area { padding-bottom: 100px; }
      .bottom-bar { padding: 16px 24px; }
    }
  `}</style>
);

export default function App() {
  const logic = useSystemLogic();
  const searchInputRef = useRef<HTMLDivElement>(null);
  
  useSocket();

  const execAction = (actionId: string) => {
    const rs = logic.rows;
    const fr = logic.focusRowRef.current;
    const fc = logic.focusColRef.current;
    const app = rs[fr]?.apps?.[fc] ?? null;

    switch (actionId) {
      case "nav_up": logic.setFocus(Math.max(fr - 1, 0), 0); break;
      case "nav_down": logic.setFocus(Math.min(fr + 1, rs.length - 1), 0); break;
      case "nav_left": logic.setFocus(fr, Math.max(fc - 1, 0)); break;
      case "nav_right": logic.setFocus(fr, Math.min(fc + 1, (rs[fr]?.apps?.length ?? 1) - 1)); break;
      case "prev_category": logic.setFocus(Math.max(fr - 1, 0), 0); break;
      case "next_category": logic.setFocus(Math.min(fr + 1, rs.length - 1), 0); break;
      case "confirm": case "launch_app": if (app) logic.handleLaunch(app); break;
      case "back": logic.setSearch(""); break;
      case "home": logic.setFocus(0, 0); logic.setSearch(""); break;
      case "edit_app": if (app) logic.setEditing(app); break;
      case "pin_app": if (app) logic.updateApp({ ...app, pinned: !app.pinned }); break;
      case "remove_app": if (app) { useLauncherStore.getState().removeApp(app.id); logic.setFocus(fr, Math.max(fc - 1, 0)); } break;
      case "add_app": logic.setShowAdd(true); break;
      case "minimize": logic.setMinimized(true); break;
      case "scan_apps": logic.runScan(); break;
      case "open_settings": logic.setShowQuickSettings(true); break;
      case "open_quick_settings": logic.setShowQuickSettings(true); break;
      case "search_focus": searchInputRef.current?.click(); break;
      case "filter_all": logic.setSearch(""); logic.setFocus(0, 0); break;
      case "filter_pinned": { const i = rs.findIndex(r => r.name === "Fixados"); if (i >= 0) logic.setFocus(i, 0); break; }
      case "filter_docker": { const i = rs.findIndex(r => r.name === "Docker"); if (i >= 0) logic.setFocus(i, 0); break; }
      case "volume_up": fetch("/api/volume/up", { method: "POST" }); break;
      case "volume_down": fetch("/api/volume/down", { method: "POST" }); break;
      case "mute": fetch("/api/volume/mute", { method: "POST" }); break;
      case "play_pause": fetch("/api/media/play-pause", { method: "POST" }); break;
      case "media_next": fetch("/api/media/next", { method: "POST" }); break;
      case "media_prev": fetch("/api/media/previous", { method: "POST" }); break;
      case "stop_media": fetch("/api/media/stop", { method: "POST" }); break;
      case "screenshot": fetch("/api/screenshot", { method: "POST" }); break;
      case "open_terminal": fetch("/api/terminal", { method: "POST" }); break;
      case "power_off": logic.setShowPower(true); break;
      case "toggle_theme": {
        const keys = Object.keys(useLauncherStore.getState().themeKey); 
        logic.setTheme(keys[0]); 
        break;
      }
      case "clear_recent": {
        logic.setApps(prev => prev.map(a => ({ ...a, lastUsed: 0 })));
        break;
      }
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
      case "reboot": logic.setShowPower(true); break;
      case "start_container":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) });
        break;
      case "stop_container":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) });
        break;
      case "restart_cont":
        if (app?.source === "docker" || app?.source === "podman")
          fetch("/api/docker/restart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: app.name.toLowerCase() }) });
        break;
      default: break;
    }
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      useLauncherStore.getState().setInputMode("keyboard");
      if (logic.editingApp || logic.showAdd || logic.showCtrl || logic.activeWebApp) return;
      const btn = BUTTONS.find(b => b.key === e.key);
      if (!btn) return;
      const actionId = logic.mapping[btn.id];
      if (!actionId || actionId === "none") return;
      e.preventDefault();
      logic.showHud(btn.id, actionId);
      execAction(actionId);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [logic.mapping, logic.editingApp, logic.showAdd, logic.showCtrl, logic.activeWebApp]);

  useGamepad(execAction, logic.mapping, logic.showHud);

  if (window.location.pathname === "/remote") return <SmartRemote />;
  if (!logic.booted) return <SplashScreen />;
  if (logic.screensaver) return <Screensaver onDismiss={() => logic.setScreensaver(false)} />;

  if (logic.minimized) return (
    <>
      <ThemeStyle theme={logic.theme} />
      <div style={{ width: "100vw", height: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${logic.theme.accent}15 0%, transparent 70%)` }} />
        <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} style={{ position: "relative" }}>
          <img src="/logo.png" alt="MartinsOS" style={{ width: 120, height: 120, borderRadius: 32, boxShadow: `0 20px 60px ${logic.theme.accent}44`, border: `1px solid ${logic.theme.border}` }} />
          <div style={{ position: "absolute", inset: -20, borderRadius: 40, border: `1px solid ${logic.theme.accent}22`, animation: "pulse 3s infinite" }} />
        </motion.div>
        <div style={{ textAlign: "center", zIndex: 10 }}>
          <div style={{ color: "var(--text)", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>MartinsOS</div>
          <div style={{ color: "var(--text-muted)", fontSize: 15, fontWeight: 600, marginTop: 4, opacity: 0.7 }}>O launcher está em segundo plano</div>
        </div>
        <motion.button whileHover={{ scale: 1.05, boxShadow: `0 12px 40px ${logic.theme.accent}55` }} whileTap={{ scale: .95 }} onClick={() => logic.setMinimized(false)}
          style={{ background: `linear-gradient(135deg, ${logic.theme.accentDim}, ${logic.theme.accent})`, border: "none", borderRadius: 18, padding: "16px 40px", color: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer", fontFamily: "'Outfit', sans-serif", zIndex: 10, boxShadow: `0 8px 30px ${logic.theme.accent}33`, display: "flex", alignItems: "center", gap: 12 }}>
          <RefreshCw size={20} /> Restaurar Interface
        </motion.button>
      </div>
    </>
  );

  return (
    <>
      <ThemeStyle theme={logic.theme} />
      <AmbientBackground accentColor={logic.focusedApp?.iconColor || logic.theme.accent} />
      <div className="app-container">
        <ButtonHUD event={logic.hudEvent} />
        <ContainerNotif event={logic.containerNotif} />

        <TopBar 
          theme={logic.theme} themeKey={logic.themeKey} apps={logic.apps} 
          search={logic.search} setSearch={logic.setSearch} 
          volMuted={logic.volMuted} volLevel={logic.volLevel} 
          scanStatus={logic.scanStatus} runScan={logic.runScan} 
          setTheme={logic.setTheme} setShowCtrl={logic.setShowCtrl} 
          setMinimized={logic.setMinimized} setShowAdd={logic.setShowAdd} 
          setShowStore={logic.setShowStore} setShowQr={logic.setShowQr} 
          searchInputRef={searchInputRef}
        />

        <HeroPanel app={logic.focusedApp} onLaunch={logic.handleLaunch} onEdit={logic.setEditing} />

        <div className="content-area">
          {logic.rows.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: "60px 48px", color: "var(--text-muted)", textAlign: "center" }}>
              {logic.scanStatus === "scanning" ? (
                <>
                  <RefreshCw size={40} style={{ animation: "spin 1s linear infinite", color: "var(--accent)" }} />
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dim)" }}>Escaneando apps do sistema...</div>
                </>
              ) : (
                <>
                  <img src="/logo.png" alt="MartinsOS" style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 8, boxShadow: `0 0 40px ${logic.theme.accent}55` }} />
                  <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text-dim)" }}>Bem-vindo ao MartinsOS</div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: .95 }} onClick={logic.runScan}
                    style={{ padding: "14px 28px", borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 17, fontFamily: "'Outfit',sans-serif", background: `linear-gradient(135deg,${logic.theme.accentDim},${logic.theme.accent})`, color: "#fff" }}>
                    <RefreshCw size={16} style={{ marginRight: 8, display: "inline", verticalAlign: "middle" }} /> Escanear Apps
                  </motion.button>
                </>
              )}
            </div>
          ) : logic.rows.map((row, ri) => (
            <CategoryRow key={row.name} name={row.name} apps={row.apps}
              isFocusedRow={ri === logic.focusRow}
              focusedCol={ri === logic.focusRow ? logic.focusCol : -1}
              onSelectApp={ci => logic.setFocus(ri, ci)}
              onLaunchApp={logic.handleLaunch} />
          ))}
        </div>

        <BottomBar theme={logic.theme} sysInfo={logic.sysInfo} setShowCtrl={logic.setShowCtrl} />

        {logic.showPower && (
          <PowerModal onPowerOff={logic.handlePowerOff} onReboot={logic.handleReboot} onQuit={logic.handleQuit} onClose={() => logic.setShowPower(false)} />
        )}
        <QuickSettings 
          isOpen={logic.showQuickSettings} onClose={() => logic.setShowQuickSettings(false)} 
          volLevel={logic.volLevel} sysInfo={logic.sysInfo}
          onCheckUpdate={() => { logic.setShowQuickSettings(false); logic.setShowUpdate(true); }}
          onOpenSystemSettings={() => logic.setShowSystemSettings(true)}
        />
        <AnimatePresence>
          {logic.showStore && <StoreView onClose={() => logic.setShowStore(false)} />}
          {logic.showQr && <QrCodeModal url={`http://${logic.sysInfo.ip}:5173/remote`} onClose={() => logic.setShowQr(false)} />}
        </AnimatePresence>
        {logic.showUpdate && <UpdateModal onClose={() => logic.setShowUpdate(false)} />}
        {logic.showSystemSettings && <SystemSettings onClose={() => logic.setShowSystemSettings(false)} />}
        {logic.editingApp && <EditModal app={logic.editingApp} onSave={u => { logic.updateApp(u); logic.setEditing(null); }} onClose={() => logic.setEditing(null)} />}
        {logic.showAdd && <UnifiedAddModal onAdd={n => { logic.addApp(n); logic.setShowAdd(false); }} onClose={() => logic.setShowAdd(false)} />}
        {logic.launchToast && <LaunchToast app={logic.launchToast} onClose={() => logic.setToast(null)} />}
        {logic.showCtrl && <ControllerConfig mapping={logic.mapping} onSave={m => { logic.setMapping(m); logic.setShowCtrl(false); }} onClose={() => logic.setShowCtrl(false)} />}
        {logic.activeWebApp && <WebAppViewer app={logic.activeWebApp} mapping={logic.mapping} onClose={() => logic.setActiveWebApp(null)} onAction={(btnId, actionId) => logic.showHud(btnId, actionId)} />}
        {logic.scanPicker !== null && (
          <ScanPickerModal items={logic.scanPicker}
            onConfirm={selectedItems => {
              const scannedIds = new Set(logic.scanPicker!.map(a => a.id));
              const selectedIds = new Set(selectedItems.map(a => a.id));
              logic.setApps(prev => {
                const kept = prev.filter(a => !scannedIds.has(a.id) || selectedIds.has(a.id));
                const prevIds = new Set(prev.map(a => a.id));
                const toAdd = selectedItems.filter(a => !prevIds.has(a.id)).map(({ alreadyAdded, ...rest }) => rest as any);
                return [...kept, ...toAdd];
              });
              logic.setScanPicker(null);
            }}
            onClose={() => logic.setScanPicker(null)} />
        )}
      </div>
    </>
  );
}
