import Link from "next/link";

type SignalCardProps = {
  coin: string;
  signal: "LONG" | "SHORT" | "WAIT";
  score: number;
  price?: string;
  change?: string;
};

function getCoinLogo(coin: string) {
  if (coin.startsWith("BTC")) return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/btc.png";
  if (coin.startsWith("ETH")) return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/eth.png";
  if (coin.startsWith("SOL")) return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/sol.png";
  if (coin.startsWith("XRP")) return "https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/xrp.png";
  return "";
}

export default function SignalCard({ coin, signal, score, price, change }: SignalCardProps) {
  const signalTextColor =
    signal === "LONG" ? "text-green-400" : signal === "SHORT" ? "text-red-400" : "text-yellow-400";

  const signalBg =
    signal === "LONG" ? "bg-green-500" : signal === "SHORT" ? "bg-red-500" : "bg-yellow-500";

  const changeColor = Number(change) >= 0 ? "text-green-400" : "text-red-400";
  const logo = getCoinLogo(coin);

  return (
    <Link href={`/coin/${coin}`}>
      <div className="cursor-pointer rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-blue-500/20">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              {logo && <img src={logo} alt={coin} className="h-11 w-11 rounded-full" />}

              <div>
                <h2 className="text-2xl font-bold">{coin}</h2>
                <div className="mt-1 flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${signalBg}`} />
                  <p className={`font-semibold ${signalTextColor}`}>{signal}</p>
                </div>
              </div>
            </div>

            <p className="mt-5 text-4xl font-bold">${price}</p>
            <p className={`mt-1 ${changeColor}`}>{change}% siste 24t</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-zinc-500">Atlas Score</p>
            <p className="text-5xl font-bold">{score}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}