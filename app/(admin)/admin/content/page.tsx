import Link from "next/link";
import { CONTENT_TYPES } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminContentOverviewPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Content Workspace</h2>
        <p className="text-sm text-muted-foreground">
          Manage journals, articles, and projects from focused editorial sections.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {CONTENT_TYPES.map((type) => {
          const meta = contentTypeMeta[type];
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{meta.plural}</CardTitle>
                <CardDescription>Open {meta.plural.toLowerCase()} management.</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link href={meta.adminBasePath} className={buttonVariants({ size: "sm", variant: "outline" })}>
                  View List
                </Link>
                <Link href={`${meta.adminBasePath}/new`} className={buttonVariants({ size: "sm" })}>
                  New
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
