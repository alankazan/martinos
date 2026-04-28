import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Circle, MousePointer2, Keyboard, Volume2, VolumeX } from "lucide-react";

export function SmartRemote() {
  const [text, setText] = useState("");
  const [volLevel, setVolLevel] = useState(50);
  const trackpadRef = useRef<HTMLDivElement>(null);
  
  // Trackpad logic
  const lastPos = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastPos.current) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    const dy = e.touches[0].clientY - lastPos.current.y;
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    
    // Send relative movement
    fetch('/api/remote/mouse', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dx: Math.round(dx * 1.5), dy: Math.round(dy * 1.5) }) // Speed multiplier
    });
  };

  const handleTouchEnd = () => {
    lastPos.current = null;
  };

  const handleClick = () => {
    fetch('/api/remote/click', { method: 'POST' });
  };

  const sendKey = (key: string) => {
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
    fetch(endpoint, { method: "POST" });
  };

  useEffect(() => {
    // Initial volume fetch
    fetch("/api/volume/level").then(r => r.json()).then(d => setVolLevel(d.level)).catch(() => {});
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#0a0a0f", color: "#fff",
      display: "flex", flexDirection: "column", fontFamily: "'Outfit', sans-serif",
      userSelect: "none", touchAction: "none"
    }}>
      {/* Header */}
      <div style={{ padding: "20px", textAlign: "center", borderBottom: "1px solid #ffffff11", background: "#111" }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>MartinsOS Remote</h2>
      </div>

      {/* Trackpad */}
      <div 
        ref={trackpadRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          flex: 1, margin: "20px", background: "#ffffff0a", borderRadius: "24px",
          border: "1px solid #ffffff11", display: "flex", alignItems: "center",
          justifyContent: "center", flexDirection: "column", gap: 10, cursor: "pointer",
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.02)"
        }}
      >
        <MousePointer2 size={32} style={{ opacity: 0.2 }} />
        <span style={{ opacity: 0.3, fontWeight: 600, fontSize: 14 }}>TRACKPAD (Toque para Clicar)</span>
      </div>

      {/* D-Pad & Controls */}
      <div style={{ padding: "0 20px 20px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* Media Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", background: "#151515", padding: "16px", borderRadius: "16px" }}>
          <button onClick={() => apiCall("/api/media/previous")} style={btnStyle}><SkipBack size={20} /></button>
          <button onClick={() => apiCall("/api/media/play-pause")} style={{...btnStyle, background: "#a78bfa", color: "#000"}}><Play size={20} /></button>
          <button onClick={() => apiCall("/api/media/next")} style={btnStyle}><SkipForward size={20} /></button>
        </div>

        {/* Volume Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", background: "#151515", padding: "16px", borderRadius: "16px", alignItems: "center" }}>
          <button onClick={() => apiCall("/api/volume/down")} style={btnStyle}><VolumeX size={20} /></button>
          <span style={{ fontWeight: 800 }}>Vol</span>
          <button onClick={() => apiCall("/api/volume/up")} style={btnStyle}><Volume2 size={20} /></button>
        </div>

        {/* D-Pad */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, maxWidth: 240, margin: "0 auto" }}>
          <div />
          <button onClick={() => sendKey("Up")} style={dpadBtnStyle}><ChevronUp /></button>
          <div />
          <button onClick={() => sendKey("Left")} style={dpadBtnStyle}><ChevronLeft /></button>
          <button onClick={() => sendKey("Return")} style={{...dpadBtnStyle, background: "#ffffff22"}}><Circle size={16} /></button>
          <button onClick={() => sendKey("Right")} style={dpadBtnStyle}><ChevronRight /></button>
          <div />
          <button onClick={() => sendKey("Down")} style={dpadBtnStyle}><ChevronDown /></button>
          <div />
        </div>

        {/* Keyboard Input */}
        <form onSubmit={sendText} style={{ display: "flex", gap: 10 }}>
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Digite algo na TV..."
            style={{
              flex: 1, padding: "14px 16px", borderRadius: "12px", border: "1px solid #ffffff22",
              background: "#111", color: "#fff", outline: "none", fontSize: 16
            }}
          />
          <button type="submit" style={{ padding: "14px", borderRadius: "12px", border: "none", background: "#a78bfa", color: "#000", fontWeight: 800 }}>
            Enviar
          </button>
        </form>

      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "#ffffff11", border: "none", borderRadius: "12px", padding: "12px 20px", 
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
};

const dpadBtnStyle: React.CSSProperties = {
  background: "#ffffff11", border: "none", borderRadius: "16px", padding: "16px", 
  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center"
};
