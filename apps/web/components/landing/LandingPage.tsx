import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/button";
import type { TrackRecordSummary } from "@/lib/atlas/trackRecord";

const FEATURES = [
  {
    icon: "🤖",
    title: "Atlas AI Engine",
    description:
      "Trend, RSI, MACD, volume, liquidity, market structure, order blocks, and multi-timeframe analysis in real time.",
  },
  {
    icon: "🏆",
    title: "Verified Track Record",
    description:
      "24h outcome for every LONG/SHORT signal, verified against real Binance prices — not just claims.",
  },
  {
    icon: "💼",
    title: "Portfolio",
    description:
      "Track open positions with live unrealized P&L.",
  },
  {
    icon: "📒",
    title: "Trading Journal",
    description:
      "Automatic logging from closed positions, manual entry, CSV export.",
  },
  {
    icon: "⭐",
    title: "Custom Watchlists",
    description: "Multiple named lists for the coins you follow.",
  },
];

type LandingPageProps = {
  trackRecord: TrackRecordSummary;
};

export default function LandingPage({
  trackRecord,
}: LandingPageProps) {
  const hasClosedTrades = trackRecord.totalClosed > 0;

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: "var(--app-backdrop)" }}
    >
      <header className="flex items-center justify-between px-6 py-6 md:px-12">
        <Image
          src="/logo-full.png"
          alt="Genwelth AI"
          width={1095}
          height={821}
          priority
          className="h-10 w-auto"
        />

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="secondary">Log in</Button>
          </Link>

          <Link href="/signup">
            <Button>Sign up free</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-12 md:py-20">
        <section className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Powered by Atlas Engine
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            AI-driven crypto analysis with a provable track record
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Genwelth AI analyzes the crypto market in real time and
            gives you LONG/SHORT signals — and we show you honestly
            how they&apos;ve actually performed, not just what they
            claim.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>

            <a
              href="https://t.me/GenwelthAiSignals"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                Follow signals on Telegram
              </Button>
            </a>
          </div>
        </section>

        <section className="atlas-card mt-16 rounded-2xl p-8">
          <h2 className="text-center text-2xl font-bold">
            Verified Track Record
          </h2>

          <p className="mt-1 text-center text-sm text-zinc-500">
            Every LONG/SHORT signal is automatically evaluated
            against real prices 24 hours after it was given
          </p>

          {hasClosedTrades ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">Win rate</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.winRate.toFixed(1)}%
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">
                  Verified signals
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.totalClosed}
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">Avg P&L</p>
                <p
                  className={`mt-2 text-3xl font-bold ${
                    trackRecord.avgPnlPercent >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {trackRecord.avgPnlPercent >= 0 ? "+" : ""}
                  {trackRecord.avgPnlPercent.toFixed(2)}%
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">
                  Under evaluation
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.openPositions.length}
                </p>
              </div>
            </div>
          ) : (
            <div className="atlas-subcard mt-8 rounded-xl p-8 text-center">
              <p className="text-3xl font-bold text-white">
                {trackRecord.openPositions.length}
              </p>
              <p className="mt-2 text-zinc-400">
                signals under real-time evaluation right now
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Verified results will appear here as the 24-hour
                window closes for each signal.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm text-zinc-400 underline hover:text-white"
            >
              Sign up to see the full history and per-coin
              stats →
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">
            Everything you need to trade on data, not gut feeling
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="atlas-card rounded-2xl p-6"
              >
                <span className="text-3xl">{feature.icon}</span>

                <h3 className="mt-3 font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="atlas-card mt-16 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold">Genwelth AI Pro</h2>

          <div className="mt-4 flex items-baseline justify-center gap-2">
            <p className="text-4xl font-bold text-white">199 kr</p>
            <p className="text-zinc-500">/ month</p>
          </div>

          <p className="mt-2 text-zinc-400">
            7-day free trial. Unlocks Track Record, Portfolio,
            Trading Journal, and Watchlists.
          </p>

          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Start free trial</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-600">
        Genwelth AI — Powered by Atlas
      </footer>
    </div>
  );
}
