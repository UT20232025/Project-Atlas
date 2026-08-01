import Image from "next/image";
import Link from "next/link";

import Button from "@/components/ui/button";
import type { TrackRecordSummary } from "@/lib/atlas/trackRecord";

const FEATURES = [
  {
    icon: "🤖",
    title: "Atlas AI Engine",
    description:
      "Trend, RSI, MACD, volum, liquidity, market structure, order blocks og multi-timeframe-analyse i sanntid.",
  },
  {
    icon: "🏆",
    title: "Verified Track Record",
    description:
      "24t-utfall for hvert LONG/SHORT-signal, verifisert mot ekte Binance-priser — ikke bare påstander.",
  },
  {
    icon: "💼",
    title: "Portfolio",
    description:
      "Spor åpne posisjoner med live urealisert P&L.",
  },
  {
    icon: "📒",
    title: "Trading Journal",
    description:
      "Automatisk logging fra lukkede posisjoner, manuell registrering, CSV-eksport.",
  },
  {
    icon: "⭐",
    title: "Egendefinerte Watchlists",
    description: "Flere navngitte lister for coinene du følger.",
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
            <Button variant="secondary">Logg inn</Button>
          </Link>

          <Link href="/signup">
            <Button>Registrer deg gratis</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-12 md:py-20">
        <section className="text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
            Powered by Atlas Engine
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            AI-drevet kryptoanalyse med et bevisbart track record
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Genwelth AI analyserer kryptomarkedet i sanntid og gir
            deg LONG/SHORT-signaler — og vi viser deg ærlig hvordan
            de faktisk har prestert, ikke bare hva de sier.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">Kom i gang gratis</Button>
            </Link>

            <a
              href="https://t.me/GenwelthAiSignals"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                Følg signaler på Telegram
              </Button>
            </a>
          </div>
        </section>

        <section className="atlas-card mt-16 rounded-2xl p-8">
          <h2 className="text-center text-2xl font-bold">
            Verified Track Record
          </h2>

          <p className="mt-1 text-center text-sm text-zinc-500">
            Hvert LONG/SHORT-signal evalueres automatisk mot ekte
            priser 24 timer etter det ble gitt
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
                  Verifiserte signaler
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.totalClosed}
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">Snitt P&L</p>
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
                  Under evaluering
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
                signaler under sanntidsevaluering akkurat nå
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Verifiserte resultater vises her etter hvert som
                24-timersvinduet lukkes for hvert signal.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm text-zinc-400 underline hover:text-white"
            >
              Registrer deg for å se full historikk og
              per-coin-statistikk →
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">
            Alt du trenger for å handle med data, ikke magefølelse
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
            <p className="text-zinc-500">/ måned</p>
          </div>

          <p className="mt-2 text-zinc-400">
            7 dager gratis prøveperiode. Låser opp Track Record,
            Portfolio, Trading Journal og Watchlists.
          </p>

          <div className="mt-6">
            <Link href="/signup">
              <Button size="lg">Start gratis prøveperiode</Button>
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
