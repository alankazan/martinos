import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Settings, LogIn } from "lucide-react";
import { useLauncherStore } from "../store/useLauncherStore";
import { UserProfile } from "../types/launcher";

export const ProfileSelection: React.FC = () => {
  const theme = useLauncherStore((state) => state.theme);
  const profiles = useLauncherStore((state) => state.profiles);
  const setActiveProfile = useLauncherStore((state) => state.setActiveProfile);
  const addProfile = useLauncherStore((state) => state.addProfile);

  const [focusIdx, setFocusIdx] = useState(0);

  const handleSelect = (p: UserProfile) => {
    setActiveProfile(p.id);
  };

  const createDefault = () => {
    const p: UserProfile = {
      id: "user_" + Date.now(),
      name: "Usuário 1",
      avatar: "👤",
    };
    addProfile(p);
  };

  const items = [...profiles, { id: "add", name: "Novo Perfil", avatar: "➕" }];

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#05050a",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", gap: 60, overflow: "hidden"
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: "center" }}
      >
        <div style={{ color: "#fff", fontSize: 42, fontWeight: 900, letterSpacing: "-0.04em" }}>MartinsOS</div>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, fontWeight: 600, marginTop: 8 }}>Quem está jogando agora?</div>
      </motion.div>

      <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
        <AnimatePresence>
          {items.map((p, i) => {
            const isFocused = i === focusIdx;
            const isAdd = p.id === "add";

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: isFocused ? 1.15 : 1,
                  boxShadow: isFocused ? `0 20px 60px ${theme.accent}44` : "none"
                }}
                onClick={() => isAdd ? createDefault() : handleSelect(p as UserProfile)}
                style={{
                  width: 180, height: 240, background: isFocused ? theme.card : "rgba(255,255,255,0.03)",
                  borderRadius: 32, border: `2px solid ${isFocused ? theme.accent : "transparent"}`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 20, cursor: "pointer", transition: "all 0.2s"
                }}
              >
                <div style={{ 
                  fontSize: 72, width: 100, height: 100, borderRadius: "50%",
                  background: isFocused ? theme.accent : "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {p.avatar}
                </div>
                <div style={{ 
                  fontSize: 20, fontWeight: 800, color: isFocused ? "#fff" : "rgba(255,255,255,0.5)"
                }}>
                  {p.name}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div style={{ position: "fixed", bottom: 60, display: "flex", gap: 32, color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: 700 }}>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "2px 6px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4 }}>A</div> Selecionar</div>
         <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ padding: "2px 6px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4 }}>⬉⬈</div> Navegar</div>
      </div>
    </div>
  );
};
