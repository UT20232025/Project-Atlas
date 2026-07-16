import type { ReactNode } from "react";
import SearchDialog from "../search/SearchDialog";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type MarketTickerData = {
  btc: number;
  btcChange: number;
  eth: number;
  ethChange: number;
  sol: number;
  solChange: number;
  fearGreed: number;
  btcDominance: number;
};

type AppLayoutProps = {
  children: ReactNode;
  marketTicker?: MarketTickerData;
};

export default function AppLayout({
  children,
  marketTicker,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <SearchDialog />

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1">
          <Topbar marketTicker={marketTicker} />

          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}