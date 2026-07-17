"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const coins = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "BNBUSDT",
  "DOGEUSDT",
  "ADAUSDT",
  "LINKUSDT",
];

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
      }

      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const filteredCoins = coins.filter((coin) =>
    coin.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24 backdrop-blur-sm">
      <div className="atlas-card w-full max-w-xl rounded-2xl p-6">
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search BTC, ETH, SOL..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
        />

        <div className="mt-4 space-y-2">
          {filteredCoins.length > 0 ? (
            filteredCoins.map((coin) => (
              <Link
                key={coin}
                href={`/coin/${coin}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="block rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-medium transition hover:border-blue-500 hover:bg-zinc-800"
              >
                {coin}
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-500">
              Ingen treff
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-zinc-500">
          Ctrl + K åpner søket • Esc lukker
        </div>
      </div>
    </div>
  );
}