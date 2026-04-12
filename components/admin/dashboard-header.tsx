"use client";

import { UserButton } from "@clerk/nextjs";
import { ArrowLeftIcon, HomeIcon, LayoutDashboardIcon, MenuIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type DashboardHeaderProps = {
  title: string;
  adminLabel: string;
  adminImageUrl?: string | null;
  onOpenSidebar: () => void;
};

const adminQuickLinks = [
  { label: "Analytics", href: "/admin/analytics", title: "Open analytics intelligence" },
  { label: "Journals", href: "/admin/journals", title: "Manage journals" },
  { label: "Articles", href: "/admin/articles", title: "Manage articles" },
  { label: "Projects", href: "/admin/projects", title: "Manage projects" },
  { label: "Courses", href: "/admin/courses", title: "Manage courses" },
  { label: "Quizzes", href: "/admin/quizzes", title: "Manage quizzes" },
  { label: "Categories", href: "/admin/categories", title: "Manage categories" },
  { label: "Tags", href: "/admin/tags", title: "Manage tags" },
  { label: "Footer Edit", href: "/admin/settings/profile", title: "Edit public footer profile content" },
] as const;

function getInitials(label: string) {
  const parts = label
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) {
    return "A";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "A";
}

export function DashboardHeader({
  title,
  adminLabel,
  adminImageUrl,
  onOpenSidebar,
}: DashboardHeaderProps) {
  const router = useRouter();
  const initials = getInitials(adminLabel);
  const headerText = title === "Dashboard" ? "ADMIN DASHBOARD" : title.toUpperCase();

  return (
    <header className="surface-glass sticky top-3 z-30 mx-3 md:mx-5">
      <div className="flex h-[4.4rem] items-center gap-3 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open admin navigation"
            title="Open navigation menu"
          >
            <MenuIcon className="size-4" />
          </Button>
          <Avatar size="default">
            {adminImageUrl ? <AvatarImage src={adminImageUrl} alt={`${adminLabel} avatar`} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <p className="truncate text-[0.86rem] font-semibold tracking-[0.14em] text-foreground uppercase">
            {headerText}
          </p>
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-1">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border/70 bg-surface-soft/70 p-1">
            {adminQuickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "shrink-0 rounded-md px-2.5 text-[0.78rem]",
                )}
                title={item.title}
                aria-label={item.title}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/70 bg-surface-soft/70 p-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-md px-2 sm:px-2.5"
              onClick={() => router.back()}
              aria-label="Go back"
              title="Go back"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-md px-2 sm:px-2.5")}
              aria-label="Go to home"
              title="Go to home page"
            >
              <HomeIcon className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-md px-2 sm:px-2.5")}
              aria-label="Go to dashboard"
              title="Go to admin dashboard"
            >
              <LayoutDashboardIcon className="size-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>

          <ThemeToggle title="Toggle light and dark mode" />
          <p className="hidden max-w-48 truncate text-sm text-muted-foreground lg:block">{adminLabel}</p>
          <div title="Open account menu">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
}
