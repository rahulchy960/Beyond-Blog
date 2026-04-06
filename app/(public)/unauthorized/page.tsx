import Link from "next/link";
import { ShieldAlertIcon } from "lucide-react";
import { SiteContainer } from "@/components/layout/site-container";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="py-16">
      <SiteContainer className="max-w-2xl">
        <Card className="border-border/80 bg-card/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="size-5" />
              Unauthorized Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You are signed in, but your account does not have administrator
              privileges for this section.
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
      </SiteContainer>
    </div>
  );
}
