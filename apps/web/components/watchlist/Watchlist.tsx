"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useMarket } from "@/components/providers/MarketProvider";
import { useScannerSignals } from "@/components/providers/ScannerSignalsProvider";
import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import type { WatchlistView } from "@/lib/watchlists/queries";
import {
  formatMarketPrice,
  formatMarketSymbol,
  WATCHLIST_FAVORITES_STORAGE_KEY,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";

type SortField = "symbol" | "price" | "change24h";
type SortDirection = "asc" | "desc";

type AtlasSignal = "LONG" | "SHORT" | "WAIT";

type WatchlistProps = {
  watchlists: WatchlistView[];
  createWatchlistAction: (formData: FormData) => void;
  deleteWatchlistAction: (formData: FormData) => void;
  addSymbolToWatchlistAction: (formData: FormData) => void;
  removeSymbolFromWatchlistAction: (
    formData: FormData
  ) => void;
  migrateLegacyFavoritesAction: (
    formData: FormData
  ) => Promise<void>;
};

function getSignalBadgeVariant(
  signal: AtlasSignal
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

function getLegacyFavorites(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(
      WATCHLIST_FAVORITES_STORAGE_KEY
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function Watchlist({
  watchlists,
  createWatchlistAction,
  deleteWatchlistAction,
  addSymbolToWatchlistAction,
  removeSymbolFromWatchlistAction,
  migrateLegacyFavoritesAction,
}: WatchlistProps) {
  const t = useTranslations("Watchlist");
  const locale = useLocale();
  const router = useRouter();
  const { market, loading, error, lastUpdated, refresh } =
    useMarket();
  const atlasSignals = useScannerSignals();

  const [activeWatchlistId, setActiveWatchlistId] =
    useState<string | null>(
      () => watchlists[0]?.id ?? null
    );
  const [sortField, setSortField] =
    useState<SortField>("change24h");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("desc");
  const [showActiveListOnly, setShowActiveListOnly] =
    useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingList, setIsCreatingList] =
    useState(false);

  const activeWatchlist =
    watchlists.find(
      (watchlist) => watchlist.id === activeWatchlistId
    ) ?? watchlists[0] ?? null;

  useEffect(() => {
    if (watchlists.length > 0) {
      return;
    }

    const legacyFavorites = getLegacyFavorites();

    if (legacyFavorites.length === 0) {
      return;
    }

    const formData = new FormData();
    formData.set(
      "symbols",
      JSON.stringify(legacyFavorites)
    );

    void migrateLegacyFavoritesAction(formData).then(
      () => {
        router.refresh();
      }
    );
    // Only ever runs while there are zero DB watchlists.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchlists.length]);

  async function handleRefresh() {
    try {
      setIsRefreshing(true);
      await refresh();
    } finally {
      setIsRefreshing(false);
    }
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
    const filteredItems =
      showActiveListOnly && activeWatchlist
        ? market.filter((item) =>
            activeWatchlist.symbols.includes(item.symbol)
          )
        : market;

    return [...filteredItems].sort(
      (firstItem, secondItem) => {
        let comparison = 0;

        if (sortField === "symbol") {
          comparison = firstItem.symbol.localeCompare(
            secondItem.symbol
          );
        }

        if (sortField === "price") {
          comparison =
            firstItem.price - secondItem.price;
        }

        if (sortField === "change24h") {
          comparison =
            firstItem.change24h - secondItem.change24h;
        }

        return sortDirection === "asc"
          ? comparison
          : -comparison;
      }
    );
  }, [
    activeWatchlist,
    market,
    showActiveListOnly,
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
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {watchlists.map((watchlist) => (
          <button
            key={watchlist.id}
            type="button"
            onClick={() =>
              setActiveWatchlistId(watchlist.id)
            }
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
              activeWatchlist?.id === watchlist.id
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white"
            }`}
          >
            {watchlist.name}
          </button>
        ))}

        {isCreatingList ? (
          <form
            action={(formData) => {
              createWatchlistAction(formData);
              setIsCreatingList(false);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              name="name"
              autoFocus
              placeholder={t("listNamePlaceholder")}
              required
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
            />

            <button
              type="submit"
              className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white"
            >
              {t("add")}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingList(true)}
            className="rounded-lg border border-dashed border-zinc-800 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            {t("newList")}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setShowActiveListOnly(
                (currentValue) => !currentValue
              )
            }
            disabled={!activeWatchlist}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
              showActiveListOnly
                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                : "border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:text-white"
            }`}
          >
            {t("showOnly", { name: activeWatchlist?.name ?? t("showOnlyFallback") })}
          </button>

          {activeWatchlist && (
            <form action={deleteWatchlistAction}>
              <input
                type="hidden"
                name="watchlistId"
                value={activeWatchlist.id}
              />

              <button
                type="submit"
                className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
              >
                {t("deleteList")}
              </button>
            </form>
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRefreshing ? t("refreshing") : t("refresh")}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="atlas-subcard overflow-hidden rounded-xl">
        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_24px] gap-1.5 border-b border-zinc-800 bg-zinc-950/70 px-3 py-3 text-xs font-medium text-zinc-500">
          <button
            type="button"
            onClick={() => updateSorting("symbol")}
            className="text-left hover:text-white"
          >
            {t("colAsset")}{getSortIndicator("symbol")}
          </button>

          <button
            type="button"
            onClick={() => updateSorting("price")}
            className="text-right hover:text-white"
          >
            {t("colPrice")}{getSortIndicator("price")}
          </button>

          <button
            type="button"
            onClick={() => updateSorting("change24h")}
            className="text-right hover:text-white"
          >
            {t("col24h")}{getSortIndicator("change24h")}
          </button>

          <span>{t("colAtlas")}</span>

          <span />
        </div>

        {loading ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            {t("loadingPrices")}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium text-zinc-300">
              {t("emptyTitle")}
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              {t("emptyHint")}
            </p>
          </div>
        ) : (
          visibleItems.map((item) => {
            const isMember = Boolean(
              activeWatchlist?.symbols.includes(
                item.symbol
              )
            );
            const isPositive = item.change24h >= 0;
            const atlasSignal = atlasSignals[item.symbol];

            return (
              <div
                key={item.symbol}
                className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_24px] items-center gap-1.5 border-b border-zinc-800/70 px-3 py-3 last:border-b-0 hover:bg-zinc-900/40"
              >
                <Link
                  href={`/coin/${item.symbol}`}
                  className="min-w-0"
                >
                  <p className="truncate font-semibold text-white">
                    {formatMarketSymbol(item.symbol)}
                  </p>

                </Link>

                <p className="text-right text-xs font-medium text-zinc-200">
                  ${formatMarketPrice(item.price)}
                </p>

                <p
                  className={`text-right text-xs font-semibold ${
                    isPositive
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {item.change24h.toFixed(2)}%
                </p>

                {atlasSignal ? (
                  <Badge
                    variant={getSignalBadgeVariant(
                      atlasSignal.signal
                    )}
                  >
                    {atlasSignal.signal}
                  </Badge>
                ) : (
                  <span className="text-xs text-zinc-700">
                    —
                  </span>
                )}

                {activeWatchlist ? (
                  <form
                    action={
                      isMember
                        ? removeSymbolFromWatchlistAction
                        : addSymbolToWatchlistAction
                    }
                  >
                    <input
                      type="hidden"
                      name="watchlistId"
                      value={activeWatchlist.id}
                    />

                    <input
                      type="hidden"
                      name="symbol"
                      value={item.symbol}
                    />

                    <button
                      type="submit"
                      aria-label={
                        isMember
                          ? t("removeAria", { symbol: item.symbol, name: activeWatchlist.name })
                          : t("addAria", { symbol: item.symbol, name: activeWatchlist.name })
                      }
                      className={`text-lg transition ${
                        isMember
                          ? "text-yellow-400"
                          : "text-zinc-700 hover:text-yellow-400"
                      }`}
                    >
                      {isMember ? "★" : "☆"}
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-zinc-700">
                    —
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-zinc-600">
        <span>{t("binanceData")}</span>

        <span>
          {lastUpdated
            ? t("updated", {
                time: lastUpdated.toLocaleTimeString(
                  locale,
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }
                ),
              })
            : t("waitingForUpdate")}
        </span>
      </div>
    </Section>
  );
}
