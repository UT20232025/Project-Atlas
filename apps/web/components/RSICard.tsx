type RSICardProps = {
  value: number;
};

export default function RSICard({ value }: RSICardProps) {
  let color = "text-yellow-400";
  let label = "Neutral";

  if (value >= 70) {
    color = "text-red-400";
    label = "Overbought";
  } else if (value <= 30) {
    color = "text-green-400";
    label = "Oversold";
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-zinc-400">RSI (14)</p>

      <p className={`mt-4 text-5xl font-bold ${color}`}>
        {value.toFixed(1)}
      </p>

      <p className={`mt-2 font-semibold ${color}`}>
        {label}
      </p>
    </div>
  );
}