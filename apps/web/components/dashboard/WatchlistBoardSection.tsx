import { Suspense } from "react";

import WatchlistSignalBoard from "@/components/dashboard/WatchlistSignalBoard";
import { getWatchlistSignalBoard } from "@/lib/watchlists/signalBoard";

// The signal board runs Atlas analysis for up to a dozen watched coins, which
// is heavy on a cold cache. Streaming it in its own Suspense boundary keeps it
// off the dashboard's blocking render path — the page never waits (or times
// out) on it; the board just fills in when ready.
async function Board({ userId }: { userId: string }) {
  const items = await getWatchlistSignalBoard(userId);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <WatchlistSignalBoard items={items} />
    </div>
  );
}

export default function WatchlistBoardSection({
  userId,
}: {
  userId: string;
}) {
  return (
    <Suspense fallback={null}>
      <Board userId={userId} />
    </Suspense>
  );
}
