import { EditorPageSkeleton, MetricCardSkeletonGrid, TableSkeleton } from "@/components/ui/loading-skeletons";

export default function AdminRoutesLoading() {
  return (
    <div className="space-y-7">
      <MetricCardSkeletonGrid count={6} />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <TableSkeleton rows={6} />
        <EditorPageSkeleton />
      </div>
    </div>
  );
}
