import React, { useState, useEffect } from "react";
import { useLauncherStore } from "../store/useLauncherStore";

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const theme = useLauncherStore((state) => state.theme);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <div style={{ 
        fontSize: "24px", 
        fontWeight: 900, 
        color: "var(--text)", 
        letterSpacing: "-0.04em",
        lineHeight: 1
      }}>
        {timeStr}
      </div>
      <div style={{ 
        fontSize: "11px", 
        fontWeight: 700, 
        color: "var(--text-muted)", 
        textTransform: "uppercase",
        letterSpacing: "0.05em"
      }}>
        {dateStr}
      </div>
    </div>
  );
};
