type ProgressProps = {
  value: number;
  max?: number;
  color?: "blue" | "green" | "red" | "yellow";
};

export default function Progress({
  value,
  max = 100,
  color = "blue",
}: ProgressProps) {
  const percentage = Math.max(
    0,
    Math.min(100, (value / max) * 100)
  );

  const colorClass = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    yellow: "bg-yellow-500",
  }[color];

  return (
    <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{
          width: `${percentage}%`,
        }}
      />
    </div>
  );
}