import { SectionHeader } from "@/components/ui/section-header";
import { SearchResultCard } from "@/components/discovery/search-result-card";
import { type DiscoveryResultItem } from "@/types/discovery";

type RelatedContentSectionProps = {
  items: DiscoveryResultItem[];
  title?: string;
  description?: string;
};

export function RelatedContentSection({
  items,
  title = "Related Reads",
  description = "Discover adjacent publications and learning material from Beyond Blog.",
}: RelatedContentSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-5">
      <SectionHeader eyebrow="Discover More" title={title} description={description} />
      <div className="grid gap-3">
        {items.slice(0, 4).map((item) => (
          <SearchResultCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </div>
    </section>
  );
}

