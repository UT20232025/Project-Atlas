type BTCDominanceCardProps = {
  value: string;
};

export default function BTCDominanceCard({ value }: BTCDominanceCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">BTC Dominance</p>

      <h2 className="mt-2 text-4xl font-bold text-orange-400">
        {value}%
      </h2>

      <p className="text-zinc-400">Bitcoin markedsandel</p>
    </div>
  );
}