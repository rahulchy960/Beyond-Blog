import dynamic from "next/dynamic";
import { EditorPageSkeleton } from "@/components/ui/loading-skeletons";

const QuizBuilder = dynamic(
  () => import("@/components/quiz/quiz-builder").then((mod) => mod.QuizBuilder),
  { loading: () => <EditorPageSkeleton /> },
);

type EditQuizPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuizPage({ params }: EditQuizPageProps) {
  const { id } = await params;
  return <QuizBuilder mode="edit" quizId={id} />;
}
