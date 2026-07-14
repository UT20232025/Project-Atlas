type StatCardProps = {
  title: string;
  value: string;
  subtitle: string;
  color?: "green" | "red" | "yellow" | "blue";
};

export default function StatCard({
  title,
  value,
  subtitle,
  color = "blue",
}: StatCardProps) {
  const valueColor = {
    green: "text-green-400",
    red: "text-red-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
  }[color];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-800">
      <p className="text-sm text-zinc-500">
        {title}
      </p>

      <p className={`mt-4 text-4xl font-bold ${valueColor}`}>
        {value}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        {subtitle}
      </p>
    </div>
  );
}