import { useEffect } from "react";
import { io } from "socket.io-client";
import { useLauncherStore } from "../store/useLauncherStore";
import { AppEntry } from "../types/launcher";

export function useSocket() {
  const { setVolume, setApps } = useLauncherStore();

  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    socket.on("sys_volume", (data) => {
      setVolume(data.level, data.muted);
    });

    socket.on("sys_docker", (containers: any[]) => {
      setApps((prev) => prev.map(app => {
        if (app.source !== "docker" && app.source !== "podman") return app;
        const match = containers.find((c: any) =>
          c.name.replace(/^\//, "").toLowerCase() === app.name.toLowerCase()
        );
        return match ? { ...app, running: match.running } : app;
      }));
    });

    socket.on("sys_media", (data) => {
      // Could be used to show "Now Playing" in the HeroPanel or HUD
      console.log("Media update:", data);
    });

    // Live hotswap update listeners
    socket.on("sys_update_log", (data: { msg: string }) => {
      console.log("[Update]", data.msg);
      window.dispatchEvent(new CustomEvent("martinos_update_log", { detail: data.msg }));
    });

    socket.on("sys_update_done", (data: { ok: boolean; backendRestart?: boolean }) => {
      if (data.ok) {
        // Give a moment for files to settle, then hard reload with cache-bust
        const delay = data.backendRestart ? 3000 : 800;
        setTimeout(() => {
          // Force browser to bypass cache and load fresh JS/CSS bundles
          window.location.href = window.location.origin + "?v=" + Date.now();
        }, delay);
      } else {
        window.dispatchEvent(new CustomEvent("martinos_update_error"));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [setVolume, setApps]);
}
