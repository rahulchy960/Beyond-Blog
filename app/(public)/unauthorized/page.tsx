import Link from "next/link";
import { SiteContainer } from "@/components/layout/site-container";
import { buttonVariants } from "@/lib/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UnauthorizedPage() {
  return (
    <div className="py-16">
      <SiteContainer className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You are signed in, but your account does not have administrator
              privileges for this section.
            </p>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Return to homepage
            </Link>
          </CardContent>
        </Card>
      </SiteContainer>
    </div>
  );
}
