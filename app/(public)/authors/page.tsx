import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteContainer } from "@/components/layout/site-container";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { SectionHeader } from "@/components/ui/section-header";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicServerCaller } from "@/server/api/caller";

export const revalidate = 300;

function getInitials(label: string) {
  return label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/authors",
    title: "Authors",
    description: "Meet the Beyond Blog editorial authors and explore their published work.",
    ogType: "website",
  });
}

export default async function AuthorsPage() {
  const caller = await getPublicServerCaller();
  const authors = await caller.profile.listAuthors();

  return (
    <div className="py-10 md:py-14">
      <SiteContainer className="space-y-8">
        <AnimatedPageWrapper>
          <SectionHeader
            eyebrow="Editorial Team"
            title="Authors"
            description="Profiles behind the articles, journals, projects, and courses on Beyond Blog."
          />
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.04}>
          {authors.length === 0 ? (
            <EmptyState title="No author profiles yet" description="Author profiles will appear once admins complete their profiles." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {authors.map((author) => {
                const imageUrl = author.profileImage?.thumbnailUrl ?? author.profileImage?.url ?? null;

                return (
                  <Card key={author.id} className="surface-panel h-full">
                    <CardHeader className="flex-row items-start gap-4 space-y-0">
                      <Avatar size="lg">
                        {imageUrl ? <AvatarImage src={imageUrl} alt={`${author.displayName} avatar`} /> : null}
                        <AvatarFallback>{getInitials(author.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-2">
                        <CardTitle className="text-2xl leading-tight">
                          <Link href={`/authors/${author.slug}`} className="inline-flex items-start gap-2 hover:text-primary">
                            {author.displayName}
                            <ArrowUpRightIcon className="mt-1 size-4 shrink-0" />
                          </Link>
                        </CardTitle>
                        {author.designation ? <p className="text-sm text-muted-foreground">{author.designation}</p> : null}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {author.bio ? <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">{author.bio}</p> : null}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{author._count.contents} publications</Badge>
                        <Badge variant="secondary">{author._count.courses} courses</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
