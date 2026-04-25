import React, { useState, useEffect, useRef } from "react";
import { useLauncherStore } from "../../store/useLauncherStore";
import { BUTTONS, ACTIONS, DEFAULT_MAPPING, GAMEPAD_BTN_MAP } from "../../constants/launcher";
import { ControllerMapping, ControlAction } from "../../types/launcher";
import { ControllerVisual } from "./ControllerVisual";

interface ControllerConfigProps {
  mapping: ControllerMapping;
  onSave: (m: ControllerMapping) => void;
  onClose: () => void;
}

export const ControllerConfig: React.FC<ControllerConfigProps> = ({ mapping, onSave, onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [map, setMap] = useState({ ...mapping });
  const [listening, setListening] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState("Todos");
  const [pressedButtons, setPressed] = useState<Set<string>>(new Set());
  const raf = useRef<number>(0);

  const groups = ["Todos", ...new Set(Object.values(ACTIONS).map(a => a.group))];

  // Gamepad Detection for visual feedback
  useEffect(() => {
    const poll = () => {
      const gps = navigator.getGamepads();
      const currentPressed = new Set<string>();
      for (const gp of gps) {
        if (!gp) continue;
        gp.buttons.forEach((btn, i) => {
          if (btn.pressed) {
            const btnId = GAMEPAD_BTN_MAP[i];
            if (btnId) currentPressed.add(btnId);
          }
        });
      }
      setPressed(currentPressed);
      raf.current = requestAnimationFrame(poll);
    };
    raf.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  // Keyboard remapping
  useEffect(() => {
    if (!listening) return;
    const h = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      const btn = BUTTONS.find(b => b.key === e.key);
      if (btn && btn.id !== listening) {
        // Swap keys or just assign
        const oldAction = map[btn.id];
        const myAction = map[listening];
        setMap(m => ({ ...m, [listening]: oldAction || "none", [btn.id]: myAction }));
      }
      setListening(null);
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [listening, map]);

  const setAction = (btnId: string, actionId: string) => setMap(m => ({ ...m, [btnId]: actionId }));

  const actionGroups = Object.entries(ACTIONS).reduce((acc: Record<string, (ControlAction & { id: string })[]>, [id, a]) => {
    if (!acc[a.group]) acc[a.group] = [];
    acc[a.group].push({ id, ...a });
    return acc;
  }, {});

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: "24px", width: "min(1100px,98vw)", height: "min(700px,96vh)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 50px 120px #000" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", borderBottom: `1px solid ${theme.border}`, background: `linear-gradient(180deg,${theme.card},transparent)`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: 42, height: 42, borderRadius: "12px", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 0 20px ${theme.accent}66` }}>🎮</div>
            <div>
              <div style={{ color: theme.text, fontWeight: 900, fontSize: "19px", letterSpacing: "-0.02em" }}>Configuração de Controle</div>
              <div style={{ color: theme.textMuted, fontSize: "11px", letterSpacing: "0.08em", fontWeight: 700 }}>ESTILO GAMER — VISUALIZAÇÃO INTERATIVA</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setMap({ ...DEFAULT_MAPPING })} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "8px 18px", color: theme.textDim, cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all .2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}>↺ Restaurar Padrão</button>
            <button onClick={() => onSave(map)} style={{ background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, border: "none", borderRadius: "10px", padding: "8px 22px", color: "#fff", cursor: "pointer", fontSize: "14px", fontWeight: 800, boxShadow: `0 4px 15px ${theme.accent}44` }}>✓ Salvar Mapeamento</button>
            <button onClick={onClose} style={{ background: "none", border: `1px solid ${theme.border}`, borderRadius: "10px", padding: "8px 12px", color: theme.textMuted, cursor: "pointer", fontSize: "18px" }}>✕</button>
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* Main Visual Area */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", background: `radial-gradient(circle at center, ${theme.accent}08 0%, transparent 70%)` }}>
            <div style={{ width: "95%", height: "95%" }}>
              <ControllerVisual 
                mapping={map}
                activeButton={listening}
                onSelectButton={(id) => setListening(id)}
                pressedButtons={pressedButtons}
              />
            </div>

            {listening && (
              <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", background: `${theme.accent}ee`, color: "#fff", padding: "10px 24px", borderRadius: "12px", fontWeight: 800, fontSize: "14px", boxShadow: `0 0 30px ${theme.accent}`, animation: "pulse 0.8s infinite", zIndex: 10 }}>
                Aguardando Ação para {BUTTONS.find(b => b.id === listening)?.label}...
              </div>
            )}

            <div style={{ position: "absolute", bottom: 20, left: 24, right: 24, display: "flex", justifyContent: "center", gap: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.textMuted, fontSize: "12px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.accent, animation: "pulse 1s infinite" }} />
                <span>Pressione um botão no controle para ver o feedback</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.textMuted, fontSize: "12px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: theme.border }} />
                <span>Clique em um botão ou rótulo para remapear</span>
              </div>
            </div>
          </div>

          {/* Sidebar - Actions Selection */}
          <div style={{ width: 380, borderLeft: `1px solid ${theme.border}`, background: theme.card, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ color: theme.textDim, fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em", marginBottom: "14px", textTransform: "uppercase" }}>Ações Disponíveis</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {groups.map(g => (
                  <button key={g} onClick={() => setActiveGroup(g)} style={{ padding: "5px 12px", borderRadius: "16px", fontSize: "11px", fontWeight: 700, cursor: "pointer", background: activeGroup === g ? theme.accent : theme.surface, border: activeGroup === g ? "none" : `1px solid ${theme.border}`, color: activeGroup === g ? "#fff" : theme.textDim, transition: "all .15s" }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {Object.entries(actionGroups)
                .filter(([g]) => activeGroup === "Todos" || g === activeGroup)
                .map(([group, acts]) => (
                  <div key={group} style={{ marginBottom: "20px" }}>
                    <div style={{ color: theme.textMuted, fontSize: "10px", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ height: 1, flex: 1, background: theme.border }} />
                      {group}
                      <div style={{ height: 1, flex: 1, background: theme.border }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "6px" }}>
                      {acts.map(act => {
                        const usedBy = BUTTONS.filter(b => map[b.id] === act.id);
                        const isSelected = listening && map[listening] === act.id;
                        return (
                          <button key={act.id}
                            onClick={() => { if (listening) { setAction(listening, act.id); setListening(null); } }}
                            style={{ display: "flex", alignItems: "center", gap: "12px", background: isSelected ? `${theme.accent}22` : theme.surface, border: `1.5px solid ${isSelected ? theme.accent : usedBy.length > 0 ? theme.accentDim + "44" : theme.border}`, borderRadius: "12px", padding: "10px 14px", cursor: listening ? "pointer" : "default", textAlign: "left", transition: "all .15s", opacity: listening ? 1 : 0.7 }}>
                            <span style={{ fontSize: "20px", flexShrink: 0 }}>{act.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: isSelected ? theme.accent : theme.text, fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{act.label}</div>
                              {usedBy.length > 0 && (
                                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                                  {usedBy.map(b => (
                                    <span key={b.id} style={{ fontSize: "9px", background: theme.accentDim + "22", color: theme.accent, padding: "1px 6px", borderRadius: "4px", fontWeight: 800 }}>{b.label}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            {isSelected && <span style={{ color: theme.accent, fontSize: "18px", flexShrink: 0 }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>

            <div style={{ padding: "18px", borderTop: `1px solid ${theme.border}`, background: theme.surface }}>
               <div style={{ color: theme.textMuted, fontSize: "10px", fontWeight: 700, textAlign: "center", lineHeight: 1.5 }}>
                 Selecione um botão no controle visual para começar o mapeamento.
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
