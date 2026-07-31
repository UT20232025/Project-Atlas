import { Bell, Search, User } from "lucide-react";
import MarketTicker from "./MarketTicker";
import MobileNav from "./MobileNav";

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
};

export default function Topbar({ marketTicker }: TopbarProps) {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="flex min-h-20 items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <MobileNav />

          <div>
            <p className="text-sm text-zinc-500">
              Trading Command Center
            </p>

            <h2 className="text-xl font-semibold text-white">
              Dashboard
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
          >
            <Bell size={19} />
          </button>

          <button
            type="button"
            aria-label="Open user menu"
            className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
              <User size={18} />
            </span>

            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium">
                Christer
              </span>

              <span className="block text-xs text-zinc-500">
                Free Beta
              </span>
            </span>
          </button>
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