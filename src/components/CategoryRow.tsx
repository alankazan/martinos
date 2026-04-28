import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 10);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll);
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [apps]);

  useEffect(() => {
    if (!isFocusedRow || !scrollRef.current) return;
    const el = scrollRef.current.children[focusedCol] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focusedCol, isFocusedRow]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = dir === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: .3 }} style={{ marginBottom: 24, position: "relative" }}>
      <div style={{
        fontSize: 22, fontWeight: 900, color: isFocusedRow ? "var(--text)" : "var(--text-dim)",
        letterSpacing: "-0.01em", padding: "0 56px", marginBottom: 16,
        transition: "color .2s", display: "flex", alignItems: "center", gap: 12
      }}>
        {isFocusedRow && (
          <motion.div layoutId="rowIndicator"
            style={{
              width: 5, height: 24, borderRadius: 3,
              background: `linear-gradient(var(--accent-dim),var(--accent))`
            }} />
        )}
        {name}
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-muted)", opacity: 0.5 }}>
          {apps.length} APPS
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <AnimatePresence>
          {showLeftArrow && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              onClick={() => scroll("left")}
              style={{
                position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10,
                width: 48, height: 48, borderRadius: "50%", background: "rgba(0,0,0,0.6)",
                border: "1px solid var(--border)", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)"
              }}
            >
              <ChevronLeft size={32} />
            </motion.button>
          )}
        </AnimatePresence>

        <div ref={scrollRef}
          style={{
            display: "flex", gap: 20, paddingLeft: 56, paddingRight: 56,
            overflowX: "auto", scrollbarWidth: "none", paddingBottom: 12,
            scrollBehavior: "smooth"
          }}>
          {apps.map((app, ci) => (
            <AppCardTV key={app.id} app={app}
              focused={isFocusedRow && ci === focusedCol}
              onSelect={() => onSelectApp(ci)}
              onLaunch={onLaunchApp} />
          ))}
        </div>

        <AnimatePresence>
          {showRightArrow && (
            <motion.button 
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
              onClick={() => scroll("right")}
              style={{
                position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 10,
                width: 48, height: 48, borderRadius: "50%", background: "rgba(0,0,0,0.6)",
                border: "1px solid var(--border)", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(10px)"
              }}
            >
              <ChevronRight size={32} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
