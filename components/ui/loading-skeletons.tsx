import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MetricCardSkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={`metric-card-skeleton-${index}`} className="surface-panel">
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
    <div className="surface-panel space-y-2 p-4">
      <Skeleton className="h-8 w-64" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={`table-skeleton-row-${index}`} className="h-12 w-full" />
      ))}
    </div>
  );
}
