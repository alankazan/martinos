import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, AlertTriangle, CheckCircle, Terminal } from "lucide-react";
import { useLauncherStore } from "../../store/useLauncherStore";

interface UpdateInfo {
  hasUpdate: boolean;
  local: string;
  remote: string;
  message: string;
  changedFiles?: string[];
}

interface UpdateModalProps {
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [status, setStatus] = useState<"checking" | "available" | "up-to-date" | "updating" | "done" | "error">("checking");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Listen for live log events from useSocket
  useEffect(() => {
    const onLog = (e: Event) => {
      const msg = (e as CustomEvent<string>).detail;
      setLogs(prev => [...prev, msg]);
    };
    const onError = () => {
      setStatus("error");
      setError("O processo de atualização falhou. Verifique os logs.");
    };
    window.addEventListener("martinos_update_log", onLog);
    window.addEventListener("martinos_update_error", onError);
    return () => {
      window.removeEventListener("martinos_update_log", onLog);
      window.removeEventListener("martinos_update_error", onError);
    };
  }, []);

  // Listen for sys_update_done — socket already handles redirect, but we update UI
  useEffect(() => {
    const onDone = (e: Event) => {
      const { ok } = (e as CustomEvent<{ ok: boolean }>).detail;
      setStatus(ok ? "done" : "error");
    };
    window.addEventListener("martinos_update_done", onDone);
    return () => window.removeEventListener("martinos_update_done", onDone);
  }, []);

  const check = async () => {
    setStatus("checking");
    setLogs([]);
    try {
      const r = await fetch("/api/update/check");
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setInfo(d);
      setStatus(d.hasUpdate ? "available" : "up-to-date");
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  };

  const apply = async () => {
    setStatus("updating");
    setLogs([]);
    try {
      const r = await fetch("/api/update/apply", { method: "POST" });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      // status will be driven by socket events (sys_update_log / sys_update_done)
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  };

  useEffect(() => { check(); }, []);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, backdropFilter: "blur(8px)" }}
      onClick={status === "updating" ? undefined : onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: "28px", width: "520px", padding: "40px",
          textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          maxHeight: "85vh", display: "flex", flexDirection: "column"
        }}
      >
        <AnimatePresence mode="wait">
          {status === "checking" && (
            <motion.div key="checking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RefreshCw size={48} style={{ color: theme.accent, animation: "spin 2s linear infinite", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Verificando atualizações...</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>Consultando repositório GitHub</div>
            </motion.div>
          )}

          {status === "available" && (
            <motion.div key="available" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Download size={48} style={{ color: theme.accent, marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Atualização disponível!</div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", margin: "20px 0", textAlign: "left", border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: theme.accent, textTransform: "uppercase", marginBottom: 4 }}>Últimas mudanças:</div>
                <div style={{ fontSize: 14, color: theme.textDim, lineHeight: 1.5 }}>{info?.message}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>Local: <code style={{ color: theme.textDim }}>{info?.local}</code></div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>Remoto: <code style={{ color: theme.accent }}>{info?.remote}</code></div>
                </div>
                {info?.changedFiles && info.changedFiles.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: theme.textMuted, textTransform: "uppercase", marginBottom: 4 }}>Arquivos modificados:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {info.changedFiles.slice(0, 8).map(f => (
                        <code key={f} style={{ fontSize: 10, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 6, color: theme.textDim }}>{f}</code>
                      ))}
                      {info.changedFiles.length > 8 && <code style={{ fontSize: 10, color: theme.textMuted }}>+{info.changedFiles.length - 8} mais</code>}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textDim, fontWeight: 700, cursor: "pointer" }}>Agora não</button>
                <button onClick={apply} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 20px ${theme.accent}33` }}>⚡ Atualizar Agora</button>
              </div>
            </motion.div>
          )}

          {status === "up-to-date" && (
            <motion.div key="up-to-date" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckCircle size={48} style={{ color: "#4ade80", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Você está atualizado!</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>MartinsOS está na versão mais recente.</div>
              <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                Commit: <code style={{ color: theme.accent }}>{info?.local}</code>
              </div>
              <button onClick={onClose} style={{ width: "100%", marginTop: 32, padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textDim, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
            </motion.div>
          )}

          {status === "updating" && (
            <motion.div key="updating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <Terminal size={28} style={{ color: theme.accent }} />
                <div style={{ fontSize: 20, fontWeight: 900, color: theme.text }}>Atualizando MartinsOS...</div>
                <RefreshCw size={20} style={{ color: theme.accent, animation: "spin 1s linear infinite", marginLeft: "auto" }} />
              </div>
              {/* Live log terminal */}
              <div style={{
                background: "#0a0a0f", borderRadius: 16, padding: "16px 20px", textAlign: "left",
                fontFamily: "monospace", fontSize: 13, lineHeight: 1.6, color: "#a3e635",
                minHeight: 200, maxHeight: 280, overflowY: "auto", border: `1px solid ${theme.border}`,
                flex: 1
              }}>
                {logs.length === 0 && <span style={{ color: "#555" }}>Iniciando processo...</span>}
                {logs.map((l, i) => <div key={i}>{l}</div>)}
                <div ref={logsEndRef} />
              </div>
              <div style={{ color: theme.textMuted, marginTop: 16, fontSize: 13 }}>
                O sistema será recarregado automaticamente ao finalizar. Não feche.
              </div>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckCircle size={48} style={{ color: "#4ade80", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Atualizado com sucesso!</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>Recarregando a interface em instantes... 🚀</div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AlertTriangle size={48} style={{ color: "#f87171", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Erro na atualização</div>
              <div style={{ color: "#f87171aa", marginTop: 12, fontSize: 14 }}>{error}</div>
              {logs.length > 0 && (
                <div style={{ background: "#0a0a0f", borderRadius: 12, padding: 12, textAlign: "left", fontFamily: "monospace", fontSize: 12, color: "#f87171", marginTop: 16, maxHeight: 120, overflowY: "auto" }}>
                  {logs.slice(-5).map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textDim, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
                <button onClick={check} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: theme.card, color: theme.text, fontWeight: 800, cursor: "pointer" }}>Tentar Novamente</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
