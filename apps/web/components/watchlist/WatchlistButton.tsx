"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { WatchlistView } from "@/lib/watchlists/queries";

type WatchlistButtonProps = {
  symbol: MarketSymbol;
  watchlists: WatchlistView[];
  addSymbolToWatchlistAction: (formData: FormData) => void;
  removeSymbolFromWatchlistAction: (
    formData: FormData
  ) => void;
};

export default function WatchlistButton({
  symbol,
  watchlists,
  addSymbolToWatchlistAction,
  removeSymbolFromWatchlistAction,
}: WatchlistButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const memberCount = watchlists.filter((watchlist) =>
    watchlist.symbols.includes(symbol)
  ).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setIsOpen((currentValue) => !currentValue)
        }
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-medium transition ${
          memberCount > 0
            ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-yellow-500/40 hover:text-yellow-300"
        }`}
      >
        <Star
          size={18}
          className={
            memberCount > 0
              ? "fill-yellow-400 text-yellow-400"
              : ""
          }
        />

        {memberCount > 0
          ? `In ${memberCount} watchlist${
              memberCount === 1 ? "" : "s"
            }`
          : "Add to Watchlist"}
      </button>

      {isOpen && (
        <div className="atlas-subcard absolute right-0 z-10 mt-2 w-56 rounded-xl p-2 shadow-xl backdrop-blur-xl">
          {watchlists.length === 0 ? (
            <p className="p-2 text-xs text-zinc-500">
              No watchlists yet — create one from the
              dashboard.
            </p>
          ) : (
            watchlists.map((watchlist) => {
              const isMember =
                watchlist.symbols.includes(symbol);

              return (
                <form
                  key={watchlist.id}
                  action={
                    isMember
                      ? removeSymbolFromWatchlistAction
                      : addSymbolToWatchlistAction
                  }
                >
                  <input
                    type="hidden"
                    name="watchlistId"
                    value={watchlist.id}
                  />

                  <input
                    type="hidden"
                    name="symbol"
                    value={symbol}
                  />

                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-900"
                  >
                    <span>{watchlist.name}</span>

                    <span
                      className={
                        isMember
                          ? "text-yellow-400"
                          : "text-zinc-700"
                      }
                    >
                      {isMember ? "★" : "☆"}
                    </span>
                  </button>
                </form>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
