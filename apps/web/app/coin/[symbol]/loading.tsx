import AppLayout from "@/components/layout/AppLayout";
import Skeleton from "@/components/ui/Skeleton";

export default function CoinLoading() {
  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-32 border-none bg-zinc-900/60" />

        <Skeleton className="h-12 w-40 rounded-xl" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-48 rounded-3xl" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-40" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-96" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-64" />
      </div>
    </AppLayout>
  );
}
