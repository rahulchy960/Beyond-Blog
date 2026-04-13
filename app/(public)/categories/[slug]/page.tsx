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

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getPublicServerCaller();

  try {
    const data = await caller.discovery.getCategoryPage({ slug, page: 1, pageSize: 1 });
    return buildPageMetadata({
      path: `/categories/${data.category.slug}`,
      title: data.category.name,
      description:
        data.category.description ??
        `Browse published content in ${data.category.name} on Beyond Blog.`,
      ogType: "website",
    });
  } catch {
    return buildPageMetadata({
      path: `/categories/${slug}`,
      title: "Category",
      description: "Category archive on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const page = parsePageParam(rawPage, 1);
  const pageSize = DEFAULT_PUBLIC_PAGE_SIZE;
  const caller = await getPublicServerCaller();

  let data: Awaited<ReturnType<typeof caller.discovery.getCategoryPage>>;
  try {
    data = await caller.discovery.getCategoryPage({ slug, page, pageSize });
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
            eyebrow="Category Archive"
            title={data.category.name}
            description={data.category.description ?? "Entries curated under this editorial category."}
            count={data.category.usageCount}
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
              nextPage > 1
                ? `/categories/${data.category.slug}?page=${nextPage}`
                : `/categories/${data.category.slug}`
            }
          />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

