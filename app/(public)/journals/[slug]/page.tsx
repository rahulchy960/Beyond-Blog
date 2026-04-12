import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { PublicContentArticle } from "@/components/content/public-content-article";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type JournalDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: JournalDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getServerCaller();

  try {
    const content = await caller.content.getPublishedBySlug({
      type: CONTENT_TYPE.JOURNAL,
      slug,
    });

    return buildPageMetadata({
      path: `/journals/${content.slug}`,
      title: content.seoTitle ?? content.title,
      description: content.seoDescription ?? content.summary,
      imageUrl: content.coverImage?.url ?? null,
      ogType: "article",
      keywords: content.tags.map((entry) => entry.tag.name),
    });
  } catch {
    return buildPageMetadata({
      path: `/journals/${slug}`,
      title: "Journal",
      description: "Journal page on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function JournalDetailPage({ params }: JournalDetailPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();
  let content: Awaited<ReturnType<typeof caller.content.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    [content, relatedItems] = await Promise.all([
      caller.content.getPublishedBySlug({
        type: CONTENT_TYPE.JOURNAL,
        slug,
      }),
      caller.discovery
        .relatedByTarget({
          targetType: "CONTENT",
          slug,
          limit: 4,
        })
        .then((result) => result.items),
    ]);
  } catch {
    notFound();
  }

  const [seo, identity] = await Promise.all([
    getSeoSettings(),
    caller.profile.getPublicIdentity(),
  ]);

  const articleSchema = buildArticleSchema({
    seo,
    title: content.title,
    description: content.summary ?? content.seoDescription,
    path: `/journals/${content.slug}`,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    imageUrl: content.coverImage?.url ?? null,
    authorName: identity.name,
    kind: "BlogPosting",
  });
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", path: "/" },
      { name: "Journals", path: "/journals" },
      { name: content.title, path: `/journals/${content.slug}` },
    ],
    seo,
  );

  return (
    <SiteContainer>
      <JsonLdScript data={[articleSchema, breadcrumbSchema]} />
      <AnimatedPageWrapper>
        <PublicContentArticle
          type={CONTENT_TYPE.JOURNAL}
          content={content}
          relatedItems={relatedItems}
        />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
