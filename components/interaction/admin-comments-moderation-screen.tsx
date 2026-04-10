"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { EllipsisVerticalIcon, MessageSquareDashedIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { CommentsToolbar } from "@/components/interaction/comments-toolbar";
import { ModerationStatusBadge } from "@/components/interaction/moderation-status-badge";
import { useTRPC } from "@/hooks/use-trpc";
import { interactionTargetLabels } from "@/lib/interaction/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/loading-skeletons";

type ModerationStatus = "PENDING" | "VISIBLE" | "HIDDEN" | "DELETED";

export function AdminCommentsModerationScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | ModerationStatus>("all");
  const [targetType, setTargetType] = useState<"all" | "CONTENT" | "COURSE" | "COURSE_LESSON">(
    "all",
  );
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const listInput = useMemo(
    () => ({
      query: query || undefined,
      status: status === "all" ? undefined : status,
      targetType: targetType === "all" ? undefined : targetType,
      limit: 120,
    }),
    [query, status, targetType],
  );

  const listQuery = useQuery(trpc.interaction.listCommentsAdmin.queryOptions(listInput));

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.interaction.pathKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
    ]);
  };

  const updateStatusMutation = useMutation(
    trpc.interaction.updateCommentStatus.mutationOptions({
      onSuccess: async (_result, variables) => {
        toast.success(`Comment marked ${variables.status.toLowerCase()}.`);
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteMutation = useMutation(
    trpc.interaction.deleteComment.mutationOptions({
      onSuccess: async () => {
        toast.success("Comment permanently deleted.");
        setCommentToDelete(null);
        await refresh();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const rows = listQuery.data?.items ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Comment Moderation"
        description="Review guest discussion quality, hide low-signal messages, and keep the public thread healthy."
      />

      <AnimatedPageWrapper delay={0.03}>
        <CommentsToolbar
          query={query}
          status={status}
          targetType={targetType}
          onQueryChange={setQuery}
          onStatusChange={setStatus}
          onTargetTypeChange={setTargetType}
        />
      </AnimatedPageWrapper>

      <AnimatedPageWrapper delay={0.06}>
        {listQuery.isPending ? (
          <TableSkeleton rows={8} />
        ) : listQuery.isError ? (
          <EmptyState
            title="Unable to load comments"
            description={listQuery.error.message || "An unexpected error occurred."}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={MessageSquareDashedIcon}
            title="No comments match these filters"
            description="Try broadening filters or wait for new submissions."
          />
        ) : (
          <div className="space-y-3">
            {rows.map((comment) => (
              <article key={comment.id} className="surface-panel-strong space-y-4 p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <ModerationStatusBadge status={comment.status} />
                      <Badge variant="outline">{interactionTargetLabels[comment.targetType]}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">{comment.guestName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {comment.guestEmail ? <span>{comment.guestEmail}</span> : null}
                        {comment.guestWebsite ? (
                          <Link
                            href={comment.guestWebsite}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline"
                          >
                            {comment.guestWebsite}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-md")}
                    >
                      <EllipsisVerticalIcon className="size-4" />
                      <span className="sr-only">Open moderation actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Moderate</DropdownMenuLabel>
                      <DropdownMenuItem
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            commentId: comment.id,
                            status: "VISIBLE",
                          })
                        }
                      >
                        Mark visible
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            commentId: comment.id,
                            status: "PENDING",
                          })
                        }
                      >
                        Move to pending
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            commentId: comment.id,
                            status: "HIDDEN",
                          })
                        }
                      >
                        Hide
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={updateStatusMutation.isPending}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            commentId: comment.id,
                            status: "DELETED",
                          })
                        }
                      >
                        Mark deleted
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setCommentToDelete(comment.id)}
                      >
                        <Trash2Icon className="size-4" />
                        Delete permanently
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/95">{comment.body}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
                  <Link
                    href={comment.target.href}
                    target="_blank"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-1.5 text-primary")}
                  >
                    {comment.target.title}
                  </Link>

                  {comment.moderatedBy ? (
                    <p className="text-xs text-muted-foreground">
                      Last moderated by {comment.moderatedBy.name}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No moderation action yet</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </AnimatedPageWrapper>

      <Dialog open={Boolean(commentToDelete)} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete comment permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone and will remove the comment record entirely.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!commentToDelete || deleteMutation.isPending}
              onClick={() =>
                commentToDelete ? deleteMutation.mutate({ commentId: commentToDelete }) : undefined
              }
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
