import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wifi, Bluetooth, Loader2, RefreshCw, Cpu, Activity, Thermometer, Info } from "lucide-react";
import { VirtualKeyboard } from "../VirtualKeyboard";
import { useLauncherStore } from "../../store/useLauncherStore";

interface SystemSettingsProps {
  onClose: () => void;
}

type TabType = "wifi" | "bluetooth" | "system";

export function SystemSettings({ onClose }: SystemSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("wifi");
  const [wifiList, setWifiList] = useState<any[]>([]);
  const [btList, setBtList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  
  const theme = useLauncherStore(state => state.theme);
  const telemetry = useLauncherStore(state => state.telemetry);
  const apps = useLauncherStore(state => state.apps);

  const fetchWifi = () => {
    setLoading(true);
    fetch("/api/network/wifi").then(r => r.json()).then(d => {
      setWifiList(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  const fetchBt = () => {
    setLoading(true);
    fetch("/api/bluetooth/devices").then(r => r.json()).then(d => {
      setBtList(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === "wifi") fetchWifi();
    else if (activeTab === "bluetooth") fetchBt();
  }, [activeTab]);

  const handleConnectWifi = () => {
    if (!selectedWifi) return;
    setLoading(true);
    fetch("/api/network/connect", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ssid: selectedWifi, password: wifiPassword })
    }).then(() => {
      setSelectedWifi(null);
      setWifiPassword("");
      fetchWifi();
    }).catch(() => setLoading(false));
  };

  const handlePairBt = (mac: string) => {
    setLoading(true);
    fetch("/api/bluetooth/pair", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mac })
    }).then(() => fetchBt()).catch(() => setLoading(false));
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.6)",
      backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        style={{
          background: `linear-gradient(145deg, ${theme.surface}, ${theme.bg})`, 
          border: `1px solid ${theme.border}`,
          width: 720, height: 600, borderRadius: 28, display: "flex", flexDirection: "column",
          boxShadow: "0 30px 100px rgba(0,0,0,0.6)", overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "24px 32px", borderBottom: `1px solid ${theme.border}`, background: "rgba(255,255,255,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 20px ${theme.accent}44` }}>
              <Info size={22} color="#000" />
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: theme.text, letterSpacing: "-0.02em" }}>Configurações do Sistema</h2>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "flex", padding: "12px 32px", gap: 8, borderBottom: `1px solid ${theme.border}`, background: "rgba(0,0,0,0.1)" }}>
          {[
            { id: "wifi", label: "Wi-Fi", icon: Wifi },
            { id: "bluetooth", label: "Bluetooth", icon: Bluetooth },
            { id: "system", label: "Sistema", icon: Activity },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{ 
                ...tabStyle, 
                background: activeTab === tab.id ? `${theme.accent}15` : "transparent", 
                color: activeTab === tab.id ? theme.accent : theme.textMuted,
                border: `1px solid ${activeTab === tab.id ? `${theme.accent}33` : "transparent"}`
              }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {activeTab !== "system" && (
            <button onClick={activeTab === "wifi" ? fetchWifi : fetchBt} style={{ background: "rgba(255,255,255,0.05)", border: "none", color: theme.textMuted, cursor: "pointer", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={16} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          <AnimatePresence mode="wait">
            {activeTab === "system" ? (
              <motion.div key="system" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <StatCard icon={Cpu} label="Processador" value={`${telemetry.cpu}%`} sub="Uso da CPU" color={theme.accent} />
                  <StatCard icon={Activity} label="Memória RAM" value={`${telemetry.ram}%`} sub="Uso da memória" color={theme.blue || "#3b82f6"} />
                  <StatCard icon={Thermometer} label="Temperatura" value={`${telemetry.temp}°C`} sub="Core package" color={telemetry.temp > 70 ? theme.red : theme.green || "#10b981"} />
                  <StatCard icon={Info} label="Aplicativos" value={apps.length.toString()} sub="Instalados" color={theme.orange || "#f59e0b"} />
                </div>
                
                <div style={{ marginTop: 32, padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.02)", border: `1px solid ${theme.border}` }}>
                  <h4 style={{ margin: "0 0 16px 0", color: theme.textDim, fontSize: 14, fontWeight: 800, textTransform: "uppercase" }}>Informações de Versão</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.textMuted }}>Versão do Sistema</span>
                      <span style={{ color: theme.text, fontWeight: 700 }}>MartinsOS v4.0.0 (Premium)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.textMuted }}>Build Date</span>
                      <span style={{ color: theme.text, fontWeight: 700 }}>28 de Abril, 2026</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: theme.textMuted }}>Kernel Bridge</span>
                      <span style={{ color: theme.text, fontWeight: 700 }}>v2.4.1-stable</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : selectedWifi ? (
              <motion.div key="wifi-connect" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 440, margin: "0 auto", textAlign: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: `${theme.accent}22`, color: theme.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                  <Wifi size={32} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", color: theme.text, fontSize: 24 }}>Conectar a {selectedWifi}</h3>
                  <p style={{ margin: 0, color: theme.textMuted }}>Digite a senha para acessar esta rede.</p>
                </div>
                <input 
                  type="password"
                  value={wifiPassword}
                  onChange={e => setWifiPassword(e.target.value)}
                  onFocus={() => setShowKeyboard(true)}
                  placeholder="Senha da rede..."
                  style={{
                    padding: "18px", borderRadius: "16px", border: `1px solid ${theme.border}`,
                    background: "rgba(0,0,0,0.3)", color: theme.text, fontSize: 18, outline: "none", textAlign: "center"
                  }}
                />
                <VirtualKeyboard 
                  isOpen={showKeyboard}
                  onClose={() => setShowKeyboard(false)}
                  value={wifiPassword}
                  onInput={(char) => setWifiPassword(p => p + char)}
                  onBackspace={() => setWifiPassword(p => p.slice(0, -1))}
                  onEnter={() => { setShowKeyboard(false); handleConnectWifi(); }}
                />
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setSelectedWifi(null)} style={{ flex: 1, padding: 16, borderRadius: 16, border: `1px solid ${theme.border}`, background: "transparent", color: theme.text, fontWeight: 800, cursor: "pointer" }}>Cancelar</button>
                  <button onClick={handleConnectWifi} style={{ flex: 1, padding: 16, borderRadius: 16, border: "none", background: theme.accent, color: "#000", fontWeight: 800, cursor: "pointer", boxShadow: `0 8px 24px ${theme.accent}44` }}>{loading ? "Conectando..." : "Conectar"}</button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {activeTab === "wifi" && wifiList.map((w, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    onClick={() => setSelectedWifi(w.ssid)} 
                    style={{
                      display: "flex", alignItems: "center", padding: "20px", borderRadius: "20px",
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${w.active ? theme.accent : theme.border}`, cursor: "pointer",
                      transition: "all 0.2s"
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: w.active ? `${theme.accent}22` : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 20 }}>
                      <Wifi size={20} style={{ color: w.active ? theme.accent : theme.textMuted }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: theme.text, fontSize: 17 }}>{w.ssid}</div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>{w.security} · Sinal: {w.signal}%</div>
                    </div>
                    {w.active && <div style={{ fontSize: 12, fontWeight: 900, color: theme.accent, background: `${theme.accent}22`, padding: "6px 12px", borderRadius: 10, letterSpacing: "0.05em", textTransform: "uppercase" }}>Conectado</div>}
                  </motion.div>
                ))}

                {activeTab === "bluetooth" && btList.map((b, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    style={{
                      display: "flex", alignItems: "center", padding: "20px", borderRadius: "20px",
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${theme.border}`,
                      transition: "all 0.2s"
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", marginRight: 20 }}>
                      <Bluetooth size={20} style={{ color: theme.accent }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: theme.text, fontSize: 17 }}>{b.name || "Dispositivo Desconhecido"}</div>
                      <div style={{ fontSize: 13, color: theme.textMuted }}>{b.mac}</div>
                    </div>
                    <button onClick={() => handlePairBt(b.mac)} style={{ padding: "10px 20px", borderRadius: 12, border: "none", background: theme.accent, color: "#000", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                      Parear
                    </button>
                  </motion.div>
                ))}

                {!loading && activeTab === "wifi" && wifiList.length === 0 && <div style={{ color: theme.textMuted, textAlign: "center", padding: 40, background: "rgba(255,255,255,0.02)", borderRadius: 20 }}>Nenhuma rede encontrada.</div>}
                {!loading && activeTab === "bluetooth" && btList.length === 0 && <div style={{ color: theme.textMuted, textAlign: "center", padding: 40, background: "rgba(255,255,255,0.02)", borderRadius: 20 }}>Nenhum dispositivo encontrado.</div>}
                {loading && <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Loader2 size={40} style={{ animation: "spin 1s linear infinite", color: theme.accent }} /></div>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

const StatCard: React.FC<{ icon: any, label: string, value: string, sub: string, color: string }> = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{ padding: 20, borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 48, height: 48, borderRadius: 16, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Icon size={24} color={color} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text)" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", opacity: 0.7 }}>{sub}</div>
    </div>
  </div>
);

const tabStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 14,
  border: "none", cursor: "pointer", fontWeight: 800, fontSize: 15, transition: "all 0.2s",
  fontFamily: "'Outfit', sans-serif"
};
