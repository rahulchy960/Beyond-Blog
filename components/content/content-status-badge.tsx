import { PUBLISH_STATUS, type PublishStatus } from "@/lib/content/enums";
import { publishStatusLabels } from "@/lib/content/constants";
import { Badge } from "@/components/ui/badge";

type ContentStatusBadgeProps = {
  status: PublishStatus;
};

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  if (status === PUBLISH_STATUS.PUBLISHED) {
    return <Badge className="tracking-[0.08em] uppercase">{publishStatusLabels[status]}</Badge>;
  }

  if (status === PUBLISH_STATUS.ARCHIVED) {
    return (
      <Badge variant="secondary" className="tracking-[0.08em] uppercase">
        {publishStatusLabels[status]}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="tracking-[0.08em] uppercase">
      {publishStatusLabels[status]}
    </Badge>
  );
}
