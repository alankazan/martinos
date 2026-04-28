import React from "react";
import { motion } from "framer-motion";
import { Monitor, Gamepad2 } from "lucide-react";
import { KbSourceBadge } from "./HUD/KbSourceBadge";
import { Theme } from "../types/launcher";
import { NATIVE_KB } from "../utils/system";

interface BottomBarProps {
  theme: Theme;
  sysInfo: { user: string; hostname: string };
  setShowCtrl: (v: boolean) => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ theme, sysInfo, setShowCtrl }) => {
  return (
    <div className="bottom-bar">
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
  );
};
