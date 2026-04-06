import { FileTextIcon } from "lucide-react";
import { type ContentType } from "@/lib/content/enums";
import { ContentCard } from "@/components/content/content-card";
import { contentTypeMeta } from "@/lib/content/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

type PublicContentListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  publishedAt: Date | null;
  category: { name: string; slug: string } | null;
  tags: Array<{ tag: { name: string; slug: string } }>;
};

type PublicContentListProps = {
  type: ContentType;
  items: PublicContentListItem[];
};

export function PublicContentList({ type, items }: PublicContentListProps) {
  const meta = contentTypeMeta[type];

  return (
    <section className="space-y-8">
      <SectionHeader
        eyebrow="Beyond Blog"
        title={meta.plural}
        description={`Published ${meta.plural.toLowerCase()} curated for public readers.`}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FileTextIcon}
          title={`No ${meta.plural.toLowerCase()} published yet`}
          description="The editorial team has not published entries in this section yet. Check back soon."
        />
      ) : (
        <div className="grid gap-5">
          {items.map((item) => (
            <ContentCard key={item.id} type={type} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
