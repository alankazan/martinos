import React, { useState, useEffect } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { WEB_PRESETS, CATEGORIES } from "../../constants/launcher";
import { AppEntry } from "../../types/launcher";
import { SmartInput } from "../SmartInput";
import { Badge } from "../Badge";

interface AddWebAppModalProps {
  onAdd: (app: AppEntry) => void;
  onClose: () => void;
}

export const AddWebAppModal: React.FC<AddWebAppModalProps> = ({ onAdd, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [step, setStep] = useState<"preset" | "form">("preset");
  const [form, setForm] = useState({
    name: "", icon: "🌐", webUrl: "http://", category: "Web Apps",
    bgColor: "#0a1a14", iconColor: "#34d399",
    openMode: "iframe" as "iframe" | "kiosk" | "tab",
    pinned: false,
    controllerPassthrough: true,
  });

  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const selectPreset = (p: typeof WEB_PRESETS[0]) => {
    setForm(f => ({
      ...f,
      name: p.name, icon: p.icon,
      webUrl: p.url, bgColor: p.bgColor, iconColor: p.iconColor,
    }));
    setStep("form");
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000095", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, backdropFilter: "blur(10px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "22px", width: "min(520px,96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 40px 100px #00000099" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 14px", borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {step === "form" && (
              <button onClick={() => setStep("preset")} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "8px", padding: "4px 10px", color: theme.textDim, cursor: "pointer", fontSize: "12px" }}>← Voltar</button>
            )}
            <div>
              <div style={{ color: theme.text, fontWeight: 900, fontSize: "16px" }}>🌐 Adicionar Web App</div>
              <div style={{ color: theme.textMuted, fontSize: "10px", letterSpacing: "0.06em" }}>
                {step === "preset" ? "ESCOLHA UM PRESET OU PERSONALIZE" : `CONFIGURAR — ${form.name}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "18px" }}>✕</button>
        </div>

        {step === "preset" && (
          <div style={{ overflowY: "auto", padding: "16px 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
            {WEB_PRESETS.map(p => (
              <button key={p.name} onClick={() => selectPreset(p)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                background: `linear-gradient(135deg,${p.bgColor},${theme.card})`,
                border: `1.5px solid ${p.iconColor}33`,
                borderRadius: "14px", padding: "16px 10px", cursor: "pointer",
                transition: "all .15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.border = `1.5px solid ${p.iconColor}88`; e.currentTarget.style.transform = "scale(1.04)"; }}
                onMouseLeave={e => { e.currentTarget.style.border = `1.5px solid ${p.iconColor}33`; e.currentTarget.style.transform = "scale(1)"; }}
              >
                <span style={{ fontSize: "28px" }}>{p.icon}</span>
                <span style={{ color: theme.text, fontSize: "11px", fontWeight: 700, textAlign: "center" }}>{p.name}</span>
                <span style={{ color: theme.textMuted, fontSize: "9px", fontFamily: "monospace" }}>{p.hint}</span>
              </button>
            ))}
          </div>
        )}

        {step === "form" && (
          <div style={{ overflowY: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", background: form.bgColor, borderRadius: "14px", padding: "14px 18px", border: `2px solid ${form.iconColor}44` }}>
              <span style={{ fontSize: "40px" }}>{form.icon}</span>
              <div>
                <div style={{ color: theme.text, fontWeight: 800, fontSize: "15px" }}>{form.name || "Nome do App"}</div>
                <div style={{ color: theme.textMuted, fontSize: "11px", fontFamily: "monospace", marginTop: "2px" }}>{form.webUrl}</div>
                <div style={{ marginTop: "6px" }}><Badge source="webapp" /></div>
              </div>
            </div>

            {[
              { label: "Nome", key: "name", placeholder: "Meu App Web" },
              { label: "Emoji / Ícone", key: "icon", placeholder: "🌐" },
            ].map(({ label, key, placeholder }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
                <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={placeholder} />
              </div>
            ))}

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>URL / Endereço IP</label>
              <SmartInput value={form.webUrl} onChange={v => u("webUrl", v)} placeholder="http://192.168.1.100:8096" />
              {form.webUrl && !form.webUrl.startsWith("http") && (
                <span style={{ color: theme.orange, fontSize: "10px" }}>⚠️ A URL deve começar com http:// ou https://</span>
              )}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {["192.168.1.", "192.168.0.", "10.0.0.", "localhost:"].map(ip => (
                  <button key={ip} onClick={() => u("webUrl", "http://" + ip)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "6px", padding: "3px 8px", color: theme.textDim, cursor: "pointer", fontSize: "10px", fontFamily: "monospace" }}>
                    {ip}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              {[{ label: "Cor Fundo", key: "bgColor" }, { label: "Cor Ícone", key: "iconColor" }].map(({ label, key }) => (
                <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input type="color" value={(form as any)[key]} onChange={e => u(key, e.target.value)} style={{ width: 36, height: 36, borderRadius: "6px", border: "none", cursor: "pointer" }} />
                    <span style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "monospace" }}>{(form as any)[key]}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>Modo de Abertura</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[
                  { val: "iframe", icon: "🖼️", label: "Embutido", desc: "Abre dentro do launcher" },
                  { val: "kiosk", icon: "🖥️", label: "Kiosk", desc: "Chrome fullscreen externo" },
                  { val: "tab", icon: "🌐", label: "Nova aba", desc: "Abre no browser padrão" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => u("openMode", opt.val)} style={{
                    flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    padding: "10px 6px", borderRadius: "12px", cursor: "pointer",
                    background: form.openMode === opt.val ? `${theme.accentDim}33` : theme.card,
                    border: form.openMode === opt.val ? `1.5px solid ${theme.accent}` : `1.5px solid ${theme.border}`,
                    transition: "all .12s",
                  }}>
                    <span style={{ fontSize: "18px" }}>{opt.icon}</span>
                    <span style={{ color: form.openMode === opt.val ? theme.accent : theme.text, fontWeight: 700, fontSize: "11px" }}>{opt.label}</span>
                    <span style={{ color: theme.textMuted, fontSize: "9px", textAlign: "center", lineHeight: 1.3 }}>{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                { key: "pinned", label: "📌 Fixar na tela principal" },
                { key: "controllerPassthrough", label: "🎮 Repassar inputs do controle" },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                  <input type="checkbox" checked={(form as any)[key]} onChange={e => u(key, e.target.checked)} style={{ width: 16, height: 16, accentColor: theme.accent }} />
                  <span style={{ color: theme.textDim, fontSize: "13px" }}>{label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label style={{ color: theme.textDim, fontSize: "10px", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>Categoria</label>
              <select value={form.category} onChange={e => u("category", e.target.value)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "9px 14px", color: theme.text, fontSize: "13px", outline: "none" }}>
                {CATEGORIES.filter(c => c !== "Todos" && c !== "Fixados").map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "11px", background: "none", border: `1px solid ${theme.border}`, color: theme.textDim, cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>Cancelar</button>
              <button
                disabled={!form.name || !form.webUrl.startsWith("http")}
                onClick={() => onAdd({
                  ...form,
                  id: `webapp_${Date.now()}`,
                  source: "webapp",
                  running: false,
                } as AppEntry)}
                style={{ flex: 2, padding: "11px", borderRadius: "11px", background: form.name && form.webUrl.startsWith("http") ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : "#333", border: "none", color: "#fff", cursor: form.name ? "pointer" : "not-allowed", fontWeight: 800, fontSize: "13px", opacity: form.name && form.webUrl.startsWith("http") ? 1 : 0.5 }}
              >🌐 Adicionar Web App</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
