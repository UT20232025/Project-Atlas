"use client";

import Link from "next/link";
import { Star, X } from "lucide-react";
import { useEffect, useState } from "react";

const DEFAULT_WATCHLIST = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "LINKUSDT",
];

const STORAGE_KEY = "genwelth-watchlist";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedWatchlist = window.localStorage.getItem(STORAGE_KEY);

      if (savedWatchlist) {
        const parsed = JSON.parse(savedWatchlist);

        if (Array.isArray(parsed)) {
          setWatchlist(parsed);
        }
      }
    } catch (error) {
      console.error("Kunne ikke lese watchlist:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(watchlist)
      );
    } catch (error) {
      console.error("Kunne ikke lagre watchlist:", error);
    }
  }, [watchlist, loaded]);

  function removeCoin(coin: string) {
    setWatchlist((current) =>
      current.filter((item) => item !== coin)
    );
  }

  return (
    <section className="atlas-card rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <Star className="fill-yellow-400 text-yellow-400" size={22} />

        <div>
          <h2 className="text-xl font-bold text-white">
            Watchlist
          </h2>

          <p className="text-sm text-zinc-500">
            {watchlist.length} lagrede markeder
          </p>
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-500">
          Watchlisten er tom.
        </div>
      ) : (
        <div className="space-y-3">
          {watchlist.map((coin) => (
            <div
              key={coin}
              className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:border-blue-500"
            >
              <Link
                href={`/coin/${coin}`}
                className="min-w-0 flex-1 font-medium text-white transition hover:text-blue-400"
              >
                {coin}
              </Link>

              <button
                type="button"
                onClick={() => removeCoin(coin)}
                aria-label={`Fjern ${coin} fra watchlist`}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-red-400"
              >
                <X size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}