import React from "react";
import { motion } from "framer-motion";
import { Search, Volume2, VolumeX, SkipBack, Play, SkipForward, Palette, RefreshCw, Gamepad2, Monitor, Plus, ShoppingBag, Smartphone } from "lucide-react";
import { SmartInput } from "./SmartInput";
import { WeatherWidget } from "./WeatherWidget";
import { Clock } from "./Clock";
import { TelemetryWidget } from "./HUD/TelemetryWidget";
import { THEMES } from "../constants/launcher";
import { Theme, AppEntry } from "../types/launcher";

interface TopBarProps {
  theme: Theme;
  themeKey: string;
  apps: AppEntry[];
  search: string;
  setSearch: (v: string) => void;
  volMuted: boolean;
  volLevel: number;
  scanStatus: string;
  runScan: () => void;
  setTheme: (k: string) => void;
  setShowCtrl: (v: boolean) => void;
  setMinimized: (v: boolean) => void;
  setShowAdd: (v: boolean) => void;
  setShowStore: (v: boolean) => void;
  setShowQr: (v: boolean) => void;
  searchInputRef: React.RefObject<HTMLDivElement | null>;
}

export const TopBar: React.FC<TopBarProps> = ({
  theme, themeKey, apps, search, setSearch, volMuted, volLevel, scanStatus, runScan,
  setTheme, setShowCtrl, setMinimized, setShowAdd, setShowStore, setShowQr, searchInputRef
}) => {
  return (
    <div className="top-bar">
      {/* Logo + Title — always visible, never shrinks */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <img
          src="/logo.png" alt="MartinsOS"
          style={{ width: 44, height: 44, borderRadius: 12, boxShadow: `0 0 20px ${theme.accent}66`, objectFit: "cover" }}
        />
        <div>
          <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1 }}>MartinsOS</div>
          <div style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 500, letterSpacing: "0.06em" }}>
            {apps.length} APPS · {apps.filter(a => a.running).length} ATIVOS
          </div>
        </div>
      </div>

      {/* Search */}
      <div ref={searchInputRef} className="search-container" style={{ flexShrink: 0 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={16} style={{ position: "absolute", left: 12, color: "var(--text-muted)", pointerEvents: "none" }} />
          <SmartInput value={search} onChange={v => setSearch(v)} placeholder="Buscar app..." style={{ paddingLeft: 36 }} />
        </div>
      </div>

      {/* Spacer pushes action bar to the right */}
      <div style={{ flex: 1, minWidth: 0 }} />

      {/*
        ── Right action strip ──────────────────────────────────────────────────
        All buttons live inside this scrollable container.
        On narrow screens the strip simply scrolls horizontally instead of
        being clipped/inaccessible. No button is ever hidden.
      */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          overflowX: "auto", scrollbarWidth: "none",
          flexShrink: 1, minWidth: 0,
          // Tiny fade on the left edge to hint scrollability
          maskImage: "linear-gradient(to right, transparent 0px, black 16px, black calc(100% - 0px), black 100%)"
        }}
      >
        {/* Telemetry (CPU / RAM) */}
        <div style={{ flexShrink: 0 }}>
          <TelemetryWidget />
        </div>

        {/* Volume */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "6px 14px", flexShrink: 0
        }}>
          <button
            onClick={() => fetch("/api/volume/mute", { method: "POST" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", padding: 0 }}
          >
            {volMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <div style={{ width: 64, height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${volLevel}%`, height: "100%",
              background: `linear-gradient(90deg,${theme.accentDim},${theme.accent})`,
              borderRadius: 2, transition: "width .3s"
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dim)", minWidth: 28 }}>{volLevel}%</span>
        </div>

        {/* Media controls */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
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

        {/* Theme picker */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "6px 10px", flexShrink: 0
        }}>
          <Palette size={13} style={{ color: "var(--text-muted)" }} />
          {Object.entries(THEMES).map(([key, th]) => (
            <button key={key} onClick={() => setTheme(key)} title={th.name}
              style={{
                width: 18, height: 18, borderRadius: "50%", padding: 0, cursor: "pointer",
                background: th.accent,
                border: themeKey === key ? `2.5px solid var(--text)` : "2.5px solid transparent",
                boxShadow: themeKey === key ? `0 0 8px ${th.accent}` : "none", transition: "all .15s"
              }} />
          ))}
        </div>

        {/* Scan / Controller / Desktop */}
        {[
          [RefreshCw, runScan, scanStatus === "scanning", "Escanear"],
          [Gamepad2, () => setShowCtrl(true), false, "Controle"],
          [Monitor, () => setMinimized(true), false, "Desktop"],
        ].map(([Icon, fn, spin, title]: any) => (
          <motion.button key={title} whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }}
            onClick={fn} title={title}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10,
              border: "1px solid var(--border)", background: "var(--card)",
              color: "var(--text-dim)", cursor: "pointer", fontWeight: 700, fontSize: 13,
              fontFamily: "'Outfit',sans-serif", flexShrink: 0, whiteSpace: "nowrap"
            }}>
            <Icon size={15} style={{ animation: spin ? "spin 1s linear infinite" : "none" }} />
            {title}
          </motion.button>
        ))}

        {/* Add App */}
        <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: .94 }}
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
            border: "none",
            background: `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`,
            color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13,
            fontFamily: "'Outfit',sans-serif",
            boxShadow: `0 4px 14px ${theme.accent}44`, flexShrink: 0, whiteSpace: "nowrap"
          }}>
          <Plus size={15} /> Adicionar
        </motion.button>

        {/* Store */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowStore(true)}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`,
            color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7,
            boxShadow: `0 4px 15px ${theme.accent}44`, flexShrink: 0, whiteSpace: "nowrap"
          }}>
          <ShoppingBag size={15} /> Loja
        </motion.button>

        {/* Remote */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowQr(true)}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "1px solid var(--border)",
            background: "var(--card)",
            color: "var(--text)", fontWeight: 800, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 7, flexShrink: 0, whiteSpace: "nowrap"
          }}>
          <Smartphone size={15} style={{ color: theme.accent }} /> Remote
        </motion.button>

        {/* Divider · Weather · Clock */}
        <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
        <div style={{ flexShrink: 0 }}><WeatherWidget /></div>
        <div style={{ width: 1, height: 24, background: "var(--border)", margin: "0 4px", flexShrink: 0 }} />
        <div style={{ flexShrink: 0 }}><Clock /></div>
      </div>
    </div>
  );
};
