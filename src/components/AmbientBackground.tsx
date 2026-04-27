import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLauncherStore } from "../store/useLauncherStore";

interface AmbientBackgroundProps {
  accentColor: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ accentColor }) => {
  const theme = useLauncherStore((state) => state.theme);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden", background: theme.bg }}>
      <AnimatePresence>
        <motion.div
          key={accentColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: "-10%",
            background: `radial-gradient(circle at 30% 40%, ${accentColor}22 0%, transparent 60%),
                         radial-gradient(circle at 70% 60%, ${accentColor}11 0%, transparent 50%)`,
            filter: "blur(80px)",
          }}
        />
      </AnimatePresence>
      <div style={{ 
        position: "absolute", 
        inset: 0, 
        background: `linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%)`,
        opacity: 0.6 
      }} />
    </div>
  );
};
