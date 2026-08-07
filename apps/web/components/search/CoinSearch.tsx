"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type CoinResult = {
  symbol: string;
  base: string;
};

export default function CoinSearch() {
  const t = useTranslations("CoinSearch");
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CoinResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search against the Binance universe.
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 1) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/coins/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );

        if (response.ok) {
          const data = (await response.json()) as {
            results: CoinResult[];
          };

          setResults(data.results);
          setActiveIndex(0);
          setOpen(true);
        }
      } catch {
        // Aborted or network error — ignore, keep prior results.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    return () =>
      document.removeEventListener("mousedown", onClick);
  }, []);

  function goToCoin(symbol: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/coin/${symbol}`);
  }

  function normalizeQueryToSymbol(raw: string): string {
    const upper = raw.trim().toUpperCase().replace(/\s+/g, "");
    return upper.endsWith("USDT") ? upper : `${upper}USDT`;
  }

  function onKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        Math.min(index + 1, results.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const chosen = results[activeIndex];

      if (chosen) {
        goToCoin(chosen.symbol);
      } else if (query.trim()) {
        goToCoin(normalizeQueryToSymbol(query));
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 focus-within:border-blue-500">
        <span className="text-zinc-500" aria-hidden="true">
          🔍
        </span>

        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setOpen(true);
            }
          }}
          placeholder={t("placeholder")}
          className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          autoComplete="off"
          spellCheck={false}
        />

        {loading && (
          <span className="text-xs text-zinc-600">…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-1 shadow-xl">
          {results.map((result, index) => (
            <li key={result.symbol}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => goToCoin(result.symbol)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  index === activeIndex
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-300"
                }`}
              >
                <span className="font-medium">
                  {result.base}
                </span>
                <span className="text-xs text-zinc-500">
                  {result.symbol}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
