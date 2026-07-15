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
      ? "Markedet viser bullish momentum."
      : bearish > bullish
      ? "Markedet viser bearish momentum."
      : "Markedet er balansert.";

  const sentiment =
    fearGreed >= 70
      ? "Investorene viser sterk grådighet."
      : fearGreed <= 30
      ? "Investorene viser betydelig frykt."
      : "Sentimentet er nøytralt.";

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
          {bullish} bullish • {neutral} nøytrale • {bearish} bearish markeder.
        </p>

        <p>
          Bitcoin-dominansen ligger på{" "}
          <span className="font-bold">
            {btcDominance.toFixed(2)}%
          </span>
          .
        </p>

        <p className="text-green-400 font-semibold">
          Atlas anbefaler å fokusere på markedene med høyest
          Confidence Score.
        </p>
      </div>
    </section>
  );
}