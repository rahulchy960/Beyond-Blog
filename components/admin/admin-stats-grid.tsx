"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  ArchiveIcon,
  BookOpenTextIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  ThumbsUpIcon,
  TimerResetIcon,
  WorkflowIcon,
} from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { MetricCard } from "@/components/ui/metric-card";
import { MetricCardSkeletonGrid } from "@/components/ui/loading-skeletons";
import { RetryPanel } from "@/components/ui/retry-panel";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

const METRIC_ICONS = [
  BookOpenTextIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  ThumbsUpIcon,
  TimerResetIcon,
  GraduationCapIcon,
  ArchiveIcon,
  ShieldCheckIcon,
  WorkflowIcon,
] as const;

export function AdminStatsGrid() {
  const trpc = useTRPC();
  const dashboardStatsQuery = useQuery(
    trpc.analytics.getDashboardSummary.queryOptions(undefined, {
      staleTime: queryStaleTimes.analytics,
    }),
  );

  if (dashboardStatsQuery.isPending) {
    return <MetricCardSkeletonGrid />;
  }

  if (dashboardStatsQuery.isError) {
    return (
      <RetryPanel
        title="Unable to load dashboard metrics"
        error={dashboardStatsQuery.error}
        onRetry={() => dashboardStatsQuery.refetch()}
      />
    );
  }

  const data = dashboardStatsQuery.data;
  const stats = [
    {
      title: "Total Content",
      value: data.metrics.totalContent.toLocaleString(),
      description: "All journals, articles, and projects",
    },
    {
      title: "Published",
      value: data.metrics.publishedContent.toLocaleString(),
      description: `${data.momentum.published30d.toLocaleString()} published in last 30 days`,
    },
    {
      title: "Comments",
      value: data.metrics.visibleComments.toLocaleString(),
      description: `${data.metrics.pendingComments.toLocaleString()} pending moderation`,
    },
    {
      title: "Likes",
      value: data.metrics.totalLikes.toLocaleString(),
      description: `${data.momentum.likes7d.toLocaleString()} new in last 7 days`,
    },
    {
      title: "Quiz Attempts",
      value: data.metrics.totalQuizAttempts.toLocaleString(),
      description: `${data.momentum.attempts7d.toLocaleString()} submissions this week`,
    },
    {
      title: "Courses",
      value: data.metrics.totalCourses.toLocaleString(),
      description: "Structured learning catalog",
    },
    {
      title: "Draft Backlog",
      value: (data.metrics.draftContent + data.attention.draftCourses + data.attention.draftQuizzes).toLocaleString(),
      description: `${data.attention.staleDraftContent + data.attention.staleDraftCourses} stale drafts over 30 days`,
    },
    {
      title: "Audit Events",
      value: data.metrics.totalAuditLogs.toLocaleString(),
      description: "Tracked administrative actions",
    },
  ];

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut", delay: index * 0.03 }}
          className={index === 0 ? "md:col-span-2 xl:col-span-2" : "xl:col-span-1"}
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
