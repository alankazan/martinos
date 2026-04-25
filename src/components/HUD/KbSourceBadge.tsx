import React from "react";
import { useLauncherStore } from "../../store/useLauncherStore";

interface KbSourceBadgeProps {
  source: string;
  native: boolean;
}

export const KbSourceBadge: React.FC<KbSourceBadgeProps> = ({ source, native }) => {
  const theme = useLauncherStore((state) => state.theme);
  return (
    <div style={{
      position: "fixed", bottom: 8, left: 8, zIndex: 9999,
      background: native ? "#052e16" : "#1a1a2e",
      border: `1px solid ${native ? theme.green : theme.accentDim}44`,
      borderRadius: "8px", padding: "4px 10px",
      display: "flex", alignItems: "center", gap: "6px",
      pointerEvents: "none", opacity: 0.75,
    }}>
      <span style={{ fontSize: "11px" }}>{native ? "⌨️🟢" : "⌨️🟣"}</span>
      <span style={{
        color: native ? theme.green : theme.accent,
        fontSize: "9px", fontFamily: "monospace", fontWeight: 700,
      }}>
        {native ? "TECLADO NATIVO" : "TECLADO EMBUTIDO"}
      </span>
      <span style={{ color: theme.textMuted, fontSize: "8px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {source}
      </span>
    </div>
  );
};
