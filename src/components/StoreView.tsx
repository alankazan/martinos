import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Download, ArrowLeft, RefreshCw, CheckCircle } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { SmartInput } from "./SmartInput";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  version: string;
  source: string;
}

interface StoreViewProps {
  onClose: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  const search = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/store/search?q=${encodeURIComponent(query)}`);
      const d = await r.json();
      setResults(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const install = async (appId: string) => {
    setInstalling(appId);
    try {
      const r = await fetch("/api/store/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId })
      });
      const d = await r.json();
      if (d.ok) {
        alert("Instalado com sucesso!");
      } else {
        alert("Erro na instalação: " + (d.details || d.error));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInstalling(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: theme.bg, zIndex: 2500,
        display: "flex", flexDirection: "column", overflow: "hidden"
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", alignItems: "center", gap: 24, padding: "20px 48px",
        background: `linear-gradient(180deg, ${theme.surface}, transparent)`,
        borderBottom: `1px solid ${theme.border}`
      }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: theme.text, cursor: "pointer" }}>
          <ArrowLeft size={32} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <ShoppingBag size={32} style={{ color: theme.accent }} />
          <div style={{ fontSize: 32, fontWeight: 900, color: theme.text, letterSpacing: "-0.04em" }}>Descobrir Apps</div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ width: 400 }}>
          <SmartInput value={query} onChange={setQuery} placeholder="Pesquisar no Flathub..." />
        </div>
        <button 
          onClick={search}
          style={{ 
            padding: "12px 24px", borderRadius: "12px", border: "none",
            background: theme.accent, color: "#fff", fontWeight: 800, cursor: "pointer"
          }}
        >
          Pesquisar
        </button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "48px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 100 }}>
            <RefreshCw size={48} style={{ animation: "spin 2s linear infinite", color: theme.accent }} />
            <div style={{ color: theme.textMuted, fontSize: 18, fontWeight: 600 }}>Buscando novidades...</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: "center", marginTop: 100, color: theme.textMuted }}>
            <ShoppingBag size={64} style={{ opacity: 0.1, marginBottom: 20 }} />
            <div style={{ fontSize: 24, fontWeight: 700 }}>Nada encontrado ainda.</div>
            <div style={{ fontSize: 16 }}>Digite um nome de app na busca acima.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {results.map(item => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02, background: theme.card }}
                style={{
                  background: theme.surface, border: `1px solid ${theme.border}`,
                  borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column",
                  gap: 12, position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 800, fontSize: "18px", color: theme.text }}>{item.name}</div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: theme.accent, padding: "2px 8px", background: `${theme.accent}11`, borderRadius: 6 }}>{item.version}</div>
                </div>
                <div style={{ fontSize: "13px", color: theme.textDim, flex: 1, lineHeight: 1.5 }}>{item.description}</div>
                <div style={{ fontSize: "11px", color: theme.textMuted, fontWeight: 700 }}>ID: {item.id}</div>
                
                <button
                  onClick={() => install(item.id)}
                  disabled={installing === item.id}
                  style={{
                    marginTop: 12, padding: "12px", borderRadius: "12px", border: "none",
                    background: installing === item.id ? theme.card : `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`,
                    color: "#fff", fontWeight: 800, cursor: installing ? "default" : "pointer",
                    display: "flex", alignItems: "center", gap: 8, justifyContent: "center"
                  }}
                >
                  {installing === item.id ? (
                    <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Instalando...</>
                  ) : (
                    <><Download size={18} /> Instalar</>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 48px", background: theme.surface, borderTop: `1px solid ${theme.border}`, display: "flex", gap: 24, color: theme.textMuted, fontSize: "12px", fontWeight: 700 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: 4 }}>B</div> Voltar</div>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "2px 6px", border: `1px solid ${theme.border}`, borderRadius: 4 }}>A</div> Selecionar</div>
      </div>
    </motion.div>
  );
};
