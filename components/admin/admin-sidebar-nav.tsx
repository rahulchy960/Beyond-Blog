"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation } from "@/components/admin/admin-navigation";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type AdminSidebarNavProps = {
  onNavigate?: () => void;
};

export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1">
      {adminNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(`${item.href}/`));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
              "h-9 w-full justify-start gap-2",
            )}
          >
            <item.icon className="size-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
