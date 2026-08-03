"use client";

import { useLocale, useTranslations } from "next-intl";

import type { PriceActionResult } from "@/lib/atlas/priceActionEngine";

type Props = {
  priceAction: PriceActionResult;
};

function formatPrice(t: ReturnType<typeof useTranslations>, value: number | null, locale: string): string {
  if (value === null) {
    return t("notDetected");
  }

  return value.toLocaleString(locale, {
    maximumFractionDigits: 5,
  });
}

function getStructureStyles(
  structure: PriceActionResult["structure"]
): string {
  if (structure === "BULLISH") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
  }

  if (structure === "BEARISH") {
    return "border-red-500/20 bg-red-500/10 text-red-400";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-300";
}

function getDirectionStyles(
  direction:
    | PriceActionResult["bosDirection"]
    | PriceActionResult["chochDirection"]
): string {
  if (direction === "BULLISH") {
    return "text-emerald-400";
  }

  if (direction === "BEARISH") {
    return "text-red-400";
  }

  return "text-zinc-500";
}

function StructureItem({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-3">
      <span className="text-sm text-zinc-300">
        {label}
      </span>

      <span
        className={
          active
            ? "text-sm font-semibold text-emerald-400"
            : "text-sm font-semibold text-zinc-600"
        }
      >
        {active ? "✓" : "—"}
      </span>
    </div>
  );
}

export default function PriceActionCard({
  priceAction,
}: Props) {
  const t = useTranslations("PriceActionCard");
  const c = useTranslations("Cards");
  const locale = useLocale();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {t("title")}
          </p>

          <h3 className="mt-2 text-xl font-semibold text-white">
            {t("subtitle")}
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            {t("description")}
          </p>
        </div>

        <div
          className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${getStructureStyles(
            priceAction.structure
          )}`}
        >
          {priceAction.structure}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StructureItem
          label={t("higherHigh")}
          active={priceAction.higherHigh}
        />

        <StructureItem
          label={t("higherLow")}
          active={priceAction.higherLow}
        />

        <StructureItem
          label={t("lowerHigh")}
          active={priceAction.lowerHigh}
        />

        <StructureItem
          label={t("lowerLow")}
          active={priceAction.lowerLow}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("breakOfStructure")}
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <p
              className={`text-xl font-semibold ${getDirectionStyles(
                priceAction.bosDirection
              )}`}
            >
              {priceAction.bosDirection}
            </p>

            <p className="text-sm text-zinc-400">
              {formatPrice(c, priceAction.bosLevel, locale)}
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            {t("bosDescription")}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("changeOfCharacter")}
          </p>

          <div className="mt-3 flex items-end justify-between gap-4">
            <p
              className={`text-xl font-semibold ${getDirectionStyles(
                priceAction.chochDirection
              )}`}
            >
              {priceAction.chochDirection}
            </p>

            <p className="text-sm text-zinc-400">
              {formatPrice(c, priceAction.chochLevel, locale)}
            </p>
          </div>

          <p className="mt-3 text-xs leading-5 text-zinc-500">
            {t("chochDescription")}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("latestSwingHigh")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(
              c,
              priceAction.lastHigh?.price ?? null,
              locale
            )}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            {c("previousColon")}{" "}
            {formatPrice(
              c,
              priceAction.previousHigh?.price ?? null,
              locale
            )}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {t("latestSwingLow")}
          </p>

          <p className="mt-2 text-lg font-semibold text-white">
            {formatPrice(
              c,
              priceAction.lastLow?.price ?? null,
              locale
            )}
          </p>

          <p className="mt-3 text-xs text-zinc-600">
            {c("previousColon")}{" "}
            {formatPrice(
              c,
              priceAction.previousLow?.price ?? null,
              locale
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            {c("confidence")}
          </p>

          <p className="text-sm font-semibold text-white">
            {priceAction.confidence}%
          </p>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-[#ffffff] transition-all"
            style={{
              width: `${priceAction.confidence}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          {t("structureExplanation")}
        </p>

        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {priceAction.explanation}
        </p>
      </div>
    </div>
  );
}