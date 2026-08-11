import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

type SignalDecision = {
  signal: AtlasTradeDirection;
  confidence: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
};

const DEFAULT_MIN_CONFIDENCE = 70;

function getMinConfidence(): number {
  const raw = process.env.TELEGRAM_MIN_CONFIDENCE;
  const parsed = raw ? Number(raw) : NaN;

  return Number.isFinite(parsed) ? parsed : DEFAULT_MIN_CONFIDENCE;
}

function formatMessage(
  symbol: MarketSymbol,
  decision: SignalDecision
): string {
  const emoji = decision.signal === "LONG" ? "🟢" : "🔴";

  const lines = [
    `${emoji} ${decision.signal} ${symbol}`,
    `Confidence: ${decision.confidence}%`,
  ];

  if (decision.entry != null) {
    lines.push(`Entry: ${decision.entry}`);
  }

  if (decision.stopLoss != null) {
    lines.push(`🛑 SL: ${decision.stopLoss}`);
  }

  if (decision.takeProfit != null) {
    lines.push(`🎯 TP: ${decision.takeProfit}`);
  }

  if (decision.riskRewardRatio != null) {
    lines.push(`R:R ${decision.riskRewardRatio.toFixed(2)}:1`);
  }

  lines.push(
    "",
    "⚠️ Not financial advice. Manage your own risk.",
    "Genwelth AI"
  );

  // Branded domain (not build-time NEXT_PUBLIC_APP_URL, which bakes to the
  // raw Compute URL).
  lines.push("https://www.genwelth.com/login");

  return lines.join("\n");
}

export async function notifySignalChange(
  symbol: MarketSymbol,
  decision: SignalDecision
): Promise<void> {
  if (decision.signal !== "LONG" && decision.signal !== "SHORT") {
    return;
  }

  if (decision.confidence < getMinConfidence()) {
    return;
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL;

  if (!token || !channel) {
    return;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          text: formatMessage(symbol, decision),
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Telegram notification failed:",
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("Telegram notification failed:", error);
  }
}
