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

  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePos({
      x: (clientX / innerWidth - 0.5) * 20,
      y: (clientY / innerHeight - 0.5) * 20
    });
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={app.id}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
        onMouseMove={handleMouseMove}
        transition={{ duration: .28, ease: "easeOut" }}
        className="hero-container">
        <motion.div 
          animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
          style={{
            position: "absolute", inset: "-10%",
            background: `radial-gradient(ellipse 80% 120% at 30% 50%, ${accent}33 0%, ${bg}88 50%, var(--bg) 100%)`,
          }} 
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, var(--bg)00 0%, var(--bg) 100%)", pointerEvents: "none" }} />
        <div className="hero-content">
          <motion.div key={app.id + "_icon"}
            initial={{ scale: .7, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1, x: mousePos.x, y: mousePos.y }}
            transition={{ duration: .32, ease: "backOut" }}
            className="hero-icon" style={{ filter: `drop-shadow(0 0 28px ${accent}88)` }}>
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
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="hero-title"
            >
              {app.name}
            </motion.div>
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
