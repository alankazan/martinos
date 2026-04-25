import React from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { ContainerNotifEvent } from "../../types/launcher";

interface ContainerNotifProps {
  event: ContainerNotifEvent | null;
}

export const ContainerNotif: React.FC<ContainerNotifProps> = ({ event }) => {
  const theme = useLauncherStore((state) => state.theme);
  if (!event) return null;
  const color = event.running ? theme.green : theme.red;
  return (
    <div style={{
      position: "fixed", top: 72, right: 24, background: theme.surface,
      border: `1.5px solid ${color}55`, borderRadius: "14px", padding: "10px 18px",
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: `0 4px 20px ${color}22`, zIndex: 850,
      animation: "hudIn .2s ease", pointerEvents: "none",
    }}>
      <span style={{ fontSize: "20px" }}>{event.icon}</span>
      <div>
        <div style={{ color: theme.text, fontWeight: 800, fontSize: "12px" }}>{event.name}</div>
        <div style={{ color, fontSize: "11px" }}>{event.running ? "container iniciado" : "container parado"}</div>
      </div>
    </div>
  );
};
