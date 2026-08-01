import AppLayout from "@/components/layout/AppLayout";
import TrackRecordView from "@/components/track-record/TrackRecordView";
import { getTrackRecord } from "@/lib/atlas/trackRecord";
import { requirePro } from "@/lib/subscription/requirePro";

export default async function TrackRecordPage() {
  const { email } = await requirePro();
  const trackRecord = await getTrackRecord();

  return (
    <AppLayout userEmail={email} isPro>
      <TrackRecordView trackRecord={trackRecord} />
    </AppLayout>
  );
}
