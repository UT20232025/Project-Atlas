import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";

import Button from "@/components/ui/button";
import Disclaimer from "@/components/ui/Disclaimer";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import type { ScannerItem } from "@/lib/analysis/scanner";
import type { TrackRecordSummary } from "@/lib/atlas/trackRecord";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";

type LandingPageProps = {
  trackRecord: TrackRecordSummary;
  topSetups: ScannerItem[];
};

function displayCoin(coin: string): string {
  return coin.replace(/USDT$/, "");
}

export default async function LandingPage({
  trackRecord,
  topSetups,
}: LandingPageProps) {
  const t = await getTranslations("Landing");
  const tReasons = await getTranslations("AtlasReasons");
  const tPricing = await getTranslations("Pricing");
  const tTrack = await getTranslations("TrackRecord");
  const locale = await getLocale();

  const proFeatures = [
    tPricing("feature1"),
    tPricing("feature2"),
    tPricing("feature3"),
    tPricing("feature4"),
  ];

  // closedTrades is already most-recent-first; surface the latest
  // winning calls as fresh social proof.
  const recentWins = trackRecord.closedTrades
    .filter((trade) => (trade.pnlPercent ?? 0) > 0)
    .slice(0, 5);
  const hasClosedTrades = trackRecord.totalClosed > 0;

  const FEATURES = [
    { icon: "🤖", title: t("featureAtlasTitle"), description: t("featureAtlasDescription") },
    { icon: "🏆", title: t("featureTrackRecordTitle"), description: t("featureTrackRecordDescription") },
    { icon: "💼", title: t("featurePortfolioTitle"), description: t("featurePortfolioDescription") },
    { icon: "📒", title: t("featureJournalTitle"), description: t("featureJournalDescription") },
    { icon: "⭐", title: t("featureWatchlistsTitle"), description: t("featureWatchlistsDescription") },
  ];

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
          <LanguageSwitcher locale={locale} className="!w-auto" />

          <Link href="/login">
            <Button variant="secondary">{t("logInButton")}</Button>
          </Link>

          <Link href="/signup">
            <Button>{t("signUpButton")}</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:px-12 md:py-20">
        <section className="relative overflow-hidden text-center">
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 flex justify-center"
            aria-hidden="true"
          >
            <Image
              src="/logo-mark.png"
              alt=""
              width={900}
              height={900}
              priority
              className="h-[320px] w-auto select-none opacity-[0.07] blur-[1px] md:h-[460px]"
              style={{
                maskImage:
                  "radial-gradient(circle at center, black 55%, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 55%, transparent 78%)",
              }}
            />
          </div>

          <div className="relative">
            <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
              {t("eyebrow")}
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              {t("heroHeadline")}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
              {t("heroSubheadline")}
            </p>

            <p className="mt-3 text-sm font-medium uppercase tracking-[0.15em] text-blue-400">
              {t("tagline")}
            </p>
          </div>

          <div className="relative mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button size="lg">{t("getStarted")}</Button>
            </Link>

            <a
              href="https://t.me/GenwelthAiSignals"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="secondary" size="lg">
                {t("followTelegram")}
              </Button>
            </a>
          </div>
        </section>

        {topSetups.length > 0 && (
          <section className="mt-16">
            <h2 className="text-center text-2xl font-bold">
              {t("liveProofTitle")}
            </h2>

            <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-zinc-500">
              {t("liveProofSubtitle")}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {topSetups.map((setup) => {
                const tone =
                  setup.signal === "LONG"
                    ? {
                        badge: "bg-green-500/15 text-green-400",
                        icon: "🟢",
                      }
                    : setup.signal === "SHORT"
                    ? {
                        badge: "bg-red-500/15 text-red-400",
                        icon: "🔴",
                      }
                    : {
                        badge: "bg-amber-500/15 text-amber-400",
                        icon: "⏳",
                      };

                return (
                  <div
                    key={setup.coin}
                    className="atlas-card rounded-2xl p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {displayCoin(setup.coin)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${tone.badge}`}
                      >
                        {tone.icon} {setup.signal}{" "}
                        {setup.confidence}%
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-zinc-300">
                      <span className="text-zinc-500">
                        {t("liveProofWhy")}{" "}
                      </span>
                      {resolveReasonText(
                        tReasons,
                        locale,
                        setup.explanation
                      )}
                    </p>

                    {setup.reasons.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {setup.reasons
                          .slice(0, 3)
                          .map((reason, index) => (
                            <li
                              key={`${reason.code}-${index}`}
                              className="text-xs text-zinc-500"
                            >
                              •{" "}
                              {resolveReasonText(
                                tReasons,
                                locale,
                                reason
                              )}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="text-sm text-zinc-400 underline hover:text-white"
              >
                {t("liveProofCta")}
              </Link>
            </div>
          </section>
        )}

        <section className="atlas-card mt-16 rounded-2xl p-8">
          <h2 className="text-center text-2xl font-bold">
            {t("trackRecordTitle")}
          </h2>

          <p className="mt-1 text-center text-sm text-zinc-500">
            {t("trackRecordSubtitle")}
          </p>

          {hasClosedTrades ? (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">{t("winRate")}</p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.winRate.toFixed(1)}%
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">
                  {t("verifiedSignals")}
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {trackRecord.totalClosed}
                </p>
              </div>

              <div className="atlas-subcard rounded-xl p-6 text-center">
                <p className="text-xs text-zinc-500">{t("avgPnl")}</p>
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
                  {t("underEvaluation")}
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
                {t("signalsEvaluating")}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {t("evaluatingNote")}
              </p>
            </div>
          )}

          {hasClosedTrades && trackRecord.bySymbol.length > 0 && (
            <div className="mt-8">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {tTrack("perSymbolTitle")}
              </p>

              <div className="mx-auto mt-4 max-w-xl overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-zinc-500">
                      <th className="pb-2 font-medium">
                        {tTrack("colSymbol")}
                      </th>
                      <th className="pb-2 font-medium">
                        {tTrack("colTrades")}
                      </th>
                      <th className="pb-2 font-medium">
                        {tTrack("colWinRate")}
                      </th>
                      <th className="pb-2 font-medium">
                        {tTrack("colAvgPnl")}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {trackRecord.bySymbol
                      .slice(0, 5)
                      .map((row) => (
                        <tr
                          key={row.symbol}
                          className="border-t border-zinc-800"
                        >
                          <td className="py-2 font-medium text-white">
                            {displayCoin(row.symbol)}
                          </td>
                          <td className="py-2 text-zinc-400">
                            {row.trades}
                          </td>
                          <td className="py-2 text-zinc-300">
                            {row.winRate.toFixed(0)}%
                          </td>
                          <td
                            className={`py-2 font-medium ${
                              row.avgPnlPercent >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {row.avgPnlPercent >= 0 ? "+" : ""}
                            {row.avgPnlPercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm text-zinc-400 underline hover:text-white"
            >
              {t("signUpFullHistory")}
            </Link>
          </div>
        </section>

        {recentWins.length > 0 && (
          <section className="mt-16">
            <h2 className="text-center text-2xl font-bold">
              {t("recentWinsTitle")}
            </h2>

            <p className="mx-auto mt-1 max-w-2xl text-center text-sm text-zinc-500">
              {t("recentWinsSubtitle")}
            </p>

            <div className="mx-auto mt-8 max-w-2xl space-y-3">
              {recentWins.map((trade) => {
                const isLong = trade.signal === "LONG";

                return (
                  <div
                    key={trade.id}
                    className="atlas-card flex items-center justify-between rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">
                        {displayCoin(trade.symbol)}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          isLong
                            ? "bg-green-500/15 text-green-400"
                            : "bg-red-500/15 text-red-400"
                        }`}
                      >
                        {isLong ? "🟢" : "🔴"} {trade.signal}
                      </span>

                      <span className="text-xs text-zinc-500">
                        {new Date(
                          trade.createdAt
                        ).toLocaleDateString(locale, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    <span className="text-lg font-bold text-green-400">
                      +{(trade.pnlPercent ?? 0).toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-16">
          <h2 className="text-center text-2xl font-bold">
            {t("featuresTitle")}
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
          <h2 className="text-2xl font-bold">{t("proTitle")}</h2>

          <div className="mt-4 flex items-baseline justify-center gap-2">
            <p className="text-4xl font-bold text-white">{t("proPrice")}</p>
            <p className="text-zinc-500">{t("proPeriod")}</p>
          </div>

          <p className="mt-2 text-sm font-medium text-green-400">
            {tPricing("trialNote")}
          </p>

          <ul className="mx-auto mt-6 max-w-md space-y-3 text-left">
            {proFeatures.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 text-sm text-zinc-300"
              >
                <span className="mt-0.5 text-green-400">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg">{t("startTrial")}</Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-600">
        <p>{t("footer")}</p>
        <Disclaimer className="mx-auto mt-3 max-w-2xl !text-zinc-600" />
      </footer>
    </div>
  );
}
