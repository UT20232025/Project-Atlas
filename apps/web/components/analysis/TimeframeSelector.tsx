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
  // Base path the timeframe param is appended to, e.g. "/coin/BTCUSDT" or "/".
  hrefBase: string;
  active: BinanceInterval;
  // Query-param name to drive (default "tf"); pass e.g. "rsiTf" for an
  // independent selector on the same page.
  param?: string;
  // Optional label override; falls back to the shared "Timeframe" label.
  label?: string;
};

export default async function TimeframeSelector({
  hrefBase,
  active,
  param = "tf",
  label,
}: TimeframeSelectorProps) {
  const t = await getTranslations("TimeframeSelector");
  const sep = hrefBase.includes("?") ? "&" : "?";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs font-medium uppercase tracking-widest text-zinc-500">
        {label ?? t("label")}
      </span>

      {TIMEFRAME_OPTIONS.map((option) => {
        const isActive = option === active;

        return (
          <Link
            key={option}
            href={`${hrefBase}${sep}${param}=${option}`}
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
