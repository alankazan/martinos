import React, { useState, useEffect } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { AppEntry } from "../../types/launcher";
import { SmartInput } from "../SmartInput";

interface AddAppModalProps {
  onAdd: (app: AppEntry) => void;
  onClose: () => void;
}

export const AddAppModal: React.FC<AddAppModalProps> = ({ onAdd, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [form, setForm] = useState({
    name: "", icon: "📦", exec: "", openUrl: "", category: "Outros",
    bgColor: "#16161f", iconColor: "#c084fc", type: "custom"
  });

  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000095", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "26px", width: "390px", display: "flex", flexDirection: "column", gap: "13px", boxShadow: "0 32px 80px #00000090", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: theme.text, fontWeight: 900, fontSize: "16px" }}>➕ Adicionar App</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        <select value={form.type} onChange={e => u("type", e.target.value)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "9px 14px", color: theme.text, fontSize: "13px", outline: "none" }}>
          {[
            { v: "custom", l: "App / Executável" },
            { v: "youtube", l: "YouTube" },
            { v: "browser_kiosk", l: "Streaming Kiosk" },
            { v: "mpv", l: "Mídia (MPV)" },
            { v: "iptv", l: "IPTV (.m3u)" },
            { v: "docker", l: "Docker Container" }
          ].map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        {[
          { label: "Nome", key: "name", ph: "Nome do app" },
          { label: "Emoji", key: "icon", ph: "🎬" },
          { label: "Exec / Comando", key: "exec", ph: "/usr/bin/app" },
          { label: "URL", key: "openUrl", ph: "http://localhost:8096" }
        ].map(({ label, key, ph }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
            <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={ph} />
          </div>
        ))}
        <div style={{ display: "flex", gap: "12px" }}>
          {[{ label: "Fundo", key: "bgColor" }, { label: "Ícone", key: "iconColor" }].map(({ label, key }) => (
            <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
              <input type="color" value={(form as any)[key]} onChange={e => u(key, e.target.value)} style={{ width: "100%", height: 36, borderRadius: "6px", border: "none", cursor: "pointer" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: `1px solid ${theme.border}`, color: theme.textDim, cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Cancelar</button>
          <button onClick={() => { if (form.name) onAdd({ ...form, id: `manual_${Date.now()}`, source: "manual", running: false, pinned: false } as AppEntry); }} style={{ flex: 2, padding: "10px", borderRadius: "10px", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: "13px" }}>Adicionar</button>
        </div>
      </div>
    </div>
  );
};
