import { SearchXIcon } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchResultCard } from "@/components/discovery/search-result-card";
import { type DiscoveryResultItem } from "@/types/discovery";

type SearchResultsShellProps = {
  items: DiscoveryResultItem[];
  query?: string;
};

export function SearchResultsShell({ items, query }: SearchResultsShellProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="No discovery results found"
        description={
          query
            ? `No published entries matched "${query}". Try broader keywords or remove filters.`
            : "Start typing to search across journals, articles, projects, courses, and quizzes."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <SearchResultCard key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

