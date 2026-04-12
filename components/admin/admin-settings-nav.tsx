import Link from "next/link";
import { Globe2Icon, UserRoundIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type AdminSettingsNavProps = {
  current: "profile" | "seo";
};

export function AdminSettingsNav({ current }: AdminSettingsNavProps) {
  return (
    <div className="surface-panel flex flex-wrap items-center gap-2 p-2">
      <Link
        href="/admin/settings/profile"
        className={cn(
          buttonVariants({ variant: current === "profile" ? "secondary" : "ghost", size: "sm" }),
          "rounded-lg",
        )}
      >
        <UserRoundIcon className="size-4" />
        Profile & Footer
      </Link>
      <Link
        href="/admin/settings/seo"
        className={cn(
          buttonVariants({ variant: current === "seo" ? "secondary" : "ghost", size: "sm" }),
          "rounded-lg",
        )}
      >
        <Globe2Icon className="size-4" />
        SEO & Metadata
      </Link>
    </div>
  );
}
