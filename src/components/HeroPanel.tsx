import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Edit3 } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { AppEntry } from "../types/launcher";
import { Badge } from "./Badge";
import { StatusDot } from "./StatusDot";

interface HeroPanelProps {
  app: AppEntry | null;
  onLaunch: (app: AppEntry) => void;
  onEdit: (app: AppEntry) => void;
}

export const HeroPanel: React.FC<HeroPanelProps> = ({ app, onLaunch, onEdit }) => {
  const theme = useLauncherStore((state) => state.theme);

  if (!app) return (
    <div style={{
      height: 240, display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--text-muted)", fontSize: 18, fontWeight: 600, letterSpacing: "0.04em"
    }}>
      Nenhum app selecionado
    </div>
  );

  const accent = app.iconColor || theme.accent;
  const bg = app.bgColor || theme.card;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={app.id}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        transition={{ duration: .28, ease: "easeOut" }}
        style={{ position: "relative", height: 240, overflow: "hidden", flexShrink: 0 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 120% at 30% 50%, ${accent}33 0%, ${bg}88 50%, var(--bg) 100%)`,
        }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--bg)00 0%, var(--bg) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", gap: 36, padding: "0 56px" }}>
          <motion.div key={app.id + "_icon"}
            initial={{ scale: .7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: .32, ease: "backOut" }}
            style={{ width: 120, height: 120, display: "flex", alignItems: "center", justifyContent: "center", filter: `drop-shadow(0 0 28px ${accent}88)`, flexShrink: 0 }}>
            {app.icon_path || (app.icon && app.icon.length > 4) ? (
              <img src={app.icon_path ? `/api/icon?name=${encodeURIComponent(app.icon)}` : app.icon} 
                   alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 88, lineHeight: 1 }}>{app.icon || "📦"}</span>
            )}
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
              {app.category}
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: "var(--text)", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "-0.02em" }}>
              {app.name}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
              <Badge source={app.source} />
              {(app.source === "docker" || app.source === "podman") && <StatusDot running={app.running} />}
              {app.pinned && <span style={{ fontSize: 13, color: accent }}>📌 Fixado</span>}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: .95 }}
                onClick={() => onLaunch(app)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "13px 28px",
                  borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800,
                  fontSize: 17, fontFamily: "'Outfit',sans-serif",
                  background: `linear-gradient(135deg,${theme.accentDim},${accent})`,
                  color: "#fff", boxShadow: `0 6px 24px ${accent}44`
                }}>
                <Play size={18} fill="#fff" /> Abrir
              </motion.button>
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: .95 }}
                onClick={() => onEdit(app)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "13px 22px",
                  borderRadius: 14, border: `1.5px solid var(--border)`, cursor: "pointer",
                  fontWeight: 700, fontSize: 15, fontFamily: "'Outfit',sans-serif",
                  background: "var(--card)", color: "var(--text-dim)"
                }}>
                <Edit3 size={15} /> Editar
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
