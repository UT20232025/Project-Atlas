import Link from "next/link";

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

function getSignalColor(signal: string) {
  if (signal === "LONG") return "text-green-400";
  if (signal === "SHORT") return "text-red-400";
  return "text-yellow-400";
}

export default function WatchlistTable({ items }: WatchlistTableProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-5">
        <h2 className="text-2xl font-bold">Watchlist</h2>
        <p className="text-sm text-zinc-500">Live markets powered by Atlas</p>
      </div>

      <div className="divide-y divide-zinc-800">
        {items.map((item) => (
          <Link
            key={item.coin}
            href={`/coin/${item.coin}`}
            className="grid grid-cols-5 items-center gap-4 p-5 transition hover:bg-zinc-800/60"
          >
            <div>
              <p className="font-bold">{item.coin}</p>
              <p className="text-sm text-zinc-500">Binance</p>
            </div>

            <p className="font-semibold">${item.price}</p>

            <p
              className={
                Number(item.change) >= 0 ? "text-green-400" : "text-red-400"
              }
            >
              {item.change}%
            </p>

            <p className={getSignalColor(item.signal)}>{item.signal}</p>

            <p className="text-right text-2xl font-bold">{item.score}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}