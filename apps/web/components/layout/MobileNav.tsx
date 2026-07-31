"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { menu } from "./Sidebar";

export default function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
        className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white lg:hidden"
      >
        <Menu size={19} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            role="button"
            aria-label="Close menu"
            tabIndex={0}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/70"
          />

          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950">
            <div className="flex items-center justify-between border-b border-zinc-800 p-6">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Genwelth AI
                </h1>

                <p className="mt-1 text-xs text-zinc-500">
                  Powered by Atlas
                </p>
              </div>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-zinc-400 transition hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto p-5">
              {menu.map((item) => {
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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
        </div>
      )}
    </>
  );
}
