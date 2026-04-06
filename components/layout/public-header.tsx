import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { platformName } from "@/lib/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { SiteContainer } from "@/components/layout/site-container";

export async function PublicHeader() {
  const { userId } = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
      <SiteContainer className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-heading text-base font-semibold tracking-tight">
            {platformName}
          </Link>
          <nav className="hidden items-center gap-2 text-sm md:flex">
            <Link className={buttonVariants({ variant: "ghost", size: "sm" })} href="/">
              Home
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {userId ? (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin">
              Admin Console
            </Link>
          ) : (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/sign-in">
              Admin Sign In
            </Link>
          )}
        </div>
      </SiteContainer>
    </header>
  );
}
