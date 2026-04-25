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

    return () => {
      socket.disconnect();
    };
  }, [setVolume, setApps]);
}
