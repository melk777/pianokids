"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "pianify.installPromptDismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/**
 * Offers "install the app" on the dashboard: the native prompt on Android and
 * desktop Chrome/Edge, and short Share → Add to Home Screen steps on iPhone.
 */
export default function InstallAppPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    let wasDismissed = false;
    try {
      wasDismissed = window.localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Storage unavailable: still offer the install once per visit.
    }
    if (isStandalone() || wasDismissed) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- platform detection runs in the browser only.
    setDismissed(false);
    if (isIos()) setShowIosSteps(true);

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore: the prompt simply shows again next visit.
    }
  };

  if (dismissed || (!installEvent && !showIosSteps)) return null;

  return (
    <section className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/10 text-cyan">
        <Download size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">Instale a Pianify no seu celular</p>
        {installEvent ? (
          <p className="mt-1 text-xs text-white/60">Abre em tela cheia, direto nas suas aulas, com um toque.</p>
        ) : (
          <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-white/60">
            No Safari, toque em <Share size={12} className="inline" aria-label="Compartilhar" /> Compartilhar e depois em
            <strong className="text-white/80">Adicionar à Tela de Início</strong>.
          </p>
        )}
        {installEvent && (
          <button
            type="button"
            onClick={async () => {
              await installEvent.prompt();
              const choice = await installEvent.userChoice;
              if (choice.outcome === "accepted") dismiss();
              setInstallEvent(null);
            }}
            className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-black transition hover:bg-cyan"
          >
            Instalar app
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/45 transition hover:bg-white/8 hover:text-white"
      >
        <X size={15} />
      </button>
    </section>
  );
}
