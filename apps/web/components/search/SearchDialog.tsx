"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
} from "@/lib/services/liveMarketService";

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export default function SearchDialog() {
  const t = useTranslations("SearchDialog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredCoins = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return MARKET_SYMBOLS.filter((symbol) =>
      symbol.toLowerCase().includes(normalizedQuery)
    );
  }, [query]);

  function closeDialog() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  useEffect(() => {
    function handleOpenRequest() {
      setOpen(true);
    }

    window.addEventListener(
      "genwelth:open-search",
      handleOpenRequest
    );

    return () => {
      window.removeEventListener(
        "genwelth:open-search",
        handleOpenRequest
      );
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        setOpen((current) => !current);
        return;
      }

      if (
        !open &&
        event.key === "/" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !isTypingTarget(event.target)
      ) {
        event.preventDefault();
        setOpen(true);
        return;
      }

      if (!open) {
        return;
      }

      if (event.key === "Escape") {
        closeDialog();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredCoins.length === 0
            ? 0
            : (current + 1) % filteredCoins.length
        );
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) =>
          filteredCoins.length === 0
            ? 0
            : (current - 1 + filteredCoins.length) %
              filteredCoins.length
        );
        return;
      }

      if (event.key === "Enter") {
        const selected = filteredCoins[activeIndex];

        if (selected) {
          event.preventDefault();
          closeDialog();
          router.push(`/coin/${selected}`);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open, filteredCoins, activeIndex, router]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-24 backdrop-blur-sm">
      <div className="atlas-card w-full max-w-xl rounded-2xl p-6">
        <input
          autoFocus
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder={t("placeholder")}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-blue-500"
        />

        <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">
          {filteredCoins.length > 0 ? (
            filteredCoins.map((symbol, index) => (
              <Link
                key={symbol}
                href={`/coin/${symbol}`}
                onClick={closeDialog}
                onMouseEnter={() =>
                  setActiveIndex(index)
                }
                className={`block rounded-xl border px-4 py-3 font-medium transition ${
                  index === activeIndex
                    ? "border-blue-500 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900 hover:border-blue-500 hover:bg-zinc-800"
                }`}
              >
                {formatMarketSymbol(symbol)}
              </Link>
            ))
          ) : (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-500">
              {t("noResults")}
            </div>
          )}
        </div>

        <div className="mt-4 text-sm text-zinc-500">
          {t("hint")}
        </div>
      </div>
    </div>
  );
}
