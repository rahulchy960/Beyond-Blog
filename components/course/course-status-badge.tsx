import { Badge } from "@/components/ui/badge";
import { COURSE_STATUS, type CourseStatus } from "@/lib/content/enums";

type CourseStatusBadgeProps = {
  status: CourseStatus;
};

export function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  if (status === COURSE_STATUS.PUBLISHED) {
    return <Badge>Published</Badge>;
  }

  if (status === COURSE_STATUS.ARCHIVED) {
    return <Badge variant="outline">Archived</Badge>;
  }

  return <Badge variant="secondary">Draft</Badge>;
}

