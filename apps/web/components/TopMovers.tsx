import Link from "next/link";

type TopMover = {
  coin: string;
  price: string;
  change: string;
};

type TopMoversProps = {
  items: TopMover[];
};

export default function TopMovers({ items }: TopMoversProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-5">
        <h2 className="text-2xl font-bold">🔥 Top Movers</h2>
        <p className="text-sm text-zinc-500">Største bevegelser siste 24t</p>
      </div>

      <div className="divide-y divide-zinc-800">
        {items.map((item, index) => {
          const positive = Number(item.change) >= 0;

          return (
            <Link
              key={item.coin}
              href={`/coin/${item.coin}`}
              className="grid grid-cols-4 items-center gap-4 p-4 transition hover:bg-zinc-800/60"
            >
              <p className="text-zinc-500">#{index + 1}</p>

              <div>
                <p className="font-bold">{item.coin}</p>
                <p className="text-sm text-zinc-500">${item.price}</p>
              </div>

              <p className={positive ? "text-green-400" : "text-red-400"}>
                {item.change}%
              </p>

              <p className="text-right text-zinc-500">Analyse →</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}