import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { SiteContainer } from "@/components/layout/site-container";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";

export default function UnauthorizedPage() {
  return (
    <div className="py-12 md:py-16">
      <SiteContainer className="max-w-3xl">
        <AnimatedPageWrapper className="surface-panel-strong p-1">
          <Card className="ring-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="inline-flex size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <ShieldAlertIcon className="size-4" />
                </span>
                Unauthorized Access
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-7 text-muted-foreground">
                You are signed in, but this account is not the configured Beyond Blog admin. Only the single owner
                account can access protected editorial routes.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Return to homepage
                </Link>
                <Link href="/sign-in" className={buttonVariants({ size: "sm" })}>
                  Sign in as admin
                </Link>
              </div>
            </CardContent>
          </Card>
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
