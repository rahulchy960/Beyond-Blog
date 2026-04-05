import { SignIn } from "@clerk/nextjs";
import { SiteContainer } from "@/components/layout/site-container";

export default function SignInPage() {
  return (
    <div className="py-16">
      <SiteContainer className="flex justify-center">
        <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
      </SiteContainer>
    </div>
  );
}
