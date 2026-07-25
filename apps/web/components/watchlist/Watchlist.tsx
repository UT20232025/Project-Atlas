"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import Section from "@/components/ui/Section";

type MarketSymbol = "BTCUSDT" | "ETHUSDT" | "SOLUSDT" | "XRPUSDT";

type WatchlistItem = {
  symbol: MarketSymbol;
  price: number;
  change24h: number;
};

type SortField = "symbol" | "price" | "change24h";
type SortDirection = "asc" | "desc";

const SYMBOLS: MarketSymbol[] = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
];

const FAVORITES_STORAGE_KEY = "genwelth-watchlist-favorites";

function formatSymbol(symbol: string) {
  return symbol.replace("USDT", "");
}

function formatPrice(price: number) {
  if (price >= 1000) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  if (price >= 1) {
    return price.toFixed(2);
  }

  return price.toFixed(4);
}

function getStoredFavorites(): MarketSymbol[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedFavorites = window.localStorage.getItem(
      FAVORITES_STORAGE_KEY
    );

    if (!storedFavorites) {
      return [];
    }

    const parsedFavorites = JSON.parse(storedFavorites);

    if (!Array.isArray(parsedFavorites)) {
      return [];
    }

    return parsedFavorites.filter((symbol): symbol is MarketSymbol =>
      SYMBOLS.includes(symbol)
    );
  } catch {
    return [];
  }
}

export default function Watchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [favorites, setFavorites] = useState<MarketSymbol[]>([]);
  const [sortField, setSortField] = useState<SortField>("change24h");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWatchlist = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setIsRefreshing(true);
      }

      setError(null);

      const requests = SYMBOLS.map(async (symbol) => {
        const response = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`,
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`Could not load ${symbol}`);
        }

        const data = (await response.json()) as {
          symbol: MarketSymbol;
          lastPrice: string;
          priceChangePercent: string;
        };

        return {
          symbol: data.symbol,
          price: Number(data.lastPrice),
          change24h: Number(data.priceChangePercent),
        };
      });

      const watchlistItems = await Promise.all(requests);

      setItems(watchlistItems);
      setLastUpdated(new Date());
    } catch {
      setError("Could not update live market data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setFavorites(getStoredFavorites());
  }, []);

  useEffect(() => {
    void fetchWatchlist();

    const interval = window.setInterval(() => {
      void fetchWatchlist();
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchWatchlist]);

  function toggleFavorite(symbol: MarketSymbol) {
    setFavorites((currentFavorites) => {
      const nextFavorites = currentFavorites.includes(symbol)
        ? currentFavorites.filter(
            (favoriteSymbol) => favoriteSymbol !== symbol
          )
        : [...currentFavorites, symbol];

      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(nextFavorites)
      );

      return nextFavorites;
    });
  }

  function updateSorting(field: SortField) {
    if (sortField === field) {
      setSortDirection((currentDirection) =>
        currentDirection === "asc" ? "desc" : "asc"
      );

      return;
    }

    setSortField(field);
    setSortDirection(field === "symbol" ? "asc" : "desc");
  }

  const visibleItems = useMemo(() => {
    const filteredItems = showFavoritesOnly
      ? items.filter((item) => favorites.includes(item.symbol))
      : items;

    return [...filteredItems].sort((firstItem, secondItem) => {
      let comparison = 0;

      if (sortField === "symbol") {
        comparison = firstItem.symbol.localeCompare(secondItem.symbol);
      }

      if (sortField === "price") {
        comparison = firstItem.price - secondItem.price;
      }

      if (sortField === "change24h") {
        comparison = firstItem.change24h - secondItem.change24h;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [
    favorites,
    items,
    showFavoritesOnly,
    sortDirection,
    sortField,
  ]);

  function getSortIndicator(field: SortField) {
    if (sortField !== field) {
      return "";
    }

    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <Section
      title="Live Watchlist"
      subtitle="Updates automatically every 30 seconds"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            setShowFavoritesOnly((currentValue) => !currentValue)
          }
          className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
            showFavoritesOnly
              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
              : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white"
          }`}
        >
          ★ Favorites
        </button>

        <button
          type="button"
          onClick={() => void fetchWatchlist(true)}
          disabled={isRefreshing}
          className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_36px] gap-3 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3 text-xs font-medium text-zinc-500">
          <button
            type="button"
            onClick={() => updateSorting("symbol")}
            className="text-left hover:text-white"
          >
            Asset{getSortIndicator("symbol")}
          </button>

          <button
            type="button"
            onClick={() => updateSorting("price")}
            className="text-right hover:text-white"
          >
            Price{getSortIndicator("price")}
          </button>

          <button
            type="button"
            onClick={() => updateSorting("change24h")}
            className="text-right hover:text-white"
          >
            24h{getSortIndicator("change24h")}
          </button>

          <span />
        </div>

        {isLoading ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Loading live prices...
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-zinc-300">
              No favorite assets
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Press the star beside a coin to add it.
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const isFavorite = favorites.includes(item.symbol);
            const isPositive = item.change24h >= 0;

            return (
              <div
                key={item.symbol}
                className="grid grid-cols-[1.2fr_1fr_1fr_36px] items-center gap-3 border-b border-zinc-800/70 px-4 py-4 last:border-b-0 hover:bg-zinc-900/40"
              >
                <Link
                  href={`/coin/${item.symbol}`}
                  className="min-w-0"
                >
                  <p className="font-semibold text-white">
                    {formatSymbol(item.symbol)}
                  </p>

                  <p className="text-xs text-zinc-600">
                    USDT
                  </p>
                </Link>

                <p className="text-right text-sm font-medium text-zinc-200">
                  ${formatPrice(item.price)}
                </p>

                <p
                  className={`text-right text-sm font-semibold ${
                    isPositive
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {item.change24h.toFixed(2)}%
                </p>

                <button
                  type="button"
                  onClick={() => toggleFavorite(item.symbol)}
                  aria-label={
                    isFavorite
                      ? `Remove ${item.symbol} from favorites`
                      : `Add ${item.symbol} to favorites`
                  }
                  className={`text-lg transition ${
                    isFavorite
                      ? "text-yellow-400"
                      : "text-zinc-700 hover:text-yellow-400"
                  }`}
                >
                  {isFavorite ? "★" : "☆"}
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
        <span>Binance market data</span>

        <span>
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}`
            : "Waiting for update"}
        </span>
      </div>
    </Section>
  );
}