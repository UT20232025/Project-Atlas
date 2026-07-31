import AppLayout from "@/components/layout/AppLayout";
import TrackRecordView from "@/components/track-record/TrackRecordView";
import { requireSession } from "@/lib/auth/session";
import { getTrackRecord } from "@/lib/atlas/trackRecord";

export default async function TrackRecordPage() {
  const { email } = await requireSession();
  const trackRecord = await getTrackRecord();

  return (
    <AppLayout userEmail={email}>
      <TrackRecordView trackRecord={trackRecord} />
    </AppLayout>
  );
}
