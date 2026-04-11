"use client";

import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { discoveryScopeOptions } from "@/lib/discovery/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type GlobalSearchInputProps = {
  defaultQuery?: string;
  defaultScope?: string;
  actionPath?: string;
  className?: string;
};

export function GlobalSearchInput({
  defaultQuery,
  defaultScope = "ALL",
  actionPath = "/search",
  className,
}: GlobalSearchInputProps) {
  const pathname = usePathname();
  const scope = useMemo(
    () =>
      discoveryScopeOptions.some((item) => item.value === defaultScope)
        ? defaultScope
        : "ALL",
    [defaultScope],
  );
  const [scopeValue, setScopeValue] = useState(scope);

  return (
    <form
      action={actionPath}
      method="get"
      className={cn(
        "surface-panel flex flex-wrap items-center gap-2 p-2",
        "focus-within:ring-ring/50 focus-within:ring-2 focus-within:ring-offset-0",
        className,
      )}
    >
      <div className="relative min-w-[15rem] flex-1">
        <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          name="q"
          defaultValue={defaultQuery}
          placeholder="Search journals, articles, projects, courses, quizzes..."
          className="h-10 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
        />
      </div>
      <input type="hidden" name="from" value={pathname} />
      <input type="hidden" name="scope" value={scopeValue} />
      <Select value={scopeValue} onValueChange={(value) => setScopeValue(value ?? "ALL")}>
        <SelectTrigger className="h-10 w-[11rem] border-border/65 bg-background/60">
          <SelectValue placeholder="Scope" />
        </SelectTrigger>
        <SelectContent>
          {discoveryScopeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" size="sm" className="h-10 px-4">
        Search
      </Button>
    </form>
  );
}
