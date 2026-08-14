import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";
import type { MarketSymbol } from "@/lib/services/liveMarketService";
import { sendPushToAll } from "@/lib/push/webPush";

type SignalDecision = {
  signal: AtlasTradeDirection;
  confidence: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  takeProfit1?: number | null;
  takeProfit2?: number | null;
  takeProfit3?: number | null;
};

const DEFAULT_MIN_CONFIDENCE = 70;

function getMinConfidence(): number {
  const raw = process.env.TELEGRAM_MIN_CONFIDENCE;
  const parsed = raw ? Number(raw) : NaN;

  return Number.isFinite(parsed) ? parsed : DEFAULT_MIN_CONFIDENCE;
}

/**
 * Broadcasts a web push when a curated signal flips — same filter as the
 * Telegram channel (directional + high confidence). No-op when web push
 * isn't configured or no one is subscribed.
 */
export async function notifyPushSignalChange(
  symbol: MarketSymbol,
  decision: SignalDecision
): Promise<void> {
  if (decision.signal !== "LONG" && decision.signal !== "SHORT") {
    return;
  }

  if (decision.confidence < getMinConfidence()) {
    return;
  }

  const display = symbol.replace(/USDT$/, "");
  const emoji = decision.signal === "LONG" ? "🟢" : "🔴";

  const parts = [`confidence ${decision.confidence}%`];
  if (decision.entry != null) parts.push(`entry ${decision.entry}`);
  if (decision.stopLoss != null) parts.push(`SL ${decision.stopLoss}`);

  const ladder = [
    decision.takeProfit1,
    decision.takeProfit2,
    decision.takeProfit3,
  ].filter((tp): tp is number => tp != null);

  if (ladder.length > 0) {
    parts.push(
      `TP ${ladder.map((tp) => tp).join(" / ")}`
    );
  } else if (decision.takeProfit != null) {
    parts.push(`TP ${decision.takeProfit}`);
  }

  await sendPushToAll({
    title: `${emoji} ${decision.signal} ${display}`,
    body: parts.join(" · "),
    url: `/coin/${symbol}`,
    tag: `signal-${symbol}`,
  });
}
