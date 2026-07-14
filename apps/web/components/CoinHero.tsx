type CoinHeroProps = {
  coin: string;
  price: number;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  score: number;
};

export default function CoinHero({
  coin,
  price,
  signal,
  confidence,
  score,
}: CoinHeroProps) {
  const signalColor =
    signal === "LONG"
      ? "text-green-400"
      : signal === "SHORT"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm">
            Genwelth AI Analysis
          </p>

          <h1 className="mt-2 text-5xl font-bold">
            {coin}
          </h1>

          <p className="mt-4 text-4xl font-bold">
            ${price.toLocaleString()}
          </p>
        </div>

        <div className="text-right">
          <p className="text-zinc-500">Signal</p>

          <p className={`text-5xl font-bold ${signalColor}`}>
            {signal}
          </p>

          <p className="mt-6 text-zinc-500">
            Atlas Score
          </p>

          <p className="text-3xl font-bold">
            {score}
          </p>

          <p className="mt-4 text-zinc-500">
            Confidence
          </p>

          <p className="text-3xl font-bold text-green-400">
            {confidence}%
          </p>
        </div>
      </div>
    </div>
  );
}