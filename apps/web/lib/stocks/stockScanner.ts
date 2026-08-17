import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { ScannerChecklist } from "@/lib/analysis/scanner";
import { prisma } from "@/lib/db/client";

// The most popular US stocks: the Magnificent Seven plus the mega-caps and
// retail favourites people actually watch. The render path never fans out over
// these live — a background cron (warm-stocks) refreshes them one at a time into
// StockSnapshot, so we stay inside Twelve Data's free tier (each Atlas analysis
// costs 4 credits, and the free tier is ~8/min · 800/day). Grow this list freely;
// the cron just takes a little longer to walk it.
export const STOCK_SCANNER_SYMBOLS = [
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "GOOGL",
  "META",
  "AMD",
  "NFLX",
  "AVGO",
  "COIN",
  "PLTR",
  "JPM",
  "V",
  "WMT",
];

export type StockScannerItem = {
  ticker: string;
  price: number | null;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  checklist: ScannerChecklist;
  updatedAt: Date;
};

function directionalFirst(a: StockScannerItem, b: StockScannerItem): number {
  const aDir = a.signal === "WAIT" ? 0 : 1;
  const bDir = b.signal === "WAIT" ? 0 : 1;
  if (aDir !== bDir) return bDir - aDir;
  return b.confidence - a.confidence;
}

// DB-only read for the /stocks page. Never touches Twelve Data, so it renders
// instantly and can't rate-limit — it just reflects whatever the warm-stocks
// cron last stored.
export async function getStockScannerFromDb(): Promise<StockScannerItem[]> {
  const rows = await prisma.stockSnapshot.findMany({
    where: { ticker: { in: STOCK_SCANNER_SYMBOLS } },
  });

  const items: StockScannerItem[] = [];

  for (const row of rows) {
    let checklist: ScannerChecklist;
    try {
      checklist = JSON.parse(row.checklist) as ScannerChecklist;
    } catch {
      continue;
    }

    items.push({
      ticker: row.ticker,
      price: row.price,
      signal: row.signal as StockScannerItem["signal"],
      confidence: row.confidence,
      checklist,
      updatedAt: row.updatedAt,
    });
  }

  return items.sort(directionalFirst);
}

// Analyse one stock (4 Twelve Data credits) and upsert its card into
// StockSnapshot. Called by the warm-stocks cron, one ticker per request, so the
// credits stay paced.
export async function warmStockSnapshot(
  ticker: string
): Promise<StockScannerItem> {
  const analysis = await getCachedAtlasAnalysis(ticker as MarketSymbol, "1d");

  const checklist: ScannerChecklist = {
    direction: analysis.checklist.direction,
    metCount: analysis.checklist.metCount,
    total: analysis.checklist.total,
    ready: analysis.checklist.ready,
    pending: analysis.checklist.items
      .filter((item) => !item.met)
      .map((item) => item.key),
  };

  const record = await prisma.stockSnapshot.upsert({
    where: { ticker },
    create: {
      ticker,
      signal: analysis.decision.signal,
      confidence: analysis.decision.confidence,
      price: analysis.decision.entry,
      checklist: JSON.stringify(checklist),
    },
    update: {
      signal: analysis.decision.signal,
      confidence: analysis.decision.confidence,
      price: analysis.decision.entry,
      checklist: JSON.stringify(checklist),
    },
  });

  return {
    ticker: record.ticker,
    price: record.price,
    signal: record.signal as StockScannerItem["signal"],
    confidence: record.confidence,
    checklist,
    updatedAt: record.updatedAt,
  };
}

// Pick the stalest curated ticker (never stored, or oldest updatedAt) and warm
// it. Returns null when every ticker is already fresh — the cron loop uses that
// to stop early and save credits.
export async function warmNextStaleStock(
  freshWithinMs = 60 * 60_000
): Promise<StockScannerItem | null> {
  const rows = await prisma.stockSnapshot.findMany({
    where: { ticker: { in: STOCK_SCANNER_SYMBOLS } },
    select: { ticker: true, updatedAt: true },
  });

  const seen = new Map(rows.map((row) => [row.ticker, row.updatedAt]));

  // Never-stored tickers first.
  const missing = STOCK_SCANNER_SYMBOLS.find((ticker) => !seen.has(ticker));
  if (missing) {
    return warmStockSnapshot(missing);
  }

  // Otherwise the oldest, if it's past the freshness window.
  let stalest: { ticker: string; updatedAt: Date } | null = null;
  for (const [ticker, updatedAt] of seen) {
    if (!stalest || updatedAt < stalest.updatedAt) {
      stalest = { ticker, updatedAt };
    }
  }

  if (!stalest || Date.now() - stalest.updatedAt.getTime() < freshWithinMs) {
    return null;
  }

  return warmStockSnapshot(stalest.ticker);
}
