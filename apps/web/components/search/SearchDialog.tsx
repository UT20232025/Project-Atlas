"use client";

import { useEffect, useState } from "react";

export default function SearchDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-24 backdrop-blur-sm">
      <div className="atlas-card w-full max-w-xl rounded-2xl p-6">
        <input
          autoFocus
          placeholder="Search coins..."
          className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none"
        />

        <div className="mt-4 text-sm text-zinc-500">
          Ctrl+K åpner søket • Esc lukker
        </div>
      </div>
    </div>
  );
}
