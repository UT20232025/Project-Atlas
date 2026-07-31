import Badge from "@/components/ui/Badge";
import type { SignalSnapshotView } from "@/lib/atlas/signalHistory";

type SignalHistoryCardProps = {
  history: SignalSnapshotView[];
};

function getSignalVariant(
  signal: SignalSnapshotView["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default function SignalHistoryCard({
  history,
}: SignalHistoryCardProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Signal History
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Every time the Atlas signal for this coin has
          changed
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="font-medium text-zinc-300">
            No signal changes recorded yet
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Check back after the signal moves.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((snapshot) => (
            <div
              key={snapshot.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4"
            >
              <div className="flex items-center gap-3">
                <Badge
                  variant={getSignalVariant(
                    snapshot.signal
                  )}
                >
                  {snapshot.signal}
                </Badge>

                <span className="text-sm text-zinc-400">
                  Confidence {snapshot.confidence}% ·
                  Score {snapshot.score}
                </span>
              </div>

              <span className="text-xs text-zinc-600">
                {new Date(
                  snapshot.createdAt
                ).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
