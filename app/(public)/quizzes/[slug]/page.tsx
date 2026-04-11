import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicQuizAttempt } from "@/components/quiz/public-quiz-attempt";
import { getServerCaller } from "@/server/api/caller";

type QuizDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let quiz: Awaited<ReturnType<typeof caller.quiz.getPublishedBySlug>>;

  try {
    quiz = await caller.quiz.getPublishedBySlug({ slug });
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicQuizAttempt quiz={quiz} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
