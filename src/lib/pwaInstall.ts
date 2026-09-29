/** Detecção de plataforma para instalar a Pianify como app (PWA). Só roda no navegador. */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "android" | "ios" | "desktop";

export function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function detectInstallPlatform(): InstallPlatform {
  if (isIos()) return "ios";
  if (/android/i.test(navigator.userAgent)) return "android";
  return "desktop";
}
