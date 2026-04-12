"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ActivityIcon, BarChart3Icon, Clock3Icon, MessageSquareDashedIcon, ThumbsUpIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { interactionTargetLabels } from "@/lib/interaction/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminInteractionInsights() {
  const trpc = useTRPC();
  const summaryQuery = useQuery(trpc.analytics.getDashboardSummary.queryOptions());

  if (summaryQuery.isPending) {
    return (
      <Card className="surface-panel h-full">
        <CardHeader>
          <CardTitle>Engagement Intelligence</CardTitle>
          <CardDescription>Live guest interaction signals across the public platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (summaryQuery.isError) {
    return (
      <Card className="surface-panel h-full">
        <CardHeader>
          <CardTitle>Engagement Intelligence</CardTitle>
          <CardDescription>Live guest interaction signals across the public platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState title="Unable to load interaction activity" description={summaryQuery.error.message} />
        </CardContent>
      </Card>
    );
  }

  const data = summaryQuery.data;

  return (
    <Card className="surface-panel h-full">
      <CardHeader>
        <CardTitle>Engagement Intelligence</CardTitle>
        <CardDescription>Recent guest interaction flow, moderation load, and ranking signals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-5">
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Visible</p>
            <p className="text-xl font-semibold">{data.metrics.visibleComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-xl font-semibold">{data.metrics.pendingComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Hidden</p>
            <p className="text-xl font-semibold">{data.metrics.hiddenComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Deleted</p>
            <p className="text-xl font-semibold">{data.metrics.deletedComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Likes</p>
            <p className="text-xl font-semibold">{data.metrics.totalLikes}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Latest interaction feed</p>
          </div>
          {data.recentPublicActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interaction activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentPublicActivity.map((event) => (
                <div key={event.id} className="surface-inset flex items-start justify-between gap-3 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.actorLabel}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{event.summary}</p>
                    <Link href={event.href} target="_blank" className="text-xs text-primary hover:underline">
                      {event.targetTitle}
                    </Link>
                  </div>
                  <Badge variant="secondary">
                    {formatDistanceToNow(new Date(event.occurredAt), { addSuffix: true })}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3Icon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Top engaged targets</p>
          </div>
          {data.topEngagedTargets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Engagement rankings will appear once activity grows.</p>
          ) : (
            <div className="space-y-2">
              {data.topEngagedTargets.map((target) => (
                <div key={`${target.targetType}:${target.targetId}`} className="surface-inset flex items-center justify-between gap-3 p-3">
                  <div className="space-y-1">
                    <Link href={target.href} target="_blank" className="text-sm font-medium hover:underline">
                      {target.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{interactionTargetLabels[target.targetType]}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MessageSquareDashedIcon className="size-3.5" />
                      {target.commentsCount}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUpIcon className="size-3.5" />
                      {target.likesCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3Icon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Recent admin actions</p>
          </div>
          {data.recentAdminActions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin actions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {data.recentAdminActions.slice(0, 4).map((event) => (
                <div key={event.id} className="surface-inset flex items-center justify-between gap-3 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{event.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.entityType} • {event.entityId}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
