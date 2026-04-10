import { MessageSquareTextIcon } from "lucide-react";
import { LikeButton } from "@/components/interaction/like-button";

type InteractionBarProps = {
  liked: boolean;
  likesCount: number;
  commentsCount: number;
  onToggleLike: () => void;
  isLikePending?: boolean;
};

export function InteractionBar({
  liked,
  likesCount,
  commentsCount,
  onToggleLike,
  isLikePending,
}: InteractionBarProps) {
  return (
    <div className="surface-panel flex flex-wrap items-center gap-3 p-3">
      <LikeButton
        liked={liked}
        likesCount={likesCount}
        onToggle={onToggleLike}
        isPending={isLikePending}
      />
      <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
        <MessageSquareTextIcon className="size-3.5" />
        {commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}
      </div>
    </div>
  );
}
