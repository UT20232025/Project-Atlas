// A staged trailing-stop plan for a directional setup: how to walk the stop
// up (or down) as each target is reached, so a winner can run for days
// instead of being cut early — "trading is a marathon, not a sprint".

export type StopMoveKey = "entry" | "breakeven" | "lock" | "trail";

export type StopMove = {
  key: StopMoveKey;
  // Price that triggers the move (null for the initial entry stage).
  trigger: number | null;
  // Where the stop sits after this stage.
  stop: number | null;
};

export type TradeManagementInput = {
  direction: "LONG" | "SHORT" | "WAIT" | string;
  entry: number | null;
  stopLoss: number | null;
  takeProfit1: number | null;
  takeProfit2: number | null;
  takeProfit3: number | null;
};

export function buildStopPlan(
  setup: TradeManagementInput
): StopMove[] | null {
  const { direction, entry, stopLoss, takeProfit1, takeProfit2, takeProfit3 } =
    setup;

  if (direction !== "LONG" && direction !== "SHORT") {
    return null;
  }

  if (entry == null || stopLoss == null || takeProfit1 == null) {
    return null;
  }

  const stages: StopMove[] = [
    // Initial risk: enter and set the protective stop.
    { key: "entry", trigger: null, stop: stopLoss },
    // First target hit → move the stop to entry (the trade is now risk-free).
    { key: "breakeven", trigger: takeProfit1, stop: entry },
    // Second target → trail the stop up to the first target (profit locked).
    { key: "lock", trigger: takeProfit2, stop: takeProfit1 },
    // Third target → trail behind structure and let the runner run.
    { key: "trail", trigger: takeProfit3, stop: takeProfit2 },
  ];

  // Drop later stages whose target/level isn't defined.
  return stages.filter(
    (stage) => stage.key === "entry" || stage.trigger != null
  );
}
