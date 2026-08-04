import AppLayout from "@/components/layout/AppLayout";
import TrackRecordView from "@/components/track-record/TrackRecordView";
import { getCachedTrackRecord } from "@/lib/atlas/trackRecordCache";
import { requirePro } from "@/lib/subscription/requirePro";

export default async function TrackRecordPage() {
  const { email } = await requirePro();
  const trackRecord = await getCachedTrackRecord();

  return (
    <AppLayout userEmail={email} isPro>
      <TrackRecordView trackRecord={trackRecord} />
    </AppLayout>
  );
}
