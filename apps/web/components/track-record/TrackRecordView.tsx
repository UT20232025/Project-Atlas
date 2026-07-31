import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import { formatMarketSymbol } from "@/lib/services/liveMarketService";
import type { TrackRecordSummary } from "@/lib/atlas/trackRecord";

type TrackRecordViewProps = {
  trackRecord: TrackRecordSummary;
};

function formatPnl(pnlPercent: number) {
  return `${pnlPercent >= 0 ? "+" : ""}${pnlPercent.toFixed(2)}%`;
}

function formatCountdown(horizonAt: string) {
  const remainingMs =
    new Date(horizonAt).getTime() - Date.now();

  if (remainingMs <= 0) {
    return "Evaluating…";
  }

  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor(
    (remainingMs % (60 * 60 * 1000)) / (60 * 1000)
  );

  return `${hours}h ${minutes}m left`;
}

export default function TrackRecordView({
  trackRecord,
}: TrackRecordViewProps) {
  const {
    totalClosed,
    wins,
    losses,
    winRate,
    avgPnlPercent,
    bestTrade,
    worstTrade,
    closedTrades,
    openPositions,
    bySymbol,
  } = trackRecord;

  return (
    <div className="space-y-8">
      <Section
        title="Track Record"
        subtitle="Verified 24h outcome of every Atlas LONG/SHORT signal"
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="atlas-subcard rounded-xl p-4">
            <p className="text-xs text-zinc-500">Win rate</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {totalClosed === 0 ? "—" : `${winRate.toFixed(1)}%`}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {wins}W / {losses}L
            </p>
          </div>

          <div className="atlas-subcard rounded-xl p-4">
            <p className="text-xs text-zinc-500">
              Closed trades
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {totalClosed}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {openPositions.length} pending
            </p>
          </div>

          <div className="atlas-subcard rounded-xl p-4">
            <p className="text-xs text-zinc-500">Avg P&L</p>
            <p
              className={`mt-1 text-2xl font-bold ${
                avgPnlPercent >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {totalClosed === 0
                ? "—"
                : formatPnl(avgPnlPercent)}
            </p>
          </div>

          <div className="atlas-subcard rounded-xl p-4">
            <p className="text-xs text-zinc-500">
              Best / worst
            </p>
            <p className="mt-1 text-sm text-zinc-200">
              {bestTrade
                ? `${formatMarketSymbol(bestTrade.symbol)} ${formatPnl(bestTrade.pnlPercent ?? 0)}`
                : "—"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {worstTrade
                ? `${formatMarketSymbol(worstTrade.symbol)} ${formatPnl(worstTrade.pnlPercent ?? 0)}`
                : "—"}
            </p>
          </div>
        </div>
      </Section>

      {bySymbol.length > 0 && (
        <Section
          title="Per-symbol breakdown"
          subtitle="Closed trades only"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="pb-3 font-medium">Symbol</th>
                  <th className="pb-3 font-medium">Trades</th>
                  <th className="pb-3 font-medium">Win rate</th>
                  <th className="pb-3 font-medium">Avg P&L</th>
                </tr>
              </thead>

              <tbody>
                {bySymbol.map((row) => (
                  <tr
                    key={row.symbol}
                    className="border-t border-zinc-800"
                  >
                    <td className="py-3 font-medium text-white">
                      {formatMarketSymbol(row.symbol)}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {row.trades}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {row.winRate.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 font-medium ${
                        row.avgPnlPercent >= 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatPnl(row.avgPnlPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <Section
        title="Open positions"
        subtitle="Awaiting the 24h evaluation window"
      >
        {openPositions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              Nothing pending
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Every LONG/SHORT signal has already been
              evaluated.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {openPositions.map((trade) => (
              <div
                key={trade.id}
                className="atlas-subcard flex flex-wrap items-center justify-between gap-4 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <p className="font-semibold text-white">
                    {formatMarketSymbol(trade.symbol)}
                  </p>
                  <Badge
                    variant={
                      trade.signal === "LONG" ? "green" : "red"
                    }
                  >
                    {trade.signal}
                  </Badge>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">
                      Entry
                    </p>
                    <p className="text-zinc-200">
                      {trade.entryPrice}
                    </p>
                  </div>

                  <p className="text-zinc-500">
                    {formatCountdown(trade.horizonAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Closed trades"
        subtitle="24h price outcome, most recent first"
      >
        {closedTrades.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              No closed trades yet
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Trades appear here once 24h has passed since a
              LONG/SHORT signal fired.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {closedTrades.map((trade) => {
              const isWin = (trade.pnlPercent ?? 0) > 0;

              return (
                <div
                  key={trade.id}
                  className="atlas-subcard rounded-xl p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">
                        {formatMarketSymbol(trade.symbol)}
                      </p>
                      <Badge
                        variant={
                          trade.signal === "LONG"
                            ? "green"
                            : "red"
                        }
                      >
                        {trade.signal}
                      </Badge>
                      <Badge variant={isWin ? "green" : "red"}>
                        {isWin ? "WIN" : "LOSS"}
                      </Badge>
                    </div>

                    <p
                      className={`text-lg font-bold ${
                        isWin
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {formatPnl(trade.pnlPercent ?? 0)}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">
                        Entry
                      </p>
                      <p className="text-zinc-200">
                        {trade.entryPrice}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Exit (24h)
                      </p>
                      <p className="text-zinc-200">
                        {trade.exitPrice}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Signaled
                      </p>
                      <p className="text-zinc-200">
                        {new Date(
                          trade.createdAt
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-zinc-500">
                        Confidence
                      </p>
                      <p className="text-zinc-200">
                        {trade.confidence}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
