"use client";

import { useEffect } from "react";

/**
 * Registers the service worker so the app is installable ("Add to Home
 * Screen") on iOS and Android and has an offline fallback. No UI.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failing is non-fatal — the app still works online.
    });
  }, []);

  return null;
}
