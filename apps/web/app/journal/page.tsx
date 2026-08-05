import { getTranslations } from "next-intl/server";

import AppLayout from "@/components/layout/AppLayout";
import JournalView from "@/components/journal/JournalView";
import ProUpsell from "@/components/ui/ProUpsell";
import { prisma } from "@/lib/db/client";
import type {
  MarketSymbol,
} from "@/lib/services/liveMarketService";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";
import type {
  JournalEntryView,
  TradeDirection,
} from "@/lib/trading/pnl";

import { createJournalEntry, deleteJournalEntry } from "./actions";

export default async function JournalPage() {
  const user = await getCurrentUser();

  if (!hasActiveSubscription(user)) {
    const t = await getTranslations("JournalGate");

    return (
      <AppLayout userEmail={user.email} isPro={false}>
        <ProUpsell
          emoji="📒"
          title={t("title")}
          subtitle={t("subtitle")}
          heading={t("heading")}
          description={t("description")}
          buttonLabel={t("button")}
        />
      </AppLayout>
    );
  }

  const { id: userId, email } = user;

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
    <AppLayout userEmail={email} isPro>
      <JournalView
        entries={entryViews}
        createEntryAction={createJournalEntry}
        deleteEntryAction={deleteJournalEntry}
      />
    </AppLayout>
  );
}
