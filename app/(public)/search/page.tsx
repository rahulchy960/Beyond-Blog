import type { Metadata } from "next";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SiteContainer } from "@/components/layout/site-container";
import { GlobalSearchInput } from "@/components/discovery/global-search-input";
import { SearchResultsShell } from "@/components/discovery/search-results-shell";
import { Badge } from "@/components/ui/badge";
import { discoveryScopeOptions } from "@/lib/discovery/constants";
import { getSearchParam } from "@/lib/discovery/query";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { getServerCaller } from "@/server/api/caller";
import { type DiscoveryResultType } from "@/types/discovery";

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const searchTypeOrder: DiscoveryResultType[] = [
  "JOURNAL",
  "ARTICLE",
  "PROJECT",
  "COURSE",
  "QUIZ",
];

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const seo = await getSeoSettings();

  return buildPageMetadata({
    path: "/search",
    title: query.length > 0 ? `Search results for "${query}"` : "Search",
    description:
      query.length > 0
        ? `Search Beyond Blog for ${query} across journals, articles, projects, courses, and quizzes.`
        : "Search journals, articles, projects, courses, and quizzes across Beyond Blog.",
    noIndex: seo.noIndexSearchPage,
    ogType: "website",
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = getSearchParam(params.q).trim();
  const scope = getSearchParam(params.scope, "ALL");

  const validScope = discoveryScopeOptions.some((option) => option.value === scope)
    ? (scope as "ALL" | "JOURNAL" | "ARTICLE" | "PROJECT" | "COURSE" | "QUIZ")
    : "ALL";

  const caller = await getServerCaller();
  const results = await caller.discovery.search({
    query: query || undefined,
    category: undefined,
    tag: undefined,
    scope: validScope,
    limit: 48,
  });

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-7">
        <AnimatedPageWrapper className="space-y-5">
          <header className="space-y-3">
            <p className="meta-kicker">Global Discovery</p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
              Search Beyond Blog
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              Search across journals, articles, projects, courses, and quizzes in one place.
            </p>
          </header>

          <GlobalSearchInput defaultQuery={query} defaultScope={validScope} />

          <div className="flex flex-wrap items-center gap-2">
            {searchTypeOrder.map((type) => (
              <Badge key={type} variant="secondary">
                {type.toLowerCase()} - {results.counts[type]}
              </Badge>
            ))}
          </div>
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.04}>
          <SearchResultsShell items={results.items} query={query} />
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
