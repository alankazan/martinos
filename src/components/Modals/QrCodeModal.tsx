import React from "react";
import { motion } from "framer-motion";
import { X, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QrCodeModalProps {
  url: string;
  onClose: () => void;
}

export function QrCodeModal({ url, onClose }: QrCodeModalProps) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: 40, borderRadius: 32, display: "flex", flexDirection: "column",
          alignItems: "center", gap: 20, boxShadow: "0 20px 80px rgba(0,0,0,0.5)",
          position: "relative"
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 20, right: 20, background: "none", border: "none",
          color: "var(--text-muted)", cursor: "pointer"
        }}>
          <X size={24} />
        </button>

        <Smartphone size={48} style={{ color: "var(--accent)" }} />
        
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--text)" }}>Controle Remoto</h2>
          <p style={{ margin: "8px 0 0 0", color: "var(--text-muted)", fontSize: 15, maxWidth: 280 }}>
            Escaneie o QR Code com a câmera do seu celular para controlar a TV.
          </p>
        </div>

        <div style={{ background: "#fff", padding: 20, borderRadius: 24 }}>
          <QRCodeSVG value={url} size={240} level="M" includeMargin={false} />
        </div>

        <div style={{
          background: "var(--card)", padding: "12px 24px", borderRadius: 16,
          border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700,
          fontFamily: "monospace", fontSize: 16, marginTop: 10
        }}>
          {url}
        </div>
      </motion.div>
    </div>
  );
}
