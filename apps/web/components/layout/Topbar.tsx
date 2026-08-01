import { Bell, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import MarketTicker from "./MarketTicker";
import MobileNav from "./MobileNav";
import UserMenu from "./UserMenu";

type TopbarProps = {
  marketTicker?: {
    btc: number;
    btcChange: number;
    eth: number;
    ethChange: number;
    sol: number;
    solChange: number;
    fearGreed: number;
    btcDominance: number;
  };
  userEmail?: string;
};

export default function Topbar({ marketTicker, userEmail }: TopbarProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="flex min-h-20 items-center justify-between gap-2 px-3 py-4 sm:gap-4 sm:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <MobileNav />

          <Link
            href="/"
            className="flex shrink-0 items-center gap-3"
          >
            <Image
              src="/logo-mark.png"
              alt="Genwelth AI"
              width={740}
              height={638}
              priority
              className="h-9 w-auto shrink-0"
            />

            <span className="hidden h-8 w-px bg-zinc-800 sm:block" />
          </Link>

          <div className="min-w-0">
            <p className="truncate text-sm text-zinc-500">
              Trading Command Center
            </p>

            <h2 className="truncate text-xl font-semibold text-white">
              Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white md:flex"
          >
            <Search size={18} />

            <span>Search markets...</span>

            <span className="ml-2 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
              Ctrl K
            </span>
          </button>

          <button
            type="button"
            aria-label="Notifications"
            className="hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white sm:block"
          >
            <Bell size={19} />
          </button>

          <ThemeToggle />

          <UserMenu email={userEmail} />
        </div>
      </div>

      {marketTicker && (
        <div className="border-t border-zinc-800 px-6 py-3">
          <MarketTicker
            btc={marketTicker.btc}
            btcChange={marketTicker.btcChange}
            eth={marketTicker.eth}
            ethChange={marketTicker.ethChange}
            sol={marketTicker.sol}
            solChange={marketTicker.solChange}
            fearGreed={marketTicker.fearGreed}
            btcDominance={marketTicker.btcDominance}
          />
        </div>
      )}
    </header>
  );
}