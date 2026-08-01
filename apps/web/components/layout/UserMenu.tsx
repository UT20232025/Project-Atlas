"use client";

import { LogOut, User } from "lucide-react";
import { useState } from "react";

import { logout } from "@/lib/auth/actions";

type UserMenuProps = {
  email?: string;
  isPro?: boolean;
};

export default function UserMenu({ email, isPro }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!email) {
    return (
      <div className="h-[52px] w-[52px] animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 sm:w-40" />
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open user menu"
        onClick={() =>
          setIsOpen((currentValue) => !currentValue)
        }
        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 transition hover:border-zinc-700 hover:text-white"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
          <User size={18} />
        </span>

        <span className="hidden text-left sm:block">
          <span className="block max-w-32 truncate text-sm font-medium">
            {email}
          </span>

          <span className="block text-xs text-zinc-500">
            {isPro ? "Pro" : "Free Beta"}
          </span>
        </span>
      </button>

      {isOpen && (
        <div className="atlas-subcard absolute right-0 z-10 mt-2 w-48 rounded-xl p-2 shadow-xl backdrop-blur-xl">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-zinc-900 hover:text-white"
            >
              <LogOut size={16} />
              Logg ut
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
