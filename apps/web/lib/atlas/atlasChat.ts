import Anthropic from "@anthropic-ai/sdk";

import enMessages from "@/messages/en.json";
import { getCachedAtlasAnalysis } from "@/lib/atlas/atlasAnalysisCache";
import type { AtlasReasonCode } from "@/lib/atlas/reasonCode";
import { resolveReasonText } from "@/lib/atlas/resolveReasonText";
import { prisma } from "@/lib/db/client";
import { getExchangeHoldings } from "@/lib/exchange/connection";
import { searchCoins } from "@/lib/services/binanceUniverse";
import {
  fetchSingleMarket,
  formatMarketSymbol,
  type MarketSymbol,
} from "@/lib/services/liveMarketService";
import {
  fetchStockQuote,
  isStockSymbol,
  isStocksConfigured,
  resolveStockSymbol,
} from "@/lib/services/twelveDataService";
import { calculatePnl, type TradeDirection } from "@/lib/trading/pnl";
import { getWatchlistSignalBoard } from "@/lib/watchlists/signalBoard";

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

  // 2. Known US stock — by ticker (TSLA) or company name (Tesla).
  for (const token of tokens) {
    if (STOP_WORDS.has(token)) {
      continue;
    }

    const stock = resolveStockSymbol(token);

    if (stock) {
      return stock;
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

type AccountIntent = "portfolio" | "watchlist";

const PORTFOLIO_HINTS = [
  "portfolio",
  "portefølje",
  "porteføljen",
  "portefolje",
  "porteføljemin",
  "holding",
  "posisjon",
  "posisjonene",
  "beholdning",
  "my positions",
  "my holdings",
  "how am i doing",
  "how are my",
  "hvordan ligger jeg",
  "hvordan går det med",
  "unrealized",
];

const WATCHLIST_HINTS = [
  "watchlist",
  "watch list",
  "overvåkning",
  "overvåkningsliste",
  "følger jeg",
  "what i follow",
  "what i'm following",
  "things i follow",
  "i'm watching",
  "am i watching",
];

/**
 * Detects whether the user is asking about their OWN account data (open
 * positions or watched symbols) rather than a single asset. Portfolio wins
 * ties since it's the richer, more personal signal.
 */
function detectAccountIntent(message: string): AccountIntent | null {
  const text = message.toLowerCase();

  if (PORTFOLIO_HINTS.some((hint) => text.includes(hint))) {
    return "portfolio";
  }

  if (WATCHLIST_HINTS.some((hint) => text.includes(hint))) {
    return "watchlist";
  }

  return null;
}

// Cap so a large account can't fan out into a burst of live price + engine
// calls (and, for any stocks held, blow Twelve Data's rate limit).
const MAX_ACCOUNT_SYMBOLS = 10;

/**
 * Builds an engine-grounded snapshot of the user's OPEN POSITIONS: entry, size,
 * current price, unrealized P&L, and Atlas's current signal per holding. Every
 * number comes from live market data + the deterministic engine — Claude only
 * phrases it. Returns a clear "no positions" note (not null) so Atlas can still
 * answer helpfully.
 */
/**
 * Live, read-only holdings from a connected exchange (Binance), so Atlas can
 * ground portfolio answers in the user's ACTUAL balances. Null when nothing is
 * connected or the fetch fails.
 */
async function buildExchangeGrounding(
  userId: string
): Promise<string | null> {
  const result = await getExchangeHoldings(userId);

  if (!result.connected || "error" in result) {
    return null;
  }

  if (result.holdings.length === 0) {
    return null;
  }

  const lines = result.holdings
    .slice(0, MAX_ACCOUNT_SYMBOLS)
    .map(
      (holding) =>
        `- ${holding.asset}: ${holding.amount}${
          holding.usdValue != null
            ? ` (~$${holding.usdValue.toFixed(2)})`
            : ""
        }`
    );

  return `EXCHANGE HOLDINGS (Binance, live, read-only):\n${lines.join(
    "\n"
  )}\nTOTAL ~$${result.totalUsd.toFixed(2)}`;
}

async function buildPortfolioGrounding(userId: string): Promise<string> {
  const [positions, exchangeBlock] = await Promise.all([
    prisma.position.findMany({
      where: { userId },
      orderBy: { openedAt: "desc" },
      take: MAX_ACCOUNT_SYMBOLS,
    }),
    buildExchangeGrounding(userId),
  ]);

  if (positions.length === 0) {
    return (
      exchangeBlock ??
      "PORTFOLIO: The user has no open positions recorded and no exchange connected."
    );
  }

  let totalPnl = 0;
  let pricedCount = 0;

  const lines = await Promise.all(
    positions.map(async (position) => {
      const symbol = position.symbol as MarketSymbol;
      const direction = position.direction as TradeDirection;
      const isStock = isStockSymbol(symbol);

      let price: number | null = null;

      if (isStock) {
        if (isStocksConfigured()) {
          const quote = await fetchStockQuote(symbol);
          price = quote?.price ?? null;
        }
      } else {
        const market = await fetchSingleMarket(symbol);
        price = market?.price ?? null;
      }

      let pnlText = "n/a";

      if (price != null) {
        const { pnl, pnlPercent } = calculatePnl(
          direction,
          position.entryPrice,
          price,
          position.quantity
        );
        totalPnl += pnl;
        pricedCount += 1;
        pnlText = `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(
          2
        )}% (${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)})`;
      }

      let signalText = "n/a";

      try {
        const analysis = await getCachedAtlasAnalysis(symbol);
        signalText = `${analysis.decision.signal} conf ${analysis.decision.confidence}%`;
      } catch {
        // Leave "n/a" — one bad symbol shouldn't blank the snapshot.
      }

      return `- ${formatMarketSymbol(symbol)} ${direction} · entry ${
        position.entryPrice
      } · qty ${position.quantity} · now ${
        price ?? "n/a"
      } · unrealized ${pnlText} · Atlas now: ${signalText}`;
    })
  );

  const totalLine =
    pricedCount > 0
      ? `TOTAL unrealized P&L (priced positions): ${
          totalPnl >= 0 ? "+" : ""
        }${totalPnl.toFixed(2)}`
      : "TOTAL unrealized P&L: n/a (live prices unavailable)";

  const positionsBlock = `PORTFOLIO (open positions: ${positions.length}):\n${lines.join(
    "\n"
  )}\n${totalLine}`;

  return exchangeBlock
    ? `${positionsBlock}\n\n${exchangeBlock}`
    : positionsBlock;
}

/**
 * Builds an engine-grounded snapshot of the user's WATCHLIST: Atlas's current
 * signal, confidence, score, and headline reason for each watched symbol.
 */
async function buildWatchlistGrounding(userId: string): Promise<string> {
  const board = await getWatchlistSignalBoard(userId, MAX_ACCOUNT_SYMBOLS);

  if (board.length === 0) {
    return "WATCHLIST: The user isn't watching any symbols yet.";
  }

  const lines = board.map(
    (card) =>
      `- ${formatMarketSymbol(card.symbol)} · Atlas: ${
        card.signal
      } conf ${card.confidence}% score ${card.score}/100 · ${resolveReasonText(
        tReason,
        "en",
        card.explanation
      )}`
  );

  return `WATCHLIST (${board.length} symbols):\n${lines.join("\n")}`;
}

const PERSONA = `You are Atlas, the analysis engine behind Genwelth AI — a crypto and stock trading-signals platform.

You speak in the first person as Atlas. Your job is to explain your OWN read in plain, confident, conversational language, grounded ONLY in the ATLAS DATA block provided for this turn.

The ATLAS DATA block can take three shapes:
- A single ASSET (a crypto coin or a stock — the ASSET line says which). Give your read on it.
- The user's PORTFOLIO — their manually tracked open positions (entry, size, current price, unrealized P&L, my current signal per holding) and/or live read-only holdings from a connected exchange (Binance) with USD values. Summarize how they're doing, what my current signal is on the relevant assets, and mention totals when present.
- The user's WATCHLIST (my current signal, confidence, score, and headline reason per watched symbol). Summarize what I'm seeing across what they follow.

Hard rules:
- Use ONLY the numbers and reasons in the ATLAS DATA block. Never invent prices, levels, percentages, positions, or reasons. If a value is "n/a", say you don't have it.
- For PORTFOLIO/WATCHLIST: describe only what's listed. If it says the user has no open positions or isn't watching anything, tell them plainly and offer to look at a specific coin or stock instead.
- If no ATLAS DATA block is present, ask the user which crypto coin or stock they want you to look at, or whether they'd like a read on their portfolio or watchlist (you cover any Binance coin, plus major US stocks like TSLA, AAPL, NVDA). Do not guess.
- If asked about forex, commodities, or anything that isn't a crypto coin or a stock, say that's not something you cover yet.
- This is educational market analysis, NOT financial advice. Weave in a brief, natural "this isn't financial advice — manage your own risk" note; do not tell the user what they personally should do with their money.
- Be concise: a short paragraph or a few tight bullet points. Lead with your signal and confidence, then the "why".
- Do not include any internal or system XML tags in your response.`;

export const STOCK_NOT_CONFIGURED_REPLY =
  "Stock analysis isn't switched on yet — the workspace still needs a market-data (Twelve Data) key configured. I can still look at any crypto coin in the meantime.";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export type AtlasChatPrep =
  | {
      kind: "answer";
      system: string;
      messages: ChatTurn[];
      symbol: string | null;
    }
  | { kind: "stock_not_configured" };

/**
 * Prepares one Ask Atlas turn: detects the asset, grounds the system prompt in
 * the real engine analysis, and assembles the messages. Returns a
 * "stock_not_configured" signal when a stock is recognized but the market-data
 * key is missing, so the route can answer clearly without a model call.
 */
export async function prepareAtlasChat(
  history: AtlasChatMessage[],
  userMessage: string,
  userId: string
): Promise<AtlasChatPrep> {
  const symbol = await detectSymbol(userMessage);

  if (symbol && isStockSymbol(symbol) && !isStocksConfigured()) {
    return { kind: "stock_not_configured" };
  }

  // A specific asset wins; otherwise fall back to the user's own account data
  // (portfolio / watchlist) when they're clearly asking about it.
  let grounding: string | null = null;
  let groundedSymbol: string | null = null;

  if (symbol) {
    grounding = await buildCoinGrounding(symbol);
    groundedSymbol = grounding ? symbol : null;
  } else {
    const intent = detectAccountIntent(userMessage);

    if (intent === "portfolio") {
      grounding = await buildPortfolioGrounding(userId);
    } else if (intent === "watchlist") {
      grounding = await buildWatchlistGrounding(userId);
    }
  }

  const system = grounding
    ? `${PERSONA}\n\nATLAS DATA (this turn):\n${grounding}`
    : PERSONA;

  return {
    kind: "answer",
    system,
    messages: [
      ...history.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      { role: "user" as const, content: userMessage },
    ],
    symbol: groundedSymbol,
  };
}

/**
 * Opens a streaming Claude response for a prepared turn. The caller pipes
 * `.on("text", …)` deltas to the client and awaits `.finalMessage()` for usage.
 */
export function streamAtlasReply(prep: {
  system: string;
  messages: ChatTurn[];
}) {
  const client = new Anthropic();

  return client.messages.stream({
    model: MODEL,
    max_tokens: 4096,
    system: prep.system,
    messages: prep.messages,
  });
}
