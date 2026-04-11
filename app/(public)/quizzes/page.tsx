import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { PublicQuizList } from "@/components/quiz/public-quiz-list";
import { getServerCaller } from "@/server/api/caller";

export default async function QuizzesPage() {
  const caller = await getServerCaller();
  const items = await caller.quiz.listPublished({ limit: 40 });

  return (
    <div className="py-10 md:py-14">
      <SiteContainer>
        <AnimatedPageWrapper>
          <PublicQuizList items={items} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
