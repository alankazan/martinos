import React, { useRef, useState, useEffect } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  Play, Pause, SkipBack, SkipForward, Circle, 
  MousePointer2, Keyboard, Volume2, VolumeX, 
  Home, RotateCcw, Power, LayoutGrid, Smartphone,
  ArrowLeft
} from "lucide-react";

export function SmartRemote() {
  const [text, setText] = useState("");
  const [volLevel, setVolLevel] = useState(0);
  const [activeMode, setActiveMode] = useState<"nav" | "trackpad" | "keyboard">("nav");
  const trackpadRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastPos.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    
    fetch('/api/remote/mouse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx: Math.round(dx * 2), dy: Math.round(dy * 2) })
    });
  };

  const handleClick = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    fetch('/api/remote/click', { method: 'POST' });
  };

  const sendKey = (key: string) => {
    if (window.navigator.vibrate) window.navigator.vibrate(10);
    fetch('/api/remote/key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key })
    });
  };

  const sendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) return;
    fetch('/api/remote/type', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    setText("");
    sendKey("Return");
  };

  const apiCall = (endpoint: string) => {
    if (window.navigator.vibrate) window.navigator.vibrate(15);
    fetch(endpoint, { method: "POST" });
  };

  useEffect(() => {
    fetch("/api/volume/level").then(r => r.json()).then(d => setVolLevel(d.level)).catch(() => {});
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#050508", color: "#fff",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif",
      userSelect: "none", touchAction: "none", overflow: "hidden"
    }}>
      {/* Premium Header */}
      <div style={{ 
        padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #a78bfa, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Smartphone size={18} color="#000" />
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: "-0.02em" }}>MartinsOS <span style={{ color: "#a78bfa" }}>Pro</span></span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => sendKey("Home")} style={iconBtnStyle}><Home size={18} /></button>
          <button onClick={() => sendKey("Escape")} style={iconBtnStyle}><ArrowLeft size={18} /></button>
        </div>
      </div>

      {/* Mode Selector */}
      <div style={{ display: "flex", padding: "16px 24px", gap: 10 }}>
        {[
          { id: "nav", label: "Controle", icon: LayoutGrid },
          { id: "trackpad", label: "Mouse", icon: MousePointer2 },
          { id: "keyboard", label: "Teclado", icon: Keyboard },
        ].map(m => (
          <button 
            key={m.id}
            onClick={() => setActiveMode(m.id as any)}
            style={{
              flex: 1, padding: "12px", borderRadius: 14, border: "none",
              background: activeMode === m.id ? "#a78bfa" : "rgba(255,255,255,0.03)",
              color: activeMode === m.id ? "#000" : "#fff",
              fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "all 0.2s"
            }}
          >
            <m.icon size={16} /> {m.label}
          </button>
        ))}
      </div>

      {/* Main Control Area */}
      <div style={{ flex: 1, position: "relative", padding: "0 24px" }}>
        <AnimatePresence mode="wait">
          {activeMode === "nav" && (
            <motion.div 
              key="nav" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 40 }}
            >
              {/* Central D-Pad */}
              <div style={{ position: "relative", width: 240, height: 240, margin: "0 auto" }}>
                <button onClick={() => sendKey("Up")} style={{ ...dpadStyle, top: 0, left: "50%", transform: "translateX(-50%)" }}><ChevronUp size={32} /></button>
                <button onClick={() => sendKey("Down")} style={{ ...dpadStyle, bottom: 0, left: "50%", transform: "translateX(-50%)" }}><ChevronDown size={32} /></button>
                <button onClick={() => sendKey("Left")} style={{ ...dpadStyle, left: 0, top: "50%", transform: "translateY(-50%)" }}><ChevronLeft size={32} /></button>
                <button onClick={() => sendKey("Right")} style={{ ...dpadStyle, right: 0, top: "50%", transform: "translateY(-50%)" }}><ChevronRight size={32} /></button>
                
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendKey("Return")}
                  style={{
                    position: "absolute", inset: 70, borderRadius: "50%", border: "none",
                    background: "linear-gradient(135deg, #a78bfa, #7c3aed)", color: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 10px 30px rgba(167, 139, 250, 0.4)"
                  }}
                >
                  <Circle size={28} fill="currentColor" />
                </motion.button>
              </div>

              {/* Extra Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <button onClick={() => sendKey("BackSpace")} style={extraBtnStyle}><RotateCcw size={20} /> Voltar</button>
                <button onClick={() => apiCall("/api/poweroff")} style={{ ...extraBtnStyle, color: "#ef4444" }}><Power size={20} /> Desligar</button>
              </div>
            </motion.div>
          )}

          {activeMode === "trackpad" && (
            <motion.div 
              key="trackpad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ height: "100%", padding: "20px 0" }}
            >
              <div 
                ref={trackpadRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onClick={handleClick}
                style={{
                  height: "100%", background: "rgba(255,255,255,0.02)", borderRadius: 32,
                  border: "2px dashed rgba(255,255,255,0.05)", display: "flex", alignItems: "center",
                  justifyContent: "center", flexDirection: "column", gap: 16
                }}
              >
                <MousePointer2 size={48} style={{ opacity: 0.1 }} />
                <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 800, fontSize: 14 }}>TRACKPAD DE ALTA PRECISÃO</span>
              </div>
            </motion.div>
          )}

          {activeMode === "keyboard" && (
            <motion.div 
              key="keyboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}
            >
              <div style={{ textAlign: "center", padding: "0 20px" }}>
                <Keyboard size={48} style={{ color: "#a78bfa", marginBottom: 16, opacity: 0.5 }} />
                <h3 style={{ margin: 0, fontSize: 20 }}>Teclado Remoto</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>Digite abaixo e pressione enviar para digitar na TV.</p>
              </div>
              <form onSubmit={sendText} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input 
                  autoFocus
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  placeholder="Mensagem..."
                  style={{
                    padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(0,0,0,0.4)", color: "#fff", outline: "none", fontSize: 18, textAlign: "center"
                  }}
                />
                <button type="submit" style={{ padding: "18px", borderRadius: "16px", border: "none", background: "#a78bfa", color: "#000", fontWeight: 900, fontSize: 16, boxShadow: "0 8px 20px rgba(167, 139, 250, 0.3)" }}>
                  ENVIAR AGORA
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media & Volume Footer */}
      <div style={{ 
        padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", 
        background: "rgba(255,255,255,0.01)", display: "flex", flexDirection: "column", gap: 24 
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => apiCall("/api/media/previous")} style={mediaBtnStyle}><SkipBack size={20} /></button>
          <button onClick={() => apiCall("/api/media/play-pause")} style={{ ...mediaBtnStyle, width: 64, height: 64, background: "#fff", color: "#000" }}><Play size={24} fill="currentColor" /></button>
          <button onClick={() => apiCall("/api/media/next")} style={mediaBtnStyle}><SkipForward size={20} /></button>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <VolumeX size={18} style={{ opacity: 0.4 }} onClick={() => apiCall("/api/volume/mute")} />
          <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, position: "relative" }}>
            <div style={{ width: `${volLevel}%`, height: "100%", background: "#a78bfa", borderRadius: 3, boxShadow: "0 0 10px #a78bfa66" }} />
          </div>
          <Volume2 size={18} style={{ opacity: 0.4 }} />
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
};

const dpadStyle: React.CSSProperties = {
  position: "absolute", width: 70, height: 70, borderRadius: 20, border: "none", background: "rgba(255,255,255,0.04)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
};

const extraBtnStyle: React.CSSProperties = {
  padding: "16px", borderRadius: 16, border: "none", background: "rgba(255,255,255,0.03)", color: "#fff", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14
};

const mediaBtnStyle: React.CSSProperties = {
  width: 52, height: 52, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.04)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
};
