import React from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { BUTTONS, ACTIONS } from "../../constants/launcher";
import { HUDEvent } from "../../types/launcher";

interface ButtonHUDProps {
  event: HUDEvent | null;
}

export const ButtonHUD: React.FC<ButtonHUDProps> = ({ event }) => {
  const theme = useLauncherStore((state) => state.theme);
  if (!event) return null;
  const btn = BUTTONS.find(b => b.id === event.btnId);
  const action = ACTIONS[event.actionId];
  if (!btn || !action || action.label === "(sem ação)") return null;

  return (
    <div style={{
      position: "fixed", top: 24, right: 24, background: theme.surface,
      border: `1.5px solid ${btn.color}55`, borderRadius: "14px", padding: "10px 16px",
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: `0 4px 20px ${btn.color}33`, zIndex: 800,
      animation: "hudIn .15s ease", pointerEvents: "none",
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: btn.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 900, fontSize: "11px", color: "#fff",
        boxShadow: `0 0 10px ${btn.color}88`,
      }}>{btn.label.charAt(0)}</div>
      <div>
        <div style={{ color: theme.textMuted, fontSize: "10px", letterSpacing: "0.06em" }}>{btn.label}</div>
        <div style={{ color: theme.text, fontWeight: 800, fontSize: "13px" }}>{action.icon} {action.label}</div>
      </div>
    </div>
  );
};
