"use client";

import { Search } from "lucide-react";

type SearchButtonProps = {
  placeholder: string;
};

export default function SearchButton({
  placeholder,
}: SearchButtonProps) {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new Event("genwelth:open-search")
        )
      }
      className="hidden items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white md:flex"
    >
      <Search size={18} />

      <span>{placeholder}</span>

      <span className="ml-2 rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-500">
        Ctrl K
      </span>
    </button>
  );
}
