import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ActiveFilter = {
  label: string;
  href: string;
};

type ActiveFilterBarProps = {
  title?: string;
  filters: ActiveFilter[];
};

export function ActiveFilterBar({ title = "Active filters", filters }: ActiveFilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="meta-kicker">{title}</span>
      {filters.map((filter) => (
        <Link key={`${filter.label}-${filter.href}`} href={filter.href}>
          <Badge variant="secondary" className="hover:bg-accent transition-colors">
            {filter.label}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

