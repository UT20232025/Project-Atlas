import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { BinanceInterval } from "@/lib/services/binanceCandleService";

export const TIMEFRAME_OPTIONS: BinanceInterval[] = [
  "5m",
  "15m",
  "1h",
  "4h",
  "1d",
];

export const DEFAULT_TIMEFRAME: BinanceInterval = "1h";

/**
 * Normalizes a raw `?tf=` search param to a supported timeframe, falling back
 * to the canonical 1h so an unknown value never breaks the analysis.
 */
export function resolveTimeframe(
  raw: string | string[] | undefined
): BinanceInterval {
  const value = Array.isArray(raw) ? raw[0] : raw;

  return TIMEFRAME_OPTIONS.includes(value as BinanceInterval)
    ? (value as BinanceInterval)
    : DEFAULT_TIMEFRAME;
}

type TimeframeSelectorProps = {
  symbol: string;
  active: BinanceInterval;
};

export default async function TimeframeSelector({
  symbol,
  active,
}: TimeframeSelectorProps) {
  const t = await getTranslations("TimeframeSelector");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
        {t("label")}
      </span>

      {TIMEFRAME_OPTIONS.map((option) => {
        const isActive = option === active;

        return (
          <Link
            key={option}
            href={`/coin/${symbol}?tf=${option}`}
            scroll={false}
            aria-current={isActive ? "true" : undefined}
            className={
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition " +
              (isActive
                ? "border-blue-500 bg-blue-600 text-white"
                : "border-zinc-800 text-zinc-400 hover:border-blue-500 hover:text-white")
            }
          >
            {option}
          </Link>
        );
      })}
    </div>
  );
}
