"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { DashboardHeader } from "@/components/admin/dashboard-header";
import { DashboardSidebar } from "@/components/admin/dashboard-sidebar";
import { getAdminPageTitle } from "@/components/admin/admin-navigation";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type AdminShellProps = {
  adminLabel: string;
  children: React.ReactNode;
};

export function AdminShell({ adminLabel, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pageTitle = getAdminPageTitle(pathname);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-72 lg:block">
        <DashboardSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader title={pageTitle} adminLabel={adminLabel} onOpenSidebar={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-3 md:p-5">
          <AnimatedPageWrapper className="mx-auto w-full max-w-7xl">{children}</AnimatedPageWrapper>
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Admin navigation</SheetTitle>
            <SheetDescription>Navigate across Beyond Blog admin sections.</SheetDescription>
          </SheetHeader>
          <DashboardSidebar onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
