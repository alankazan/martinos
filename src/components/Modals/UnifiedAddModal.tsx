import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Globe, Container, Plus, ChevronLeft } from "lucide-react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { AppEntry } from "../../types/launcher";
import { SmartInput } from "../SmartInput";
import { Badge } from "../Badge";
import { WEB_PRESETS, CATEGORIES } from "../../constants/launcher";

type Tab = "native" | "webapp" | "docker";

interface UnifiedAddModalProps {
  onAdd: (app: AppEntry) => void;
  onClose: () => void;
}

// ── Native App Form ────────────────────────────────────────────────
function NativeForm({ onAdd, theme }: { onAdd: (app: AppEntry) => void; theme: any }) {
  const [form, setForm] = useState({
    name: "", icon: "📦", exec: "", openUrl: "", category: "Outros",
    bgColor: "#16161f", iconColor: "#c084fc", type: "custom"
  });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const APP_TYPES = [
    { v: "custom", l: "🖥️ App / Executável" },
    { v: "youtube", l: "▶️ YouTube" },
    { v: "browser_kiosk", l: "📺 Streaming Kiosk" },
    { v: "mpv", l: "🎬 Mídia (MPV)" },
    { v: "iptv", l: "📡 IPTV (.m3u)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: form.bgColor, borderRadius: 14, padding: "14px 18px", border: `2px solid ${form.iconColor}44` }}>
        <span style={{ fontSize: 40 }}>{form.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{form.name || "Nome do App"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2, fontFamily: "monospace" }}>{form.exec || form.openUrl || "Sem comando definido"}</div>
        </div>
      </div>

      <select value={form.type} onChange={e => u("type", e.target.value)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "9px 14px", color: theme.text, fontSize: 13, outline: "none" }}>
        {APP_TYPES.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>

      {[
        { label: "Nome", key: "name", ph: "Nome do app" },
        { label: "Emoji / Ícone", key: "icon", ph: "📦" },
        { label: "Exec / Comando", key: "exec", ph: "/usr/bin/vlc" },
        { label: "URL (opcional)", key: "openUrl", ph: "http://localhost:8096" },
      ].map(({ label, key, ph }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
          <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={ph} />
        </div>
      ))}

      <div style={{ display: "flex", gap: 12 }}>
        {[{ label: "Cor Fundo", key: "bgColor" }, { label: "Cor Ícone", key: "iconColor" }].map(({ label, key }) => (
          <div key={key} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
            <input type="color" value={(form as any)[key]} onChange={e => u(key, e.target.value)} style={{ width: "100%", height: 36, borderRadius: 6, border: "none", cursor: "pointer" }} />
          </div>
        ))}
      </div>

      <button
        disabled={!form.name}
        onClick={() => form.name && onAdd({ ...form, id: `manual_${Date.now()}`, source: "manual", running: false, pinned: false } as AppEntry)}
        style={{ padding: "13px", borderRadius: 12, border: "none", background: form.name ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : theme.card, color: "#fff", fontWeight: 800, fontSize: 14, cursor: form.name ? "pointer" : "not-allowed", opacity: form.name ? 1 : 0.5 }}
      >
        <Plus size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} /> Adicionar App
      </button>
    </div>
  );
}

