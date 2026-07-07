type SignalCardProps = {
  coin: string;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
};

export default function SignalCard({
  coin,
  signal,
  confidence,
}: SignalCardProps) {
  const color =
    signal === "LONG"
      ? "text-green-400"
      : signal === "SHORT"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">{coin}</h2>
          <p className={color}>{signal}</p>
        </div>

        <div className="text-right">
          <p className="text-zinc-400">Confidence</p>
          <p className="text-3xl font-bold">{confidence}%</p>
        </div>
      </div>
    </div>
  );
}
