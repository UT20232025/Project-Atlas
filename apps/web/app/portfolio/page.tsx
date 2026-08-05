import { getTranslations } from "next-intl/server";

import AppLayout from "@/components/layout/AppLayout";
import PortfolioView from "@/components/portfolio/PortfolioView";
import { MarketProvider } from "@/components/providers/MarketProvider";
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
  PortfolioPositionView,
  TradeDirection,
} from "@/lib/trading/pnl";

import { closePosition, createPosition, deletePosition } from "./actions";

export default async function PortfolioPage() {
  const user = await getCurrentUser();

  if (!hasActiveSubscription(user)) {
    const t = await getTranslations("PortfolioGate");

    return (
      <AppLayout userEmail={user.email} isPro={false}>
        <ProUpsell
          emoji="💼"
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

  const positions = await prisma.position.findMany({
    where: { userId },
    orderBy: { openedAt: "desc" },
  });

  const positionViews: PortfolioPositionView[] = positions.map(
    (position) => ({
      id: position.id,
      symbol: position.symbol as MarketSymbol,
      direction: position.direction as TradeDirection,
      entryPrice: position.entryPrice,
      quantity: position.quantity,
      note: position.note,
      openedAt: position.openedAt.toISOString(),
    })
  );

  return (
    <MarketProvider>
      <AppLayout userEmail={email} isPro>
        <PortfolioView
          positions={positionViews}
          createPositionAction={createPosition}
          closePositionAction={closePosition}
          deletePositionAction={deletePosition}
        />
      </AppLayout>
    </MarketProvider>
  );
}
