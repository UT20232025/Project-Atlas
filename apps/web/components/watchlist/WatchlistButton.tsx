"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "genwelth-watchlist";

type WatchlistButtonProps = {
  symbol: string;
};

export default function WatchlistButton({
  symbol,
}: WatchlistButtonProps) {
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const watchlist = saved ? JSON.parse(saved) : [];

      if (Array.isArray(watchlist)) {
        setActive(watchlist.includes(symbol));
      }
    } catch (error) {
      console.error("Kunne ikke lese watchlist:", error);
    } finally {
      setLoaded(true);
    }
  }, [symbol]);

  function toggleWatchlist() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      const current = saved ? JSON.parse(saved) : [];
      const watchlist = Array.isArray(current) ? current : [];

      const next = watchlist.includes(symbol)
        ? watchlist.filter((item: string) => item !== symbol)
        : [...watchlist, symbol];

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(next)
      );

      setActive(next.includes(symbol));
    } catch (error) {
      console.error("Kunne ikke oppdatere watchlist:", error);
    }
  }

  if (!loaded) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleWatchlist}
      className={`flex items-center gap-2 rounded-xl border px-4 py-3 font-medium transition ${
        active
          ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-yellow-500/40 hover:text-yellow-300"
      }`}
    >
      <Star
        size={18}
        className={active ? "fill-yellow-400 text-yellow-400" : ""}
      />

      {active ? "In Watchlist" : "Add to Watchlist"}
    </button>
  );
}