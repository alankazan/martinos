import React, { useState, useEffect } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { CATEGORIES } from "../../constants/launcher";
import { AppEntry } from "../../types/launcher";
import { SmartInput } from "../SmartInput";

interface EditModalProps {
  app: AppEntry;
  onSave: (app: AppEntry) => void;
  onClose: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({ app, onSave, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [form, setForm] = useState({
    name: app.name,
    icon: app.icon,
    iconColor: app.iconColor || "#c084fc",
    bgColor: app.bgColor || "#16161f",
    category: app.category || "Outros",
    pinned: app.pinned || false,
    openUrl: app.openUrl || ""
  });

  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000095", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "20px", padding: "26px", width: "370px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 32px 80px #00000090", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: theme.text, fontWeight: 900, fontSize: "16px" }}>✏️ Editar App</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: form.bgColor, borderRadius: "14px", padding: "20px", border: `2px solid ${form.iconColor}44` }}>
          <span style={{ fontSize: "52px" }}>{form.icon}</span>
        </div>
        {[
          { label: "Nome", key: "name", placeholder: "Nome do app" },
          { label: "Emoji", key: "icon", placeholder: "🎬" },
          { label: "URL", key: "openUrl", placeholder: "http://localhost:8096" }
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
            <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={placeholder} />
          </div>
        ))}
        <div style={{ display: "flex", gap: "12px" }}>
          {[{ label: "Fundo", key: "bgColor" }, { label: "Ícone", key: "iconColor" }].map(({ label, key }) => (
            <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="color" value={(form as any)[key]} onChange={e => u(key, e.target.value)} style={{ width: 36, height: 36, borderRadius: "6px", border: "none", cursor: "pointer" }} />
                <span style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "monospace" }}>{(form as any)[key]}</span>
              </div>
            </div>
          ))}
        </div>
        <select value={form.category} onChange={e => u("category", e.target.value)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "9px 14px", color: theme.text, fontSize: "13px", outline: "none" }}>
          {CATEGORIES.filter(c => c !== "Todos" && c !== "Fixados").map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
          <input type="checkbox" checked={form.pinned} onChange={e => u("pinned", e.target.checked)} style={{ width: 16, height: 16, accentColor: theme.accent }} />
          <span style={{ color: theme.textDim, fontSize: "13px" }}>📌 Fixar na tela principal</span>
        </label>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "none", border: `1px solid ${theme.border}`, color: theme.textDim, cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Cancelar</button>
          <button onClick={() => onSave({ ...app, ...form })} style={{ flex: 2, padding: "10px", borderRadius: "10px", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, border: "none", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: "13px" }}>Salvar</button>
        </div>
      </div>
    </div>
  );
};
