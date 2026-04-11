import { notFound } from "next/navigation";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { PublicContentArticle } from "@/components/content/public-content-article";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type ArticleDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let content: Awaited<ReturnType<typeof caller.content.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    content = await caller.content.getPublishedBySlug({
      type: CONTENT_TYPE.ARTICLE,
      slug,
    });
    relatedItems = (await caller.discovery.relatedByTarget({
      targetType: "CONTENT",
      slug,
      limit: 4,
    })).items;
  } catch {
    notFound();
  }

  return (
    <SiteContainer>
      <AnimatedPageWrapper>
        <PublicContentArticle type={CONTENT_TYPE.ARTICLE} content={content} relatedItems={relatedItems} />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
