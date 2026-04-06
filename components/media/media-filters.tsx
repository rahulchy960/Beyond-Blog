"use client";

import { SearchIcon } from "lucide-react";
import { MEDIA_TYPE, type MediaType } from "@/lib/content/enums";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type MediaFiltersProps = {
  type: "all" | MediaType;
  query: string;
  onTypeChange: (value: "all" | MediaType) => void;
  onQueryChange: (value: string) => void;
};

export function MediaFilters({ type, query, onTypeChange, onQueryChange }: MediaFiltersProps) {
  return (
    <div className="grid gap-2 md:grid-cols-[220px_1fr]">
      <Select value={type} onValueChange={(value) => onTypeChange((value ?? "all") as "all" | MediaType)}>
        <SelectTrigger>
          <SelectValue placeholder="Media type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All media types</SelectItem>
          <SelectItem value={MEDIA_TYPE.IMAGE}>Images</SelectItem>
          <SelectItem value={MEDIA_TYPE.FILE}>Files</SelectItem>
          <SelectItem value={MEDIA_TYPE.VIDEO}>Videos</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by filename, title, alt text"
          className="pl-9"
        />
      </div>
    </div>
  );
}
