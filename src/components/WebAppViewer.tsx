import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLauncherStore } from "../store/useLauncherStore";
import { BUTTONS } from "../constants/launcher";
import { AppEntry, ControllerMapping } from "../types/launcher";

interface WebAppViewerProps {
  app: AppEntry;
  onClose: () => void;
  mapping: ControllerMapping;
  onAction: (btnId: string, actionId: string) => void;
}

export const WebAppViewer: React.FC<WebAppViewerProps> = ({ app, onClose, mapping, onAction }) => {
  const theme = useLauncherStore((state) => state.theme);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showBar, setShowBar] = useState(true);
  const barTimer = useRef<any>();

  const resetBarTimer = useCallback(() => {
    setShowBar(true);
    clearTimeout(barTimer.current);
    barTimer.current = setTimeout(() => setShowBar(false), 3000);
  }, []);

  useEffect(() => {
    resetBarTimer();
    return () => clearTimeout(barTimer.current);
  }, [resetBarTimer]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const btn = BUTTONS.find(b => b.key === e.key);
      if (!btn) return;
      const actionId = mapping[btn.id];
      resetBarTimer();

      if (actionId === "back" || actionId === "home") { e.preventDefault(); onClose(); return; }
      if (actionId === "fullscreen") {
        e.preventDefault();
        const el = document.fullscreenElement;
        if (el) document.exitFullscreen(); else document.documentElement.requestFullscreen();
        return;
      }

      if (iframeRef.current?.contentWindow && app.controllerPassthrough) {
        try {
          iframeRef.current.contentWindow.dispatchEvent(
            new KeyboardEvent(e.type, { key: e.key, code: e.code, bubbles: true })
          );
        } catch (_) { /* cross-origin: sem acesso */ }
      }
      onAction(btn.id, actionId);
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [mapping, onClose, onAction, resetBarTimer, app.controllerPassthrough]);

  const accentColor = app.iconColor || theme.accent;

  return (
    <div
      onMouseMove={resetBarTimer}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "#000",
        display: "flex", flexDirection: "column",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        background: `linear-gradient(180deg, ${theme.surface}f0, transparent)`,
        padding: "10px 16px",
        display: "flex", alignItems: "center", gap: "12px",
        transition: "opacity .4s, transform .4s",
        opacity: showBar ? 1 : 0,
        transform: showBar ? "translateY(0)" : "translateY(-100%)",
        pointerEvents: showBar ? "all" : "none",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "8px",
          background: app.bgColor || theme.card,
          border: `1.5px solid ${accentColor}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "16px", flexShrink: 0,
        }}>{app.icon}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: theme.text, fontWeight: 800, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {app.name}
          </div>
          <div style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {app.webUrl}
          </div>
        </div>

        {loading && !error && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor, animation: "pulse 1s infinite" }} />
            <span style={{ color: theme.textDim, fontSize: "11px" }}>Carregando...</span>
          </div>
        )}
        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px" }}>⚠️</span>
            <span style={{ color: theme.orange, fontSize: "11px" }}>Erro ao carregar</span>
          </div>
        )}

        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={() => { const el = document.fullscreenElement; if (el) document.exitFullscreen(); else document.documentElement.requestFullscreen(); }}
            style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "5px 10px", color: theme.textDim, cursor: "pointer", fontSize: "12px" }}
            title="Fullscreen"
          >⛶</button>
          <button
            onClick={() => { setError(false); setLoading(true); if (iframeRef.current) iframeRef.current.src = app.webUrl || ""; }}
            style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "5px 10px", color: theme.textDim, cursor: "pointer", fontSize: "12px" }}
            title="Recarregar"
          >🔄</button>
          <button
            onClick={onClose}
            style={{ background: "#3a0a0a", border: `1px solid ${theme.red}44`, borderRadius: "8px", padding: "5px 12px", color: theme.red, cursor: "pointer", fontSize: "12px", fontWeight: 700 }}
          >✕ Fechar</button>
        </div>
      </div>

      {!error ? (
        <iframe
          ref={iframeRef}
          src={app.webUrl}
          title={app.name}
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
          style={{
            flex: 1, border: "none", width: "100%",
            background: app.bgColor || "#000",
          }}
          // @ts-ignore
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-pointer-lock"
        />
      ) : (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "16px",
          background: theme.bg,
        }}>
          <span style={{ fontSize: "52px" }}>{app.icon}</span>
          <div style={{ color: theme.text, fontWeight: 800, fontSize: "18px" }}>{app.name}</div>
          <div style={{ color: theme.textMuted, fontSize: "13px" }}>Não foi possível carregar</div>
          <div style={{
            background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px",
            padding: "10px 18px", fontFamily: "monospace", color: theme.orange, fontSize: "12px",
          }}>{app.webUrl}</div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => { setError(false); setLoading(true); if (iframeRef.current) iframeRef.current.src = app.webUrl || ""; }}
              style={{ background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, border: "none", borderRadius: "10px", padding: "10px 20px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
              🔄 Tentar novamente
            </button>
            <button onClick={() => window.open(app.webUrl, "_blank")}
              style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "10px 20px", color: theme.textDim, cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>
              🌐 Abrir no browser
            </button>
            <div style={{ position: "absolute", top: 12, right: 64, display: "flex", gap: 10 }}>
              <button onClick={() => window.open(app.webUrl, "_blank")}
                style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Abrir em Nova Aba ↗
              </button>
              <button onClick={onClose}
                style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                Fechar (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
