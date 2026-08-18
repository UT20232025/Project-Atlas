"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { toggleSignalAlert } from "@/app/alerts/actions";

export default function SignalAlertToggle({
  symbol,
  initialOn,
}: {
  symbol: string;
  initialOn: boolean;
}) {
  const t = useTranslations("SignalAlert");
  const [on, setOn] = useState(initialOn);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const next = await toggleSignalAlert(symbol);
      setOn(next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={on}
      className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition disabled:opacity-60 ${
        on
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15"
          : "border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600"
      }`}
    >
      <span>{on ? "🔔" : "🔕"}</span>
      <span>{on ? t("on") : t("off")}</span>
    </button>
  );
}
