import React, { useState, useRef } from "react";
import { useLauncherStore } from "../store/useLauncherStore";
import { NATIVE_KB } from "../utils/system";
import { VirtualKeyboard } from "./VirtualKeyboard";

interface SmartInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export const SmartInput: React.FC<SmartInputProps> = ({ value, onChange, placeholder = "", style = {} }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  if (NATIVE_KB.has) {
    return (
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            background: theme.card,
            border: `1.5px solid ${theme.border}`,
            borderRadius: "10px", padding: "9px 14px",
            color: value ? theme.text : theme.textMuted,
            fontSize: "13px", outline: "none",
            transition: "border-color .15s, box-shadow .15s",
            fontFamily: "'Courier New',monospace",
            width: "100%", boxSizing: "border-box",
            ...style,
          }}
          onFocus={e => { e.target.style.borderColor = theme.accent; e.target.style.boxShadow = `0 0 0 3px ${theme.accent}22`; }}
          onBlur={e => { e.target.style.borderColor = theme.border; e.target.style.boxShadow = "none"; }}
        />
        {value && (
          <button onClick={() => onChange("")} style={{
            position: "absolute", right: 8, background: "none", border: "none",
            color: theme.textMuted, cursor: "pointer", fontSize: "13px", padding: "2px 4px",
          }}>✕</button>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <input
          ref={ref}
          readOnly
          value={value}
          placeholder={placeholder}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          style={{
            background: theme.card,
            border: `1.5px solid ${open ? theme.accent : theme.border}`,
            borderRadius: "10px", padding: "9px 14px",
            color: value ? theme.text : theme.textMuted,
            fontSize: "13px", outline: "none", cursor: "pointer",
            transition: "border-color .15s, box-shadow .15s",
            fontFamily: "'Courier New',monospace",
            boxShadow: open ? `0 0 0 3px ${theme.accent}22` : "none",
            width: "100%", boxSizing: "border-box",
            ...style,
          }}
        />
        {value && (
          <button onClick={() => onChange("")} style={{
            position: "absolute", right: 8, background: "none", border: "none",
            color: theme.textMuted, cursor: "pointer", fontSize: "13px", padding: "2px 4px",
          }}>✕</button>
        )}
      </div>
      {open && (
        <VirtualKeyboard
          value={value}
          onChange={onChange}
          onClose={() => { setOpen(false); ref.current?.blur(); }}
          placeholder={placeholder}
        />
      )}
    </>
  );
};
