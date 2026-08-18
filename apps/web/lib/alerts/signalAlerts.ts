import { prisma } from "@/lib/db/client";
import { sendPushToUser } from "@/lib/push/webPush";
import { isTwelveDataSymbol, isForexSymbol } from "@/lib/services/twelveDataService";

export type AlertSignal = "LONG" | "SHORT" | "WAIT";

// Human label for a symbol: strip USDT for crypto, slash the pair for FX,
// leave stock tickers as-is.
export function displaySymbol(symbol: string): string {
  if (isForexSymbol(symbol) && symbol.length === 6) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  return symbol.replace(/USDT$/, "");
}

// Current signal for a symbol, read straight from the DB the other crons keep
// warm — StockSnapshot for stocks/gold/FX, the latest 1h SignalSnapshot for
// crypto. No market API calls, so this scales to any number of alerts.
export async function getCurrentSignal(
  symbol: string
): Promise<AlertSignal | null> {
  if (isTwelveDataSymbol(symbol)) {
    const row = await prisma.stockSnapshot.findUnique({
      where: { ticker: symbol },
      select: { signal: true },
    });
    return (row?.signal as AlertSignal) ?? null;
  }

  const row = await prisma.signalSnapshot.findFirst({
    where: { symbol, interval: "1h" },
    orderBy: { createdAt: "desc" },
    select: { signal: true },
  });
  return (row?.signal as AlertSignal) ?? null;
}

// Marathon framing: the wait paid off.
function alertBody(symbol: string, signal: "LONG" | "SHORT"): string {
  const dir = signal === "LONG" ? "LONG 🟢" : "SHORT 🔴";
  return `${displaySymbol(symbol)} er nå et ${dir}-oppsett. Tålmodigheten lønte seg — sjekk analysen.`;
}

// Fire every standing signal alert whose asset has just flipped to a directional
// setup. Returns how many pushes were sent. Reused by the cron route.
export async function runSignalAlerts(): Promise<{ sent: number }> {
  const alerts = await prisma.signalAlert.findMany();
  if (alerts.length === 0) {
    return { sent: 0 };
  }

  // Resolve each distinct symbol's current signal once.
  const symbols = Array.from(new Set(alerts.map((a) => a.symbol)));
  const current = new Map<string, AlertSignal | null>();
  await Promise.all(
    symbols.map(async (symbol) => {
      current.set(symbol, await getCurrentSignal(symbol));
    })
  );

  let sent = 0;

  for (const alert of alerts) {
    const now = current.get(alert.symbol) ?? null;
    if (now === null || now === alert.lastSignal) {
      continue;
    }

    // Only push on a flip INTO a directional setup; still record WAIT/other
    // transitions so the next directional flip re-triggers cleanly.
    if (now === "LONG" || now === "SHORT") {
      await sendPushToUser(alert.userId, {
        title: "🎯 Atlas: klar til trade",
        body: alertBody(alert.symbol, now),
        url: `/coin/${alert.symbol}`,
        tag: `signal-alert-${alert.symbol}`,
      });
      sent += 1;
    }

    await prisma.signalAlert.update({
      where: { id: alert.id },
      data: { lastSignal: now },
    });
  }

  return { sent };
}
