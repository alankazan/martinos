import { ICON_MAP } from "../constants/launcher";

export function resolveIcon(name: string | undefined): string {
  if (!name) return "📦";
  for (const [re, emoji] of ICON_MAP) {
    if (re.test(name)) return emoji;
  }
  return "📦";
}

export type NativeKeyboardDetection = {
  has: boolean;
  source: string;
};

export function detectNativeKeyboard(): NativeKeyboardDetection {
  if (typeof navigator !== "undefined" && "virtualKeyboard" in navigator) {
    return { has: true, source: "navigator.virtualKeyboard API" };
  }

  // @ts-ignore
  if (typeof window !== "undefined" && window.__LAUNCHER_NATIVE_KB === true) {
    return { has: true, source: "window.__LAUNCHER_NATIVE_KB (backend flag)" };
  }
  // @ts-ignore
  if (typeof window !== "undefined" && window.__LAUNCHER_NATIVE_KB === false) {
    return { has: false, source: "window.__LAUNCHER_NATIVE_KB (backend flag)" };
  }

  if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 1) {
    return { has: true, source: "maxTouchPoints > 1 (touch device)" };
  }

  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return { has: true, source: "ontouchstart in window" };
  }

  if (typeof window !== "undefined" && window.matchMedia) {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return { has: true, source: "CSS pointer: coarse" };
    }
  }

  if (typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";
    const mobileOS = /Android|iPhone|iPad|iPod|Windows Phone|Tizen|WebOS/i.test(ua);
    if (mobileOS) {
      return { has: true, source: `user-agent: ${ua.slice(0, 40)}` };
    }
  }

  return { has: false, source: "nenhuma condição detectada — usando teclado embutido" };
}

export const NATIVE_KB = detectNativeKeyboard();
