"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AtlasSignalData = {
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
};

type ScannerSignalsMap = Record<string, AtlasSignalData>;

const ScannerSignalsContext =
  createContext<ScannerSignalsMap | null>(null);

async function loadScannerSignals(
  interval: string
): Promise<ScannerSignalsMap> {
  const response = await fetch(
    `/api/atlas/scanner?interval=${encodeURIComponent(interval)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to load scanner signals.");
  }

  const data = (await response.json()) as {
    items: {
      coin: string;
      signal: AtlasSignalData["signal"];
      confidence: number;
    }[];
  };

  const nextSignals: ScannerSignalsMap = {};

  for (const item of data.items) {
    nextSignals[item.coin] = {
      signal: item.signal,
      confidence: item.confidence,
    };
  }

  return nextSignals;
}

export function ScannerSignalsProvider({
  children,
  interval = "1h",
}: {
  children: ReactNode;
  interval?: string;
}) {
  const [signals, setSignals] = useState<ScannerSignalsMap>(
    {}
  );

  useEffect(() => {
    let isCancelled = false;

    async function refresh() {
      try {
        const nextSignals = await loadScannerSignals(interval);

        if (!isCancelled) {
          setSignals(nextSignals);
        }
      } catch {
        // Keep showing the last known signals on failure.
      }
    }

    void refresh();

    const timer = window.setInterval(() => {
      void refresh();
    }, 30_000);

    return () => {
      isCancelled = true;
      window.clearInterval(timer);
    };
  }, [interval]);

  return (
    <ScannerSignalsContext.Provider value={signals}>
      {children}
    </ScannerSignalsContext.Provider>
  );
}

export function useScannerSignals(): ScannerSignalsMap {
  const context = useContext(ScannerSignalsContext);

  if (!context) {
    throw new Error(
      "useScannerSignals must be used inside ScannerSignalsProvider"
    );
  }

  return context;
}
