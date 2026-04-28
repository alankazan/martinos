import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Delete, Space, CornerDownLeft, Type, ArrowUp } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInput: (char: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  value: string;
}

const KEYS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["SHIFT", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
  ["SPACE", "ENTER"]
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ 
  isOpen, onClose, onInput, onBackspace, onEnter, value 
}) => {
  const theme = useLauncherStore((state) => state.theme);
  const inputMode = useLauncherStore((state) => state.inputMode);
  const [row, setRow] = useState(1);
  const [col, setCol] = useState(0);
  const [isShift, setShift] = useState(false);

  // Simple gamepad/keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") setRow(r => Math.max(0, r - 1));
      if (e.key === "ArrowDown") setRow(r => Math.min(KEYS.length - 1, r + 1));
      if (e.key === "ArrowLeft") setCol(c => Math.max(0, c - 1));
      if (e.key === "ArrowRight") setCol(c => Math.min(KEYS[row].length - 1, c + 1));
      if (e.key === "Enter") {
        const key = KEYS[row][col];
        handleKeyPress(key);
      }
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, row, col]);

  // Adjust column when row changes to avoid out of bounds
  useEffect(() => {
    if (col >= KEYS[row].length) {
      setCol(KEYS[row].length - 1);
    }
  }, [row]);

  const handleKeyPress = (key: string) => {
    if (key === "SHIFT") setShift(!isShift);
    else if (key === "BACKSPACE") onBackspace();
    else if (key === "SPACE") onInput(" ");
    else if (key === "ENTER") onEnter();
    else onInput(isShift ? key.toUpperCase() : key.toLowerCase());
  };

  if (inputMode === "keyboard") return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            height: "45vh", background: "rgba(10, 10, 20, 0.95)",
            backdropFilter: "blur(20px)", borderTop: `2px solid ${theme.accent}`,
            zIndex: 4000, padding: "32px", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "12px",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.5)"
          }}
        >
          {/* Display area */}
          <div style={{ 
            width: "100%", maxWidth: "800px", background: "rgba(255,255,255,0.05)",
            borderRadius: "16px", padding: "12px 24px", marginBottom: "12px",
            border: `1px solid ${theme.border}`, display: "flex", alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span style={{ fontSize: "20px", fontWeight: 700, color: theme.text }}>{value || <span style={{ opacity: 0.3 }}>Digite aqui...</span>}</span>
            <div style={{ width: 2, height: 24, background: theme.accent, animation: "blink 1s infinite" }} />
          </div>

          {/* Keys rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
            {KEYS.map((currentRow, ri) => (
              <div key={ri} style={{ display: "flex", gap: "8px" }}>
                {currentRow.map((key, ci) => {
                  const isFocused = ri === row && ci === col;
                  const isSpecial = ["SHIFT", "BACKSPACE", "SPACE", "ENTER"].includes(key);
                  
                  return (
                    <motion.div
                      key={key}
                      animate={{ 
                        scale: isFocused ? 1.15 : 1,
                        background: isFocused ? theme.accent : "rgba(255,255,255,0.05)",
                        boxShadow: isFocused ? `0 0 20px ${theme.accent}66` : "none"
                      }}
                      style={{
                        minWidth: key === "SPACE" ? "300px" : key === "ENTER" ? "120px" : isSpecial ? "100px" : "64px",
                        height: "56px", borderRadius: "12px", display: "flex",
                        alignItems: "center", justifyContent: "center", cursor: "pointer",
                        border: `1px solid ${isFocused ? theme.accent : theme.border}`,
                        color: isFocused ? "#fff" : theme.text, fontWeight: 800,
                        fontSize: "18px"
                      }}
                      onClick={() => { setRow(ri); setCol(ci); handleKeyPress(key); }}
                    >
                      {key === "SHIFT" && <ArrowUp size={24} color={isShift ? theme.accent : "currentColor"} />}
                      {key === "BACKSPACE" && <Delete size={24} />}
                      {key === "SPACE" && <Space size={24} />}
                      {key === "ENTER" && <CornerDownLeft size={24} />}
                      {!isSpecial && (isShift ? key.toUpperCase() : key.toLowerCase())}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Hints */}
          <div style={{ marginTop: "12px", display: "flex", gap: "24px", color: theme.textMuted, fontSize: "12px", fontWeight: 700 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ padding: "2px 6px", background: theme.card, borderRadius: 4, border: `1px solid ${theme.border}` }}>A</div> Selecionar</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ padding: "2px 6px", background: theme.card, borderRadius: 4, border: `1px solid ${theme.border}` }}>B</div> Voltar</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ padding: "2px 6px", background: theme.card, borderRadius: 4, border: `1px solid ${theme.border}` }}>X</div> Espaço</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ padding: "2px 6px", background: theme.card, borderRadius: 4, border: `1px solid ${theme.border}` }}>Y</div> Shift</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
