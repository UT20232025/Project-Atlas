import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary:
      "border-blue-500 bg-blue-600 text-white hover:bg-blue-500",
    secondary:
      "border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800",
    success:
      "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20",
    danger:
      "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20",
    ghost:
      "border-transparent bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white",
  }[variant];

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-5 py-3 text-base",
  }[size];

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}