import { notFound } from "next/navigation";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { PublicContentArticle } from "@/components/content/public-content-article";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { getServerCaller } from "@/server/api/caller";

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let content: Awaited<ReturnType<typeof caller.content.getPublishedBySlug>>;

  try {
    content = await caller.content.getPublishedBySlug({
      type: CONTENT_TYPE.ARTICLE,
      slug,
    });
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicContentArticle type={CONTENT_TYPE.ARTICLE} content={content} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
