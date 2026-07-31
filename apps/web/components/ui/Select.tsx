import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="relative">
      <select
        className={`w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-3 pr-9 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 ${className}`}
        {...props}
      />

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
      />
    </div>
  );
}
