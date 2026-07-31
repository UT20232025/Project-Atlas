import AppLayout from "@/components/layout/AppLayout";
import JournalView from "@/components/journal/JournalView";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import type {
  MarketSymbol,
} from "@/lib/services/liveMarketService";
import type {
  JournalEntryView,
  TradeDirection,
} from "@/lib/trading/pnl";

import { createJournalEntry, deleteJournalEntry } from "./actions";

export default async function JournalPage() {
  const { userId, email } = await requireSession();

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { closedAt: "desc" },
  });

  const entryViews: JournalEntryView[] = entries.map(
    (entry) => ({
      id: entry.id,
      symbol: entry.symbol as MarketSymbol,
      direction: entry.direction as TradeDirection,
      entryPrice: entry.entryPrice,
      exitPrice: entry.exitPrice,
      quantity: entry.quantity,
      pnl: entry.pnl,
      pnlPercent: entry.pnlPercent,
      note: entry.note,
      openedAt: entry.openedAt.toISOString(),
      closedAt: entry.closedAt.toISOString(),
    })
  );

  return (
    <AppLayout userEmail={email}>
      <JournalView
        entries={entryViews}
        createEntryAction={createJournalEntry}
        deleteEntryAction={deleteJournalEntry}
      />
    </AppLayout>
  );
}
