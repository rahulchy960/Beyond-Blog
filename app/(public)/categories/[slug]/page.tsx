import { notFound } from "next/navigation";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { SearchResultsShell } from "@/components/discovery/search-results-shell";
import { TaxonomyHeader } from "@/components/discovery/taxonomy-header";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const caller = await getServerCaller();

  let data: Awaited<ReturnType<typeof caller.discovery.getCategoryPage>>;
  try {
    data = await caller.discovery.getCategoryPage({ slug, limit: 60 });
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
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

