"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { BarChart3Icon, MessageSquareDashedIcon, ThumbsUpIcon } from "lucide-react";
import { useTRPC } from "@/hooks/use-trpc";
import { interactionTargetLabels } from "@/lib/interaction/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminInteractionInsights() {
  const trpc = useTRPC();
  const statsQuery = useQuery(trpc.interaction.getAdminStats.queryOptions());

  if (statsQuery.isPending) {
    return (
      <Card className="surface-panel h-full">
        <CardHeader>
          <CardTitle>Interaction Activity</CardTitle>
          <CardDescription>Latest guest responses and engagement trends.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (statsQuery.isError) {
    return (
      <Card className="surface-panel h-full">
        <CardHeader>
          <CardTitle>Interaction Activity</CardTitle>
          <CardDescription>Latest guest responses and engagement trends.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState title="Unable to load interaction activity" description={statsQuery.error.message} />
        </CardContent>
      </Card>
    );
  }

  const data = statsQuery.data;

  return (
    <Card className="surface-panel h-full">
      <CardHeader>
        <CardTitle>Interaction Activity</CardTitle>
        <CardDescription>Recent guest discussion and top engaged targets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Visible comments</p>
            <p className="text-xl font-semibold">{data.counts.visibleComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Pending moderation</p>
            <p className="text-xl font-semibold">{data.counts.pendingComments}</p>
          </div>
          <div className="surface-inset space-y-1 p-3">
            <p className="text-xs text-muted-foreground">Total likes</p>
            <p className="text-xl font-semibold">{data.counts.totalLikes}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquareDashedIcon className="size-4 text-muted-foreground" />
            <p className="text-sm font-medium">Latest comments</p>
          </div>
          {data.latestComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comment activity yet.</p>
          ) : (
            <div className="space-y-2">
              {data.latestComments.map((comment) => (
                <div key={comment.id} className="surface-inset flex items-start justify-between gap-3 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{comment.guestName}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{comment.body}</p>
                    <Link href={comment.target.href} target="_blank" className="text-xs text-primary hover:underline">
                      {comment.target.title}
                    </Link>
                  </div>
                  <Badge variant={comment.status === "PENDING" ? "default" : "secondary"}>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
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
      </CardContent>
    </Card>
  );
}
