import Link from "next/link";

import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";

export default function WatchlistUpsell() {
  return (
    <Section title="Watchlist" subtitle="Pro subscribers only">
      <div className="atlas-subcard flex flex-col items-center gap-3 rounded-xl p-8 text-center">
        <span className="text-3xl">💎</span>

        <p className="font-medium text-zinc-300">
          Custom watchlists require Pro
        </p>

        <p className="text-sm text-zinc-600">
          Create named lists and follow your favorite coins.
        </p>

        <Link href="/pricing">
          <Button size="sm" className="mt-2">
            Upgrade to Pro
          </Button>
        </Link>
      </div>
    </Section>
  );
}
