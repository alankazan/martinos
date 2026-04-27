import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export const SplashScreen: React.FC = () => {
  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#07070e",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 32
    }}>
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src="/logo.png" alt="MartinsOS" style={{ width: 120, height: 120, borderRadius: 32 }} />
      </motion.div>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: "#fff", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>MartinsOS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 600 }}>
          <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
          <span>Iniciando núcleo do sistema...</span>
        </div>
      </div>
    </div>
  );
};
