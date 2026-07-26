type TradeSetup = {
  direction: string;
  entry: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward1: number;
  riskReward2: number;
  quality: string;
  explanation: string;
};

type Props = {
  tradeSetup: TradeSetup;
};

function formatPrice(price: number) {
  return price.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

export default function AtlasTradeSetup({
  tradeSetup,
}: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-5">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Trade Setup
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">
            Direction
          </p>

          <p className="mt-1 text-lg font-semibold text-white">
            {tradeSetup.direction}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Entry
          </p>

          <p className="mt-1 font-medium text-white">
            {formatPrice(tradeSetup.entry)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Stop Loss
          </p>

          <p className="mt-1 font-medium text-red-400">
            {formatPrice(tradeSetup.stopLoss)}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            Quality
          </p>

          <p className="mt-1 font-medium text-emerald-400">
            {tradeSetup.quality}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Take Profit 1
          </p>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit1)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            RR {tradeSetup.riskReward1.toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 p-4">
          <p className="text-xs text-zinc-500">
            Take Profit 2
          </p>

          <p className="mt-1 text-lg font-semibold text-emerald-400">
            {formatPrice(tradeSetup.takeProfit2)}
          </p>

          <p className="mt-2 text-xs text-zinc-500">
            RR {tradeSetup.riskReward2.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm leading-6 text-zinc-400">
        {tradeSetup.explanation}
      </p>
    </div>
  );
}