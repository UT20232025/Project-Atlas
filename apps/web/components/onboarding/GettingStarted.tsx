"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const STORAGE_KEY = "genwelth-onboarding-dismissed";

export default function GettingStarted() {
  const t = useTranslations("Onboarding");

  // Starts hidden so the server and first client render match; the real
  // state is read from localStorage after mount (avoids hydration
  // mismatch).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY) !== "1"
    ) {
      setVisible(true);
    }
  }, []);

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const steps: Array<{
    href: string;
    title: string;
    description: string;
    external?: boolean;
  }> = [
    {
      href: "/coin/BTCUSDT",
      title: t("seeAnalysis"),
      description: t("seeAnalysisDesc"),
    },
    {
      href: "/stocks",
      title: t("markets"),
      description: t("marketsDesc"),
    },
    {
      href: "/track-record",
      title: t("trackRecord"),
      description: t("trackRecordDesc"),
    },
    {
      href: "https://t.me/GenwelthAiSignals",
      title: t("telegram"),
      description: t("telegramDesc"),
      external: true,
    },
  ];

  return (
    <section className="relative rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6">
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("dismiss")}
        className="absolute right-4 top-4 rounded-md px-2 text-lg leading-none text-zinc-500 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ✕
      </button>

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
        {t("eyebrow")}
      </p>

      <h2 className="mt-2 pr-8 text-xl font-bold">
        {t("heading")}
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
        {t("intro")}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            {...(step.external
              ? {
                  target: "_blank",
                  rel: "noopener noreferrer",
                }
              : {})}
            className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 transition hover:border-blue-500/40 hover:bg-zinc-950/70"
          >
            <p className="font-medium text-white">
              {step.title}
            </p>
            <p className="mt-1 text-sm leading-5 text-zinc-500">
              {step.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
