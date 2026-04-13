"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BarChart3Icon, Clock3Icon, LineChartIcon, TrendingUpIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { RetryPanel } from "@/components/ui/retry-panel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { queryStaleTimes } from "@/lib/trpc/query-presets";

const timeRangeOptions = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
  { label: "All time", value: "all" },
] as const;

const metricOptions = [
  { label: "Engagement", value: "ENGAGEMENT" },
  { label: "Likes", value: "LIKES" },
  { label: "Comments", value: "COMMENTS" },
  { label: "Quiz Attempts", value: "QUIZ_ATTEMPTS" },
] as const;

type TimeRangeValue = (typeof timeRangeOptions)[number]["value"];
type MetricValue = (typeof metricOptions)[number]["value"];

function TrendStack({
  title,
  description,
  rows,
  field,
}: {
  title: string;
  description: string;
  rows: Array<{ date: string; total: number }>;
  field: keyof (typeof rows)[number];
}) {
  const values = rows.map((row) => Number(row[field] ?? 0));
  const max = values.length > 0 ? Math.max(...values) : 0;

  return (
    <Card className="surface-panel">
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.slice(-12).map((row) => {
          const value = Number(row[field] ?? 0);
          const width = max > 0 ? (value / max) * 100 : 0;
          return (
            <div key={row.date} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3">
              <p className="text-xs text-muted-foreground">{row.date}</p>
              <div className="h-2.5 rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-primary/80 transition-[width] duration-300"
                  style={{ width: `${width}%` }}
                />
              </div>
              <p className="text-xs font-medium tabular-nums">{value}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AdminAnalyticsScreen() {
  const trpc = useTRPC();
  const [timeRange, setTimeRange] = useState<TimeRangeValue>("30d");
  const [metric, setMetric] = useState<MetricValue>("ENGAGEMENT");

  const detailQuery = useQuery(
    trpc.analytics.getAnalyticsDetail.queryOptions({
      timeRange,
    }, {
      staleTime: queryStaleTimes.analytics,
    }),
  );

  const topQuery = useQuery(
    trpc.analytics.getTopPerforming.queryOptions({
      timeRange,
      metric,
      limit: 8,
    }, {
      staleTime: queryStaleTimes.analytics,
    }),
  );

  const headline = useMemo(() => {
    if (!detailQuery.data) {
      return null;
    }

    return [
      {
        label: "Published",
        value: detailQuery.data.summary.metrics.publishedContent,
        description: `${detailQuery.data.summary.momentum.published30d} in last 30 days`,
      },
      {
        label: "Public Interactions",
        value:
          detailQuery.data.summary.momentum.comments7d +
          detailQuery.data.summary.momentum.likes7d +
          detailQuery.data.summary.momentum.attempts7d,
        description: "7-day combined signal",
      },
      {
        label: "Audit Events",
        value: detailQuery.data.summary.metrics.totalAuditLogs,
        description: "Admin actions captured",
      },
      {
        label: "Attention Queue",
        value:
          detailQuery.data.summary.attention.pendingComments +
          detailQuery.data.summary.attention.staleDraftContent +
          detailQuery.data.summary.attention.staleDraftCourses,
        description: "Pending moderation + stale drafts",
      },
    ];
  }, [detailQuery.data]);

  return (
    <div className="space-y-7">
      <PageHeader
        title="Analytics"
        description="Operational intelligence for publishing throughput, engagement quality, and editorial momentum."
        actions={
          <>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Home
            </Link>
            <Link href="/admin" className={buttonVariants({ size: "sm" })}>
              Dashboard
            </Link>
          </>
        }
      />

      <div className="toolbar-row gap-3">
        <div className="min-w-44">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRangeValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-44">
          <Select value={metric} onValueChange={(value) => setMetric(value as MetricValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Ranking metric" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {detailQuery.isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`analytics-headline-skeleton-${index}`} className="surface-panel">
              <CardContent className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-44" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : detailQuery.isError ? (
        <RetryPanel
          title="Unable to load analytics"
          error={detailQuery.error}
          onRetry={() => detailQuery.refetch()}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {headline?.map((item) => (
              <Card key={item.label} className="surface-panel">
                <CardContent className="space-y-2 p-5">
                  <p className="text-[0.7rem] tracking-[0.14em] text-muted-foreground uppercase">{item.label}</p>
                  <p className="text-3xl font-semibold tracking-tight">{item.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-5">
              <TrendStack
                title="Publishing Velocity"
                description="Daily publishing volume across content, courses, and quizzes."
                rows={detailQuery.data.publishTrend}
                field="total"
              />
              <TrendStack
                title="Interaction Velocity"
                description="Daily comments, likes, and quiz submissions from public visitors."
                rows={detailQuery.data.interactionTrend}
                field="total"
              />
            </div>

            <div className="grid gap-5">
              <Card className="surface-panel">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <TrendingUpIcon className="size-4" />
                    Ranked Performance
                  </CardTitle>
                  <CardDescription>
                    Top records by {metricOptions.find((item) => item.value === metric)?.label?.toLowerCase() ?? "selected metric"}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topQuery.isPending ? (
                    <>
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                      <Skeleton className="h-11 w-full" />
                    </>
                  ) : topQuery.isError ? (
                    <RetryPanel
                      title="Unable to rank top items"
                      error={topQuery.error}
                      onRetry={() => topQuery.refetch()}
                    />
                  ) : topQuery.data.items.length === 0 ? (
                    <EmptyState title="No ranking data yet" description="Public engagement data will appear as activity grows." />
                  ) : (
                    topQuery.data.items.map((item, index) => (
                      <div key={item.id} className="surface-inset flex items-center justify-between gap-3 p-3">
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs text-muted-foreground">#{index + 1}</p>
                          <Link href={item.href} target="_blank" className="line-clamp-1 text-sm font-medium hover:underline">
                            {item.title}
                          </Link>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{item.primaryCount.toLocaleString()}</p>
                          {item.secondaryCount > 0 ? (
                            <p className="text-xs text-muted-foreground">{item.secondaryCount.toLocaleString()} secondary</p>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="surface-panel">
                <CardHeader className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <LineChartIcon className="size-4" />
                    Course Engagement Signals
                  </CardTitle>
                  <CardDescription>Sections, lessons, and course-level interactions in one view.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {detailQuery.data.courseSignals.length === 0 ? (
                    <EmptyState title="No course signals yet" description="Course engagement appears after public interactions." />
                  ) : (
                    detailQuery.data.courseSignals.map((course) => (
                      <div key={course.id} className="surface-inset space-y-2 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <Link href={course.href} target="_blank" className="text-sm font-medium hover:underline">
                            {course.title}
                          </Link>
                          <Badge variant="secondary">{course.status.toLowerCase()}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{course.sectionsCount} sections</span>
                          <span>{course.lessonsCount} lessons</span>
                          <span>{course.commentsCount} comments</span>
                          <span>{course.likesCount} likes</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="surface-panel">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3Icon className="size-4" />
                Type Distribution
              </CardTitle>
              <CardDescription>Status composition by publication type.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detailQuery.data.summary.contentByType.map((row) => (
                <div key={row.type} className="surface-inset grid grid-cols-[1.1fr_repeat(4,minmax(0,1fr))] items-center gap-2 p-3 text-sm">
                  <p className="font-medium">{row.type.toLowerCase()}</p>
                  <div className="space-y-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="tabular-nums">{row.total}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Published</p>
                    <p className="tabular-nums">{row.published}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Draft</p>
                    <p className="tabular-nums">{row.draft}</p>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <p className="text-xs text-muted-foreground">Archived</p>
                    <p className="tabular-nums">{row.archived}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="surface-panel">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock3Icon className="size-4" />
                Recent Admin Actions
              </CardTitle>
              <CardDescription>Latest changes made from the admin console.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {detailQuery.data.summary.recentAdminActions.length === 0 ? (
                <EmptyState title="No admin actions recorded" description="Actions will populate once mutations are performed." />
              ) : (
                detailQuery.data.summary.recentAdminActions.map((item) => (
                  <div key={item.id} className="surface-inset flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 space-y-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.action}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {item.entityType} • {item.entityId}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              )}
              <Link
                href="/admin/audit-logs"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-2")}
              >
                Open Full Audit Logs
              </Link>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

