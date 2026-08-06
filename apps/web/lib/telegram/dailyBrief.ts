import {
  getAtlasScanner,
  type ScannerItem,
} from "@/lib/analysis/scanner";
import { getCachedTrackRecord } from "@/lib/atlas/trackRecordCache";

export type DailyBriefResult = {
  telegram: string;
  x: string;
  topCount: number;
  posted: boolean;
};

function displayCoin(coin: string): string {
  return coin.replace(/USDT$/, "");
}

function getMinConfidence(): number {
  const raw = process.env.TELEGRAM_MIN_CONFIDENCE;
  const parsed = raw ? Number(raw) : NaN;

  return Number.isFinite(parsed) ? parsed : 70;
}

function getAppUrl(): string {
  // Public marketing post — always link to the branded domain. Not
  // NEXT_PUBLIC_APP_URL, which bakes to the raw Compute URL at build time.
  return "https://www.genwelth.com";
}

/**
 * Composes the daily market brief from the live scanner + verified track
 * record. Returns both a Telegram-formatted body and a compact X/Twitter
 * variant (kept short). Pure — does not post anywhere.
 */
export async function buildDailyBrief(): Promise<
  Omit<DailyBriefResult, "posted">
> {
  const [scanner, track] = await Promise.all([
    getAtlasScanner(),
    getCachedTrackRecord(),
  ]);

  const bullish = scanner.filter(
    (item) => item.trend === "BULLISH"
  ).length;
  const bearish = scanner.filter(
    (item) => item.trend === "BEARISH"
  ).length;
  const neutral = scanner.filter(
    (item) => item.trend === "NEUTRAL"
  ).length;

  const bias =
    bullish > bearish
      ? "BULLISH"
      : bearish > bullish
      ? "BEARISH"
      : "NEUTRAL";

  const minConfidence = getMinConfidence();

  const setups = scanner
    .filter(
      (item) =>
        (item.signal === "LONG" ||
          item.signal === "SHORT") &&
        item.confidence >= minConfidence
    )
    .sort(
      (first, second) =>
        second.confidence - first.confidence
    )
    .slice(0, 4);

  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const appUrl = getAppUrl();

  const badge = (item: ScannerItem) =>
    item.signal === "LONG" ? "🟢" : "🔴";

  // --- Telegram (multi-line) ---
  const tLines: string[] = [
    `📊 Genwelth Daily Brief — ${date}`,
    "",
    `Market: ${bullish} bullish · ${bearish} bearish · ${neutral} neutral → ${bias}`,
    "",
  ];

  if (setups.length > 0) {
    tLines.push("Top setups:");
    setups.forEach((item) =>
      tLines.push(
        `${badge(item)} ${item.signal} ${displayCoin(
          item.coin
        )} — ${item.confidence}%`
      )
    );
  } else {
    tLines.push(
      "No high-confidence setups right now — Atlas stays patient."
    );
  }

  if (track.totalClosed > 0) {
    tLines.push(
      "",
      `Verified track record: ${track.winRate.toFixed(
        0
      )}% over ${track.totalClosed} signals`
    );
  }

  tLines.push(
    "",
    `Full analysis → ${appUrl}`,
    "",
    "Not financial advice."
  );

  const telegram = tLines.join("\n");

  // --- X / Twitter (compact) ---
  const topX = setups
    .slice(0, 3)
    .map(
      (item) =>
        `${badge(item)}${displayCoin(item.coin)} ${
          item.confidence
        }%`
    )
    .join(" · ");

  const xLines = [
    `📊 Genwelth Daily — ${date}`,
    `Market: ${bias} (${bullish}↑ / ${bearish}↓)`,
    setups.length > 0
      ? `Top: ${topX}`
      : "No high-conf setups — staying patient.",
    track.totalClosed > 0
      ? `${track.winRate.toFixed(0)}% verified · ${
          track.totalClosed
        } signals`
      : "",
    appUrl,
  ].filter(Boolean);

  return {
    telegram,
    x: xLines.join("\n"),
    topCount: setups.length,
  };
}

async function postToTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const channel = process.env.TELEGRAM_CHANNEL;

  if (!token || !channel) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channel,
          text,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Telegram daily brief failed:",
        response.status,
        await response.text()
      );

      return false;
    }

    return true;
  } catch (error) {
    console.error("Telegram daily brief failed:", error);

    return false;
  }
}

/**
 * Builds the daily brief and posts it to the Telegram channel.
 * Pass `dryRun` to compose without posting (for previewing the text).
 */
export async function runDailyBrief(
  dryRun = false
): Promise<DailyBriefResult> {
  const brief = await buildDailyBrief();

  const posted = dryRun
    ? false
    : await postToTelegram(brief.telegram);

  return { ...brief, posted };
}
