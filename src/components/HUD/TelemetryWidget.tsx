import React from "react";
import { motion } from "framer-motion";
import { Cpu, Activity, Thermometer } from "lucide-react";
import { useLauncherStore } from "../../store/useLauncherStore";

export const TelemetryWidget: React.FC = () => {
  const telemetry = useLauncherStore((state) => state.telemetry);
  const theme = useLauncherStore((state) => state.theme);

  const stats = [
    { label: "CPU", value: telemetry.cpu, icon: Cpu, unit: "%", color: theme.accent },
    { label: "RAM", value: telemetry.ram, icon: Activity, unit: "%", color: theme.blue || "#3b82f6" },
    { label: "TEMP", value: telemetry.temp, icon: Thermometer, unit: "°C", color: telemetry.temp > 70 ? theme.red : theme.green || "#10b981" },
  ];

  return (
    <div style={{
      display: "flex", gap: 12, padding: "8px 16px",
      background: "rgba(0,0,0,0.2)", backdropFilter: "blur(10px)",
      borderRadius: 12, border: `1px solid ${theme.border}`,
      boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
    }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <s.icon size={14} style={{ color: s.color }} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>
              {Math.round(s.value)}{s.unit}
            </span>
          </div>
          {i < stats.length - 1 && <div style={{ width: 1, height: 16, background: theme.border, marginLeft: 4 }} />}
        </div>
      ))}
    </div>
  );
};
