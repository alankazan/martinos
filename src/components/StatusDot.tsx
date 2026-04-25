import React from "react";
import { useLauncherStore } from "../store/useLauncherStore";

interface StatusDotProps {
  running?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({ running }) => {
  const theme = useLauncherStore((state) => state.theme);
  return (
    <span
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: running ? theme.green : theme.textMuted,
        display: "inline-block",
        boxShadow: running ? `0 0 6px ${theme.green}` : "none",
        flexShrink: 0,
      }}
    />
  );
};
