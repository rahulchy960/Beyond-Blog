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
            Production Foundation
          </Badge>
          <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-5xl">
            Academic publishing infrastructure for journals, projects, media, and
            future assessments.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            This platform is now initialized with modern auth, typed API boundaries,
            Neon/PostgreSQL persistence, and scalable App Router architecture.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Create account
            </Link>
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Open admin area
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
                Router, providers, and database layers are ready for journal modules.
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
                Admin route scaffolding supports granular role-based editing workflows.
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
                tRPC + Zod + React Query are pre-configured for scalable data access.
              </p>
            </CardContent>
          </Card>
        </section>
      </SiteContainer>
    </div>
  );
}
