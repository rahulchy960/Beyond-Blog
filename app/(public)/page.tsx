import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { FeaturedContentCard } from "@/components/content/featured-content-card";
import { ContentCard } from "@/components/content/content-card";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { PublicQuizCard } from "@/components/quiz/public-quiz-card";
import { DiscoverySection } from "@/components/discovery/discovery-section";
import { GlobalSearchInput } from "@/components/discovery/global-search-input";
import { SearchResultCard } from "@/components/discovery/search-result-card";
import { Badge } from "@/components/ui/badge";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { buildPageMetadata, getSeoSettings } from "@/lib/seo/metadata";
import { buildPersonSchema, buildWebSiteSchema } from "@/lib/seo/structured-data";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { getPublicServerCaller } from "@/server/api/caller";
import { type DiscoveryResultItem } from "@/types/discovery";
import { platformName } from "@/lib/constants";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/",
    title: null,
    description:
      "Discover journals, articles, projects, courses, and quizzes published on Beyond Blog.",
    ogType: "website",
  });
}

export default async function HomePage() {
  const caller = await getPublicServerCaller();
  const emptyHome = {
    featuredContent: [],
    featuredCourses: [],
    featuredQuizzes: [],
    recentMixed: [],
    discoveryCategories: [],
    discoveryTags: [],
  };
  const [home, identity, profile, seo] = await Promise.all([
    caller.discovery.homepageSections({
      featuredLimit: 4,
      recentLimit: 10,
    }).catch(() => emptyHome),
    caller.profile.getPublicIdentity().catch(() => ({
      name: platformName,
      slug: null,
      imageUrl: null,
    })),
    caller.profile.getPublicFooterProfile().catch(() => null),
    getSeoSettings(),
  ]);

  const featuredLead = home.featuredContent[0] ?? null;
  const featuredRest = home.featuredContent.slice(1);
  const webSiteSchema = buildWebSiteSchema(seo);
  const personSchema = buildPersonSchema(seo, {
    name: identity.name,
    description: profile?.bio ?? null,
    imageUrl: identity.imageUrl,
    email: profile?.email ?? null,
    websiteUrl: profile?.websiteUrl ?? null,
  });

  return (
    <div className="py-10 md:py-14">
      <JsonLdScript data={[webSiteSchema, personSchema]} />
      <SiteContainer className="space-y-16 md:space-y-20">
        <AnimatedPageWrapper>
          <section className="surface-panel-strong relative overflow-hidden px-6 py-8 md:px-9 md:py-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <p className="meta-kicker">Beyond Blog Discovery</p>
                <h1 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight md:text-6xl">
                  Editorial publishing and open learning, discoverable in one place.
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Browse journals, articles, projects, courses, and quizzes with no reader sign-in. Search, filter,
                  and follow curated pathways from the same editorial surface.
                </p>
                <GlobalSearchInput className="max-w-3xl" />
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/journals" className={buttonVariants({ size: "lg" })}>
                    Explore publications
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link href="/courses" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Browse courses
                  </Link>
                </div>
              </div>

              <aside className="space-y-3">
                <div className="surface-inset p-4">
                  <p className="meta-kicker">Curated Topics</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {home.discoveryCategories.map((category) => (
                      <Link key={category.id} href={`/categories/${category.slug}`}>
                        <Badge variant="secondary">
                          {category.name} ({category.count})
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="surface-inset p-4">
                  <p className="meta-kicker">Popular Tags</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {home.discoveryTags.map((tag) => (
                      <Link key={tag.id} href={`/tags/${tag.slug}`}>
                        <Badge variant="outline">#{tag.name}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        </AnimatedPageWrapper>

        {featuredLead ? (
          <AnimatedPageWrapper delay={0.04} className="space-y-5">
            <DiscoverySection
              eyebrow="Editorial Spotlight"
              title="Featured Publication"
              description="A highlighted piece from the Beyond Blog editorial stream."
              actions={
                <Link href="/search?scope=ALL" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>
                  Open global search
                </Link>
              }
            >
              <FeaturedContentCard type={featuredLead.type} item={featuredLead} />
              {featuredRest.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {featuredRest.map((item) => (
                    <ContentCard key={item.id} type={item.type} item={item} />
                  ))}
                </div>
              ) : null}
            </DiscoverySection>
          </AnimatedPageWrapper>
        ) : null}

        {home.featuredCourses.length > 0 ? (
          <AnimatedPageWrapper delay={0.06}>
            <DiscoverySection
              eyebrow="Courses"
              title="Featured Learning Paths"
              description="Structured modules for readers who want deeper skill progression."
              actions={
                <Link href="/courses" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>
                  View all courses
                </Link>
              }
            >
              <div className="grid gap-4">
                {home.featuredCourses.map((course) => (
                  <PublicCourseCard key={course.id} course={course} />
                ))}
              </div>
            </DiscoverySection>
          </AnimatedPageWrapper>
        ) : null}

        {home.featuredQuizzes.length > 0 ? (
          <AnimatedPageWrapper delay={0.08}>
            <DiscoverySection
              eyebrow="Assessments"
              title="Featured Public Quizzes"
              description="Open quizzes for quick checks and guided practice."
            >
              <div className="grid gap-4">
                {home.featuredQuizzes.map((quiz) => (
                  <PublicQuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            </DiscoverySection>
          </AnimatedPageWrapper>
        ) : null}

        {home.recentMixed.length > 0 ? (
          <AnimatedPageWrapper delay={0.1}>
            <DiscoverySection
              eyebrow="Fresh"
              title="Recent Across Beyond Blog"
              description="Newest releases across editorial publications, courses, and quizzes."
            >
              <div className="grid gap-3">
                {home.recentMixed.slice(0, 8).map((item) => (
                  <SearchResultCard
                    key={`${item.type}-${item.id}`}
                    item={item as DiscoveryResultItem}
                    className="surface-panel"
                  />
                ))}
              </div>
              <div className="pt-2">
                <Link href="/search?scope=ALL" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <SparklesIcon className="size-4" />
                  Explore all discovery results
                </Link>
              </div>
            </DiscoverySection>
          </AnimatedPageWrapper>
        ) : null}
      </SiteContainer>
    </div>
  );
}
