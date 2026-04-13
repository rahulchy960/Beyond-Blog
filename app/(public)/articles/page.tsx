import type { Metadata } from "next";
import { CONTENT_TYPE } from "@/lib/content/enums";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicContentList } from "@/components/content/public-content-list";
import { SiteContainer } from "@/components/layout/site-container";
import { ActiveFilterBar } from "@/components/discovery/active-filter-bar";
import { FilterToolbar } from "@/components/discovery/filter-toolbar";
import { GlobalSearchInput } from "@/components/discovery/global-search-input";
import { getSearchParam, getSearchParamBoolean } from "@/lib/discovery/query";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicServerCaller } from "@/server/api/caller";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { DEFAULT_PUBLIC_PAGE_SIZE, parsePageParam } from "@/lib/performance/pagination";

export const revalidate = 120;

type ArticlesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/articles",
    title: "Articles",
    description:
      "Explore long-form articles published on Beyond Blog across software, research, and editorial topics.",
    ogType: "website",
  });
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const category = getSearchParam(params.category).trim();
  const tag = getSearchParam(params.tag).trim();
  const sort = getSearchParam(params.sort) === "oldest" ? "oldest" : "newest";
  const featuredOnly = getSearchParamBoolean(params.featured);
  const page = parsePageParam(getSearchParam(params.page), 1);
  const pageSize = DEFAULT_PUBLIC_PAGE_SIZE;

  const caller = await getPublicServerCaller();
  const data = await caller.discovery.listContent({
    type: CONTENT_TYPE.ARTICLE,
    query: query || undefined,
    category: category || undefined,
    tag: tag || undefined,
    featuredOnly: featuredOnly || undefined,
    sort,
    page,
    pageSize,
  });
  const items = data.items;

  const buildHrefWithout = (key: string) => {
    const next = new URLSearchParams();
    if (query && key !== "q") next.set("q", query);
    if (category && key !== "category") next.set("category", category);
    if (tag && key !== "tag") next.set("tag", tag);
    if (featuredOnly && key !== "featured") next.set("featured", "1");
    if (sort !== "newest" && key !== "sort") next.set("sort", sort);
    if (page > 1 && key !== "page") next.set("page", String(page));
    const suffix = next.toString();
    return suffix.length ? `/articles?${suffix}` : "/articles";
  };

  const buildPageHref = (nextPage: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (category) next.set("category", category);
    if (tag) next.set("tag", tag);
    if (featuredOnly) next.set("featured", "1");
    if (sort !== "newest") next.set("sort", sort);
    if (nextPage > 1) next.set("page", String(nextPage));
    const suffix = next.toString();
    return suffix.length ? `/articles?${suffix}` : "/articles";
  };

  const activeFilters = [
    ...(query ? [{ label: `Query: ${query}`, href: buildHrefWithout("q") }] : []),
    ...(category ? [{ label: `Category: ${category}`, href: buildHrefWithout("category") }] : []),
    ...(tag ? [{ label: `Tag: ${tag}`, href: buildHrefWithout("tag") }] : []),
    ...(featuredOnly ? [{ label: "Featured only", href: buildHrefWithout("featured") }] : []),
    ...(sort !== "newest" ? [{ label: "Oldest first", href: buildHrefWithout("sort") }] : []),
  ];

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-5">
        <AnimatedPageWrapper className="space-y-3">
          <GlobalSearchInput defaultQuery={query} defaultScope="ARTICLE" />
          <FilterToolbar
            actionPath="/articles"
            query={query}
            featuredOnly={featuredOnly}
            selects={[
              {
                name: "category",
                label: "Category",
                value: category,
                options: data.facets.categories.map((item) => ({
                  label: `${item.name} (${item.count})`,
                  value: item.slug,
                })),
              },
              {
                name: "tag",
                label: "Tag",
                value: tag,
                options: data.facets.tags.map((item) => ({
                  label: `${item.name} (${item.count})`,
                  value: item.slug,
                })),
              },
              {
                name: "sort",
                label: "Sort",
                value: sort,
                options: [
                  { label: "Newest first", value: "newest" },
                  { label: "Oldest first", value: "oldest" },
                ],
                allLabel: "Newest first",
              },
            ]}
          />
          <ActiveFilterBar filters={activeFilters} />
        </AnimatedPageWrapper>
        <AnimatedPageWrapper delay={0.04}>
          <PublicContentList type={CONTENT_TYPE.ARTICLE} items={items} />
          <PaginationControls
            className="mt-5"
            page={data.pageInfo.page}
            pageSize={data.pageInfo.pageSize}
            totalItems={data.pageInfo.total}
            buildHref={buildPageHref}
          />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

