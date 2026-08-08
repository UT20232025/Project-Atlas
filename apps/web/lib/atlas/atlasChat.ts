import Anthropic from "@anthropic-ai/sdk";

import enMessages from "@/messages/en.json";
import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";
import { searchCoins } from "@/lib/services/binanceUniverse";
import {
  fetchSingleMarket,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import {
  fetchStockQuote,
  isStockSymbol,
  isStocksConfigured,
} from "@/lib/services/twelveDataService";

// Default to the most capable model; the owner can point this at a cheaper
// model (e.g. claude-sonnet-5 or claude-haiku-4-5) via env to cut per-message
// cost, since the heavy lifting is done by the deterministic Atlas engine and
// Claude only phrases it.
const MODEL = process.env.ATLAS_CHAT_MODEL ?? "claude-opus-5";

const reasonMessages = (
  enMessages as unknown as { AtlasReasons: Record<string, string> }
).AtlasReasons;

// A tiny next-intl-free translator over the English reason strings, so the
// chat route (which has no request-scoped locale) can resolve reason codes to
// readable text for grounding.
function tReason(
  key: string,
  params?: Record<string, string | number>
): string {
  const template = reasonMessages[key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
    String(params[name] ?? `{${name}}`)
  );
}

function resolveReasons(reasons: AtlasReasonCode[]): string {
  if (reasons.length === 0) {
    return "(none)";
  }

  return reasons
    .map((reason) => `- ${resolveReasonText(tReason, "en", reason)}`)
    .join("\n");
}

export type AtlasChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function isAtlasChatConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

const STOP_WORDS = new Set([
  "LONG",
  "SHORT",
  "BUY",
  "SELL",
  "THE",
  "AND",
  "FOR",
  "USD",
  "USDT",
  "ATLAS",
  "WHAT",
  "HOW",
  "WHY",
  "TRADE",
  "PRICE",
  "NOW",
  "TP",
  "SL",
  "RR",
  "OK",
]);

/**
 * Best-effort extraction of a Binance coin from the user's message: prefer a
 * standalone ticker that resolves to an exact base asset, then fall back to a
 * loose universe search.
 */
async function detectSymbol(message: string): Promise<string | null> {
  const tokens = Array.from(
    new Set(message.toUpperCase().match(/\b[A-Z0-9]{2,6}\b/g) ?? [])
  );

  // 1. Exact crypto base match (crypto-first, so ambiguous tickers like SOL
  //    resolve to the coin).
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) {
      continue;
    }

    const exact = await searchCoins(token, 1);

    if (exact.length > 0 && exact[0].base.toUpperCase() === token) {
      return exact[0].symbol;
    }
  }

  // 2. Known US stock ticker (TSLA, AAPL, …).
  for (const token of tokens) {
    if (!STOP_WORDS.has(token) && isStockSymbol(token)) {
      return token;
    }
  }

  // 3. Loose crypto search.
  for (const token of tokens) {
    if (STOP_WORDS.has(token) || token.length < 3) {
      continue;
    }

    const loose = await searchCoins(token, 1);

    if (loose.length > 0) {
      return loose[0].symbol;
    }
  }

  return null;
}

function formatNumber(value: number | null): string {
  return value == null ? "n/a" : String(value);
}

/**
 * Builds a factual, engine-grounded context block for a single asset (crypto
 * or stock). Every number here comes straight from the deterministic Atlas
 * engine — Claude is only allowed to phrase and explain what's in this block.
 */
