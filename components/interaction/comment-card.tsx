import { format } from "date-fns";
import Link from "next/link";
import { GlobeIcon } from "lucide-react";

type CommentCardProps = {
  comment: {
    id: string;
    guestName: string;
    guestWebsite: string | null;
    body: string;
    createdAt: Date;
  };
};

export function CommentCard({ comment }: CommentCardProps) {
  return (
    <article className="surface-inset space-y-3 p-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-foreground">{comment.guestName}</p>
        <time className="text-xs text-muted-foreground">
          {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </time>
        {comment.guestWebsite ? (
          <Link
            href={comment.guestWebsite}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <GlobeIcon className="size-3" />
            Website
          </Link>
        ) : null}
      </header>

      <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/95">{comment.body}</p>
    </article>
  );
}
