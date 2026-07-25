"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchLiveMarketData,
  type LiveMarketItem,
} from "@/lib/services/liveMarketService";

type MarketContextValue = {
  market: LiveMarketItem[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
};

const MarketContext = createContext<MarketContextValue | null>(null);

export function MarketProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [market, setMarket] = useState<LiveMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);

      const data = await fetchLiveMarketData();

      setMarket(data);
      setLastUpdated(new Date());
    } catch {
      setError("Unable to refresh market data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const interval = window.setInterval(() => {
      void refresh();
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [refresh]);

  const value = useMemo(
    () => ({
      market,
      loading,
      error,
      lastUpdated,
      refresh,
    }),
    [market, loading, error, lastUpdated, refresh]
  );

  return (
    <MarketContext.Provider value={value}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);

  if (!context) {
    throw new Error(
      "useMarket must be used inside MarketProvider"
    );
  }

  return context;
}