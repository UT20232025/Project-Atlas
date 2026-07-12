import {
  BarChart3,
  Bell,
  BookOpen,
  Home,
  Newspaper,
  Settings,
  Star,
} from "lucide-react";

export default function Sidebar() {
  const items = [
    { label: "Dashboard", icon: Home },
    { label: "Markets", icon: BarChart3 },
    { label: "Signals", icon: Bell },
    { label: "Journal", icon: BookOpen },
    { label: "News", icon: Newspaper },
    { label: "Settings", icon: Settings },
  ];

  return (
    <aside className="hidden min-h-screen w-72 border-r border-zinc-800 bg-zinc-950 p-6 lg:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600">
          <Star size={22} />
        </div>

        <div>
          <h2 className="text-xl font-bold">Genwelth AI</h2>
          <p className="text-sm text-zinc-500">Trading Intelligence</p>
        </div>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-sm text-zinc-500">Plan</p>
        <p className="mt-1 font-semibold">Free Beta</p>
      </div>
    </aside>
  );
}