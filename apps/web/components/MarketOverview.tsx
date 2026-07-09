export default function MarketOverview() {
  return (
    <div className="mb-8 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Market</p>
        <h2 className="mt-2 text-2xl font-bold text-green-400">Bullish</h2>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Atlas Status</p>
        <h2 className="mt-2 text-2xl font-bold">Online</h2>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="text-sm text-zinc-400">Signal Mode</p>
        <h2 className="mt-2 text-2xl font-bold text-yellow-400">Testing</h2>
      </div>
    </div>
  );
}