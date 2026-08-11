import type { ReactNode } from "react";
import { isBetaAccessEmail } from "@/lib/subscription/requirePro";
import FeedbackButton from "../feedback/FeedbackButton";
import SearchDialog from "../search/SearchDialog";
import ShortcutsHelp from "../search/ShortcutsHelp";
import AmbientBackground from "./AmbientBackground";
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
  userEmail?: string;
  isPro?: boolean;
};

export default function AppLayout({
  children,
  marketTicker,
  userEmail,
  isPro,
}: AppLayoutProps) {
  // Beta testers get comped Pro via env — badge them as BETA, not PRO.
  const isBeta = Boolean(isPro) && isBetaAccessEmail(userEmail);

  return (
    <div className="min-h-screen text-white">
      <AmbientBackground />
      <SearchDialog />
      <ShortcutsHelp />
      <FeedbackButton />

      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="min-w-0 flex-1">
          <Topbar
            marketTicker={marketTicker}
            userEmail={userEmail}
            isPro={isPro}
            isBeta={isBeta}
          />

          <main className="p-6 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}