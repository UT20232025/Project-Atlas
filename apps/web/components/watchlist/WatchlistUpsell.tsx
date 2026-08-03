import { getTranslations } from "next-intl/server";
import Link from "next/link";

import Button from "@/components/ui/button";
import Section from "@/components/ui/Section";

export default async function WatchlistUpsell() {
  const t = await getTranslations("WatchlistUpsell");

  return (
    <Section title={t("title")} subtitle={t("subtitle")}>
      <div className="atlas-subcard flex flex-col items-center gap-3 rounded-xl p-8 text-center">
        <span className="text-3xl">💎</span>

        <p className="font-medium text-zinc-300">
          {t("heading")}
        </p>

        <p className="text-sm text-zinc-600">
          {t("description")}
        </p>

        <Link href="/pricing">
          <Button size="sm" className="mt-2">
            {t("upgradeButton")}
          </Button>
        </Link>
      </div>
    </Section>
  );
}
