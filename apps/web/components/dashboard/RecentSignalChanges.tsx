import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import { formatMarketSymbol } from "@/lib/services/liveMarketService";
import type { SignalSnapshotView } from "@/lib/atlas/signalHistory";

type RecentSignalChangesProps = {
  items: SignalSnapshotView[];
};

function getSignalVariant(
  signal: SignalSnapshotView["signal"]
): "green" | "red" | "yellow" {
  if (signal === "LONG") return "green";
  if (signal === "SHORT") return "red";
  return "yellow";
}

export default async function RecentSignalChanges({
  items,
}: RecentSignalChangesProps) {
  const t = await getTranslations("RecentSignalChanges");
  const locale = await getLocale();

  return (
    <section className="atlas-card rounded-2xl p-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">
          {t("title")}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          {t("subtitle")}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-zinc-400">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/coin/${item.symbol}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 transition hover:border-zinc-600"
            >
              <div className="flex items-center gap-3">
                <p className="font-bold">
                  {formatMarketSymbol(item.symbol)}
                </p>

                <Badge variant={getSignalVariant(item.signal)}>
                  {item.signal}
                </Badge>

                <span className="text-sm text-zinc-500">
                  {t("confidenceLabel", { confidence: item.confidence })}
                </span>
              </div>

              <span className="text-xs text-zinc-600">
                {new Date(item.createdAt).toLocaleString(locale)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
