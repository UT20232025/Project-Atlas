import { Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import MarketTicker from "./MarketTicker";
import MobileNav from "./MobileNav";
import SearchButton from "./SearchButton";
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
  isPro?: boolean;
  isBeta?: boolean;
};

export default async function Topbar({
  marketTicker,
  userEmail,
  isPro,
  isBeta,
}: TopbarProps) {
  const t = await getTranslations("Topbar");

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
              {t("eyebrow")}
            </p>

            <h2 className="truncate text-xl font-semibold text-white">
              {t("heading")}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <SearchButton
            placeholder={t("searchPlaceholder")}
          />

          <button
            type="button"
            aria-label={t("notifications")}
            className="hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white sm:block"
          >
            <Bell size={19} />
          </button>

          <ThemeToggle />

          <UserMenu email={userEmail} isPro={isPro} isBeta={isBeta} />
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