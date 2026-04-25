import React, { useState, useEffect, useCallback, useContext } from "react";
import { useLauncherStore } from "../store/useLauncherStore";

const KB_ROWS = {
  lower: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"],
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l", "↵"],
    ["⇧", "z", "x", "c", "v", "b", "n", "m", ",", ".", "⇧"],
    ["@", "_", "-", "ESPAÇO", "!", "?", "✕"],
  ],
  upper: [
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "⌫"],
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "↵"],
    ["⇧", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "⇧"],
    ["@", "_", "-", "ESPAÇO", "!", "?", "✕"],
  ],
  sym: [
    ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "⌫"],
    ["+", "=", "[", "]", "{", "}", "\\", "|", "<", ">"],
    [";", ":", "'", '"', "`", "~", "/", "?", ",", ".", "↵"],
    ["⇧", "1", "2", "3", "4", "5", "6", "7", "8", "9", "⇧"],
    ["abc", "_", "-", "ESPAÇO", "!", "?", "✕"],
  ],
};

const KW: Record<string, number> = { "ESPAÇO": 3.4, "⌫": 1.5, "↵": 1.5, "⇧": 1.5, "✕": 1.3, "abc": 1.5 };

interface VirtualKeyboardProps {
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  placeholder?: string;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ value, onChange, onClose, placeholder = "" }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [layout, setLayout] = useState<keyof typeof KB_ROWS>("lower");
  const [focus, setFocus] = useState({ row: 4, col: 3 });
  const rows = KB_ROWS[layout];

  const press = useCallback((key: string) => {
    if (key === "⌫") { onChange(value.slice(0, -1)); return; }
    if (key === "↵" || key === "✕") { onClose(); return; }
    if (key === "⇧") { setLayout(l => l === "lower" ? "upper" : l === "upper" ? "sym" : "lower"); return; }
    if (key === "abc") { setLayout("lower"); return; }
    if (key === "ESPAÇO") { onChange(value + " "); return; }
    onChange(value + key);
  }, [value, onChange, onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const s = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Enter", " ", "Escape"];
      if (s.includes(e.key)) { e.preventDefault(); e.stopPropagation(); }
      if (e.key === "ArrowRight") setFocus(f => ({ ...f, col: Math.min(f.col + 1, rows[f.row].length - 1) }));
      else if (e.key === "ArrowLeft") setFocus(f => ({ ...f, col: Math.max(f.col - 1, 0) }));
      else if (e.key === "ArrowDown") setFocus(f => { const r = Math.min(f.row + 1, rows.length - 1); return { row: r, col: Math.min(f.col, rows[r].length - 1) }; });
      else if (e.key === "ArrowUp") setFocus(f => { const r = Math.max(f.row - 1, 0); return { row: r, col: Math.min(f.col, rows[r].length - 1) }; });
      else if (e.key === "Enter" || e.key === " ") press(rows[focus.row][focus.col]);
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [focus, rows, press, onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", background: "linear-gradient(to top,#000000bb 55%,transparent)", pointerEvents: "none" }}>
      <div style={{ pointerEvents: "all", width: "min(860px,99vw)", background: "linear-gradient(160deg,#111128,#090916)", borderRadius: "22px 22px 0 0", border: `1px solid ${theme.border}`, borderBottom: "none", boxShadow: "0 -20px 70px #00000090", padding: "14px 14px 18px", animation: "kbUp .26s cubic-bezier(.2,.8,.4,1)" }}>
        <div style={{ background: theme.card, border: `1.5px solid ${theme.accent}66`, borderRadius: "12px", padding: "10px 16px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", boxShadow: `0 0 24px ${theme.accent}18` }}>
          <span style={{ color: theme.textMuted, fontSize: "16px" }}>⌨️</span>
          <span style={{ flex: 1, fontSize: "17px", color: value ? theme.text : theme.textMuted, fontFamily: "'Courier New',monospace", letterSpacing: "0.04em", minHeight: "22px" }}>
            {value || placeholder}
            <span style={{ display: "inline-block", width: 2, height: "1.1em", background: theme.accent, marginLeft: 3, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />
          </span>
          {value && <button onClick={() => onChange("")} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "16px", padding: "2px 6px" }}>✕</button>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: "flex", justifyContent: "center", gap: "4px" }}>
              {row.map((key, ci) => {
                const isFoc = focus.row === ri && focus.col === ci;
                const isSpc = key === "ESPAÇO";
                const isSpec = ["⌫", "↵", "⇧", "✕", "abc"].includes(key);
                return (
                  <button key={`${ri}-${ci}`} onClick={() => press(key)} onMouseEnter={() => setFocus({ row: ri, col: ci })} style={{ flex: KW[key] || 1, minWidth: isSpc ? 120 : 34, maxWidth: isSpc ? 220 : undefined, height: 48, borderRadius: "10px", border: isFoc ? `2px solid ${theme.accent}` : `1.5px solid ${isSpec ? "#222238" : "#1a1a2e"}`, background: isFoc ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : isSpec ? "#1a1a2c" : "#15152a", color: isFoc ? "#fff" : isSpec ? theme.textDim : theme.text, fontSize: isSpc ? "11px" : key.length > 1 ? "14px" : "16px", fontWeight: isSpec || isFoc ? 800 : 500, cursor: "pointer", transition: "all .1s ease", boxShadow: isFoc ? `0 0 16px ${theme.accent}77,0 3px 10px #00000070` : "0 2px 5px #00000050", transform: isFoc ? "translateY(-3px)" : "none", fontFamily: "'Trebuchet MS',sans-serif", userSelect: "none" }}>
                    {isSpc ? "ESPAÇO" : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "18px", marginTop: "10px" }}>
          {[["←→↑↓", "Navegar"], ["Enter", "Digitar"], ["Esc", "Fechar"]].map(([k, l]) => (
            <span key={k} style={{ fontSize: "10px", color: theme.textMuted }}>
              <span style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "3px", padding: "1px 5px", color: theme.textDim, fontFamily: "monospace" }}>{k}</span>{" "}{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
