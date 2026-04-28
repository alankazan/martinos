import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingBag, Download, ArrowLeft, RefreshCw, CheckCircle, Package, Star, Grid } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { SmartInput } from "./SmartInput";
import { resolveIcon } from "../utils/system";

interface StoreItem {
  id: string;
  name: string;
  description: string;
  version: string;
  source: string;
  category?: string;
  icon?: string;
}

interface StoreViewProps {
  onClose: () => void;
}

export const StoreView: React.FC<StoreViewProps> = ({ onClose }) => {
  const theme = useLauncherStore((state) => state.theme);
  const addApp = useLauncherStore((state) => state.addApp);
  const apps = useLauncherStore((state) => state.apps);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StoreItem[]>([]);
  const [featured, setFeatured] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);

  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/store/featured");
      const d = await r.json();
      setFeatured(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const search = async () => {
    if (!query) {
      setResults([]);
      return;
    }
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

  const install = async (item: StoreItem) => {
    setInstalling(item.id);
    try {
      const r = await fetch("/api/store/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, source: item.source })
      });
      const d = await r.json();
      if (d.ok) {
        // Automatically add to launcher
        addApp({
          id: `${item.source}_${item.id.toLowerCase().replace(/\W+/g, "_")}`,
          name: item.name,
          source: item.source as any,
          category: item.category || "Apps",
          icon: item.icon || resolveIcon(item.name),
          pinned: false,
          running: false,
          exec: item.id // Flatpak/Snap ID usually works as exec
        });
        alert(`${item.name} instalado e adicionado ao launcher!`);
      } else {
        alert("Erro na instalação: " + (d.details || d.error));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setInstalling(null);
    }
  };

  const categories = ["Jogos", "Mídia", "Social", "Desenvolvimento", "Internet"];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, background: theme.bg, zIndex: 2500,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Outfit', sans-serif"
      }}
    >
      {/* Header */}
      <div style={{ 
        display: "flex", alignItems: "center", gap: 32, padding: "24px 64px",
        background: `linear-gradient(180deg, ${theme.surface}, transparent)`,
        borderBottom: `1px solid ${theme.border}`, zIndex: 10
      }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: theme.text, cursor: "pointer", width: 48, height: 48, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ArrowLeft size={28} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 30px ${theme.accent}44` }}>
            <ShoppingBag size={24} color="#000" />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900, color: theme.text, letterSpacing: "-0.04em", lineHeight: 1 }}>Loja Unificada</div>
            <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>MartinsOS App Ecosystem</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button 
          onClick={fetchFeatured}
          disabled={loading}
          style={{ 
            background: "rgba(255,255,255,0.05)", border: "none", color: theme.text, 
            cursor: "pointer", width: 48, height: 48, borderRadius: 16, 
            display: "flex", alignItems: "center", justifyContent: "center",
            marginRight: -16
          }}
          title="Recarregar"
        >
          <RefreshCw size={20} style={{ animation: loading ? "spin 2s linear infinite" : "none" }} />
        </button>
        <div style={{ width: 400, position: "relative" }}>
          <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: theme.textMuted, zIndex: 1, pointerEvents: "none" }} />
          <SmartInput 
            value={query} onChange={setQuery} placeholder="Buscar por Flatpaks, Snaps..." 
            style={{ paddingLeft: 48, background: "rgba(0,0,0,0.4)", borderRadius: 16 }} 
          />
        </div>
        <button 
          onClick={search}
          disabled={loading || !query}
          style={{ 
            padding: "14px 32px", borderRadius: "16px", border: "none",
            background: (loading || !query) ? theme.card : theme.accent, 
            color: "#000", fontWeight: 800, cursor: (loading || !query) ? "default" : "pointer",
            boxShadow: (loading || !query) ? "none" : `0 8px 24px ${theme.accent}44`,
            transition: "all 0.2s"
          }}
        >
          Explorar
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 64px 80px" }}>
        
        {loading && !featured.length && !results.length ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 100 }}>
            <div style={{ position: "relative" }}>
               <RefreshCw size={64} style={{ animation: "spin 3s linear infinite", color: theme.accent, opacity: 0.2 }} />
               <ShoppingBag size={32} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: theme.accent }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: theme.text, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>SINCRONIZANDO REPOSITÓRIOS</div>
              <div style={{ color: theme.textMuted, fontSize: 14, fontWeight: 700, marginTop: 4 }}>ISSO PODE LEVAR ALGUNS SEGUNDOS...</div>
            </div>
          </div>
        ) : query && results.length > 0 ? (
          /* Search Results View */
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <SectionTitle icon={Search} label={`Resultados para "${query}"`} count={results.length} color={theme.accent} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
              {results.map(item => <AppStoreCard key={item.id} item={item} theme={theme} onInstall={() => install(item)} installing={installing === item.id} />)}
            </div>
          </div>
        ) : (
          /* Featured & Categories View */
          <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
            {/* Featured Row */}
            {featured.length > 0 ? (
              <div>
                <SectionTitle icon={Star} label="Destaques da Semana" color={theme.yellow || "#fbbf24"} />
                <div style={{ display: "flex", gap: 24, overflowX: "auto", padding: "8px 0 24px", scrollbarWidth: "none" }}>
                  {featured.slice(0, 4).map(item => (
                    <motion.div key={item.id} whileHover={{ y: -8 }} style={{ flex: "0 0 380px" }}>
                      <AppStoreCard item={item} theme={theme} onInstall={() => install(item)} installing={installing === item.id} large />
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : !loading && (
              <div style={{ textAlign: "center", padding: "60px 0", background: "rgba(255,255,255,0.02)", borderRadius: 32, border: `1px dashed ${theme.border}` }}>
                <ShoppingBag size={48} style={{ color: theme.textMuted, marginBottom: 16, opacity: 0.5 }} />
                <div style={{ color: theme.textDim, fontSize: 20, fontWeight: 800 }}>Nenhum app em destaque</div>
                <button onClick={fetchFeatured} style={{ marginTop: 16, background: theme.accent, border: "none", padding: "10px 20px", borderRadius: 12, fontWeight: 800, cursor: "pointer" }}>Tentar Novamente</button>
              </div>
            )}

            {/* Category Sections */}
            {categories.map(cat => {
              const catApps = featured.filter(a => a.category === cat);
              if (catApps.length === 0) return null;
              return (
                <div key={cat}>
                  <SectionTitle icon={Grid} label={cat} color={theme.accent} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
                    {catApps.map(item => <AppStoreCard key={item.id} item={item} theme={theme} onInstall={() => install(item)} installing={installing === item.id} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 100, color: theme.textMuted }}>
            <ShoppingBag size={80} style={{ opacity: 0.1, marginBottom: 24 }} />
            <div style={{ fontSize: 26, fontWeight: 800, color: theme.textDim }}>Nenhum app encontrado</div>
            <div style={{ fontSize: 16, marginTop: 8 }}>Tente outro termo ou verifique se o Flatpak está instalado e configurado corretamente.</div>
            <button onClick={search} style={{ marginTop: 24, background: "rgba(255,255,255,0.1)", border: `1px solid ${theme.border}`, color: theme.text, padding: "12px 24px", borderRadius: 14, fontWeight: 800, cursor: "pointer" }}>Tentar Novamente</button>
          </div>
        )}
      </div>

      {/* Help Bar */}
      <div style={{ padding: "16px 64px", background: "rgba(0,0,0,0.3)", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 32, color: theme.textMuted, fontSize: "13px", fontWeight: 700, backdropFilter: "blur(20px)" }}>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "4px 8px", border: `1px solid ${theme.border}`, borderRadius: 8, background: theme.card }}>ESC</div> Voltar</div>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "4px 8px", border: `1px solid ${theme.border}`, borderRadius: 8, background: theme.card }}>ENTER</div> Ver Detalhes</div>
         <div style={{ flex: 1 }} />
         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.green || "#10b981" }} />
            <span>Repositórios Online</span>
         </div>
      </div>
    </motion.div>
  );
};

const SectionTitle: React.FC<{ icon: any, label: string, count?: number, color: string }> = ({ icon: Icon, label, count, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
    <Icon size={22} style={{ color }} />
    <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{label}</span>
    {count !== undefined && <span style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 700, padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 10 }}>{count}</span>}
  </div>
);

const AppStoreCard: React.FC<{ item: StoreItem, theme: any, onInstall: () => void, installing: boolean, large?: boolean }> = ({ item, theme, onInstall, installing, large }) => {
  const isInstalled = useLauncherStore.getState().apps.some(a => a.name === item.name);

  return (
    <motion.div
      whileHover={{ scale: 1.02, background: "rgba(255,255,255,0.04)" }}
      style={{
        background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.border}`,
        borderRadius: "24px", padding: large ? "32px" : "24px", display: "flex", flexDirection: "column",
        gap: 16, transition: "background 0.2s"
      }}
    >
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ 
          width: large ? 80 : 64, height: large ? 80 : 64, borderRadius: 18, 
          background: "rgba(0,0,0,0.3)", border: `1px solid ${theme.border}`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: large ? 40 : 32
        }}>
          {item.icon ? (item.icon.length > 2 ? <Package size={32} style={{ opacity: 0.5 }} /> : item.icon) : <Package size={28} style={{ opacity: 0.3 }} />}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: large ? "22px" : "18px", color: theme.text, letterSpacing: "-0.02em" }}>{item.name}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: theme.accent, padding: "3px 8px", background: `${theme.accent}15`, borderRadius: 6, textTransform: "uppercase" }}>
              {item.source}
            </span>
            {item.category && (
              <span style={{ fontSize: "10px", fontWeight: 800, color: theme.textMuted, padding: "3px 8px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>
                {item.category}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ fontSize: "14px", color: theme.textDim, flex: 1, lineHeight: 1.6, minHeight: 44 }}>
        {item.description}
      </div>
      
      <button
        onClick={onInstall}
        disabled={installing || isInstalled}
        style={{
          width: "100%", padding: "14px", borderRadius: "16px", border: "none",
          background: isInstalled ? "rgba(255,255,255,0.05)" : (installing ? theme.card : `linear-gradient(135deg, ${theme.accentDim}, ${theme.accent})`),
          color: isInstalled ? theme.textMuted : "#000", fontWeight: 900, fontSize: 14,
          cursor: (installing || isInstalled) ? "default" : "pointer",
          display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
          boxShadow: isInstalled ? "none" : `0 8px 20px ${theme.accent}33`
        }}
      >
        {isInstalled ? (
          <><CheckCircle size={18} /> Instalado</>
        ) : installing ? (
          <><RefreshCw size={18} style={{ animation: "spin 1s linear infinite" }} /> Baixando...</>
        ) : (
          <><Download size={18} /> Adicionar ao MartinsOS</>
        )}
      </button>
    </motion.div>
  );
};
