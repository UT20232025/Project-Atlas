import SwingSignals from "@/components/dashboard/SwingSignals";
import { getAtlasScanner } from "@/lib/analysis/scanner";

// Async wrapper so the daily (1d) swing scan runs inside its own Suspense
// boundary and streams in — it never blocks the main dashboard shell.
export default async function SwingSignalsSection() {
  const items = await getAtlasScanner("1d");

  return <SwingSignals items={items} />;
}
