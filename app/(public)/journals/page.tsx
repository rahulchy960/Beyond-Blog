import { CONTENT_TYPE } from "@/lib/content/enums";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PublicContentList } from "@/components/content/public-content-list";
import { SiteContainer } from "@/components/layout/site-container";
import { ActiveFilterBar } from "@/components/discovery/active-filter-bar";
import { FilterToolbar } from "@/components/discovery/filter-toolbar";
import { GlobalSearchInput } from "@/components/discovery/global-search-input";
import { getSearchParam, getSearchParamBoolean } from "@/lib/discovery/query";
import { getServerCaller } from "@/server/api/caller";

type JournalsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JournalsPage({ searchParams }: JournalsPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const category = getSearchParam(params.category).trim();
  const tag = getSearchParam(params.tag).trim();
  const sort = getSearchParam(params.sort) === "oldest" ? "oldest" : "newest";
  const featuredOnly = getSearchParamBoolean(params.featured);

  const caller = await getServerCaller();
  const data = await caller.discovery.listContent({
    type: CONTENT_TYPE.JOURNAL,
    query: query || undefined,
    category: category || undefined,
    tag: tag || undefined,
    featuredOnly: featuredOnly || undefined,
    sort,
    limit: 60,
  });
  const items = data.items;

  const buildHrefWithout = (key: string) => {
    const next = new URLSearchParams();
    if (query && key !== "q") next.set("q", query);
    if (category && key !== "category") next.set("category", category);
    if (tag && key !== "tag") next.set("tag", tag);
    if (featuredOnly && key !== "featured") next.set("featured", "1");
    if (sort !== "newest" && key !== "sort") next.set("sort", sort);
    const suffix = next.toString();
    return suffix.length ? `/journals?${suffix}` : "/journals";
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
          <GlobalSearchInput defaultQuery={query} defaultScope="JOURNAL" />
          <FilterToolbar
            actionPath="/journals"
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
          <PublicContentList type={CONTENT_TYPE.JOURNAL} items={items} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
