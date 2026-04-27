import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, RefreshCw, LogOut, X } from "lucide-react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { isElectron } from "../../utils/system";

interface PowerModalProps {
  onPowerOff: () => void;
  onReboot: () => void;
  onQuit: () => void;
  onClose: () => void;
}

export const PowerModal: React.FC<PowerModalProps> = ({
  onPowerOff,
  onReboot,
  onQuit,
  onClose,
}) => {
  const theme = useLauncherStore((state) => state.theme);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = [
    { id: "reboot", label: "Reiniciar", icon: RefreshCw, action: onReboot, color: theme.blue || "#3b82f6" },
    { id: "poweroff", label: "Desligar", icon: Power, action: onPowerOff, color: theme.red || "#ef4444" },
    ...(isElectron ? [{ id: "quit", label: "Sair p/ Desktop", icon: LogOut, action: onQuit, color: theme.orange || "#f59e0b" }] : []),
    { id: "cancel", label: "Cancelar", icon: X, action: onClose, color: theme.textMuted },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % options.length);
      } else if (e.key === "Enter") {
        options[selectedIndex].action();
      } else if (e.key === "Escape" || e.key === "Backspace") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, options, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 2000, backdropFilter: "blur(12px)"
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: "28px",
          padding: "40px",
          width: "560px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)"
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2 style={{ color: theme.text, fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>
            Opções de Energia
          </h2>
          <p style={{ color: theme.textDim, fontSize: "15px", marginTop: "8px", fontWeight: 500 }}>
            O que você deseja fazer agora?
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", width: "100%" }}>
          {options.map((opt, idx) => {
            const isFocused = idx === selectedIndex;
            const Icon = opt.icon;
            return (
              <motion.button
                key={opt.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={opt.action}
                animate={{
                  scale: isFocused ? 1.05 : 1,
                  backgroundColor: isFocused ? `${opt.color}22` : "rgba(255,255,255,0.03)",
                  borderColor: isFocused ? opt.color : theme.border,
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                  padding: "24px", borderRadius: "20px", border: "2px solid transparent",
                  cursor: "pointer", color: isFocused ? opt.color : theme.textDim,
                  transition: "all 0.2s ease", outline: "none", background: "none"
                }}
              >
                <div style={{
                  width: "56px", height: "56px", borderRadius: "16px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: isFocused ? opt.color : "rgba(255,255,255,0.05)",
                  color: isFocused ? "#fff" : theme.textMuted,
                  boxShadow: isFocused ? `0 8px 24px ${opt.color}44` : "none"
                }}>
                  <Icon size={28} />
                </div>
                <span style={{ fontWeight: 800, fontSize: "14px" }}>{opt.label}</span>
              </motion.button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: "12px", marginTop: "8px", color: theme.textMuted, fontSize: "12px", fontWeight: 600 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: "4px", background: theme.card }}>A</div> Selecionar
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: "4px", background: theme.card }}>B</div> Voltar
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
