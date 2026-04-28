import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wifi, Bluetooth, Loader2, RefreshCw } from "lucide-react";
import { VirtualKeyboard } from "../VirtualKeyboard";
import { useLauncherStore } from "../../store/useLauncherStore";

interface SystemSettingsProps {
  onClose: () => void;
}

export function SystemSettings({ onClose }: SystemSettingsProps) {
  const [activeTab, setActiveTab] = useState<"wifi" | "bluetooth">("wifi");
  const [wifiList, setWifiList] = useState<any[]>([]);
  const [btList, setBtList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWifi, setSelectedWifi] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState("");
  const [showKeyboard, setShowKeyboard] = useState(false);
  const theme = useLauncherStore(state => state.theme);

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
    else fetchBt();
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
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          width: 600, height: 600, borderRadius: 24, display: "flex", flexDirection: "column",
          boxShadow: "0 20px 80px rgba(0,0,0,0.5)", overflow: "hidden"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", padding: "24px 32px", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)", flex: 1 }}>Configurações de Rede</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={24} /></button>
        </div>

        <div style={{ display: "flex", padding: "16px 32px", gap: 16, borderBottom: "1px solid var(--border)" }}>
          <button 
            onClick={() => setActiveTab("wifi")}
            style={{ ...tabStyle, background: activeTab === "wifi" ? "var(--card-hover)" : "transparent", color: activeTab === "wifi" ? theme.accent : "var(--text-muted)" }}>
            <Wifi size={18} /> Wi-Fi
          </button>
          <button 
            onClick={() => setActiveTab("bluetooth")}
            style={{ ...tabStyle, background: activeTab === "bluetooth" ? "var(--card-hover)" : "transparent", color: activeTab === "bluetooth" ? theme.accent : "var(--text-muted)" }}>
            <Bluetooth size={18} /> Bluetooth
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={activeTab === "wifi" ? fetchWifi : fetchBt} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <RefreshCw size={18} style={{ animation: loading ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {selectedWifi ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <h3 style={{ margin: 0, color: "var(--text)" }}>Conectar a {selectedWifi}</h3>
              <input 
                type="password"
                value={wifiPassword}
                onChange={e => setWifiPassword(e.target.value)}
                onFocus={() => setShowKeyboard(true)}
                placeholder="Senha da rede..."
                style={{
                  padding: "16px", borderRadius: "12px", border: "1px solid var(--border)",
                  background: "var(--card)", color: "var(--text)", fontSize: 16, outline: "none"
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
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSelectedWifi(null)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontWeight: 800, cursor: "pointer" }}>Cancelar</button>
                <button onClick={handleConnectWifi} style={{ flex: 1, padding: 14, borderRadius: 12, border: "none", background: theme.accent, color: "#000", fontWeight: 800, cursor: "pointer" }}>{loading ? "Conectando..." : "Conectar"}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeTab === "wifi" && wifiList.map((w, i) => (
                <div key={i} onClick={() => setSelectedWifi(w.ssid)} style={{
                  display: "flex", alignItems: "center", padding: "16px", borderRadius: "16px",
                  background: "var(--card)", border: "1px solid var(--border)", cursor: "pointer"
                }}>
                  <Wifi size={20} style={{ color: w.active ? theme.green : "var(--text-muted)", marginRight: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>{w.ssid}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{w.security} · Sinal: {w.signal}%</div>
                  </div>
                  {w.active && <div style={{ fontSize: 12, fontWeight: 800, color: theme.green, background: `${theme.green}22`, padding: "4px 8px", borderRadius: 8 }}>Conectado</div>}
                </div>
              ))}

              {activeTab === "bluetooth" && btList.map((b, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", padding: "16px", borderRadius: "16px",
                  background: "var(--card)", border: "1px solid var(--border)"
                }}>
                  <Bluetooth size={20} style={{ color: "var(--text-muted)", marginRight: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text)", fontSize: 16 }}>{b.name || "Dispositivo Desconhecido"}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.mac}</div>
                  </div>
                  <button onClick={() => handlePairBt(b.mac)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: theme.accent, color: "#000", fontWeight: 800, cursor: "pointer" }}>
                    Parear
                  </button>
                </div>
              ))}

              {!loading && activeTab === "wifi" && wifiList.length === 0 && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Nenhuma rede encontrada.</div>}
              {!loading && activeTab === "bluetooth" && btList.length === 0 && <div style={{ color: "var(--text-muted)", textAlign: "center", padding: 20 }}>Nenhum dispositivo encontrado. Certifique-se que o Bluetooth está ligado.</div>}
              {loading && <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: theme.accent }} /></div>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const tabStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12,
  border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14
};
