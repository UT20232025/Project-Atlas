import { Bell, Search, User } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex h-20 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div>
        <p className="text-sm text-zinc-500">Trading Command Center</p>
        <h2 className="text-xl font-semibold text-white">Dashboard</h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="hidden items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-white md:flex">
          <Search size={18} />
          Search markets
        </button>

        <button className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition hover:border-zinc-700 hover:text-white">
          <Bell size={19} />
        </button>

        <button className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-300 transition hover:border-zinc-700 hover:text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600">
            <User size={18} />
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium">Christer</p>
            <p className="text-xs text-zinc-500">Free Beta</p>
          </div>
        </button>
      </div>
    </header>
  );
}