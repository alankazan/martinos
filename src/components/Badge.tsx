import React from "react";
import { SOURCE_BADGES } from "../constants/launcher";

interface BadgeProps {
  source: string;
}

export const Badge: React.FC<BadgeProps> = ({ source }) => {
  const b = SOURCE_BADGES[source] || SOURCE_BADGES.manual;
  return (
    <span
      style={{
        fontSize: "9px",
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: b.color,
        background: b.bg,
        border: `1px solid ${b.color}33`,
        borderRadius: "3px",
        padding: "1px 5px",
        fontFamily: "'Courier New',monospace",
      }}
    >
      {b.label}
    </span>
  );
};
