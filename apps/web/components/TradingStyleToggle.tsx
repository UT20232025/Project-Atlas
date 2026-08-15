"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Mountain, Zap } from "lucide-react";

import {
  TRADING_STYLE_COOKIE,
  type TradingStyle,
} from "@/lib/preferences/tradingStyle";

const OPTIONS: Array<{
  value: TradingStyle;
  labelKey: string;
  hintKey: string;
  icon: typeof Mountain;
}> = [
  { value: "swing", labelKey: "swing", hintKey: "swingHint", icon: Mountain },
  {
    value: "intraday",
    labelKey: "intraday",
    hintKey: "intradayHint",
    icon: Zap,
  },
];

export default function TradingStyleToggle({
  active,
}: {
  active: TradingStyle;
}) {
  const t = useTranslations("TradingStyle");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(style: TradingStyle) {
    if (style === active) return;

    document.cookie = `${TRADING_STYLE_COOKIE}=${style}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      className="inline-flex rounded-xl border border-zinc-800 bg-zinc-950/50 p-1"
      aria-busy={pending}
    >
      {OPTIONS.map((option) => {
        const isActive = option.value === active;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => choose(option.value)}
            title={t(option.hintKey)}
            aria-current={isActive ? "true" : undefined}
            className={
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition " +
              (isActive
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black"
                : "text-zinc-400 hover:text-white")
            }
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            <span>{t(option.labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
