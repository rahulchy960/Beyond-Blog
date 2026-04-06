"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { BookOpenTextIcon, CheckCircle2Icon, ClipboardEditIcon, MessageSquareIcon, SparklesIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard } from "@/components/ui/metric-card";
import { MetricCardSkeletonGrid } from "@/components/ui/loading-skeletons";

const METRIC_ICONS = [
  BookOpenTextIcon,
  CheckCircle2Icon,
  ClipboardEditIcon,
  MessageSquareIcon,
  SparklesIcon,
] as const;

export function AdminStatsGrid() {
  const trpc = useTRPC();
  const dashboardStatsQuery = useQuery(trpc.admin.dashboardStats.queryOptions());

  if (dashboardStatsQuery.isPending) {
    return <MetricCardSkeletonGrid />;
  }

  if (dashboardStatsQuery.isError) {
    return (
      <EmptyState
        title="Unable to load dashboard metrics"
        description={dashboardStatsQuery.error.message || "An unexpected error occurred while loading metrics."}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {dashboardStatsQuery.data.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.03 }}
        >
          <MetricCard
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={METRIC_ICONS[index] ?? BookOpenTextIcon}
          />
        </motion.div>
      ))}
    </div>
  );
}
