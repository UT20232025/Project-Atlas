import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import type { ScannerChecklist } from "@/lib/analysis/scanner";
import { FOREX_SYMBOLS } from "@/lib/services/twelveDataService";
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

// Gold + major FX — same Twelve Data pipeline as stocks, shown on their own
// /gold-forex page. Sourced from the canonical FOREX_SYMBOLS list.
export const FOREX_SCANNER_SYMBOLS: string[] = [...FOREX_SYMBOLS];

// Every Twelve Data asset the warmer knows about (stocks + gold/FX). The cron
// warms these; the pages read filtered subsets.
export const ALL_ASSET_SYMBOLS: string[] = [
  ...STOCK_SCANNER_SYMBOLS,
  ...FOREX_SCANNER_SYMBOLS,
];

export type AssetScannerItem = {
  ticker: string;
  price: number | null;
  signal: "LONG" | "SHORT" | "WAIT";
  confidence: number;
  checklist: ScannerChecklist;
  updatedAt: Date;
};

// Back-compat alias — stocks used this name before gold/FX joined.
export type StockScannerItem = AssetScannerItem;

function directionalFirst(a: AssetScannerItem, b: AssetScannerItem): number {
  const aDir = a.signal === "WAIT" ? 0 : 1;
  const bDir = b.signal === "WAIT" ? 0 : 1;
  if (aDir !== bDir) return bDir - aDir;
  return b.confidence - a.confidence;
}

// DB-only read for the asset pages. Never touches Twelve Data, so it renders
// instantly and can't rate-limit — it just reflects whatever the warmer cron
// last stored. Pass the symbol subset for the page (stocks or forex).
export async function getAssetScannerFromDb(
  symbols: string[]
): Promise<AssetScannerItem[]> {
  const rows = await prisma.stockSnapshot.findMany({
    where: { ticker: { in: symbols } },
  });

  const items: AssetScannerItem[] = [];

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
      signal: row.signal as AssetScannerItem["signal"],
      confidence: row.confidence,
      checklist,
      updatedAt: row.updatedAt,
    });
  }

  return items.sort(directionalFirst);
}

export function getStockScannerFromDb(): Promise<AssetScannerItem[]> {
  return getAssetScannerFromDb(STOCK_SCANNER_SYMBOLS);
}

export function getForexScannerFromDb(): Promise<AssetScannerItem[]> {
  return getAssetScannerFromDb(FOREX_SCANNER_SYMBOLS);
}

// Analyse one asset (4 Twelve Data credits) and upsert its card into
// StockSnapshot. Called by the warm cron, one ticker per request, so the
// credits stay paced. Works for any Twelve Data symbol (stock, gold or FX).
export async function warmAssetSnapshot(
  ticker: string
): Promise<AssetScannerItem> {
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
      price: analysis.currentPrice,
      checklist: JSON.stringify(checklist),
    },
    update: {
      signal: analysis.decision.signal,
      confidence: analysis.decision.confidence,
      price: analysis.currentPrice,
      checklist: JSON.stringify(checklist),
    },
  });

  return {
    ticker: record.ticker,
    price: record.price,
    signal: record.signal as AssetScannerItem["signal"],
    confidence: record.confidence,
    checklist,
    updatedAt: record.updatedAt,
  };
}

// Pick the stalest asset among `symbols` (never stored, or oldest updatedAt) and
// warm it. Returns null when every one is already fresh — the cron loop uses
// that to stop early and save credits.
export async function warmNextStaleAsset(
  symbols: string[] = ALL_ASSET_SYMBOLS,
  freshWithinMs = 60 * 60_000
): Promise<AssetScannerItem | null> {
  const rows = await prisma.stockSnapshot.findMany({
    where: { ticker: { in: symbols } },
    select: { ticker: true, updatedAt: true },
  });

  const seen = new Map(rows.map((row) => [row.ticker, row.updatedAt]));

  const missing = symbols.find((ticker) => !seen.has(ticker));
  if (missing) {
    return warmAssetSnapshot(missing);
  }

  let stalest: { ticker: string; updatedAt: Date } | null = null;
  for (const [ticker, updatedAt] of seen) {
    if (!stalest || updatedAt < stalest.updatedAt) {
      stalest = { ticker, updatedAt };
    }
  }

  if (!stalest || Date.now() - stalest.updatedAt.getTime() < freshWithinMs) {
    return null;
  }

  return warmAssetSnapshot(stalest.ticker);
}
