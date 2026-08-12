import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import TradeLevels from "@/components/dashboard/TradeLevels";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/button";
import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";
import { SOCIAL_LINKS } from "@/lib/config/social";
import {
  fetchSingleMarket,
  MARKET_SYMBOLS,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";

const SITE = "https://www.genwelth.com";

type Props = { params: Promise<{ symbol: string }> };

function resolveCurated(raw: string): MarketSymbol | null {
  const upper = raw.toUpperCase();
  return (MARKET_SYMBOLS as readonly string[]).includes(upper)
    ? (upper as MarketSymbol)
    : null;
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { symbol } = await params;
  const resolved = resolveCurated(symbol);

  if (!resolved) {
    return {};
  }

  const coin = resolved.replace(/USDT$/, "");
  const card = `${SITE}/api/signal-card/${resolved}`;
  const title = `${coin} — Genwelth AI signal`;
  const description = `Atlas's live read on ${coin}: signal, confidence, and trade levels.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE}/signal/${resolved}`,
      images: [{ url: card, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [card],
    },
  };
}

function signalVariant(
  signal: "LONG" | "SHORT" | "WAIT"
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function SignalPage({ params }: Props) {
  const { symbol } = await params;
  const resolved = resolveCurated(symbol);

  if (!resolved) {
    notFound();
  }

  const t = await getTranslations("SignalPage");
  const tReasons = await getTranslations("AtlasReasons");
  const locale = await getLocale();
  const coin = resolved.replace(/USDT$/, "");

  const [analysis, market] = await Promise.all([
    getCachedAtlasAnalysis(resolved),
    fetchSingleMarket(resolved),
  ]);
  const d = analysis.decision;

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-2xl px-6 py-14">
        <div className="text-center">
          <Link href="/" className="text-xl font-bold">
            GENWELTH <span className="text-teal-400">AI</span>
          </Link>
          <p className="mt-1 text-sm text-zinc-500">{t("tagline")}</p>
        </div>

        <section className="atlas-card mt-8 rounded-2xl p-8">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            {t("eyebrow")}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4">
            <h1 className="text-5xl font-bold">{coin}</h1>
            <Badge variant={signalVariant(d.signal)}>{d.signal}</Badge>
            <span
              className={`ml-auto text-3xl font-bold ${
                d.signal === "LONG"
                  ? "text-green-400"
                  : d.signal === "SHORT"
                    ? "text-red-400"
                    : "text-yellow-400"
              }`}
            >
              {d.confidence}%
            </span>
          </div>

          {market && (
            <p className="mt-2 text-sm text-zinc-400">
              {t("priceLabel")}:{" "}
              {market.price.toLocaleString(locale, {
                maximumFractionDigits: market.price < 1 ? 6 : 2,
              })}{" "}
              USDT
            </p>
          )}

          <div className="mt-6">
            <TradeLevels
              signal={d.signal}
              entry={d.entry}
              stopLoss={d.stopLoss}
              takeProfit={d.takeProfit}
              riskRewardRatio={d.riskRewardRatio}
            />
          </div>

          <p className="mt-6 text-sm leading-6 text-zinc-300">
            {resolveReasonText(tReasons, locale, d.explanation)}
          </p>
        </section>

        <div className="mt-6 flex flex-col gap-3">
          <Link href="/signup">
            <Button className="w-full">{t("ctaSignup")}</Button>
          </Link>

          <a
            href={SOCIAL_LINKS.telegram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" className="w-full">
              {t("ctaTelegram")}
            </Button>
          </a>

          <a
            href={`/api/signal-card/${resolved}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            {t("downloadCard")}
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-600">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
