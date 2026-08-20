import type { BreakoutResult } from "@/lib/atlas/breakoutEngine";
import { sendPushToAll } from "@/lib/push/webPush";

// Broadcasts a breakout as a FULL signal — branded card + entry/SL/TP — the
// moment it fires, independent of the conservative decision.signal (which sits
// on WAIT through a fast move). Goes to the Telegram channel + every push
// subscriber. Debounced by the caller (shouldBroadcastSignal, BREAKOUT_ key)
// and gated on strength so a market-wide move doesn't fire one per coin. Kept
// labelled as momentum (higher risk) so it never masquerades as the conservative
// signal or the verified track record.

function minBroadcastStrength(): number {
  const raw = Number(process.env.ATLAS_BREAKOUT_BROADCAST_MIN_STRENGTH);
  return Number.isFinite(raw) ? raw : 55;
}

function display(symbol: string): string {
  return symbol.replace(/USDT$/, "");
}

// Price rounding that stays useful across BTC-scale and PEPE-scale assets.
function round(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value >= 1000) return Math.round(value * 100) / 100;
  if (value >= 1) return Math.round(value * 10000) / 10000;
  return Math.round(value * 100000000) / 100000000;
}

async function sendTelegramPhoto(
  photo: string,
  caption: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL;
  if (!token || !channel) return;

  // Lead with the branded card; fall back to text so a signal is never dropped.
  try {
    const photoResponse = await fetch(
      `https://api.telegram.org/bot${token}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channel, photo, caption }),
      }
    );
    if (photoResponse.ok) return;
    console.error(
      "Telegram breakout sendPhoto failed, falling back to text:",
      photoResponse.status
    );
  } catch (error) {
    console.error("Telegram breakout sendPhoto failed:", error);
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channel, text: caption }),
      }
    );
    if (!response.ok) {
      console.error("Telegram breakout notify failed:", response.status);
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
  const emoji = isLong ? "🟢" : "🔴";
  const expansion = breakout.rangeExpansion.toFixed(1);

  const entry = round(breakout.entry);
  const stopLoss = round(breakout.stopLoss);
  const takeProfit = round(breakout.takeProfit);
  const rr = breakout.riskReward;

  const lines = [
    `${emoji} ${breakout.direction} ${symbol} (BREAKOUT)`,
    `Confidence: ${breakout.strength}%`,
  ];
  if (entry != null) lines.push(`Entry: ${entry}`);
  if (stopLoss != null) lines.push(`🛑 SL: ${stopLoss}`);
  if (takeProfit != null) lines.push(`🎯 TP: ${takeProfit}`);
  if (rr != null) lines.push(`R:R ${rr.toFixed(2)}:1`);
  lines.push(
    `Momentum akkurat nå — ${expansion}× normal bevegelse.`,
    "",
    "⚡ Momentum-signal (høyere risiko), ikke det konservative Atlas-signalet.",
    "Not financial advice. Manage your own risk.",
    "https://www.genwelth.com/login"
  );
  const caption = lines.join("\n");

  const cardParams = new URLSearchParams({
    bo: breakout.direction,
    conf: String(breakout.strength),
  });
  if (entry != null) cardParams.set("entry", String(entry));
  if (stopLoss != null) cardParams.set("sl", String(stopLoss));
  if (takeProfit != null) cardParams.set("tp", String(takeProfit));
  if (rr != null) cardParams.set("rr", String(rr));
  const cardUrl = `https://www.genwelth.com/api/signal-card/${symbol}?${cardParams.toString()}`;

  await Promise.all([
    sendTelegramPhoto(cardUrl, caption),
    sendPushToAll({
      title: `🚀 ${name} breakout ${emoji} ${breakout.direction}`,
      body: `Entry ${entry ?? "—"} · SL ${stopLoss ?? "—"} · TP ${takeProfit ?? "—"} — momentum ${expansion}× normal.`,
      url: `/coin/${symbol}`,
      tag: `breakout-${symbol}`,
    }),
  ]);
}
