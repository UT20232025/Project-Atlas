import { Bell, Settings, User } from "lucide-react";

export default function Header() {
  return (
    <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-6">
      <div>
        <h1 className="text-4xl font-bold">Genwelth AI</h1>

        <p className="mt-1 text-zinc-400">
          Powered by Atlas
        </p>
      </div>

      <div className="flex items-center gap-6">

        <div className="flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />

          <span className="text-sm font-medium">
            Atlas Online
          </span>
        </div>

        <button className="rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800">
          <Bell size={20} />
        </button>

        <button className="rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800">
          <Settings size={20} />
        </button>

        <button className="rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800">
          <User size={20} />
        </button>

      </div>
    </header>
  );
}