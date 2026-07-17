import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightContent?: ReactNode;
  className?: string;
};

export default function Section({
  title,
  subtitle,
  children,
  rightContent,
  className = "",
}: SectionProps) {
  return (
    <section className={`atlas-card rounded-2xl p-6 ${className}`}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-sm text-zinc-500">
              {subtitle}
            </p>
          )}
        </div>

        {rightContent}
      </div>

      {children}
    </section>
  );
}