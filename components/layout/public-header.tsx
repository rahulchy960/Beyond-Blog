import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { getServerCaller } from "@/server/api/caller";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import { SiteContainer } from "@/components/layout/site-container";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Journals", href: "/journals" },
  { label: "Articles", href: "/articles" },
  { label: "Projects", href: "/projects" },
  { label: "Courses", href: "/courses" },
];

function getInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

export async function PublicHeader() {
  const { userId } = await auth();
  const caller = await getServerCaller();
  const identity = await caller.profile.getPublicIdentity();
  const adminLabel = identity.name;

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <SiteContainer className="flex h-[4.45rem] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="default">
            {identity.imageUrl ? <AvatarImage src={identity.imageUrl} alt={`${adminLabel} avatar`} /> : null}
            <AvatarFallback>{getInitials(adminLabel)}</AvatarFallback>
          </Avatar>

          <Link href="/" className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight">{adminLabel}</p>
          </Link>
        </div>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-md text-[0.83rem]")}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center justify-end gap-2">
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
            <SheetTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "md:hidden")} aria-label="Open navigation menu">
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
                  <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>Admin Console</Link>
                ) : (
                  <Link href="/sign-in" className={buttonVariants({ variant: "outline", size: "sm" })}>Admin Sign-In</Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SiteContainer>
    </header>
  );
}

