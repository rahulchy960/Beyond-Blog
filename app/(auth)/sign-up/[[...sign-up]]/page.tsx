import { SignUp } from "@clerk/nextjs";
import { SiteContainer } from "@/components/layout/site-container";

export default function SignUpPage() {
  return (
    <div className="py-16">
      <SiteContainer className="flex justify-center">
        <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
      </SiteContainer>
    </div>
  );
}
