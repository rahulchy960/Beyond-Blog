import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={`metric-card-skeleton-${index}`}
          className={`surface-panel ${index === 0 ? "md:col-span-2 xl:col-span-2" : "xl:col-span-1"}`}
        >
          <CardHeader className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="data-table-shell space-y-2 p-4">
      <Skeleton className="h-10 w-72" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={`table-skeleton-row-${index}`} className="h-11 w-full" />
      ))}
    </div>
  );
}

export function PageShellSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-10 w-2/3 max-w-2xl" />
        <Skeleton className="h-5 w-full max-w-3xl" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DiscoveryListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={`discovery-skeleton-${index}`} className="surface-panel space-y-3 p-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
      <Skeleton className="h-[24rem] w-full rounded-2xl" />
      <div className="space-y-3 rounded-2xl border border-border/70 p-6">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

export function EditorPageSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
      <div className="space-y-6">
        <div className="surface-panel space-y-4 p-5">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[22rem] w-full rounded-xl" />
        </div>
        <div className="surface-panel space-y-4 p-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="surface-panel space-y-3 p-5">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="surface-panel space-y-3 p-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function MediaGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={`media-skeleton-${index}`} className="surface-panel space-y-3 p-3">
          <Skeleton className="aspect-[16/10] w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ))}
    </div>
  );
}
