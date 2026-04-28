import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Volume2, Palette, Cpu, HardDrive, 
  Settings, X, Shield, Activity, Download 
} from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { THEMES } from "../constants/launcher";

interface QuickSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  volLevel: number;
  sysInfo: { user: string; hostname: string };
  onCheckUpdate: () => void;
  onOpenSystemSettings: () => void;
}

export const QuickSettings: React.FC<QuickSettingsProps> = ({ 
  isOpen, onClose, volLevel, sysInfo, onCheckUpdate, onOpenSystemSettings
}) => {
  const theme = useLauncherStore((state) => state.theme);
  const setTheme = useLauncherStore((state) => state.setTheme);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)", zIndex: 1800
            }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0,
              width: "360px", background: theme.surface,
              borderLeft: `1px solid ${theme.border}`,
              boxShadow: "-20px 0 50px rgba(0,0,0,0.3)",
              zIndex: 1801, display: "flex", flexDirection: "column",
              padding: "32px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Settings size={20} style={{ color: theme.accent }} />
                <span style={{ fontWeight: 900, fontSize: "18px", color: theme.text }}>Painel Rápido</span>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
              {/* System Stats Section */}
              <section>
                <label style={{ color: theme.textMuted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "block" }}>
                  Sistema
                </label>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "16px", padding: "16px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Cpu size={16} style={{ color: theme.accent }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: theme.textDim }}>{sysInfo.hostname}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Shield size={16} style={{ color: theme.accent }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: theme.textDim }}>User: {sysInfo.user}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Activity size={16} style={{ color: theme.accent }} />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: theme.textDim }}>MartinsOS v1.0.0</span>
                  </div>
                  <button 
                    onClick={onCheckUpdate}
                    style={{ 
                      marginTop: 8, padding: "10px", borderRadius: "10px", 
                      background: theme.card, border: `1px solid ${theme.border}`,
                      color: theme.text, fontSize: "12px", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      justifyContent: "center"
                    }}
                  >
                    <Download size={14} style={{ color: theme.accent }} /> Verificar Atualizações
                  </button>

                  <button 
                    onClick={() => { onClose(); onOpenSystemSettings(); }}
                    style={{ 
                      padding: "10px", borderRadius: "10px", 
                      background: `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`, 
                      border: "none", color: "#fff", fontSize: "12px", fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      justifyContent: "center"
                    }}
                  >
                    <Settings size={14} /> Redes & Bluetooth
                  </button>
                </div>
              </section>

              {/* Audio Section */}
              <section>
                <label style={{ color: theme.textMuted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "block" }}>
                  Áudio
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Volume2 size={18} style={{ color: theme.textDim }} />
                  <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", position: "relative" }}>
                    <div style={{ width: `${volLevel}%`, height: "100%", background: theme.accent, borderRadius: "3px" }} />
                  </div>
                  <span style={{ fontWeight: 800, fontSize: "14px", color: theme.text, minWidth: "32px" }}>{volLevel}%</span>
                </div>
              </section>

              {/* Themes Section */}
              <section>
                <label style={{ color: theme.textMuted, fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", display: "block" }}>
                  Temas
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {Object.entries(THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      style={{
                        background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`,
                        borderRadius: "12px", padding: "12px", display: "flex", flexDirection: "column",
                        alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s"
                      }}
                    >
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: t.accent }} />
                      <span style={{ fontSize: "10px", fontWeight: 800, color: theme.textDim }}>{t.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div style={{ marginTop: "auto", display: "flex", gap: "8px", color: theme.textMuted, fontSize: "12px", fontWeight: 600 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: "4px", background: theme.card }}>B</div> Voltar
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
