import Link from "next/link";
import { CONTENT_TYPES } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";

export default function AdminContentOverviewPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Content Workspace"
        description="Manage journals, articles, and projects from dedicated editorial sections."
      />

      <div className="space-y-3">
        {CONTENT_TYPES.map((type, index) => {
          const meta = contentTypeMeta[type];
          return (
            <AnimatedPageWrapper key={type} delay={0.03 * index}>
              <section className="surface-panel flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <p className="text-xl font-semibold tracking-tight">{meta.plural}</p>
                  <p className="text-sm text-muted-foreground">
                    Open {meta.plural.toLowerCase()} management with draft and publishing controls.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={meta.adminBasePath}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "min-w-24")}
                  >
                    View list
                  </Link>
                  <Link href={`${meta.adminBasePath}/new`} className={cn(buttonVariants({ size: "sm" }), "min-w-20")}>
                    New
                  </Link>
                </div>
              </section>
            </AnimatedPageWrapper>
          );
        })}
      </div>
    </div>
  );
}
