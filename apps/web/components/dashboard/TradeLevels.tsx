import { getLocale, getTranslations } from "next-intl/server";

type Signal = "LONG" | "SHORT" | "WAIT";

type TradeLevelsProps = {
  signal: Signal;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  /** Compact single-line form for dense lists (e.g. the scanner table). */
  compact?: boolean;
};

function formatPrice(price: number | null, locale: string): string {
  if (price === null || !Number.isFinite(price)) {
    return "—";
  }

  return price.toLocaleString(locale, {
    maximumFractionDigits: price < 1 ? 6 : 2,
  });
}

function formatRr(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(2)}:1`;
}

/**
 * Renders Atlas's recommended trade levels (entry / stop-loss / take-profit /
 * R:R) for a signal — so EVERY signal surfaces its TP & SL, not just the coin
 * page. Directional signals (LONG/SHORT) with real levels show the grid;
 * WAIT — or a directional call the engine didn't hand levels for — shows a
 * clear "no active setup" note instead of blank fields.
 */
export default async function TradeLevels({
  signal,
  entry,
  stopLoss,
  takeProfit,
  riskRewardRatio,
  compact = false,
}: TradeLevelsProps) {
  const t = await getTranslations("TradeLevels");
  const locale = await getLocale();

  const hasSetup =
    signal !== "WAIT" &&
    (entry !== null || stopLoss !== null || takeProfit !== null);

  if (!hasSetup) {
    return (
      <p
        className={
          compact
            ? "text-xs text-zinc-600"
            : "text-sm text-amber-300/80"
        }
      >
        {t("noSetup")}
      </p>
    );
  }

  if (compact) {
    return (
      <p className="text-xs text-zinc-500">
        <span className="text-emerald-400">
          {t("tpShort")} {formatPrice(takeProfit, locale)}
        </span>
        {" · "}
        <span className="text-red-400">
          {t("slShort")} {formatPrice(stopLoss, locale)}
        </span>
        {" · "}
        {t("rrShort")} {formatRr(riskRewardRatio)}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-xs text-zinc-500">{t("entry")}</p>
        <p className="mt-1 font-semibold text-white">
          {formatPrice(entry, locale)}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-xs text-zinc-500">{t("stopLoss")}</p>
        <p className="mt-1 font-semibold text-red-400">
          {formatPrice(stopLoss, locale)}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-xs text-zinc-500">{t("takeProfit")}</p>
        <p className="mt-1 font-semibold text-emerald-400">
          {formatPrice(takeProfit, locale)}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
        <p className="text-xs text-zinc-500">{t("riskReward")}</p>
        <p className="mt-1 font-semibold text-white">
          {formatRr(riskRewardRatio)}
        </p>
      </div>
    </div>
  );
}
