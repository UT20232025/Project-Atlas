import type { BreakoutResult } from "@/lib/atlas/breakoutEngine";
import { sendPushToAll } from "@/lib/push/webPush";

// Broadcasts a breakout the moment it fires — independent of the conservative
// decision.signal, which is exactly what sits on WAIT through a fast move. Goes
// to the Telegram channel + every push subscriber. Debounced by the caller
// (shouldBroadcastSignal with a BREAKOUT_ key) and gated on strength so a
// market-wide move doesn't fire a push for every single coin.

function minBroadcastStrength(): number {
  const raw = Number(process.env.ATLAS_BREAKOUT_BROADCAST_MIN_STRENGTH);
  return Number.isFinite(raw) ? raw : 55;
}

function display(symbol: string): string {
  return symbol.replace(/USDT$/, "");
}

async function sendTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL;
  if (!token || !channel) return;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channel, text }),
      }
    );
    if (!response.ok) {
      console.error(
        "Telegram breakout notify failed:",
        response.status,
        await response.text()
      );
    }
  } catch (error) {
    console.error("Telegram breakout notify failed:", error);
  }
}

export async function notifyBreakout(
  symbol: string,
  breakout: BreakoutResult
): Promise<void> {
  if (
    !breakout.detected ||
    breakout.direction === null ||
    breakout.strength < minBroadcastStrength()
  ) {
    return;
  }

  const name = display(symbol);
  const isLong = breakout.direction === "LONG";
  const arrow = isLong ? "🟢 opp" : "🔴 ned";
  const expansion = breakout.rangeExpansion.toFixed(1);

  const telegramText = [
    `🚀 BREAKOUT: ${name} bryter ut ${arrow}`,
    `Momentum akkurat nå — ${expansion}× normal bevegelse.`,
    "",
    "⚡ Momentum-signal (høyere risiko), ikke det konservative Atlas-signalet.",
    "Not financial advice. Manage your own risk.",
    "https://www.genwelth.com/login",
  ].join("\n");

  await Promise.all([
    sendTelegram(telegramText),
    sendPushToAll({
      title: `🚀 ${name} breakout ${isLong ? "🟢" : "🔴"}`,
      body: `Momentum fyrer akkurat nå — ${expansion}× normal bevegelse. Trykk for analysen.`,
      url: `/coin/${symbol}`,
      tag: `breakout-${symbol}`,
    }),
  ]);
}
