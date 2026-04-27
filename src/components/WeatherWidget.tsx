import React, { useState, useEffect } from "react";
import { Cloud, Sun, CloudRain, Thermometer } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";

export const WeatherWidget: React.FC = () => {
  const theme = useLauncherStore((state) => state.theme);
  const [weather, setWeather] = useState({ temp: 24, condition: "Ensolarado", city: "São Paulo" });

  // In a real app, we would fetch from an API here
  useEffect(() => {
    // Mock update
    const timer = setInterval(() => {
      setWeather(prev => ({ ...prev, temp: prev.temp + (Math.random() > 0.5 ? 0.1 : -0.1) }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", padding: "6px 14px", borderRadius: "10px", border: `1px solid ${theme.border}` }}>
      <Sun size={20} style={{ color: "#facc15" }} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "14px", fontWeight: 900, color: theme.text, lineHeight: 1 }}>{weather.temp.toFixed(0)}°C</div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: theme.textMuted, textTransform: "uppercase" }}>{weather.city}</div>
      </div>
    </div>
  );
};
