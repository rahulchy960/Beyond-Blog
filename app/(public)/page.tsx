import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { CONTENT_TYPE, type ContentType } from "@/lib/content/enums";
import { SiteContainer } from "@/components/layout/site-container";
import { buttonVariants } from "@/lib/ui/button-variants";
import { getServerCaller } from "@/server/api/caller";
import { FeaturedContentCard } from "@/components/content/featured-content-card";
import { ContentCard } from "@/components/content/content-card";
import { SectionHeader } from "@/components/ui/section-header";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

type HomeEntry = {
  type: ContentType;
  entry: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
    coverImage: { url: string; altText: string | null } | null;
    tags: Array<{ tag: { name: string; slug: string } }>;
  };
};

function getEntryDate(value: Date | null) {
  return value ? new Date(value).getTime() : 0;
}

export default async function HomePage() {
  const caller = await getServerCaller();
  const [journals, articles, projects] = await Promise.all([
    caller.content.listPublished({ type: CONTENT_TYPE.JOURNAL, limit: 4 }),
    caller.content.listPublished({ type: CONTENT_TYPE.ARTICLE, limit: 4 }),
    caller.content.listPublished({ type: CONTENT_TYPE.PROJECT, limit: 4 }),
  ]);

  const latest = [
    ...journals.map((entry) => ({ type: CONTENT_TYPE.JOURNAL, entry }) satisfies HomeEntry),
    ...articles.map((entry) => ({ type: CONTENT_TYPE.ARTICLE, entry }) satisfies HomeEntry),
    ...projects.map((entry) => ({ type: CONTENT_TYPE.PROJECT, entry }) satisfies HomeEntry),
  ].sort((a, b) => getEntryDate(b.entry.publishedAt) - getEntryDate(a.entry.publishedAt));

  const featured = latest[0] ?? null;
  const highlights = latest.slice(1, 7);

  return (
    <div className="py-12 md:py-16">
      <SiteContainer className="space-y-14 md:space-y-16">
        <AnimatedPageWrapper>
          <section className="surface-panel-strong relative overflow-hidden p-7 md:p-10">
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="space-y-5">
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Beyond Blog
                </p>
                <h1 className="max-w-4xl text-4xl leading-tight font-semibold md:text-6xl">
                  A modern editorial platform for journals, projects, and scholarly writing.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  Public readers can browse every published piece openly. A single protected admin console powers
                  drafting, publishing, and long-term content stewardship.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link href="/articles" className={buttonVariants({ size: "lg" })}>
                    Explore published work
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "lg" })}>
                    Admin sign-in
                  </Link>
                </div>
              </div>

              <div className="surface-panel space-y-3 p-5">
                <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">What is live now</p>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                    <span>Journals</span>
                    <strong>{journals.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                    <span>Articles</span>
                    <strong>{articles.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                    <span>Projects</span>
                    <strong>{projects.length}</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </AnimatedPageWrapper>

        {featured ? (
          <AnimatedPageWrapper delay={0.05} className="space-y-5">
            <SectionHeader
              eyebrow="Featured"
              title="Latest Editorial Highlight"
              description="A curated spotlight from the most recent published work."
            />
            <FeaturedContentCard type={featured.type} item={featured.entry} />
          </AnimatedPageWrapper>
        ) : null}

        <AnimatedPageWrapper delay={0.08} className="space-y-5">
          <SectionHeader
            eyebrow="Discover"
            title="Recent Publications"
            description="Fresh journals, articles, and projects from the Beyond Blog editorial stream."
            actions={
              <Link
                href="/journals"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}
              >
                Browse all journals
              </Link>
            }
          />
          {highlights.length === 0 ? (
            <EmptyState
              title="No publications available yet"
              description="Publish your first journal, article, or project from the admin workspace to populate the homepage."
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {highlights.map((item) => (
                <ContentCard key={item.entry.id} type={item.type} item={item.entry} />
              ))}
            </div>
          )}
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
