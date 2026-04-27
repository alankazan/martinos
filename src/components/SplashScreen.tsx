import React from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

export const SplashScreen: React.FC = () => {
  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#05050a",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 32, position: "relative", overflow: "hidden"
    }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, #7e57c211 0%, transparent 70%)" }} />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: [1, 1.05, 1], opacity: 1 }}
        transition={{ 
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 1 }
        }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <img src="/logo.png" alt="MartinsOS" style={{ width: 160, height: 160, borderRadius: 40, boxShadow: "0 20px 80px rgba(126, 87, 194, 0.4)" }} />
        <motion.div
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ position: "absolute", inset: -20, borderRadius: 60, border: "2px solid rgba(126, 87, 194, 0.2)" }}
        />
      </motion.div>
      <div style={{ textAlign: "center", zIndex: 10 }}>
        <motion.div 
          initial={{ letterSpacing: "0.2em", opacity: 0 }}
          animate={{ letterSpacing: "-0.02em", opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ color: "#fff", fontSize: 32, fontWeight: 900 }}
        >
          MartinsOS
        </motion.div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} />
          <span>Iniciando núcleo do sistema</span>
        </div>
      </div>
    </div>
  );
};
