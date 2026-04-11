import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicQuizAttempt } from "@/components/quiz/public-quiz-attempt";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type QuizDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let quiz: Awaited<ReturnType<typeof caller.quiz.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    quiz = await caller.quiz.getPublishedBySlug({ slug });
    relatedItems = (await caller.discovery.relatedByTarget({
      targetType: "QUIZ",
      slug,
      limit: 4,
    })).items;
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicQuizAttempt quiz={quiz} relatedItems={relatedItems} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
