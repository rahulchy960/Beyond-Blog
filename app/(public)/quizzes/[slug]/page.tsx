import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteContainer } from "@/components/layout/site-container";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicQuizAttempt } from "@/components/quiz/public-quiz-attempt";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema, buildQuizSchema } from "@/lib/seo/structured-data";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type QuizDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: QuizDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getServerCaller();

  try {
    const quiz = await caller.quiz.getPublishedBySlug({ slug });
    return buildPageMetadata({
      path: `/quizzes/${quiz.slug}`,
      title: quiz.seoTitle ?? quiz.title,
      description: quiz.seoDescription ?? quiz.description,
      imageUrl: quiz.coverImage?.url ?? null,
      ogType: "article",
    });
  } catch {
    return buildPageMetadata({
      path: `/quizzes/${slug}`,
      title: "Quiz",
      description: "Quiz page on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function QuizDetailPage({ params }: QuizDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let quiz: Awaited<ReturnType<typeof caller.quiz.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    [quiz, relatedItems] = await Promise.all([
      caller.quiz.getPublishedBySlug({ slug }),
      caller.discovery
        .relatedByTarget({
          targetType: "QUIZ",
          slug,
          limit: 4,
        })
        .then((result) => result.items),
    ]);
  } catch {
    notFound();
  }

  const seo = await getSeoSettings();
  const quizSchema = buildQuizSchema({
    seo,
    title: quiz.title,
    description: quiz.description ?? quiz.seoDescription,
    path: `/quizzes/${quiz.slug}`,
    imageUrl: quiz.coverImage?.url ?? null,
    questionCount: quiz.questions.length,
  });
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", path: "/" },
      { name: "Quizzes", path: "/quizzes" },
      { name: quiz.title, path: `/quizzes/${quiz.slug}` },
    ],
    seo,
  );

  return (
    <SiteContainer>
      <JsonLdScript data={[quizSchema, breadcrumbSchema]} />
      <AnimatedPageWrapper>
        <PublicQuizAttempt quiz={quiz} relatedItems={relatedItems} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
