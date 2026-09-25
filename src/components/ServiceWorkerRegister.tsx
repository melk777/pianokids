"use client";

import { useEffect } from "react";

/** Registers /sw.js in production so the site is installable and caches static assets. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Installation is a progressive enhancement; the site works without it.
    });
  }, []);

  return null;
}
