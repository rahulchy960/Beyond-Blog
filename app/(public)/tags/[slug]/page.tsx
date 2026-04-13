import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { SearchResultsShell } from "@/components/discovery/search-results-shell";
import { TaxonomyHeader } from "@/components/discovery/taxonomy-header";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DEFAULT_PUBLIC_PAGE_SIZE, parsePageParam } from "@/lib/performance/pagination";

export const revalidate = 120;

type TagPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getPublicServerCaller();

  try {
    const data = await caller.discovery.getTagPage({ slug, page: 1, pageSize: 1 });
    return buildPageMetadata({
      path: `/tags/${data.tag.slug}`,
      title: `Tag: ${data.tag.name}`,
      description: `Explore content tagged with ${data.tag.name} on Beyond Blog.`,
      ogType: "website",
    });
  } catch {
    return buildPageMetadata({
      path: `/tags/${slug}`,
      title: "Tag",
      description: "Tag archive on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = parsePageParam(rawPage, 1);
  const pageSize = DEFAULT_PUBLIC_PAGE_SIZE;
  const caller = await getPublicServerCaller();

  let data: Awaited<ReturnType<typeof caller.discovery.getTagPage>>;
  try {
    data = await caller.discovery.getTagPage({ slug, page, pageSize });
  } catch {
    notFound();
  }

  const items: DiscoveryResultItem[] = data.items.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    slug: item.slug,
    href:
      item.type === "JOURNAL"
        ? `/journals/${item.slug}`
        : item.type === "ARTICLE"
          ? `/articles/${item.slug}`
          : `/projects/${item.slug}`,
    summary: item.summary,
    isFeatured: item.isFeatured,
    publishedAt: item.publishedAt,
    coverImage: item.coverImage
      ? {
          url: item.coverImage.url,
          thumbnailUrl: item.coverImage.thumbnailUrl,
          altText: item.coverImage.altText,
        }
      : null,
    category: item.category
      ? {
          name: item.category.name,
          slug: item.category.slug,
        }
      : null,
    tags: item.tags.map((entry) => ({
      name: entry.tag.name,
      slug: entry.tag.slug,
    })),
    meta: {},
  }));

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-7">
        <AnimatedPageWrapper>
          <TaxonomyHeader
            eyebrow="Tag Archive"
            title={`#${data.tag.name}`}
            description="Entries grouped by shared editorial topic."
            count={data.tag.usageCount}
          />
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.04}>
          <SearchResultsShell items={items} />
          <PaginationControls
            className="mt-5"
            page={data.pageInfo.page}
            pageSize={data.pageInfo.pageSize}
            totalItems={data.pageInfo.total}
            buildHref={(nextPage) =>
              nextPage > 1 ? `/tags/${data.tag.slug}?page=${nextPage}` : `/tags/${data.tag.slug}`
            }
          />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

