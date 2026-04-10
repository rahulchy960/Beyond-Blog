import { type CommentStatus } from "@/lib/content/enums";
import { commentStatusLabels } from "@/lib/interaction/constants";
import { Badge } from "@/components/ui/badge";

type ModerationStatusBadgeProps = {
  status: CommentStatus;
};

export function ModerationStatusBadge({ status }: ModerationStatusBadgeProps) {
  if (status === "VISIBLE") {
    return <Badge variant="secondary">{commentStatusLabels[status]}</Badge>;
  }

  if (status === "PENDING") {
    return <Badge>{commentStatusLabels[status]}</Badge>;
  }

  if (status === "HIDDEN") {
    return <Badge variant="outline">{commentStatusLabels[status]}</Badge>;
  }

  return <Badge variant="destructive">{commentStatusLabels[status]}</Badge>;
}
