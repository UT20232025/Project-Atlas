export default function Sidebar() {
  const items = [
    "🏠 Dashboard",
    "📈 Markets",
    "⭐ Signals",
    "📖 Journal",
    "📰 News",
    "⚙️ Settings",
  ];

  return (
    <aside className="w-64 min-h-screen bg-zinc-950 border-r border-zinc-800 p-6">

      <h2 className="text-2xl font-bold mb-8">
        Genwelth AI
      </h2>

      <nav className="space-y-3">

        {items.map((item) => (
          <button
            key={item}
            className="w-full rounded-lg px-4 py-3 text-left transition hover:bg-zinc-800"
          >
            {item}
          </button>
        ))}

      </nav>

    </aside>
  );
}