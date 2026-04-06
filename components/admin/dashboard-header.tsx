"use client";

import { UserButton } from "@clerk/nextjs";
import { MenuIcon } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

type DashboardHeaderProps = {
  title: string;
  adminLabel: string;
  onOpenSidebar: () => void;
};

export function DashboardHeader({ title, adminLabel, onOpenSidebar }: DashboardHeaderProps) {
  return (
    <header className="surface-glass sticky top-3 z-30 mx-3 md:mx-5">
      <div className="flex h-16 items-center justify-between gap-3 px-3 md:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden"
            onClick={onOpenSidebar}
            aria-label="Open admin navigation"
          >
            <MenuIcon className="size-4" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs tracking-[0.14em] text-muted-foreground uppercase">Dashboard</p>
            <h1 className="truncate text-lg font-semibold">{title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <p className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">{adminLabel}</p>
          <UserButton />
        </div>
      </div>
    </header>
  );
}