async function buildCoinGrounding(symbol: string): Promise<string | null> {
  const isStock = isStockSymbol(symbol);

  let price: number;
  let change: number;
  let unit: string;
  let assetLabel: string;
  let display: string;

  if (isStock) {
    if (!isStocksConfigured()) {
      return null;
    }

    const quote = await fetchStockQuote(symbol);

    if (!quote) {
      return null;
    }

    price = quote.price;
    change = quote.change24h;
    unit = "USD";
    assetLabel = "STOCK";
    display = symbol.toUpperCase();
  } else {
    const market = await fetchSingleMarket(symbol);

    if (!market) {
      return null;
    }

    price = market.price;
    change = market.change24h;
    unit = "USDT";
    assetLabel = "CRYPTO";
    display = symbol.replace(/USDT$/, "");
  }

  const analysis = await getCachedAtlasAnalysis(symbol as MarketSymbol);
  const decision = analysis.decision;

  return [
    `ASSET: ${display} (${symbol}) · ${assetLabel}`,
    `LIVE PRICE: ${price} ${unit} (change ${change.toFixed(2)}%)`,
    `ATLAS SIGNAL: ${decision.signal} · confidence ${decision.confidence}% · score ${decision.score}/100 · trade approved: ${decision.tradeApproved}`,
    `TREND: ${analysis.trend.direction} · RSI: ${analysis.indicators.rawRsi.toFixed(
      1
    )}`,
    `TRADE SETUP: entry ${formatNumber(decision.entry)} · stop-loss ${formatNumber(
      decision.stopLoss
    )} · take-profit ${formatNumber(
      decision.takeProfit
    )} · R:R ${formatNumber(decision.riskRewardRatio)}`,
    `KEY LEVELS: support ${formatNumber(
      analysis.priceLevels.support
    )} · resistance ${formatNumber(
      analysis.priceLevels.resistance
    )} · POC ${formatNumber(
      analysis.volumeProfile.poc
    )} · VWAP ${formatNumber(analysis.vwap.vwap)}`,
    `HEADLINE REASON: ${resolveReasonText(tReason, "en", decision.explanation)}`,
    `SUPPORTING REASONS:\n${resolveReasons(decision.reasons)}`,
    `WARNINGS:\n${resolveReasons(decision.warnings)}`,
  ].join("\n");
}

const PERSONA = `You are Atlas, the analysis engine behind Genwelth AI — a crypto and stock trading-signals platform.

You speak in the first person as Atlas. Your job is to explain your OWN read on an asset (a crypto coin or a stock) in plain, confident, conversational language, grounded ONLY in the ATLAS DATA block provided for this turn. The block's ASSET line says whether it's CRYPTO or a STOCK — speak accordingly.

Hard rules:
- Use ONLY the numbers and reasons in the ATLAS DATA block. Never invent prices, levels, percentages, or reasons. If a value is "n/a", say you don't have it.
- If no ATLAS DATA block is present, ask the user which crypto coin or stock they want you to look at (you cover any Binance coin, plus major US stocks like TSLA, AAPL, NVDA). Do not guess.
- If asked about forex, commodities, or anything that isn't a crypto coin or a stock, say that's not something you cover yet.
- This is educational market analysis, NOT financial advice. Weave in a brief, natural "this isn't financial advice — manage your own risk" note; do not tell the user what they personally should do with their money.
- Be concise: a short paragraph or a few tight bullet points. Lead with your signal and confidence, then the "why".
- Do not include any internal or system XML tags in your response.`;

export type AtlasChatResult = {
  reply: string;
  symbol: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
};

/**
 * Runs one turn of the "Ask Atlas" chat: detects the coin, grounds Claude in
 * the real engine analysis, and returns Atlas's natural-language explanation.
 */
export async function runAtlasChat(
  history: AtlasChatMessage[],
  userMessage: string
): Promise<AtlasChatResult> {
  const symbol = await detectSymbol(userMessage);
  const grounding = symbol ? await buildCoinGrounding(symbol) : null;

  const system = grounding
    ? `${PERSONA}\n\nATLAS DATA (this turn):\n${grounding}`
    : PERSONA;

  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system,
    messages: [
      ...history.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
  });

  const reply = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { text: string }).text)
    .join("\n")
    .trim();

  return {
    reply:
      reply ||
      "I couldn't put together a read just now — try asking again in a moment.",
    symbol: grounding ? symbol : null,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
  };
}
