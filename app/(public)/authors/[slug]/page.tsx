import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLinkIcon, GraduationCapIcon, MailIcon, MapPinIcon } from "lucide-react";
import { ContentCard } from "@/components/content/content-card";
import { PublicCourseCard } from "@/components/course/public-course-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Separator } from "@/components/ui/separator";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicServerCaller } from "@/server/api/caller";

export const revalidate = 300;

type AuthorPageProps = {
  params: Promise<{ slug: string }>;
};

function getInitials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caller = await getPublicServerCaller();

  try {
    const author = await caller.profile.getAuthorBySlug({ slug });
    return buildPageMetadata({
      path: `/authors/${author.slug}`,
      title: author.displayName,
      description: author.bio ?? author.designation,
      imageUrl: author.profileImage?.url ?? null,
      ogType: "website",
    });
  } catch {
    return buildPageMetadata({
      path: `/authors/${slug}`,
      title: "Author",
      description: "Author profile on Beyond Blog.",
      noIndex: true,
      ogType: "website",
    });
  }
}

export default async function AuthorDetailPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const caller = await getPublicServerCaller();
  let author: Awaited<ReturnType<typeof caller.profile.getAuthorBySlug>>;

  try {
    author = await caller.profile.getAuthorBySlug({ slug });
  } catch {
    notFound();
  }

  const imageUrl = author.profileImage?.url ?? author.profileImage?.thumbnailUrl ?? null;
  const socialLinks = [
    { label: "LinkedIn", href: author.linkedinUrl },
    { label: "GitHub", href: author.githubUrl },
    { label: "Twitter", href: author.twitterUrl },
    { label: "Website", href: author.websiteUrl },
  ].filter((item): item is { label: string; href: string } => Boolean(item.href));

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-8">
        <AnimatedPageWrapper>
          <section className="surface-panel-strong overflow-hidden">
            <div className="grid gap-6 p-6 md:grid-cols-[13rem_1fr] md:p-8">
              <Avatar className="size-40 border border-border/70 bg-muted/45 md:size-48">
                {imageUrl ? <AvatarImage src={imageUrl} alt={`${author.displayName} avatar`} /> : null}
                <AvatarFallback className="text-4xl">{getInitials(author.displayName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 space-y-5">
                <div className="space-y-3">
                  <p className="meta-kicker">Author Profile</p>
                  <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-6xl">{author.displayName}</h1>
                  {author.designation ? <p className="max-w-3xl text-lg text-muted-foreground">{author.designation}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{author.contents.length} publications</Badge>
                    <Badge variant="secondary">{author.courses.length} courses</Badge>
                  </div>
                </div>

                {author.bio ? <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">{author.bio}</p> : null}

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {author.email ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted/65 px-3 py-1">
                      <MailIcon className="size-3.5" />
                      {author.email}
                    </span>
                  ) : null}
                  {author.address ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-muted/65 px-3 py-1">
                      <MapPinIcon className="size-3.5" />
                      {author.address}
                    </span>
                  ) : null}
                </div>

                {socialLinks.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {socialLinks.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                      >
                        {item.label}
                        <ExternalLinkIcon className="size-3.5" />
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </AnimatedPageWrapper>

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <AnimatedPageWrapper delay={0.04}>
            <div className="space-y-5">
              <Card className="surface-panel">
                <CardHeader>
                  <CardTitle className="inline-flex items-center gap-2">
                    <GraduationCapIcon className="size-5" />
                    Background
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
                  {author.education ? <p>{author.education}</p> : null}
                  {author.education && author.experience ? <Separator /> : null}
                  {author.experience ? <p>{author.experience}</p> : null}
                  {!author.education && !author.experience ? <p>Background details have not been published yet.</p> : null}
                </CardContent>
              </Card>
            </div>
          </AnimatedPageWrapper>

          <AnimatedPageWrapper delay={0.06}>
            <section className="space-y-5">
              <div className="space-y-1">
                <p className="meta-kicker">Published Work</p>
                <h2 className="text-2xl font-semibold tracking-tight">Latest publications</h2>
              </div>
              {author.contents.length === 0 ? (
                <EmptyState title="No published content" description="Published articles, journals, and projects by this author will appear here." />
              ) : (
                <div className="grid gap-4">
                  {author.contents.map((item) => (
                    <ContentCard key={item.id} type={item.type} item={item} />
                  ))}
                </div>
              )}
            </section>
          </AnimatedPageWrapper>
        </div>

        <AnimatedPageWrapper delay={0.08}>
          <section className="space-y-5">
            <div className="space-y-1">
              <p className="meta-kicker">Courses</p>
              <h2 className="text-2xl font-semibold tracking-tight">Learning paths</h2>
            </div>
            {author.courses.length === 0 ? (
              <EmptyState title="No published courses" description="Courses by this author will appear here after publication." />
            ) : (
              <div className="grid gap-4">
                {author.courses.map((course) => (
                  <PublicCourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </section>
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
