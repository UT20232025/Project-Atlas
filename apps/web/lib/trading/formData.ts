import {
  MARKET_SYMBOLS,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import type { TradeDirection } from "@/lib/trading/pnl";

export function parseSymbol(
  value: FormDataEntryValue | null
): MarketSymbol {
  const symbol = String(value ?? "").toUpperCase();

  if (
    !MARKET_SYMBOLS.includes(symbol as MarketSymbol)
  ) {
    throw new Error(
      `Unsupported market symbol: ${symbol}`
    );
  }

  return symbol as MarketSymbol;
}

export function parseDirection(
  value: FormDataEntryValue | null
): TradeDirection {
  if (value === "LONG" || value === "SHORT") {
    return value;
  }

  throw new Error(`Invalid trade direction: ${value}`);
}

export function parsePositiveNumber(
  value: FormDataEntryValue | null,
  fieldName: string
): number {
  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue <= 0
  ) {
    throw new Error(
      `${fieldName} must be a positive number.`
    );
  }

  return numericValue;
}

export function parseOptionalNote(
  value: FormDataEntryValue | null
): string | null {
  const note = String(value ?? "").trim();

  return note.length > 0 ? note : null;
}
