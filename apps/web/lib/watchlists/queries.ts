import { prisma } from "@/lib/db/client";
import type { MarketSymbol } from "@/lib/services/liveMarketService";

export type WatchlistView = {
  id: string;
  name: string;
  createdAt: string;
  symbols: MarketSymbol[];
};

export async function getWatchlists(
  userId: string
): Promise<WatchlistView[]> {
  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      symbols: {
        orderBy: { addedAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return watchlists.map((watchlist) => ({
    id: watchlist.id,
    name: watchlist.name,
    createdAt: watchlist.createdAt.toISOString(),
    symbols: watchlist.symbols.map(
      (entry) => entry.symbol as MarketSymbol
    ),
  }));
}
