import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { PublicCourseList } from "@/components/course/public-course-list";
import { courseDifficultyOptions } from "@/lib/course/constants";
import { ActiveFilterBar } from "@/components/discovery/active-filter-bar";
import { FilterToolbar } from "@/components/discovery/filter-toolbar";
import { GlobalSearchInput } from "@/components/discovery/global-search-input";
import { getSearchParam, getSearchParamBoolean } from "@/lib/discovery/query";
import { getServerCaller } from "@/server/api/caller";

type CoursesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const difficulty = getSearchParam(params.difficulty).trim();
  const sort = getSearchParam(params.sort) === "oldest" ? "oldest" : "newest";
  const featuredOnly = getSearchParamBoolean(params.featured);

  const caller = await getServerCaller();
  const data = await caller.discovery.listCourses({
    query: query || undefined,
    difficulty:
      difficulty === "BEGINNER" || difficulty === "INTERMEDIATE" || difficulty === "ADVANCED"
        ? difficulty
        : undefined,
    featuredOnly: featuredOnly || undefined,
    sort,
    limit: 60,
  });
  const items = data.items;

  const buildHrefWithout = (key: string) => {
    const next = new URLSearchParams();
    if (query && key !== "q") next.set("q", query);
    if (difficulty && key !== "difficulty") next.set("difficulty", difficulty);
    if (featuredOnly && key !== "featured") next.set("featured", "1");
    if (sort !== "newest" && key !== "sort") next.set("sort", sort);
    const suffix = next.toString();
    return suffix.length ? `/courses?${suffix}` : "/courses";
  };

  const activeFilters = [
    ...(query ? [{ label: `Query: ${query}`, href: buildHrefWithout("q") }] : []),
    ...(difficulty ? [{ label: `Difficulty: ${difficulty.toLowerCase()}`, href: buildHrefWithout("difficulty") }] : []),
    ...(featuredOnly ? [{ label: "Featured only", href: buildHrefWithout("featured") }] : []),
    ...(sort !== "newest" ? [{ label: "Oldest first", href: buildHrefWithout("sort") }] : []),
  ];

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-5">
        <AnimatedPageWrapper className="space-y-3">
          <GlobalSearchInput defaultQuery={query} defaultScope="COURSE" />
          <FilterToolbar
            actionPath="/courses"
            query={query}
            featuredOnly={featuredOnly}
            selects={[
              {
                name: "difficulty",
                label: "Difficulty",
                value: difficulty,
                options: courseDifficultyOptions.map((item) => ({
                  label: item.label,
                  value: item.value,
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
          <PublicCourseList items={items} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}

