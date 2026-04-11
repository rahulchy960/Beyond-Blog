import { QuizBuilder } from "@/components/quiz/quiz-builder";

type EditQuizPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuizPage({ params }: EditQuizPageProps) {
  const { id } = await params;
  return <QuizBuilder mode="edit" quizId={id} />;
}
