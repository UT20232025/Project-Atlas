import { sendPushToAll } from "@/lib/push/webPush";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

type Direction = "LONG" | "SHORT";

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL;

  if (!token || !channel) {
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: channel, text }),
    });
  } catch (error) {
    console.error("Telegram reversal notification failed:", error);
  }
}

/**
 * Fires when a previously-broadcast signal flips to the opposite direction —
 * i.e. an exit / "protect your profit" cue for anyone in the old trade.
 */
export async function notifyReversal(
  symbol: MarketSymbol,
  oldDirection: Direction,
  newDirection: Direction
): Promise<void> {
  const display = symbol.replace(/USDT$/, "");

  const telegram = [
    `⚠️ REVERSAL — ${display}`,
    `Atlas flipped ${oldDirection} → ${newDirection}.`,
    `Consider exiting your ${oldDirection} — or move your stop-loss to protect profit.`,
    "",
    "⚠️ Not financial advice. Manage your own risk.",
    "Genwelth AI",
    "https://www.genwelth.com/login",
  ].join("\n");

  await Promise.all([
    sendTelegram(telegram),
    sendPushToAll({
      title: `⚠️ Reversal — ${display}`,
      body: `Atlas flipped ${oldDirection} → ${newDirection}. Consider exiting / protecting profit.`,
      url: `/coin/${symbol}`,
      tag: `reversal-${symbol}`,
    }),
  ]);
}
