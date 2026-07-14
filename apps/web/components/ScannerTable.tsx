import Link from "next/link";
import type { ScannerItem } from "../lib/analysis/scanner";

type ScannerTableProps = {
  items: ScannerItem[];
};

function getSignalColor(signal: ScannerItem["signal"]) {
  if (signal === "LONG") return "text-green-400";
  if (signal === "SHORT") return "text-red-400";
  return "text-yellow-400";
}

function getTrendSymbol(trend: ScannerItem["trend"]) {
  if (trend === "BULLISH") return "↑";
  if (trend === "BEARISH") return "↓";
  return "→";
}

export default function ScannerTable({ items }: ScannerTableProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-6">
        <h2 className="text-2xl font-bold">Atlas Scanner</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Markedene rangert etter Atlas Confidence
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-7 gap-4 border-b border-zinc-800 px-6 py-3 text-sm text-zinc-500">
            <span>#</span>
            <span>Marked</span>
            <span>Pris</span>
            <span>24t</span>
            <span>Signal</span>
            <span>RSI</span>
            <span className="text-right">Confidence</span>
          </div>

          <div className="divide-y divide-zinc-800">
            {items.map((item, index) => {
              const changeColor =
                item.change24h >= 0 ? "text-green-400" : "text-red-400";

              return (
                <Link
                  key={item.coin}
                  href={`/coin/${item.coin}`}
                  className="grid grid-cols-7 items-center gap-4 px-6 py-4 transition hover:bg-zinc-800/60"
                >
                  <span className="text-zinc-500">{index + 1}</span>

                  <div>
                    <p className="font-bold">{item.coin}</p>
                    <p className="text-xs text-zinc-500">
                      {getTrendSymbol(item.trend)} {item.trend}
                    </p>
                  </div>

                  <span className="font-medium">
                    ${item.price.toLocaleString("en-US")}
                  </span>

                  <span className={changeColor}>
                    {item.change24h.toFixed(2)}%
                  </span>

                  <span className={`font-semibold ${getSignalColor(item.signal)}`}>
                    {item.signal}
                  </span>

                  <span>{item.rsi.toFixed(1)}</span>

                  <span className="text-right text-2xl font-bold">
                    {item.confidence}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}