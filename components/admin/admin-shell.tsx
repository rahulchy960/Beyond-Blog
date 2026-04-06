"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, MenuIcon } from "lucide-react";
import { useState } from "react";
import { getAdminPageTitle } from "@/components/admin/admin-navigation";
import { AdminSidebarNav } from "@/components/admin/admin-sidebar-nav";
import { platformName } from "@/lib/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type AdminShellProps = {
  adminLabel: string;
  children: React.ReactNode;
};

function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-4">
        <Link href="/admin" className="font-heading text-base font-semibold tracking-tight">
          {platformName}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Single-admin console</p>
      </div>
      <Separator />
      <div className="flex-1 p-3">
        <AdminSidebarNav onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AdminShell({ adminLabel, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle = getAdminPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 border-r border-border/70 bg-card/70 lg:block">
        <AdminSidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "lg:hidden")}
                >
                  <MenuIcon className="size-4" />
                  <span className="sr-only">Open navigation</span>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Admin navigation</SheetTitle>
                    <SheetDescription>Navigate across Beyond Blog admin sections.</SheetDescription>
                  </SheetHeader>
                  <AdminSidebarContent onNavigate={() => setMobileNavOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Link href="/admin" className="hover:text-foreground">
                    Admin
                  </Link>
                  <ChevronRight className="size-3" />
                  <span className="truncate">{pageTitle}</span>
                </div>
                <h1 className="truncate font-heading text-lg font-semibold tracking-tight md:text-xl">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <p className="hidden text-sm text-muted-foreground sm:block">{adminLabel}</p>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
