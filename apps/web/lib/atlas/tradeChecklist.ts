import type { AtlasMtfResult } from "@/lib/atlas/multiTimeframeEngine";
import type { LiquidityResult } from "@/lib/atlas/liquidityEngine";
import type { PriceActionResult } from "@/lib/atlas/priceActionEngine";
import { readRegime } from "@/lib/atlas/regimeGate";

// The trade checklist turns Atlas's internal confluence into five plain,
// tickable conditions — so a user sees exactly what has lined up and what
// the setup is still waiting for before it's worth taking.

export type ChecklistDirection = "LONG" | "SHORT";

export type ChecklistItemKey =
  | "trend"
  | "timeframes"
  | "structure"
  | "liquidity"
  | "momentum";

export type ChecklistItem = {
  key: ChecklistItemKey;
  met: boolean;
};

export type TradeChecklist = {
  // The direction the checklist is evaluated for (the setup's lean, even
  // when the current signal is WAIT — so it reads as "what's needed to go").
  direction: ChecklistDirection;
  items: ChecklistItem[];
  metCount: number;
  total: number;
  ready: boolean;
};

// All five must line up for the setup to be "ready".
const READY_THRESHOLD = 5;

export type TradeChecklistInput = {
  signal: "LONG" | "SHORT" | "WAIT";
  multiTimeframe: AtlasMtfResult;
  priceAction: PriceActionResult;
  liquidity: LiquidityResult;
  rawRsi: number;
};

export function buildTradeChecklist(
  input: TradeChecklistInput
): TradeChecklist {
  const direction: ChecklistDirection =
    input.signal === "SHORT"
      ? "SHORT"
      : input.signal === "LONG"
        ? "LONG"
        : input.multiTimeframe.bearishScore >
            input.multiTimeframe.bullishScore
          ? "SHORT"
          : "LONG";

  const isLong = direction === "LONG";
  const regime = readRegime(input.multiTimeframe);
  const mtfSignal = input.multiTimeframe.signal;
  const { priceAction, liquidity } = input;

  const items: ChecklistItem[] = [
    {
      key: "trend",
      met: isLong
        ? regime.direction === "BULLISH"
        : regime.direction === "BEARISH",
    },
    {
      key: "timeframes",
      met:
        input.multiTimeframe.aligned &&
        (isLong
          ? mtfSignal === "LONG" || mtfSignal === "STRONG_LONG"
          : mtfSignal === "SHORT" || mtfSignal === "STRONG_SHORT"),
    },
    {
      key: "structure",
      met: isLong
        ? priceAction.structure === "BULLISH" ||
          priceAction.bullishBos ||
          priceAction.bullishChoch
        : priceAction.structure === "BEARISH" ||
          priceAction.bearishBos ||
          priceAction.bearishChoch,
    },
    {
      key: "liquidity",
      met: isLong ? liquidity.bullishSweep : liquidity.bearishSweep,
    },
    {
      key: "momentum",
      met: isLong ? input.rawRsi >= 50 : input.rawRsi <= 50,
    },
  ];

  const metCount = items.filter((item) => item.met).length;

  return {
    direction,
    items,
    metCount,
    total: items.length,
    ready: metCount >= READY_THRESHOLD,
  };
}
