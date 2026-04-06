import { SignUp } from "@clerk/nextjs";
import { SiteContainer } from "@/components/layout/site-container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <div className="py-16">
      <SiteContainer className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Admin Onboarding</CardTitle>
            <CardDescription>
              This page is only for initial owner setup. Only one admin account is authorized.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            After onboarding, assign the owner account via the seed flow to activate admin access.
          </CardContent>
        </Card>
        <div className="flex justify-center lg:justify-end">
          <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
        </div>
      </SiteContainer>
    </div>
  );
}
