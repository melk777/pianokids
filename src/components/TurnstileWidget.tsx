"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange: (token: string | null) => void;
  refreshKey?: string;
}

export default function TurnstileWidget({
  siteKey,
  onTokenChange,
  refreshKey,
}: TurnstileWidgetProps) {
  const widgetIdRef = useRef<string | null>(null);
  const containerId = useId().replace(/:/g, "");
  const [apiReady, setApiReady] = useState(false);

  const canRender = useMemo(() => Boolean(siteKey), [siteKey]);

  useEffect(() => {
    if (!canRender || !apiReady || !window.turnstile) return;
    if (widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(`#${containerId}`, {
      sitekey: siteKey!,
      theme: "dark",
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => onTokenChange(null),
    });

    return () => {
      if (widgetIdRef.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [apiReady, canRender, containerId, onTokenChange, siteKey]);

  useEffect(() => {
    if (!refreshKey || !widgetIdRef.current || !window.turnstile) return;

    onTokenChange(null);
    window.turnstile.reset(widgetIdRef.current);
  }, [onTokenChange, refreshKey]);

  if (!canRender) {
    return (
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
        Configure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` para ativar a verificacao anti-robo.
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setApiReady(true)}
      />
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
          Verificacao anti-robo
        </p>
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div id={containerId} className="min-h-[70px]" />
        </div>
      </div>
    </>
  );
}
