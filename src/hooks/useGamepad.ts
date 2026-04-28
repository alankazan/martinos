import { useEffect, useRef } from "react";
import { GAMEPAD_BTN_MAP } from "../constants/launcher";
import { ControllerMapping } from "../types/launcher";
import { useLauncherStore } from "../store/useLauncherStore";

export function useGamepad(
  execAction: (actionId: string) => void,
  mapping: ControllerMapping,
  showHud: (btnId: string, actionId: string) => void
) {
  const prev = useRef<Record<string, boolean>>({});
  const raf = useRef<number>(0);

  useEffect(() => {
    const poll = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of gamepads) {
        if (!gp) continue;
        gp.buttons.forEach((btn, i) => {
          const btnId = GAMEPAD_BTN_MAP[i];
          if (!btnId) return;
          const key = `${gp.index}-${i}`;
          const wasPressed = prev.current[key];
          if (btn.pressed && !wasPressed) {
            useLauncherStore.getState().setInputMode("gamepad");
            const actionId = mapping[btnId];
            if (actionId && actionId !== "none") {
              showHud(btnId, actionId);
              execAction(actionId);
            }
          }
          prev.current[key] = btn.pressed;
        });
      }
      raf.current = requestAnimationFrame(poll);
    };
    raf.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf.current);
  }, [execAction, mapping, showHud]);
}
