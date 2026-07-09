export default function Header() {
  return (
    <header className="mb-10 flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          Genwelth AI
        </h1>

        <p className="text-zinc-400">
          Powered by Atlas
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>

        <span className="text-sm text-zinc-300">
          Atlas Online
        </span>
      </div>
    </header>
  );
}