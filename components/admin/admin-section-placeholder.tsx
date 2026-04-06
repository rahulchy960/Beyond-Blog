import Link from "next/link";
import { ArrowLeftIcon, WrenchIcon } from "lucide-react";
import { buttonVariants } from "@/lib/ui/button-variants";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

type AdminSectionPlaceholderProps = {
  title: string;
  description: string;
};

export function AdminSectionPlaceholder({ title, description }: AdminSectionPlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={WrenchIcon}
        title={`${title} is ready for implementation`}
        description="This section has the base layout and authorization guard in place. CRUD and operational workflows can now be integrated."
        action={
          <Link href="/admin" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeftIcon className="size-4" />
            Back to dashboard
          </Link>
        }
      />
    </div>
  );
}
