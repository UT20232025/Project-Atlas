import type { ReactNode } from "react";

type BadgeVariant =
  | "blue"
  | "green"
  | "red"
  | "yellow"
  | "neutral";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: BadgeProps) {
  const variantClasses = {
    blue:
      "border-blue-500/30 bg-blue-500/10 text-blue-300",
    green:
      "border-green-500/30 bg-green-500/10 text-green-300",
    red:
      "border-red-500/30 bg-red-500/10 text-red-300",
    yellow:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    neutral:
      "border-zinc-700 bg-zinc-900 text-zinc-300",
  }[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
}