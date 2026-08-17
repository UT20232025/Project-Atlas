import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { ScannerChecklist } from "@/lib/analysis/scanner";

// A small, curated set of mega-caps. Kept tiny on purpose: each Atlas analysis
// makes several Twelve Data calls, and the free tier is ~8/min — so we analyse
// a handful on the daily frame (long cache) rather than a full scanner.
export const STOCK_SCANNER_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
];

export type StockScannerItem = {
  ticker: string;
  price: number | null;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  checklist: ScannerChecklist;
};

// Daily frame → the long analysis cache (10 min), so we hit Twelve Data at most
// once per stock every 10 minutes. allSettled keeps a rate-limited stock from
// taking down the page — it just drops out until the next load warms it.
export async function getStockScanner(): Promise<StockScannerItem[]> {
  const settled = await Promise.allSettled(
    STOCK_SCANNER_SYMBOLS.map((ticker) =>
      getCachedAtlasAnalysis(ticker as MarketSymbol, "1d")
    )
  );

  const items: StockScannerItem[] = [];

  settled.forEach((result, index) => {
    if (result.status !== "fulfilled") {
      return;
    }

    const analysis = result.value;

    items.push({
      ticker: STOCK_SCANNER_SYMBOLS[index],
      price: analysis.decision.entry,
      signal: analysis.decision.signal,
      confidence: analysis.decision.confidence,
      checklist: {
        direction: analysis.checklist.direction,
        metCount: analysis.checklist.metCount,
        total: analysis.checklist.total,
        ready: analysis.checklist.ready,
        pending: analysis.checklist.items
          .filter((item) => !item.met)
          .map((item) => item.key),
      },
    });
  });

  // Directional calls first, then by confidence.
  return items.sort((a, b) => {
    const aDir = a.signal === "WAIT" ? 0 : 1;
    const bDir = b.signal === "WAIT" ? 0 : 1;
    if (aDir !== bDir) return bDir - aDir;
    return b.confidence - a.confidence;
  });
}
