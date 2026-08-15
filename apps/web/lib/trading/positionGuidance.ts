// Live follow-up for an open position: does Atlas still back the trade, has
// the thesis cooled, or has the market turned? Turns the raw current signal
// into a plain HOLD / CONSIDER / EXIT verdict a holder can act on.

export type PositionVerdict = "HOLD" | "CONSIDER" | "EXIT";

export type PositionGuidance = {
  verdict: PositionVerdict;
  // i18n key under the "PortfolioGuidance" namespace for the reason line.
  reasonKey:
    | "aligned"
    | "noRead"
    | "flipped"
    | "protectProfit"
    | "noConviction";
};

export function getPositionGuidance(input: {
  direction: "LONG" | "SHORT";
  atlasSignal: "LONG" | "SHORT" | "WAIT" | undefined;
  pnlPercent: number | null;
}): PositionGuidance {
  const { direction, atlasSignal, pnlPercent } = input;

  if (atlasSignal === undefined) {
    return { verdict: "HOLD", reasonKey: "noRead" };
  }

  const opposite = direction === "LONG" ? "SHORT" : "LONG";

  // Atlas now points the other way — the market turned against the trade.
  if (atlasSignal === opposite) {
    return { verdict: "EXIT", reasonKey: "flipped" };
  }

  // Atlas has gone neutral — the thesis has cooled. If in profit, protect it;
  // otherwise just hold with the stop and don't add.
  if (atlasSignal === "WAIT") {
    return (pnlPercent ?? 0) > 0
      ? { verdict: "CONSIDER", reasonKey: "protectProfit" }
      : { verdict: "CONSIDER", reasonKey: "noConviction" };
  }

  // Atlas still agrees with the position's direction.
  return { verdict: "HOLD", reasonKey: "aligned" };
}
