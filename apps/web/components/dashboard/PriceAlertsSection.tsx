import PriceAlertsPanel from "@/components/dashboard/PriceAlertsPanel";
import { checkTriggeredAlerts } from "@/lib/alerts/priceAlerts";

// Async wrapper so the alert check (and any live-price fetches it needs) runs
// in its own Suspense boundary and never blocks the dashboard shell.
export default async function PriceAlertsSection({
  userId,
}: {
  userId: string;
}) {
  const { triggered, active } = await checkTriggeredAlerts(userId);

  return <PriceAlertsPanel triggered={triggered} active={active} />;
}
