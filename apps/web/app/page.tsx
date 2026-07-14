import ScannerTable from "../components/ScannerTable";
import { getAtlasScanner } from "../lib/analysis/scanner";

export default async function HomePage() {
  const scanner = await getAtlasScanner();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-7xl p-8">

        <div className="mb-10">
          <h1 className="text-5xl font-bold">
            Genwelth AI
          </h1>

          <p className="mt-3 text-zinc-400">
            AI-powered crypto trading terminal
          </p>
        </div>

        <ScannerTable items={scanner} />

      </div>
    </main>
  );
}
