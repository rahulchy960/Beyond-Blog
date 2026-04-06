"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/components/admin/admin-navigation";
import { platformName } from "@/lib/constants";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type DashboardSidebarProps = {
  onNavigate?: () => void;
};

export function DashboardSidebar({ onNavigate }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="surface-sidebar flex h-full flex-col">
      <div className="px-5 py-5">
        <Link href="/admin" onClick={onNavigate} className="inline-flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">{platformName}</span>
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Editorial Console
        </p>
      </div>

      <div className="px-3 pb-4">
        <nav className="grid gap-1.5">
          {adminNavigation.map((item, index) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.015 }}
              >
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                    "h-10 w-full justify-start gap-2.5 rounded-lg",
                    isActive && "shadow-sm",
                  )}
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
