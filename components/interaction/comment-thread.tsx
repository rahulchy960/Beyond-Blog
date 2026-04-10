"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { MessageSquareDashedIcon } from "lucide-react";
import { toast } from "sonner";
import { CommentCard } from "@/components/interaction/comment-card";
import { CommentForm, type CommentFormValues } from "@/components/interaction/comment-form";
import { InteractionBar } from "@/components/interaction/interaction-bar";
import { useTRPC } from "@/hooks/use-trpc";
import { type InteractionTargetType } from "@/lib/content/enums";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

type CommentThreadProps = {
  targetType: InteractionTargetType;
  targetId: string;
  title?: string;
};

export function CommentThread({ targetType, targetId, title }: CommentThreadProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const commentsInput = useMemo(
    () => ({
      targetType,
      targetId,
      limit: 120,
    }),
    [targetId, targetType],
  );

  const likesInput = useMemo(
    () => ({
      targetType,
      targetId,
    }),
    [targetId, targetType],
  );

  const commentsQuery = useQuery(trpc.interaction.listVisibleComments.queryOptions(commentsInput));
  const likesQuery = useQuery(trpc.interaction.getLikeSummary.queryOptions(likesInput));

  const toggleLikeMutation = useMutation(
    trpc.interaction.toggleLike.mutationOptions({
      onMutate: async () => {
        await queryClient.cancelQueries({
          queryKey: trpc.interaction.getLikeSummary.queryKey(likesInput),
        });

        const previous = queryClient.getQueryData(
          trpc.interaction.getLikeSummary.queryKey(likesInput),
        ) as { liked: boolean; likesCount: number } | undefined;

        queryClient.setQueryData(
          trpc.interaction.getLikeSummary.queryKey(likesInput),
          (old: { liked: boolean; likesCount: number } | undefined) => {
            if (!old) {
              return old;
            }

            const nextLiked = !old.liked;
            return {
              liked: nextLiked,
              likesCount: Math.max(0, old.likesCount + (nextLiked ? 1 : -1)),
            };
          },
        );

        return { previous };
      },
      onError: (error, _input, context) => {
        if (context?.previous) {
          queryClient.setQueryData(trpc.interaction.getLikeSummary.queryKey(likesInput), context.previous);
        }
        toast.error(error.message);
      },
      onSuccess: (data) => {
        queryClient.setQueryData(trpc.interaction.getLikeSummary.queryKey(likesInput), data);
      },
    }),
  );

  const createCommentMutation = useMutation(
    trpc.interaction.createComment.mutationOptions({
      onSuccess: async (result) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: trpc.interaction.listVisibleComments.queryKey(commentsInput),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.interaction.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.admin.pathKey() }),
        ]);

        if (result.status === "VISIBLE") {
          toast.success("Comment posted.");
        } else {
          toast.success("Comment submitted for moderation.");
        }
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleSubmit = async (values: CommentFormValues) => {
    await createCommentMutation.mutateAsync({
      targetType,
      targetId,
      guestName: values.guestName,
      guestEmail: values.guestEmail || null,
      guestWebsite: values.guestWebsite || null,
      body: values.body,
      honeypot: values.honeypot ?? "",
    });
  };

  const comments = commentsQuery.data?.items ?? [];
  const commentsCount = commentsQuery.data?.totalVisible ?? 0;
  const liked = likesQuery.data?.liked ?? false;
  const likesCount = likesQuery.data?.likesCount ?? 0;

  return (
    <section className="space-y-5 pt-4 md:pt-6">
      <header className="space-y-2">
        <p className="meta-kicker">Public Interaction</p>
        <h2 className="text-2xl font-semibold tracking-tight md:text-[2rem]">
          {title ?? "Community responses"}
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-[0.96rem]">
          Readers can react and contribute as guests. Submissions are moderated to keep discussion useful.
        </p>
      </header>

      <InteractionBar
        liked={liked}
        likesCount={likesCount}
        commentsCount={commentsCount}
        onToggleLike={() => toggleLikeMutation.mutate(likesInput)}
        isLikePending={toggleLikeMutation.isPending}
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-5">
        <CommentForm
          onSubmit={handleSubmit}
          isSubmitting={createCommentMutation.isPending}
        />

        <section className="surface-reading space-y-3 p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold tracking-tight">
              Reader comments
            </h3>
            <p className="text-xs text-muted-foreground">
              {commentsCount} visible
            </p>
          </div>

          {commentsQuery.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : commentsQuery.isError ? (
            <EmptyState
              title="Unable to load comments"
              description={commentsQuery.error.message}
            />
          ) : comments.length === 0 ? (
            <EmptyState
              icon={MessageSquareDashedIcon}
              title="No comments yet"
              description="Start the conversation with the first thoughtful response."
            />
          ) : (
            <div className="space-y-3">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <CommentCard comment={comment} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
