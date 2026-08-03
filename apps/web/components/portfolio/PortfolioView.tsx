"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { usePriceFlash } from "@/components/hooks/usePriceFlash";
import { useMarket } from "@/components/providers/MarketProvider";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
} from "@/lib/services/liveMarketService";
import {
  calculatePnl,
  type PortfolioPositionView,
} from "@/lib/trading/pnl";

type PortfolioViewProps = {
  positions: PortfolioPositionView[];
  createPositionAction: (formData: FormData) => void;
  closePositionAction: (formData: FormData) => void;
  deletePositionAction: (formData: FormData) => void;
};

type PortfolioPositionRowProps = {
  position: PortfolioPositionView;
  currentPrice: number | undefined;
  isClosing: boolean;
  onToggleClosing: () => void;
  closePositionAction: (formData: FormData) => void;
  deletePositionAction: (formData: FormData) => void;
  t: ReturnType<typeof useTranslations>;
};

function PortfolioPositionRow({
  position,
  currentPrice,
  isClosing,
  onToggleClosing,
  closePositionAction,
  deletePositionAction,
  t,
}: PortfolioPositionRowProps) {
  const priceFlash = usePriceFlash(currentPrice ?? 0);

  const unrealized =
    currentPrice !== undefined
      ? calculatePnl(
          position.direction,
          position.entryPrice,
          currentPrice,
          position.quantity
        )
      : null;

  return (
    <div className="atlas-subcard rounded-xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="font-semibold text-white">
            {formatMarketSymbol(position.symbol)}
          </p>

          <Badge
            variant={
              position.direction === "LONG"
                ? "green"
                : "red"
            }
          >
            {position.direction}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleClosing}
            className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
          >
            {isClosing ? t("cancel") : t("close")}
          </button>

          <form action={deletePositionAction}>
            <input
              type="hidden"
              name="positionId"
              value={position.id}
            />

            <button
              type="submit"
              className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
            >
              {t("delete")}
            </button>
          </form>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-xs text-zinc-500">
            {t("entry")}
          </p>
          <p className="text-zinc-200">
            {position.entryPrice}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("quantity")}
          </p>
          <p className="text-zinc-200">
            {position.quantity}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("currentPrice")}
          </p>
          <p
            className={`text-zinc-200 ${
              priceFlash === "up"
                ? "atlas-price-flash-up"
                : priceFlash === "down"
                ? "atlas-price-flash-down"
                : ""
            }`}
          >
            {currentPrice ?? "—"}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">
            {t("unrealizedPnl")}
          </p>
          <p
            className={
              unrealized && unrealized.pnl >= 0
                ? "font-semibold text-green-400"
                : unrealized
                ? "font-semibold text-red-400"
                : "text-zinc-600"
            }
          >
            {unrealized
              ? `${unrealized.pnl >= 0 ? "+" : ""}${unrealized.pnl.toFixed(2)} (${unrealized.pnlPercent.toFixed(2)}%)`
              : "—"}
          </p>
        </div>
      </div>

      {position.note && (
        <p className="mt-3 text-sm text-zinc-500">
          {position.note}
        </p>
      )}

      {isClosing && (
        <form
          action={closePositionAction}
          className="atlas-subcard mt-4 flex flex-wrap items-center gap-3 rounded-xl p-3"
        >
          <input
            type="hidden"
            name="positionId"
            value={position.id}
          />

          <input
            type="number"
            name="exitPrice"
            placeholder={t("exitPricePlaceholder")}
            step="any"
            required
            defaultValue={currentPrice}
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-lg bg-[#ffffff] px-4 py-2 text-sm font-semibold text-[#000000] transition hover:bg-[#e4e4e7]"
          >
            {t("confirmClose")}
          </button>
        </form>
      )}
    </div>
  );
}

export default function PortfolioView({
  positions,
  createPositionAction,
  closePositionAction,
  deletePositionAction,
}: PortfolioViewProps) {
  const t = useTranslations("Portfolio");
  const { market } = useMarket();
  const [closingPositionId, setClosingPositionId] = useState<
    string | null
  >(null);

  return (
    <div className="space-y-8">
      <Section
        title={t("title")}
        subtitle={t("subtitle")}
      >
        <form
          action={createPositionAction}
          className="atlas-subcard mb-6 grid gap-3 rounded-2xl p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1.5fr_auto]"
        >
          <Select
            name="symbol"
            defaultValue={MARKET_SYMBOLS[0]}
          >
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </Select>

          <Select name="direction" defaultValue="LONG">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>

          <input
            type="number"
            name="entryPrice"
            placeholder={t("entryPricePlaceholder")}
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="number"
            name="quantity"
            placeholder={t("quantityPlaceholder")}
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="text"
            name="note"
            placeholder={t("notePlaceholder")}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-[#ffffff] px-5 py-3 text-sm font-semibold text-[#000000] transition hover:bg-[#e4e4e7]"
          >
            {t("addPosition")}
          </button>
        </form>

        {positions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              {t("emptyTitle")}
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => {
              const currentPrice = market.find(
                (item) => item.symbol === position.symbol
              )?.price;

              const isClosing =
                closingPositionId === position.id;

              return (
                <PortfolioPositionRow
                  key={position.id}
                  position={position}
                  currentPrice={currentPrice}
                  isClosing={isClosing}
                  onToggleClosing={() =>
                    setClosingPositionId(
                      isClosing ? null : position.id
                    )
                  }
                  closePositionAction={closePositionAction}
                  deletePositionAction={deletePositionAction}
                  t={t}
                />
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
