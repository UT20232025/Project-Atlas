"use client";

import Badge from "@/components/ui/Badge";
import Section from "@/components/ui/Section";
import Select from "@/components/ui/Select";
import {
  formatMarketSymbol,
  MARKET_SYMBOLS,
} from "@/lib/services/liveMarketService";
import type { JournalEntryView } from "@/lib/trading/pnl";

type JournalViewProps = {
  entries: JournalEntryView[];
  createEntryAction: (formData: FormData) => void;
  deleteEntryAction: (formData: FormData) => void;
};

const CSV_COLUMNS = [
  "Symbol",
  "Direction",
  "Entry Price",
  "Exit Price",
  "Quantity",
  "P&L",
  "P&L %",
  "Opened At",
  "Closed At",
  "Note",
] as const;

function toCsvValue(value: string | number) {
  const stringValue = String(value);

  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildCsv(entries: JournalEntryView[]) {
  const rows = entries.map((entry) =>
    [
      entry.symbol,
      entry.direction,
      entry.entryPrice,
      entry.exitPrice,
      entry.quantity,
      entry.pnl.toFixed(2),
      entry.pnlPercent.toFixed(2),
      entry.openedAt,
      entry.closedAt,
      entry.note ?? "",
    ]
      .map(toCsvValue)
      .join(",")
  );

  return [CSV_COLUMNS.join(","), ...rows].join("\n");
}

function downloadCsv(entries: JournalEntryView[]) {
  const csv = buildCsv(entries);
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `atlas-trading-journal-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function JournalView({
  entries,
  createEntryAction,
  deleteEntryAction,
}: JournalViewProps) {
  return (
    <div className="space-y-8">
      <Section
        title="Trading Journal"
        subtitle="A log of your closed trades"
      >
        <form
          action={createEntryAction}
          className="atlas-subcard mb-6 grid gap-3 rounded-2xl p-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <Select
            name="symbol"
            defaultValue={MARKET_SYMBOLS[0]}
          >
            {MARKET_SYMBOLS.map((symbol) => (
              <option key={symbol} value={symbol}>
                {formatMarketSymbol(symbol)}
              </option>
            ))}
          </Select>

          <Select name="direction" defaultValue="LONG">
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>

          <input
            type="number"
            name="entryPrice"
            placeholder="Entry price"
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="number"
            name="exitPrice"
            placeholder="Exit price"
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            step="any"
            required
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <input
            type="date"
            name="openedAt"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-zinc-600"
          />

          <input
            type="text"
            name="note"
            placeholder="Note (optional)"
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Add entry
          </button>
        </form>

        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            {entries.length} closed trades
          </span>

          <button
            type="button"
            onClick={() => downloadCsv(entries)}
            disabled={entries.length === 0}
            className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="font-medium text-zinc-300">
              No journal entries yet
            </p>

            <p className="mt-1 text-sm text-zinc-600">
              Close a position from Portfolio, or add a trade
              manually above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="atlas-subcard rounded-xl p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-white">
                      {formatMarketSymbol(entry.symbol)}
                    </p>

                    <Badge
                      variant={
                        entry.direction === "LONG"
                          ? "green"
                          : "red"
                      }
                    >
                      {entry.direction}
                    </Badge>
                  </div>

                  <form action={deleteEntryAction}>
                    <input
                      type="hidden"
                      name="entryId"
                      value={entry.id}
                    />

                    <button
                      type="submit"
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </form>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                  <div>
                    <p className="text-xs text-zinc-500">
                      Entry
                    </p>
                    <p className="text-zinc-200">
                      {entry.entryPrice}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      Exit
                    </p>
                    <p className="text-zinc-200">
                      {entry.exitPrice}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      Quantity
                    </p>
                    <p className="text-zinc-200">
                      {entry.quantity}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      P&L
                    </p>
                    <p
                      className={
                        entry.pnl >= 0
                          ? "font-semibold text-green-400"
                          : "font-semibold text-red-400"
                      }
                    >
                      {entry.pnl >= 0 ? "+" : ""}
                      {entry.pnl.toFixed(2)} (
                      {entry.pnlPercent.toFixed(2)}%)
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">
                      Closed
                    </p>
                    <p className="text-zinc-200">
                      {new Date(
                        entry.closedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {entry.note && (
                  <p className="mt-3 text-sm text-zinc-500">
                    {entry.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
