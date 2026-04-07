import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { type ContentType } from "@/lib/content/enums";
import { contentTypeMeta } from "@/lib/content/constants";
import { AnimatedPageWrapper } from "@/components/ui/animated-page-wrapper";
import { PageHeader } from "@/components/ui/page-header";
import { ContentListTable } from "@/components/content/content-list-table";
import { buttonVariants } from "@/lib/ui/button-variants";

type AdminContentListScreenProps = {
  type: ContentType;
};

export function AdminContentListScreen({ type }: AdminContentListScreenProps) {
  const meta = contentTypeMeta[type];

  return (
    <div className="space-y-7">
      <PageHeader
        title={meta.plural}
        description={`Manage ${meta.plural.toLowerCase()} with draft, publish, featured, and archive workflows.`}
        actions={
          <Link href={`${meta.adminBasePath}/new`} className={buttonVariants({ size: "sm" })}>
            <PlusIcon className="size-4" />
            New {meta.singular}
          </Link>
        }
      />

      <AnimatedPageWrapper delay={0.03}>
        <ContentListTable type={type} />
      </AnimatedPageWrapper>
    </div>
  );
}
