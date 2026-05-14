import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { PublicContentArticle } from "@/components/content/public-content-article";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { getPublicServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

export const revalidate = 300;

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getPublicServerCaller();

  try {
    const content = await caller.content.getPublishedBySlug({
      type: CONTENT_TYPE.PROJECT,
      slug,
    });

    return buildPageMetadata({
      path: `/projects/${content.slug}`,
      title: content.seoTitle ?? content.title,
      description: content.seoDescription ?? content.summary,
      imageUrl: content.coverImage?.url ?? null,
      ogType: "article",
      keywords: content.tags.map((entry) => entry.tag.name),
    });
  } catch {
    return buildPageMetadata({
      path: `/projects/${slug}`,
      title: "Project",
      description: "Project page on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const caller = await getPublicServerCaller();
  let content: Awaited<ReturnType<typeof caller.content.getPublishedBySlug>>;
  let relatedItems: DiscoveryResultItem[] = [];

  try {
    [content, relatedItems] = await Promise.all([
      caller.content.getPublishedBySlug({
        type: CONTENT_TYPE.PROJECT,
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

  const seo = await getSeoSettings();

  const articleSchema = buildArticleSchema({
    seo,
    title: content.title,
    description: content.summary ?? content.seoDescription,
    path: `/projects/${content.slug}`,
    publishedAt: content.publishedAt,
    updatedAt: content.updatedAt,
    imageUrl: content.coverImage?.url ?? null,
    authorName: content.author?.displayName,
    kind: "Article",
  });
  const breadcrumbSchema = buildBreadcrumbSchema(
    [
      { name: "Home", path: "/" },
      { name: "Projects", path: "/projects" },
      { name: content.title, path: `/projects/${content.slug}` },
    ],
    seo,
  );

  return (
    <SiteContainer>
      <JsonLdScript data={[articleSchema, breadcrumbSchema]} />
      <AnimatedPageWrapper>
        <PublicContentArticle
          type={CONTENT_TYPE.PROJECT}
          content={content}
          relatedItems={relatedItems}
        />
      </AnimatedPageWrapper>
    </SiteContainer>
  );
}
