import { FileTextIcon } from "lucide-react";
import Link from "next/link";
import { type ContentType } from "@/lib/content/enums";
import { ContentCard } from "@/components/content/content-card";
import { contentTypeMeta } from "@/lib/content/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { buttonVariants } from "@/lib/ui/button-variants";

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
  const lead = items[0];
  const rest = items.slice(1);

  return (
    <section className="space-y-10">
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
        <>
          {lead ? (
            <article className="surface-panel-strong space-y-4 px-6 py-6">
              <p className="meta-kicker">Lead {meta.singular}</p>
              <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">{lead.title}</h3>
              {lead.summary ? <p className="max-w-3xl text-sm text-muted-foreground">{lead.summary}</p> : null}
              <div className="pt-1">
                <Link href={`${meta.publicBasePath}/${lead.slug}`} className={buttonVariants({ size: "sm" })}>
                  Read {meta.singular.toLowerCase()}
                </Link>
              </div>
            </article>
          ) : null}

          <div className="grid gap-4">
            {(rest.length > 0 ? rest : lead ? [lead] : []).map((item) => (
              <ContentCard key={item.id} type={type} item={item} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
