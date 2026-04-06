import Link from "next/link";
import { SiteContainer } from "@/components/layout/site-container";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/ui/button-variants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function HomePage() {
  return (
    <div className="py-16 md:py-24">
      <SiteContainer className="space-y-10">
        <section className="space-y-6">
          <Badge variant="outline" className="uppercase tracking-wide">
            Beyond Blog
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-5xl">
            Journals, articles, projects, media, and public quizzes in one editorial platform.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Beyond Blog is built for public readership with a secure single-admin
            publishing workflow.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Open admin console
            </Link>
            <Link href="/sign-in" className={buttonVariants({ size: "lg" })}>
              Admin sign in
            </Link>
          </div>
        </section>

        <Separator />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Scholarly Journals</CardTitle>
              <CardDescription>
                Long-form publication pipeline with metadata and categorization.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Public browsing is open, while editorial management stays admin-only.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research Projects</CardTitle>
              <CardDescription>
                Showcase projects with links, collaborators, and media attachments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Project-focused storytelling with scalable metadata and media support.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Future Quizzes</CardTitle>
              <CardDescription>
                Extend with assessments, grading states, and attempt tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Guest attempts, answer tracking, and moderation-ready infrastructure.
              </p>
            </CardContent>
          </Card>
        </section>
      </SiteContainer>
    </div>
  );
}
