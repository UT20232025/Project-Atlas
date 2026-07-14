import ScannerTable from "../ScannerTable";
import type { ScannerItem } from "../../lib/analysis/scanner";

type ScannerSectionProps = {
  items: ScannerItem[];
};

export default function ScannerSection({
  items,
}: ScannerSectionProps) {
  return (
    <section>
      <ScannerTable items={items} />
    </section>
  );
}