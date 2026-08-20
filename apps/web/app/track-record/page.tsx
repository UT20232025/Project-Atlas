import Link from "next/link";
import { getTranslations } from "next-intl/server";

import AppLayout from "@/components/layout/AppLayout";
import TrackRecordView from "@/components/track-record/TrackRecordView";
import BreakoutTrackRecordCard from "@/components/track-record/BreakoutTrackRecordCard";
import { getBreakoutTrackRecord } from "@/lib/atlas/breakoutTrackRecord";
import Button from "@/components/ui/button";
import Disclaimer from "@/components/ui/Disclaimer";
import Section from "@/components/ui/Section";
import { getCachedTrackRecord } from "@/lib/atlas/trackRecordCache";
import {
  getCurrentUser,
  hasActiveSubscription,
} from "@/lib/subscription/requirePro";

export default async function TrackRecordPage() {
  const user = await getCurrentUser();
  const isPro = hasActiveSubscription(user);
  const trackRecord = await getCachedTrackRecord();

  // Pro: the full, detailed track record.
  if (isPro) {
    const breakoutRecord = await getBreakoutTrackRecord();
    return (
      <AppLayout userEmail={user.email} isPro>
        <TrackRecordView trackRecord={trackRecord} />
        <div className="mt-8">
          <BreakoutTrackRecordCard record={breakoutRecord} />
        </div>
      </AppLayout>
    );
  }

  // Free: show the proof (headline stats) and upsell the full history,
  // rather than bouncing the strongest conversion asset to /pricing.
  const t = await getTranslations("Landing");
  const tg = await getTranslations("TrackRecordGate");
  const hasClosed = trackRecord.totalClosed > 0;

  return (
    <AppLayout userEmail={user.email} isPro={false}>
      <Section
        title={t("trackRecordTitle")}
        subtitle={t("trackRecordSubtitle")}
      >
        {hasClosed && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="atlas-subcard rounded-xl p-6 text-center">
              <p className="text-xs text-zinc-500">{t("winRate")}</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {trackRecord.winRate.toFixed(1)}%
              </p>
            </div>

            <div className="atlas-subcard rounded-xl p-6 text-center">
              <p className="text-xs text-zinc-500">
                {t("verifiedSignals")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {trackRecord.totalClosed}
              </p>
            </div>

            <div className="atlas-subcard rounded-xl p-6 text-center">
              <p className="text-xs text-zinc-500">{t("avgPnl")}</p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  trackRecord.avgPnlPercent >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {trackRecord.avgPnlPercent >= 0 ? "+" : ""}
                {trackRecord.avgPnlPercent.toFixed(2)}%
              </p>
            </div>

            <div className="atlas-subcard rounded-xl p-6 text-center">
              <p className="text-xs text-zinc-500">
                {t("underEvaluation")}
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {trackRecord.openPositions.length}
              </p>
            </div>
          </div>
        )}

        <div className="atlas-subcard mt-6 flex flex-col items-center gap-3 rounded-xl p-8 text-center">
          <span className="text-3xl">💎</span>

          <p className="font-medium text-zinc-200">
            {tg("lockedTitle")}
          </p>

          <p className="mx-auto max-w-md text-sm text-zinc-500">
            {tg("lockedBody")}
          </p>

          <Link href="/pricing">
            <Button className="mt-2">{tg("unlockButton")}</Button>
          </Link>
        </div>

        <Disclaimer className="mx-auto mt-6 max-w-2xl text-center" />
      </Section>
    </AppLayout>
  );
}
