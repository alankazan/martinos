import React, { useState, useEffect } from "react";

interface ScreensaverProps {
  onDismiss: () => void;
}

export const Screensaver: React.FC<ScreensaverProps> = ({ onDismiss }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const h = () => onDismiss();
    window.addEventListener("keydown", h, true);
    window.addEventListener("mousedown", h, true);
    window.addEventListener("mousemove", h, true);
    return () => {
      window.removeEventListener("keydown", h, true);
      window.removeEventListener("mousedown", h, true);
      window.removeEventListener("mousemove", h, true);
    };
  }, [onDismiss]);

  return (
    <div onClick={onDismiss} style={{
      position: "fixed", inset: 0, background: "#000", zIndex: 9000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: "8px", cursor: "none",
    }}>
      <div style={{ fontSize: "76px", fontWeight: 900, color: "#ffffff18", fontFamily: "monospace", letterSpacing: "-0.04em" }}>
        {now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div style={{ fontSize: "15px", color: "#ffffff0c", fontFamily: "monospace" }}>
        {now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </div>
      <div style={{ position: "absolute", bottom: 28, fontSize: "11px", color: "#ffffff07" }}>
        pressione qualquer tecla para voltar
      </div>
    </div>
  );
};
