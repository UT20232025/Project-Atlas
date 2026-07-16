type MarketTickerProps = {
  btc: number;
  btcChange: number;
  eth: number;
  ethChange: number;
  sol: number;
  solChange: number;
  fearGreed: number;
  btcDominance: number;
};

function Coin({
  symbol,
  price,
  change,
}: {
  symbol: string;
  price: number;
  change: number;
}) {
  const positive = change >= 0;

  return (
    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
      <span className="font-semibold">{symbol}</span>

      <span className="text-zinc-300">
        ${price.toLocaleString("en-US")}
      </span>

      <span
        className={
          positive
            ? "font-semibold text-green-400"
            : "font-semibold text-red-400"
        }
      >
        {positive ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}

export default function MarketTicker({
  btc,
  btcChange,
  eth,
  ethChange,
  sol,
  solChange,
  fearGreed,
  btcDominance,
}: MarketTickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Coin symbol="BTC" price={btc} change={btcChange} />

      <Coin symbol="ETH" price={eth} change={ethChange} />

      <Coin symbol="SOL" price={sol} change={solChange} />

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
        Fear & Greed <b>{fearGreed}</b>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
        BTC Dom <b>{btcDominance.toFixed(1)}%</b>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" />
        <span className="font-semibold text-green-400">
          LIVE
        </span>
      </div>
    </div>
  );
}
