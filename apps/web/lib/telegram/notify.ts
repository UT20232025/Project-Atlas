import type { AtlasTradeDirection } from "@/lib/atlas/riskEngine";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

type SignalDecision = {
  signal: AtlasTradeDirection;
  confidence: number;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  // Optional scale-out ladder from the trade-setup engine. When present,
  // the message shows TP1/TP2/TP3 instead of the single takeProfit above.
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

  const hasLadder =
    decision.takeProfit1 != null ||
    decision.takeProfit2 != null ||
    decision.takeProfit3 != null;

  if (hasLadder) {
    if (decision.takeProfit1 != null) {
      lines.push(`🎯 TP1: ${decision.takeProfit1}`);
    }
    if (decision.takeProfit2 != null) {
      lines.push(`🎯 TP2: ${decision.takeProfit2}`);
    }
    if (decision.takeProfit3 != null) {
      lines.push(`🎯 TP3: ${decision.takeProfit3}`);
    }
  } else if (decision.takeProfit != null) {
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

  const caption = formatMessage(symbol, decision);

  // Lead with the branded signal card (image sells harder than plain text),
  // with the full signal as its caption. Fall back to a text message so a
  // signal is never dropped if the card can't be sent.
  const cardUrl = `https://www.genwelth.com/api/signal-card/${symbol}`;

  try {
    const photoResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          photo: cardUrl,
          caption,
        }),
      }
    );

    if (photoResponse.ok) {
      return;
    }

    console.error(
      "Telegram sendPhoto failed, falling back to text:",
      photoResponse.status,
      await photoResponse.text()
    );
  } catch (error) {
    console.error("Telegram sendPhoto failed, falling back to text:", error);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          text: caption,
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
