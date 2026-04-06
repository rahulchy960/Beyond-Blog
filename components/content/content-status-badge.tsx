import { PUBLISH_STATUS, type PublishStatus } from "@/lib/content/enums";
import { publishStatusLabels } from "@/lib/content/constants";
import { Badge } from "@/components/ui/badge";

type ContentStatusBadgeProps = {
  status: PublishStatus;
};

export function ContentStatusBadge({ status }: ContentStatusBadgeProps) {
  if (status === PUBLISH_STATUS.PUBLISHED) {
    return <Badge className="uppercase">{publishStatusLabels[status]}</Badge>;
  }

  if (status === PUBLISH_STATUS.ARCHIVED) {
    return <Badge variant="secondary" className="uppercase">{publishStatusLabels[status]}</Badge>;
  }

  return <Badge variant="outline" className="uppercase">{publishStatusLabels[status]}</Badge>;
}
