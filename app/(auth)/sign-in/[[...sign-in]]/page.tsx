import { SignIn } from "@clerk/nextjs";
import { SiteContainer } from "@/components/layout/site-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="py-16">
      <SiteContainer className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              Beyond Blog uses a single-admin authentication model. Public readers do not sign in.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use the configured Clerk owner account to access the admin console.
          </CardContent>
        </Card>
        <div className="flex justify-center lg:justify-end">
          <SignIn path="/sign-in" routing="path" signUpUrl="/sign-in" fallbackRedirectUrl="/admin" />
        </div>
      </SiteContainer>
    </div>
  );
}
