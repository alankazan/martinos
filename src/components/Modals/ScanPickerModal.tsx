import React, { useState } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { AppEntry } from "../../types/launcher";

interface ScanPickerModalProps {
  items: AppEntry[];
  onConfirm: (selected: AppEntry[]) => void;
  onClose: () => void;
}

export const ScanPickerModal: React.FC<ScanPickerModalProps> = ({ items, onConfirm, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map(a => a.id)));

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () =>
    setSelected(selected.size === items.length ? new Set() : new Set(items.map(a => a.id)));

  const nativeApps = items.filter(a => a.source === "native");
  const dockerItems = items.filter(a => a.source === "docker" || a.source === "podman");

  const toAdd = items.filter(a => !a.alreadyAdded && selected.has(a.id)).length;
  const toRemove = items.filter(a => a.alreadyAdded && !selected.has(a.id)).length;

  const rowStyle = (id: string) => ({
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px",
    background: selected.has(id) ? theme.cardHover : theme.card,
    border: `1px solid ${selected.has(id) ? theme.accent : theme.border}`,
    borderRadius: 10, cursor: "pointer", transition: "border-color .15s",
  });

  const sectionLabel = (txt: string) => (
    <div style={{ color: theme.textDim, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, marginTop: 4 }}>{txt}</div>
  );

  const badge = (app: AppEntry) => app.alreadyAdded
    ? <span style={{ fontSize: "10px", fontWeight: 700, color: theme.green, background: "#052e1644", border: `1px solid ${theme.green}44`, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>NO SISTEMA</span>
    : <span style={{ fontSize: "10px", fontWeight: 700, color: theme.accent, background: `${theme.accent}11`, border: `1px solid ${theme.accent}44`, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>NOVO</span>;

  const confirmLabel = () => {
    const parts = [];
    if (toAdd > 0) parts.push(`+${toAdd} adicionar`);
    if (toRemove > 0) parts.push(`−${toRemove} remover`);
    return parts.length ? parts.join("  ·  ") : "Confirmar";
  };
  const hasChanges = toAdd > 0 || toRemove > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "18px", width: "min(680px,95vw)", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px #0008" }}>
        <div style={{ padding: "20px 24px 14px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ fontWeight: 900, fontSize: "17px" }}>🔍 Apps Encontrados</div>
          <div style={{ color: theme.textDim, fontSize: "12px", marginTop: 4, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span>{items.length} encontrado{items.length !== 1 ? "s" : ""}</span>
            {toAdd > 0 && <span style={{ color: theme.accent }}>+{toAdd} a adicionar</span>}
            {toRemove > 0 && <span style={{ color: theme.red }}>−{toRemove} a remover</span>}
          </div>
        </div>

        {items.length > 0 && (
          <div style={{ padding: "10px 24px", display: "flex", gap: 8, borderBottom: `1px solid ${theme.border}` }}>
            <button onClick={toggleAll} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 8, padding: "6px 14px", color: theme.text, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              {selected.size === items.length ? "Desmarcar Todos" : "Selecionar Todos"}
            </button>
          </div>
        )}

        <div style={{ overflowY: "auto", flex: 1, padding: "14px 24px" }}>
          {items.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: theme.textDim, fontSize: 14 }}>
              ✅ Nenhum app novo encontrado no sistema.
            </div>
          )}

          {nativeApps.length > 0 && (
            <>
              {sectionLabel(`APPS DO SISTEMA (${nativeApps.length})`)}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 18 }}>
                {nativeApps.map(app => (
                  <label key={app.id} style={rowStyle(app.id) as any}>
                    <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggle(app.id)} style={{ accentColor: theme.accent, width: 16, height: 16, flexShrink: 0 }} />
                    <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {app.icon_path || (app.icon && app.icon.length > 4) ? (
                        <img src={app.icon_path ? `/api/icon?name=${encodeURIComponent(app.icon)}` : app.icon} 
                             alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>{app.icon || "📦"}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: theme.textDim }}>{app.category}</div>
                    </div>
                    {badge(app)}
                  </label>
                ))}
              </div>
            </>
          )}

          {dockerItems.length > 0 && (
            <>
              {sectionLabel(`CONTAINERS DOCKER (${dockerItems.length})`)}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dockerItems.map(app => (
                  <label key={app.id} style={rowStyle(app.id) as any}>
                    <input type="checkbox" checked={selected.has(app.id)} onChange={() => toggle(app.id)} style={{ accentColor: theme.accent, width: 16, height: 16, flexShrink: 0 }} />
                    <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {app.icon_path || (app.icon && app.icon.length > 4) ? (
                        <img src={app.icon_path ? `/api/icon?name=${encodeURIComponent(app.icon)}` : app.icon} 
                             alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                      ) : (
                        <span style={{ fontSize: 20 }}>{app.icon || "📦"}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: theme.text }}>{app.name}</div>
                      <div style={{ fontSize: 11, color: app.running ? theme.green : theme.textDim }}>{app.running ? "🟢 Rodando" : "⚫ Parado"}</div>
                    </div>
                    {badge(app)}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 10, justifyContent: "flex-end", alignItems: "center" }}>
          {toRemove > 0 && (
            <span style={{ fontSize: "11px", color: theme.red, flex: 1 }}>⚠️ {toRemove} app{toRemove !== 1 ? "s" : ""} desmarcado{toRemove !== 1 ? "s" : ""} será{toRemove !== 1 ? "o" : ""} removido{toRemove !== 1 ? "s" : ""}</span>
          )}
          <button onClick={onClose} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 20px", color: theme.textDim, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(items.filter(a => selected.has(a.id)))}
            style={{ background: hasChanges ? `linear-gradient(135deg,${theme.accentDim},${theme.accent})` : `linear-gradient(135deg,${theme.accentDim}88,${theme.accent}88)`, border: "none", borderRadius: 10, padding: "10px 24px", color: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13 }}>
            ✓ {confirmLabel()}
          </button>
        </div>
      </div>
    </div>
  );
};
