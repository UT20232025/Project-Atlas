type FearGreedCardProps = {
  value: number;
  label: string;
};

export default function FearGreedCard({ value, label }: FearGreedCardProps) {
  const color =
    value >= 70
      ? "text-green-400"
      : value <= 30
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">Fear & Greed</p>

      <h2 className={`mt-2 text-4xl font-bold ${color}`}>
        {value}
      </h2>

      <p className={color}>{label}</p>
    </div>
  );
}