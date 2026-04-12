import Link from "next/link";
import { CompassIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { SiteContainer } from "@/components/layout/site-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NotFoundShellProps = {
  title: string;
  description: string;
  homeHref?: string;
  homeLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function NotFoundShell({
  title,
  description,
  homeHref = "/",
  homeLabel = "Go to homepage",
  secondaryHref = "/search",
  secondaryLabel = "Search published content",
}: NotFoundShellProps) {
  return (
    <div className="py-12 md:py-16">
      <SiteContainer className="max-w-3xl">
        <Card className="surface-panel-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-surface-elevated text-muted-foreground">
                <CompassIcon className="size-4" />
              </span>
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-7 text-muted-foreground">{description}</p>
            <div className="flex flex-wrap gap-2">
              <Link href={homeHref} className={buttonVariants({ size: "sm" })}>
                {homeLabel}
              </Link>
              {secondaryHref ? (
                <Link
                  href={secondaryHref}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  {secondaryLabel}
                </Link>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </SiteContainer>
    </div>
  );
}
