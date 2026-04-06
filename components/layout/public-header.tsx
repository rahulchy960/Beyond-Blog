import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { platformName } from "@/lib/constants";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { SiteContainer } from "@/components/layout/site-container";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Journals", href: "/journals" },
  { label: "Articles", href: "/articles" },
  { label: "Projects", href: "/projects" },
];

export async function PublicHeader() {
  const { userId } = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <SiteContainer className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            {platformName}
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {PUBLIC_NAV.map((item) => (
              <Link key={item.href} className={buttonVariants({ variant: "ghost", size: "sm" })} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {userId ? (
            <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/admin">
              Admin Console
            </Link>
          ) : (
            <Link className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")} href="/sign-in">
              Admin Sign-In
            </Link>
          )}
          <Sheet>
            <SheetTrigger
              className={cn(buttonVariants({ variant: "outline", size: "icon" }), "md:hidden")}
              aria-label="Open navigation menu"
            >
              <MenuIcon className="size-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="sr-only">
                <SheetTitle>Beyond Blog navigation</SheetTitle>
                <SheetDescription>Navigate public sections and admin sign-in.</SheetDescription>
              </SheetHeader>
              <div className="mt-8 grid gap-2">
                {PUBLIC_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    {item.label}
                  </Link>
                ))}
                {userId ? (
                  <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Admin Console
                  </Link>
                ) : (
                  <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Admin Sign-In
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SiteContainer>
    </header>
  );
}
