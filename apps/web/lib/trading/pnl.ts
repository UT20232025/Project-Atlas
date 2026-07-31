import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type TradeDirection = "LONG" | "SHORT";

export type PortfolioPositionView = {
  id: string;
  symbol: MarketSymbol;
  direction: TradeDirection;
  entryPrice: number;
  quantity: number;
  note: string | null;
  openedAt: string;
};

export type JournalEntryView = {
  id: string;
  symbol: MarketSymbol;
  direction: TradeDirection;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  note: string | null;
  openedAt: string;
  closedAt: string;
};

export function calculatePnl(
  direction: TradeDirection,
  entryPrice: number,
  exitPrice: number,
  quantity: number
): { pnl: number; pnlPercent: number } {
  const priceDelta =
    direction === "LONG"
      ? exitPrice - entryPrice
      : entryPrice - exitPrice;

  return {
    pnl: priceDelta * quantity,
    pnlPercent: (priceDelta / entryPrice) * 100,
  };
}
