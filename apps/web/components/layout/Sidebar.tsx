"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { SOCIAL_LINKS } from "@/lib/config/social";

export const menu = [
  {
    key: "dashboard",
    href: "/",
    icon: "🏠",
  },
  {
    key: "askAtlas",
    href: "/ask",
    icon: "🧭",
  },
  {
    key: "scanner",
    href: "/#scanner",
    icon: "📊",
  },
  {
    key: "markets",
    href: "/#markets",
    icon: "📈",
  },
  {
    key: "stocks",
    href: "/stocks",
    icon: "🏦",
  },
  {
    key: "compare",
    href: "/compare",
    icon: "⚖️",
  },
  {
    key: "alerts",
    href: "/#alerts",
    icon: "🔔",
  },
  {
    key: "watchlist",
    href: "/#watchlist",
    icon: "⭐",
  },
  {
    key: "journal",
    href: "/journal",
    icon: "📒",
  },
  {
    key: "trackRecord",
    href: "/track-record",
    icon: "🏆",
  },
  {
    key: "portfolio",
    href: "/portfolio",
    icon: "💼",
  },
  {
    key: "upgradeToPro",
    href: "/pricing",
    icon: "💎",
  },
  {
    key: "settings",
    href: "/settings",
    icon: "⚙️",
  },
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-6">
        <Link href="/">
          <Image
            src="/logo-full.png"
            alt={t("logoAlt")}
            width={1095}
            height={821}
            priority
            className="h-auto w-full"
          />
        </Link>
      </div>

      <nav className="flex-1 space-y-2 p-5">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-4 rounded-xl px-4 py-3 transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <span className="text-xl">
                {item.icon}
              </span>

              <span className="font-medium">
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-zinc-800 p-5">
        <a
          href={SOCIAL_LINKS.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl bg-[#229ED9] px-4 py-3 font-medium text-white transition hover:bg-[#1c8dc2]"
        >
          <span className="text-xl">📣</span>
          <span>{t("joinTelegram")}</span>
        </a>

        <a
          href={SOCIAL_LINKS.telegramChat}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-zinc-800 px-4 py-3 font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
        >
          <span className="text-xl">💬</span>
          <span>{t("joinChat")}</span>
        </a>
      </div>
    </aside>
  );
}