import { getTranslations } from "next-intl/server";
import Link from "next/link";

import type { ScannerItem } from "@/lib/analysis/scanner";

function fmt(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return "—";
  if (v >= 1000) return String(Math.round(v * 100) / 100);
  if (v >= 1) return String(Math.round(v * 10000) / 10000);
  return String(Math.round(v * 100000000) / 100000000);
}

// A live "breaking out now" feed. Only rendered when something is actually
// breaking out — so it reads as an event, not a permanent empty card.
export default async function BreakingOutNow({
  items,
}: {
  items: ScannerItem[];
}) {
  const breaking = items
    .filter((item) => item.breakout.detected && item.breakout.direction)
    .sort((a, b) => b.breakout.strength - a.breakout.strength);

  if (breaking.length === 0) {
    return null;
  }

  const t = await getTranslations("BreakingOutNow");

  return (
    <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-6">
      <h2 className="text-lg font-semibold text-white">🚀 {t("title")}</h2>
      <p className="mt-1 text-sm text-zinc-400">{t("subtitle")}</p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {breaking.map((item) => {
          const bo = item.breakout;
          const isLong = bo.direction === "LONG";
          return (
            <li key={item.coin}>
              <Link
                href={`/coin/${item.coin}`}
                className="block rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 transition hover:border-cyan-500/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-white">
                    {item.coin.replace(/USDT$/, "")}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      isLong
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {isLong ? "🟢 LONG" : "🔴 SHORT"}
                  </span>
                  <span className="ml-auto text-xs text-zinc-500">
                    {bo.rangeExpansion.toFixed(1)}× · {bo.strength}
                  </span>
                </div>
                {bo.entry != null && (
                  <p className="mt-2 text-xs text-zinc-400">
                    Entry {fmt(bo.entry)} · SL{" "}
                    <span className="text-red-300">{fmt(bo.stopLoss)}</span> · TP{" "}
                    <span className="text-emerald-300">{fmt(bo.takeProfit)}</span>
                  </p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
