import Link from "next/link";
import { FunnelIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/lib/ui/button-variants";
import { cn } from "@/lib/utils";

type FilterOption = {
  label: string;
  value: string;
};

type FilterSelect = {
  name: string;
  label: string;
  value?: string;
  options: FilterOption[];
  allLabel?: string;
};

type FilterToolbarProps = {
  actionPath: string;
  query?: string;
  featuredOnly?: boolean;
  selects?: FilterSelect[];
  className?: string;
};

export function FilterToolbar({
  actionPath,
  query,
  featuredOnly,
  selects = [],
  className,
}: FilterToolbarProps) {
  return (
    <form action={actionPath} method="get" className={cn("toolbar-row gap-2.5 p-3", className)}>
      <div className="relative min-w-[14rem] flex-1">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          name="q"
          defaultValue={query}
          placeholder="Search within this collection..."
          className="h-10 pl-10"
        />
      </div>

      {selects.map((field) => (
        <label key={field.name} className="min-w-[11rem] space-y-1 text-xs">
          <span className="meta-kicker">{field.label}</span>
          <select
            name={field.name}
            defaultValue={field.value ?? ""}
            className="focus-visible:ring-ring h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
          >
            <option value="">{field.allLabel ?? `All ${field.label.toLowerCase()}`}</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm whitespace-nowrap">
        <input type="checkbox" name="featured" defaultChecked={featuredOnly} value="1" />
        Featured only
      </label>

      <Button type="submit" size="sm" className="h-10 px-4">
        <FunnelIcon className="size-4" />
        Apply
      </Button>
      <Link href={actionPath} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-10 px-4")}>
        Reset
      </Link>
    </form>
  );
}
