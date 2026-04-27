import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, RefreshCw, AlertTriangle, CheckCircle, X } from "lucide-react";
import { useLauncherStore } from "../../store/useLauncherStore";

interface UpdateInfo {
  hasUpdate: boolean;
  local: string;
  remote: string;
  message: string;
}

interface UpdateModalProps {
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [status, setStatus] = useState<"checking" | "available" | "up-to-date" | "updating" | "done" | "error">("checking");
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const [error, setError] = useState("");

  const check = async () => {
    setStatus("checking");
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
    try {
      const r = await fetch("/api/update/apply", { method: "POST" });
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      setStatus("done");
      // Reiniciar após 2 segundos
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (e: any) {
      setError(e.message);
      setStatus("error");
    }
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: theme.surface, border: `1px solid ${theme.border}`,
          borderRadius: "28px", width: "480px", padding: "40px",
          textAlign: "center", boxShadow: "0 40px 100px rgba(0,0,0,0.5)"
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
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textDim, fontWeight: 700, cursor: "pointer" }}>Agora não</button>
                <button onClick={apply} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", background: `linear-gradient(135deg,${theme.accentDim},${theme.accent})`, color: "#fff", fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 20px ${theme.accent}33` }}>Atualizar Agora</button>
              </div>
            </motion.div>
          )}

          {status === "up-to-date" && (
            <motion.div key="up-to-date" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckCircle size={48} style={{ color: "#4ade80", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Você está atualizado!</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>O MartinsOS está na versão mais recente disponível.</div>
              <button onClick={onClose} style={{ width: "100%", marginTop: 32, padding: "14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "transparent", color: theme.textDim, fontWeight: 700, cursor: "pointer" }}>Fechar</button>
            </motion.div>
          )}

          {status === "updating" && (
            <motion.div key="updating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <RefreshCw size={48} style={{ color: theme.accent, animation: "spin 1s linear infinite", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Atualizando...</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>Baixando e aplicando novos arquivos. Não feche a aplicação.</div>
            </motion.div>
          )}

          {status === "done" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CheckCircle size={48} style={{ color: "#4ade80", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Atualizado com sucesso!</div>
              <div style={{ color: theme.textMuted, marginTop: 12 }}>O sistema será reiniciado para aplicar as mudanças.</div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AlertTriangle size={48} style={{ color: "#f87171", marginBottom: 24 }} />
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text }}>Erro na atualização</div>
              <div style={{ color: "#f87171aa", marginTop: 12, fontSize: 14 }}>{error}</div>
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