// ── Web App Form ────────────────────────────────────────────────────
function WebAppForm({ onAdd, theme }: { onAdd: (app: AppEntry) => void; theme: any }) {
  const [step, setStep] = useState<"preset" | "form">("preset");
  const [form, setForm] = useState({
    name: "", icon: "🌐", webUrl: "http://", category: "Web Apps",
    bgColor: "#0a1a14", iconColor: "#34d399",
    openMode: "iframe" as "iframe" | "kiosk" | "tab",
    pinned: false, controllerPassthrough: true,
  });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  if (step === "preset") return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
      {/* Custom option */}
      <button onClick={() => setStep("form")} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: theme.card, border: `1.5px dashed ${theme.border}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer" }}>
        <span style={{ fontSize: 28 }}>✏️</span>
        <span style={{ color: theme.text, fontSize: 11, fontWeight: 700 }}>Personalizado</span>
        <span style={{ color: theme.textMuted, fontSize: 9, fontFamily: "monospace" }}>URL própria</span>
      </button>
      {WEB_PRESETS.map(p => (
        <button key={p.name} onClick={() => { setForm(f => ({ ...f, name: p.name, icon: p.icon, webUrl: p.url, bgColor: p.bgColor, iconColor: p.iconColor })); setStep("form"); }}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: `linear-gradient(135deg,${p.bgColor},${theme.card})`, border: `1.5px solid ${p.iconColor}33`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", transition: "all .15s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.04)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: 28 }}>{p.icon}</span>
          <span style={{ color: theme.text, fontSize: 11, fontWeight: 700, textAlign: "center" }}>{p.name}</span>
          <span style={{ color: theme.textMuted, fontSize: 9, fontFamily: "monospace" }}>{p.hint}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button onClick={() => setStep("preset")} style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${theme.border}`, borderRadius: 8, padding: "4px 12px", color: theme.textDim, cursor: "pointer", fontSize: 12 }}>
        <ChevronLeft size={14} /> Voltar aos Presets
      </button>

      {/* Preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, background: form.bgColor, borderRadius: 14, padding: "14px 18px", border: `2px solid ${form.iconColor}44` }}>
        <span style={{ fontSize: 40 }}>{form.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>{form.name || "Nome do App"}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2, fontFamily: "monospace" }}>{form.webUrl}</div>
          <div style={{ marginTop: 6 }}><Badge source="webapp" /></div>
        </div>
      </div>

      {[{ label: "Nome", key: "name", ph: "Meu Serviço" }, { label: "Emoji / Ícone", key: "icon", ph: "🌐" }].map(({ label, key, ph }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
          <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={ph} />
        </div>
      ))}

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>URL / Endereço</label>
        <SmartInput value={form.webUrl} onChange={v => u("webUrl", v)} placeholder="http://192.168.1.100:8096" />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
          {["192.168.1.", "192.168.0.", "localhost:"].map(ip => (
            <button key={ip} onClick={() => u("webUrl", "http://" + ip)} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 6, padding: "3px 8px", color: theme.textDim, cursor: "pointer", fontSize: 10, fontFamily: "monospace" }}>{ip}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>Modo de Abertura</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[{ val: "iframe", icon: "🖼️", label: "Embutido" }, { val: "kiosk", icon: "🖥️", label: "Kiosk" }, { val: "tab", icon: "🌐", label: "Nova Aba" }].map(opt => (
            <button key={opt.val} onClick={() => u("openMode", opt.val)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 6px", borderRadius: 12, cursor: "pointer", background: form.openMode === opt.val ? `${theme.accentDim}33` : theme.card, border: form.openMode === opt.val ? `1.5px solid ${theme.accent}` : `1.5px solid ${theme.border}` }}>
              <span style={{ fontSize: 18 }}>{opt.icon}</span>
              <span style={{ color: form.openMode === opt.val ? theme.accent : theme.text, fontWeight: 700, fontSize: 11 }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!form.name || !form.webUrl.startsWith("http")}
        onClick={() => form.name && form.webUrl.startsWith("http") && onAdd({ ...form, id: `webapp_${Date.now()}`, source: "webapp", running: false } as AppEntry)}
        style={{ padding: "13px", borderRadius: 12, border: "none", background: form.name && form.webUrl.startsWith("http") ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : theme.card, color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", opacity: form.name && form.webUrl.startsWith("http") ? 1 : 0.5 }}
      >
        <Globe size={16} style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} /> Adicionar Web App
      </button>
    </div>
  );
}

// ── Docker Form ─────────────────────────────────────────────────────
function DockerForm({ onAdd, theme }: { onAdd: (app: AppEntry) => void; theme: any }) {
  const [form, setForm] = useState({ name: "", icon: "🐳", bgColor: "#001218", iconColor: "#13BEF9" });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const DOCKER_PRESETS = [
    { name: "Portainer", icon: "🐳", color: "#13BEF9" },
    { name: "Plex", icon: "🎬", color: "#e5a00d" },
    { name: "Jellyfin", icon: "📺", color: "#9b59b6" },
    { name: "Home Assistant", icon: "🏠", color: "#18bcf2" },
    { name: "Sonarr", icon: "📡", color: "#35c5f4" },
    { name: "Radarr", icon: "🎥", color: "#ffc230" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "rgba(19,190,249,0.06)", border: "1px solid #13BEF922", borderRadius: 12, padding: "10px 14px", color: "#13BEF9bb", fontSize: 12 }}>
        🐳 Adicione containers Docker já em execução no seu sistema. O MartinsOS irá monitorar o status em tempo real.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {DOCKER_PRESETS.map(p => (
          <button key={p.name} onClick={() => setForm(f => ({ ...f, name: p.name, icon: p.icon, iconColor: p.color }))}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", borderRadius: 12, cursor: "pointer", background: form.name === p.name ? `${p.color}22` : theme.card, border: form.name === p.name ? `1.5px solid ${p.color}` : `1.5px solid ${theme.border}`, transition: "all .1s" }}>
            <span style={{ fontSize: 24 }}>{p.icon}</span>
            <span style={{ color: theme.text, fontSize: 10, fontWeight: 700 }}>{p.name}</span>
          </button>
        ))}
      </div>

      {[{ label: "Nome do Container", key: "name", ph: "meu-container" }, { label: "Emoji / Ícone", key: "icon", ph: "🐳" }].map(({ label, key, ph }) => (
        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ color: theme.textDim, fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase" }}>{label}</label>
          <SmartInput value={(form as any)[key]} onChange={v => u(key, v)} placeholder={ph} />
        </div>
      ))}

      <button
        disabled={!form.name}
        onClick={() => form.name && onAdd({ ...form, id: `docker_${Date.now()}`, source: "docker", category: "Docker", running: false, pinned: false } as AppEntry)}
        style={{ padding: "13px", borderRadius: 12, border: "none", background: form.name ? "linear-gradient(135deg,#004d6e,#13BEF9)" : theme.card, color: "#fff", fontWeight: 800, fontSize: 14, cursor: form.name ? "pointer" : "not-allowed", opacity: form.name ? 1 : 0.5 }}
      >
        🐳 Adicionar Container
      </button>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────
export const UnifiedAddModal: React.FC<UnifiedAddModalProps> = ({ onAdd, onClose }) => {
  const theme = useLauncherStore(state => state.theme);
  const [tab, setTab] = useState<Tab>("native");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
    { id: "native", icon: <Monitor size={16} />, label: "App Nativo" },
    { id: "webapp", icon: <Globe size={16} />, label: "Web App" },
    { id: "docker", icon: <Container size={16} />, label: "Docker" },
  ];

  const handleAdd = (app: AppEntry) => {
    onAdd(app);
    onClose();
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1500, backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 16 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: 24,
          width: "min(560px, 96vw)", maxHeight: "90vh", display: "flex", flexDirection: "column",
          boxShadow: "0 40px 100px rgba(0,0,0,0.6)", overflow: "hidden",
          fontFamily: "'Outfit', sans-serif"
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "20px 24px 0", flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: theme.text }}>Adicionar ao MartinsOS</div>
            <div style={{ color: theme.textMuted, fontSize: 11, marginTop: 2, letterSpacing: "0.05em" }}>APPS · WEB APPS · DOCKER</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: theme.textMuted, cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "16px 24px 0", flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "10px", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 13,
                border: "none",
                background: tab === t.id ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : theme.card,
                color: tab === t.id ? "#fff" : theme.textDim,
                boxShadow: tab === t.id ? `0 4px 14px ${theme.accent}44` : "none",
                transition: "all .15s"
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 24px" }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
              {tab === "native" && <NativeForm onAdd={handleAdd} theme={theme} />}
              {tab === "webapp" && <WebAppForm onAdd={handleAdd} theme={theme} />}
              {tab === "docker" && <DockerForm onAdd={handleAdd} theme={theme} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
