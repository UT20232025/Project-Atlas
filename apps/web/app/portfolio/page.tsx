import AppLayout from "@/components/layout/AppLayout";
import PortfolioView from "@/components/portfolio/PortfolioView";
import { MarketProvider } from "@/components/providers/MarketProvider";
import { prisma } from "@/lib/db/client";
import type {
  MarketSymbol,
} from "@/lib/services/liveMarketService";
import { requirePro } from "@/lib/subscription/requirePro";
import type {
  PortfolioPositionView,
  TradeDirection,
} from "@/lib/trading/pnl";

import { closePosition, createPosition, deletePosition } from "./actions";

export default async function PortfolioPage() {
  const { id: userId, email } = await requirePro();

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
