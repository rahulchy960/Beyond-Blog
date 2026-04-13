import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const QuizBuilder = dynamic(
  () => import("@/components/quiz/quiz-builder").then((mod) => mod.QuizBuilder),
  { loading: () => <EditorPageSkeleton /> },
);

export default function NewQuizPage() {
  return <QuizBuilder mode="create" />;
}
