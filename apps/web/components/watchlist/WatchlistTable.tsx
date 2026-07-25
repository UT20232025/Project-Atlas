import Link from "next/link";

import Badge from "../ui/Badge";
import Section from "../ui/Section";

type WatchlistItem = {
  coin: string;
  price: string;
  change: string;
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
};

type WatchlistTableProps = {
  items: WatchlistItem[];
};

function getSignalVariant(
  signal: WatchlistItem["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

function getScoreVariant(
  score: number
): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

export default function WatchlistTable({
  items,
}: WatchlistTableProps) {
  return (
    <Section
      title="Watchlist"
      subtitle="Live markets powered by Atlas"
      className="overflow-hidden p-0"
    >
      <div className="hidden grid-cols-5 gap-4 border-b border-zinc-800 px-5 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 md:grid">
        <span>Market</span>
        <span>Price</span>
        <span>24h</span>
        <span>Signal</span>
        <span className="text-right">Atlas Score</span>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="font-medium text-zinc-300">
            Watchlisten er tom
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Legg til markeder fra en coin-side.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-800">
          {items.map((item) => {
            const change = Number(item.change);
            const changeIsPositive =
              Number.isFinite(change) && change >= 0;

            return (
              <Link
                key={item.coin}
                href={`/coin/${item.coin}`}
                className="grid grid-cols-2 items-center gap-4 px-5 py-5 transition hover:bg-zinc-800/60 md:grid-cols-5"
              >
                <div>
                  <p className="font-bold text-white">
                    {item.coin}
                  </p>

                  <p className="text-sm text-zinc-500">
                    Binance
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 md:hidden">
                    Price
                  </p>

                  <p className="font-semibold text-zinc-200">
                    ${item.price}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-zinc-500 md:hidden">
                    24h
                  </p>

                  <p
                    className={
                      changeIsPositive
                        ? "font-medium text-green-400"
                        : "font-medium text-red-400"
                    }
                  >
                    {changeIsPositive ? "+" : ""}
                    {item.change}%
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs text-zinc-500 md:hidden">
                    Signal
                  </p>

                  <Badge variant={getSignalVariant(item.signal)}>
                    {item.signal}
                  </Badge>
                </div>

                <div className="flex justify-start md:justify-end">
                  <div>
                    <p className="mb-1 text-xs text-zinc-500 md:hidden">
                      Atlas Score
                    </p>

                    <Badge variant={getScoreVariant(item.score)}>
                      {item.score}
                    </Badge>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Section>
  );
}