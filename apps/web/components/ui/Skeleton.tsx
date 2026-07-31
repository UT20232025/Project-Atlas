type SkeletonProps = {
  className?: string;
};

export default function Skeleton({
  className = "",
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 ${className}`}
    />
  );
}
