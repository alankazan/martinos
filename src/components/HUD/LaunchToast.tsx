import React, { useEffect } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { AppEntry } from "../../types/launcher";

interface LaunchToastProps {
  app: AppEntry;
  onClose: () => void;
}

export const LaunchToast: React.FC<LaunchToastProps> = ({ app, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
      background: theme.surface, border: `1px solid ${(app.iconColor || theme.accent) + "55"}`,
      borderRadius: "14px", padding: "12px 24px", display: "flex", alignItems: "center", gap: "12px",
      boxShadow: "0 8px 32px #00000060", zIndex: 900, animation: "kbUp .25s ease",
    }}>
      <span style={{ fontSize: "24px" }}>{app.icon}</span>
      <div>
        <div style={{ color: theme.text, fontWeight: 800, fontSize: "13px" }}>Iniciando {app.name}</div>
        <div style={{ color: theme.textDim, fontSize: "11px" }}>
          {(app.source === "docker" || app.source === "podman")
            ? app.running ? "Container ativo → abrindo" : "Iniciando container..."
            : `Lançando via ${app.source}`}
        </div>
      </div>
      <div style={{
        width: 6, height: 6, borderRadius: "50%",
        background: app.iconColor || theme.accent,
        boxShadow: `0 0 8px ${app.iconColor || theme.accent}`,
        animation: "pulse 1s infinite",
      }} />
    </div>
  );
};
