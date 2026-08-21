import { getRiskRadarNow } from "@/lib/services/dashboardService";
import { sendPushToAll } from "@/lib/push/webPush";

// Fires a broad "crash risk HIGH" alert (push + Telegram) when the Risk Radar
// crosses into HIGH — the downside counterpart to the breakout alerts. Debounced
// in-memory so a sustained-high tape doesn't spam: alerts on the transition into
// HIGH, then at most once per cooldown while it stays high.

const REASON_TEXT: Record<string, string> = {
  BREAKDOWN: "coins bryter ned samtidig",
  FUNDING: "høye funding rates (overbelånte longs)",
  GREED: "ekstrem grådighet",
  COMPRESSION: "markedsbred kompresjon",
  BTC_BEARISH: "BTC snur ned",
};

let lastLevel: string | null = null;
let lastAlertAt = 0;

function cooldownMs(): number {
  const raw = Number(process.env.CRASH_ALERT_COOLDOWN_MINUTES);
  return (Number.isFinite(raw) ? raw : 360) * 60_000; // 6h default
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
      console.error("Telegram crash alert failed:", response.status);
    }
  } catch (error) {
    console.error("Telegram crash alert failed:", error);
  }
}

export async function checkAndAlertCrashRisk(): Promise<{
  level: string;
  score: number;
  alerted: boolean;
}> {
  const radar = await getRiskRadarNow();
  const now = Date.now();

  const wasHigh = lastLevel === "HIGH";
  const shouldAlert =
    radar.level === "HIGH" && (!wasHigh || now - lastAlertAt > cooldownMs());

  lastLevel = radar.level;

  if (!shouldAlert) {
    return { level: radar.level, score: radar.score, alerted: false };
  }

  lastAlertAt = now;

  const reasons = radar.reasons
    .map((code) => REASON_TEXT[code])
    .filter(Boolean)
    .join(", ");

  const push = {
    title: "⚠️ Crash-risiko HØY",
    body: `Risk Radar ${radar.score}/100${reasons ? " — " + reasons : ""}. Vurder å stramme stopp og redusere størrelse.`,
    url: "/",
    tag: "crash-alert",
  };

  const telegram = [
    `⚠️ RISK HØY — crash-risiko forhøyet (${radar.score}/100)`,
    reasons ? `Hvorfor: ${reasons}` : "",
    "",
    "Ikke en spådom — en avlesning av forholdene. Vurder å stramme stopp / redusere størrelse.",
    "Not financial advice. Manage your own risk.",
    "https://www.genwelth.com/login",
  ]
    .filter(Boolean)
    .join("\n");

  await Promise.all([sendPushToAll(push), sendTelegram(telegram)]);

  return { level: radar.level, score: radar.score, alerted: true };
}
