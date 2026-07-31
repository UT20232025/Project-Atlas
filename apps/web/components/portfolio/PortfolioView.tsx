"use client";

import { useState } from "react";

import { useMarket } from "@/components/providers/MarketProvider";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
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

export default function PortfolioView({
  positions,
  createPositionAction,
  closePositionAction,
  deletePositionAction,
}: PortfolioViewProps) {
  const { market } = useMarket();
  const [closingPositionId, setClosingPositionId] = useState<
    string | null
  >(null);

  return (
    <div className="space-y-8">
      <Section
        title="Portfolio"
        subtitle="Track your open positions"
      >
        <form
          action={createPositionAction}
          className="mb-6 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_1.5fr_auto]"
        >
          <select
            name="symbol"
            defaultValue={MARKET_SYMBOLS[0]}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
          >
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </select>

          <select
            name="direction"
            defaultValue="LONG"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
          >
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>

          <input
            type="number"
            name="entryPrice"
            placeholder="Entry price"
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="text"
            name="note"
            placeholder="Note (optional)"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Add position
          </button>
        </form>

        {positions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              No open positions
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              Add your first position above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {positions.map((position) => {
              const currentPrice = market.find(
                (item) => item.symbol === position.symbol
              )?.price;

              const unrealized =
                currentPrice !== undefined
                  ? calculatePnl(
                      position.direction,
                      position.entryPrice,
                      currentPrice,
                      position.quantity
                    )
                  : null;

              const isClosing =
                closingPositionId === position.id;

              return (
                <div
                  key={position.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-4"
                >
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
                        onClick={() =>
                          setClosingPositionId(
                            isClosing ? null : position.id
                          )
                        }
                        className="rounded-lg border border-zinc-800 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
                      >
                        {isClosing ? "Cancel" : "Close"}
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
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Entry
                      </p>
                      <p className="text-zinc-200">
                        {position.entryPrice}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Quantity
                      </p>
                      <p className="text-zinc-200">
                        {position.quantity}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Current price
                      </p>
                      <p className="text-zinc-200">
                        {currentPrice ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Unrealized P&L
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
                      className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <input
                        type="hidden"
                        name="positionId"
                        value={position.id}
                      />

                      <input
                        type="number"
                        name="exitPrice"
                        placeholder="Exit price"
                        step="any"
                        required
                        defaultValue={currentPrice}
                        className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
                      />

                      <button
                        type="submit"
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
                      >
                        Confirm close
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
