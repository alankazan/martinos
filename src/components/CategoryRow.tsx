import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AppEntry } from "../types/launcher";
import { AppCardTV } from "./AppCardTV";

interface CategoryRowProps {
  name: string;
  apps: AppEntry[];
  focusedCol: number;
  isFocusedRow: boolean;
  onSelectApp: (ci: number) => void;
  onLaunchApp: (app: AppEntry) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ name, apps, focusedCol, isFocusedRow, onSelectApp, onLaunchApp }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFocusedRow || !scrollRef.current) return;
    const el = scrollRef.current.children[focusedCol] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focusedCol, isFocusedRow]);

  return (
    <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: .3 }} style={{ marginBottom: 8 }}>
      <div style={{
        fontSize: 20, fontWeight: 800, color: isFocusedRow ? "var(--text)" : "var(--text-dim)",
        letterSpacing: "0.01em", padding: "0 48px", marginBottom: 14,
        transition: "color .2s", display: "flex", alignItems: "center", gap: 10
      }}>
        {isFocusedRow && (
          <motion.div layoutId="rowIndicator"
            style={{
              width: 4, height: 22, borderRadius: 2,
              background: `linear-gradient(var(--accent-dim),var(--accent))`
            }} />
        )}
        {name}
        <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-muted)" }}>
          {apps.length}
        </span>
      </div>
      <div ref={scrollRef}
        style={{
          display: "flex", gap: 16, paddingLeft: 48, paddingRight: 48,
          overflowX: "auto", scrollbarWidth: "none", paddingBottom: 8
        }}>
        {apps.map((app, ci) => (
          <AppCardTV key={app.id} app={app}
            focused={isFocusedRow && ci === focusedCol}
            onSelect={() => onSelectApp(ci)}
            onLaunch={onLaunchApp} />
        ))}
      </div>
    </motion.div>
  );
};
