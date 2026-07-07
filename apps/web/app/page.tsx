import SignalCard from "../components/SignalCard";

export default function Home() {
  const signals = [
    { coin: "BTCUSDT", signal: "LONG", confidence: 92 },
    { coin: "ETHUSDT", signal: "WAIT", confidence: 61 },
    { coin: "SOLUSDT", signal: "SHORT", confidence: 84 },
    { coin: "XRPUSDT", signal: "LONG", confidence: 88 },
  ] as const;

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-10">
      <h1 className="text-5xl font-bold">Genwelth AI</h1>
      <p className="text-zinc-400 mt-2">Powered by Atlas</p>

      <div className="mt-8 grid gap-4">
        {signals.map((item) => (
          <SignalCard
            key={item.coin}
            coin={item.coin}
            signal={item.signal}
            confidence={item.confidence}
          />
        ))}
      </div>
    </main>
  );
}