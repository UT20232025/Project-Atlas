import AppLayout from "@/components/layout/AppLayout";
import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <AppLayout>
      <Skeleton className="h-20" />

      <div className="mt-8">
        <Skeleton className="h-96" />
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-40" />
      </div>

      <div className="mt-8">
        <Skeleton className="h-64" />
      </div>

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_360px]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </AppLayout>
  );
}
