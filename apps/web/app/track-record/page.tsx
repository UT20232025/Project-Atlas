import AppLayout from "@/components/layout/AppLayout";
import TrackRecordView from "@/components/track-record/TrackRecordView";
import { getTrackRecord } from "@/lib/atlas/trackRecord";

export default async function TrackRecordPage() {
  const trackRecord = await getTrackRecord();

  return (
    <AppLayout>
      <TrackRecordView trackRecord={trackRecord} />
    </AppLayout>
  );
}
