import React from "react";
import { motion } from "framer-motion";
import { Pin } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { AppEntry } from "../types/launcher";
import { Badge } from "./Badge";
import { StatusDot } from "./StatusDot";

interface AppCardTVProps {
  app: AppEntry;
  focused: boolean;
  onSelect: () => void;
  onLaunch: (app: AppEntry) => void;
}

export const AppCardTV: React.FC<AppCardTVProps> = ({ app, focused, onSelect, onLaunch }) => {
  const theme = useLauncherStore((state) => state.theme);
  const accent = app.iconColor || theme.accent;
  const isDocker = app.source === "docker" || app.source === "podman";

  return (
    <motion.div
      onClick={onSelect} onDoubleClick={() => onLaunch(app)}
      animate={{
        scale: focused ? 1.1 : 1,
        boxShadow: focused
          ? `0 0 0 3px ${accent}, 0 16px 48px ${accent}44`
          : "0 2px 12px #00000060"
      }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      style={{
        flexShrink: 0, width: 160, height: 186, borderRadius: 20, cursor: "pointer",
        background: focused
          ? `linear-gradient(145deg,${app.bgColor || theme.cardHover},${theme.card})`
          : `linear-gradient(145deg,${app.bgColor || theme.card},${theme.surface})`,
        border: focused ? `2px solid ${accent}` : "2px solid var(--border)",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 10, padding: "14px 10px",
        position: "relative", userSelect: "none", overflow: "hidden"
      }}>
      {app.pinned && (
        <div style={{ position: "absolute", top: 9, left: 11, color: accent, opacity: .8 }}>
          <Pin size={12} fill={accent} />
        </div>
      )}
      <motion.div animate={{ filter: focused ? `drop-shadow(0 0 12px ${accent})` : "none" }}
        transition={{ duration: .2 }}
        style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {app.icon_path || (app.icon && app.icon.length > 4) ? (
          <img src={app.icon_path ? `/api/icon?name=${encodeURIComponent(app.icon)}` : app.icon} 
               alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
               onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
        ) : (
          <span style={{ fontSize: 52, lineHeight: 1 }}>{app.icon || "📦"}</span>
        )}
      </motion.div>
      <div style={{
        fontSize: 14, fontWeight: 700, color: focused ? "var(--text)" : "var(--text-dim)",
        textAlign: "center", lineHeight: 1.25, width: "100%",
        overflow: "hidden", textOverflow: "ellipsis",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
      }}>
        {app.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <Badge source={app.source} />
        {isDocker && <StatusDot running={app.running} />}
      </div>
    </motion.div>
  );
};
