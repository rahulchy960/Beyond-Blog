import { type QuizStatus } from "@/lib/content/enums";
import { quizStatusLabels } from "@/lib/quiz/constants";
import { Badge } from "@/components/ui/badge";

type QuizStatusBadgeProps = {
  status: QuizStatus;
};

export function QuizStatusBadge({ status }: QuizStatusBadgeProps) {
  if (status === "PUBLISHED") {
    return <Badge variant="secondary">{quizStatusLabels[status]}</Badge>;
  }

  if (status === "DRAFT") {
    return <Badge variant="outline">{quizStatusLabels[status]}</Badge>;
  }

  return <Badge variant="destructive">{quizStatusLabels[status]}</Badge>;
}
