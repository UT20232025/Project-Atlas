type DailyBriefProps = {
  bullish: number;
  bearish: number;
  neutral: number;
  fearGreed: number;
  btcDominance: number;
};

export default function DailyBrief({
  bullish,
  bearish,
  neutral,
  fearGreed,
  btcDominance,
}: DailyBriefProps) {
  const marketText =
    bullish > bearish
      ? "The market is showing bullish momentum."
      : bearish > bullish
      ? "The market is showing bearish momentum."
      : "The market is balanced.";

  const sentiment =
    fearGreed >= 70
      ? "Investors are showing strong greed."
      : fearGreed <= 30
      ? "Investors are showing significant fear."
      : "Sentiment is neutral.";

  return (
   <section className="atlas-card rounded-2xl p-8">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">🤖</span>

        <h2 className="text-2xl font-bold">
          Atlas AI Daily Brief
        </h2>
      </div>

      <div className="space-y-3 text-zinc-300 leading-7">
        <p>{marketText}</p>

        <p>{sentiment}</p>

        <p>
          {bullish} bullish • {neutral} neutral • {bearish} bearish markets.
        </p>

        <p>
          Bitcoin dominance is at{" "}
          <span className="font-bold">
            {btcDominance.toFixed(2)}%
          </span>
          .
        </p>

        <p className="text-green-400 font-semibold">
          Atlas recommends focusing on the markets with the
          highest Confidence Score.
        </p>
      </div>
    </section>
  );
}