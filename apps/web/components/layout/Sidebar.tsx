"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  {
    title: "Dashboard",
    href: "/",
    icon: "🏠",
  },
  {
    title: "Scanner",
    href: "/",
    icon: "📊",
  },
  {
    title: "Markets",
    href: "/",
    icon: "📈",
  },
  {
    title: "Alerts",
    href: "/",
    icon: "🔔",
  },
  {
    title: "Watchlist",
    href: "/",
    icon: "⭐",
  },
  {
    title: "Journal",
    href: "/",
    icon: "📒",
  },
  {
    title: "Portfolio",
    href: "/",
    icon: "💼",
  },
  {
    title: "News",
    href: "/",
    icon: "📰",
  },
  {
    title: "Settings",
    href: "/",
    icon: "⚙️",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-8">
        <h1 className="text-3xl font-bold text-white">
          Genwelth AI
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Powered by Atlas
        </p>
      </div>

      <nav className="flex-1 space-y-2 p-5">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.title}
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
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}