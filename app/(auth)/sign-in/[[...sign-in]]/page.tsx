import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { LockKeyholeIcon } from "lucide-react";
import { SiteContainer } from "@/components/layout/site-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { buildPageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: "/sign-in",
    title: "Admin Sign-In",
    description: "Secure admin sign-in for Beyond Blog.",
    noIndex: true,
    ogType: "website",
  });
}

export default function SignInPage() {
  return (
    <div className="py-12 md:py-16">
      <SiteContainer className="grid gap-6 lg:grid-cols-[1.05fr_auto] lg:items-center">
        <AnimatedPageWrapper className="surface-panel-strong max-w-2xl p-1">
          <Card className="ring-0">
            <CardHeader className="space-y-3">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <LockKeyholeIcon className="size-4" />
              </span>
              <CardTitle className="text-2xl">Admin Sign-In</CardTitle>
              <CardDescription className="max-w-lg text-sm leading-7">
                Beyond Blog uses a controlled admin authentication model. Public readers do not need accounts and
                browse published content openly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Sign in with the configured owner Clerk account to access the editorial console.
            </CardContent>
          </Card>
        </AnimatedPageWrapper>

        <AnimatedPageWrapper delay={0.06} className="flex justify-center lg:justify-end">
          <div className="surface-panel p-2">
            <SignIn path="/sign-in" routing="path" signUpUrl="/sign-in" fallbackRedirectUrl="/admin" />
          </div>
        </AnimatedPageWrapper>
      </SiteContainer>
    </div>
  );
}
