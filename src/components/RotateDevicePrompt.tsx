"use client";

import { useEffect, useRef, useState } from "react";
import { Smartphone } from "lucide-react";

const DISMISS_KEY = "pianify.rotatePromptDismissed";
// Celular em pé: tela de toque, em retrato e com o lado menor de celular.
const PORTRAIT_PHONE = "(pointer: coarse) and (orientation: portrait) and (max-width: 600px)";

type LockableOrientation = ScreenOrientation & { lock?: (orientation: "landscape") => Promise<void>; unlock?: () => void };

/**
 * No celular o app é usado deitado: o teclado fica mais largo, as teclas maiores e as
 * telas foram desenhadas para 844×390. No Android dá para girar com um toque (tela cheia
 * + trava em paisagem); no iPhone o site não pode girar a tela, então o aviso explica e
 * some ao deitar. Quem não consegue girar (rotação travada) pode seguir em pé.
 */
export default function RotateDevicePrompt() {
  const [portraitPhone, setPortraitPhone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [canLock, setCanLock] = useState(false);
  const lockedRef = useRef(false);

  useEffect(() => {
    const query = window.matchMedia(PORTRAIT_PHONE);
    const update = () => setPortraitPhone(query.matches);
    update();
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- preference read in the browser only.
      setDismissed(window.sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      // Storage unavailable: the prompt shows until dismissed in this visit.
    }
    const orientation = screen.orientation as LockableOrientation | undefined;
    setCanLock(Boolean(orientation?.lock && document.documentElement.requestFullscreen));
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      if (lockedRef.current) {
        try {
          (screen.orientation as LockableOrientation).unlock?.();
        } catch {
          // Nothing to undo.
        }
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  async function rotate() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      await (screen.orientation as LockableOrientation).lock?.("landscape");
      lockedRef.current = true;
    } catch {
      // Some browsers refuse the lock; the instructions below still apply.
      setCanLock(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore: the prompt only returns on the next visit.
    }
  }

  if (!portraitPhone || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/92 p-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="rotate-title">
      <style>{`@keyframes pianify-rotate { 0%, 20% { transform: rotate(0deg); } 50%, 80% { transform: rotate(-90deg); } 100% { transform: rotate(0deg); } }`}</style>
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl border border-cyan/30 bg-cyan/10 text-cyan">
          <Smartphone className="h-12 w-12" style={{ animation: "pianify-rotate 2.6s ease-in-out infinite" }} aria-hidden />
        </div>
        <h2 id="rotate-title" className="mt-6 text-2xl font-black text-white">
          Vire o celular
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/65">
          A Pianify foi feita para usar com o celular deitado: o teclado fica mais largo, as teclas maiores e as notas mais fáceis de acompanhar.
        </p>
        {canLock ? (
          <button
            type="button"
            onClick={rotate}
            className="mt-7 w-full rounded-2xl bg-cyan px-5 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition active:scale-[0.98]"
          >
            Girar a tela
          </button>
        ) : (
          <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs leading-relaxed text-white/60">
            Se a tela não girar sozinha, desative o bloqueio de rotação na central de controle do celular.
          </p>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full rounded-2xl px-5 py-3 text-xs font-bold text-white/40 transition hover:text-white/70"
        >
          Não consigo girar
        </button>
      </div>
    </div>
  );
}
