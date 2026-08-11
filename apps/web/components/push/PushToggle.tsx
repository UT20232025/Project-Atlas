"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ToggleState =
  | "loading"
  | "unsupported"
  | "notConfigured"
  | "enabled"
  | "disabled";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export default function PushToggle() {
  const t = useTranslations("PushNotifications");
  const [state, setState] = useState<ToggleState>("loading");
  const [busy, setBusy] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setState("unsupported");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/push/public-key");
        const { publicKey } = (await res.json()) as {
          publicKey: string | null;
        };

        if (!publicKey) {
          setState("notConfigured");
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setState(sub ? "enabled" : "disabled");
      } catch {
        setState("disabled");
      }
    })();
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setBusy(false);
        return;
      }

      const res = await fetch("/api/push/public-key");
      const { publicKey } = (await res.json()) as {
        publicKey: string | null;
      };
      if (!publicKey) {
        setState("notConfigured");
        setBusy(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          publicKey
        ) as BufferSource,
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });

      setState("enabled");
    } catch {
      // Permission denied or subscribe failed — leave as disabled.
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("disabled");
    } catch {
      // ignore
    }
    setBusy(false);
  }

  async function sendTest() {
    setTestSent(false);
    try {
      await fetch("/api/push/test", { method: "POST" });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    } catch {
      // ignore
    }
  }

  if (state === "loading") {
    return null;
  }

  if (state === "unsupported") {
    return <p className="text-sm text-zinc-500">{t("unsupported")}</p>;
  }

  if (state === "notConfigured") {
    return <p className="text-sm text-zinc-500">{t("notConfigured")}</p>;
  }

  const enabled = state === "enabled";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={busy}
        onClick={enabled ? disable : enable}
        className={
          enabled
            ? "rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white disabled:opacity-50"
            : "rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        }
      >
        {enabled ? t("disable") : t("enable")}
      </button>

      {enabled && (
        <button
          type="button"
          onClick={sendTest}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:text-white"
        >
          {testSent ? t("testSent") : t("sendTest")}
        </button>
      )}

      <span className="text-sm text-zinc-500">
        {enabled ? t("statusOn") : t("statusOff")}
      </span>
    </div>
  );
}
