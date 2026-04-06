import Link from "next/link";
import { CONTENT_TYPES } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminContentOverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Workspace"
        description="Manage journals, articles, and projects from dedicated editorial sections."
      />

      <div className="grid gap-4 md:grid-cols-3">
        {CONTENT_TYPES.map((type, index) => {
          const meta = contentTypeMeta[type];
          return (
            <AnimatedPageWrapper key={type} delay={0.03 * index}>
              <Card className="surface-panel">
                <CardHeader>
                  <CardTitle>{meta.plural}</CardTitle>
                  <CardDescription>Open {meta.plural.toLowerCase()} management.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Link href={meta.adminBasePath} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    View list
                  </Link>
                  <Link href={`${meta.adminBasePath}/new`} className={buttonVariants({ size: "sm" })}>
                    New
                  </Link>
                </CardContent>
              </Card>
            </AnimatedPageWrapper>
          );
        })}
      </div>
    </div>
  );
}
